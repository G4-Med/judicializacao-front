import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type {
  DataTableFilterMeta,
  DataTablePageEvent,
  DataTableSortEvent
} from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { getPerdas, getOrders, getMedicosCompleto } from '../../services/api/orders';
import { getStatusTagStyle } from '../../utils/statusTag';
import './PerdasPage.css';
import { PainelKpis } from '../../components/PainelKpis/PainelKpis';
import { colunaSolicitante, colunaSegredo, colunaCnj, colunaSei, colunaComarca, colunaCadastro, FILTROS_IDENTIFICACAO, nomeComCopiar, colunaInteiroTeor } from '../../components/ColunasIdentificacao/colunasIdentificacao';
import { BotaoExportarExcel } from '../../components/BotaoExportarExcel/BotaoExportarExcel';
import { AcoesTabela } from '../../components/AcoesTabela/AcoesTabela';
import { useColunasVisiveis } from '../../components/ColunasVisiveis/useColunasVisiveis';

interface PerdaProcesso {
  id: number;
  paciente: string;
  nprocesso: string;
  procedimento: string;
  area: string;
  refPreco: number;
  valorOrcamento: number;
  dataPedido: string | null;
  dataStatusPerda?: string | null;
  dias: number;
  statusProcesso: string;
  statusPerda: string;
  justificativaPerda: string;
  motivoPerdaCategoria?: string | null;
  analiseJuridicaFinal: string;
  cliente: string;
  valor: number;
  resultado: string;
  idMedico?: number | null;
}

interface PerdaProcessoTableRow extends PerdaProcesso {
  sequencial: number;
  dias: number;
}

export function PerdasPage() {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<PerdaProcesso[]>([]);
  const [selectedRegistros, setSelectedRegistros] = useState<PerdaProcessoTableRow[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(100);
  const [sortField, setSortField] = useState<string | undefined>('dias');
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(1);

  const colunasCfg = useColunasVisiveis('perdas');

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    ...FILTROS_IDENTIFICACAO,   // CNJ · SEI · Comarca (task #214)
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    cliente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    valor: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
    resultado: { value: '', matchMode: FilterMatchMode.CONTAINS },
    statusPerda: { value: '', matchMode: FilterMatchMode.CONTAINS },
    justificativaPerda: { value: '', matchMode: FilterMatchMode.CONTAINS }
  });

  const carregarDados = () => {
    setLoading(true);
    Promise.all([getPerdas(), getOrders(), getMedicosCompleto()])
      .then(([perdasRes, ordersRes, medicosRes]) => {
        const ordersLookup = (ordersRes.data as any[]).reduce<Record<number, any>>((acc, order) => {
          acc[order.id] = order;
          return acc;
        }, {});

        setRegistros(
          perdasRes.data.map((o: any) => {
            const orderCompleta = ordersLookup[o.id];
            const medicoId = o.idMedico ?? orderCompleta?.idMedico ?? null;
            const medico = medicosRes.data.find((item: any) => item.id === medicoId);
            const valorOrcamento = o.valorOrcamento ?? orderCompleta?.valorOrcamento ?? 0;

            return {
          ...o,   // preserva ident (SEI/comarca/cadastro/segredo/solicitante) — classe do bug 27/08
              id: o.id,
              paciente: o.paciente ?? '',
              nprocesso: o.nprocesso ?? '',
              procedimento: o.procedimento ?? '',
              area: o.area ?? '',
              refPreco: o.refPreco ?? 0,
              valorOrcamento,
              dataPedido: o.dataPedido ?? null,
              dataStatusPerda: o.dataStatusPerda ?? null,
              dias: o.dias ?? 0,
              statusProcesso: o.statusProcesso ?? '',
              statusPerda: o.statusPerda ?? '',
              justificativaPerda: o.justificativaPerda ?? '',
              motivoPerdaCategoria: o.motivoPerdaCategoria ?? null,
              analiseJuridicaFinal: o.analiseJuridicaFinal ?? '',
              cliente: medico?.razaoSocial ?? '',
              valor: valorOrcamento || o.refPreco || 0,
              resultado: 'Perda',
              idMedico: medicoId
            };
          })
        );
      })
      .catch(() => console.error('Erro ao carregar perdas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const dataComCamposCalculados = useMemo<PerdaProcessoTableRow[]>(() => {
    return registros.map((item, index) => {
      const dataPedido = item.dataPedido ? new Date(`${item.dataPedido}T00:00:00`) : null;
      const dataStatusPerda = item.dataStatusPerda ? new Date(`${item.dataStatusPerda}T00:00:00`) : null;
      const dias =
        dataPedido && dataStatusPerda
          ? Math.max(0, Math.floor((dataStatusPerda.getTime() - dataPedido.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

      return {
        ...item,
        sequencial: index + 1,
        dias
      };
    });
  }, [registros]);

  const kpis = useMemo(() => {
    const totalProcessos = dataComCamposCalculados.length;
    const valorTotal = dataComCamposCalculados.reduce(
      (acc, item) => acc + (item.valorOrcamento || item.refPreco || 0),
      0
    );
    const perdaJuridico = dataComCamposCalculados.filter(
      (item) => item.statusPerda === 'Perda Pelo Juridico'
    ).length;
    const perdaMedico = dataComCamposCalculados.filter(
      (item) => item.statusPerda === 'Perda pelo Medico'
    ).length;
    const perdaSemEspecialista = dataComCamposCalculados.filter(
      (item) => item.statusPerda === 'Perda por falta de especialista'
    ).length;
    // Padronização 68b1f91e32 (@R 27/08): as 2 classes novas de perda parcial/tempo
    const perdaSesSemResposta = dataComCamposCalculados.filter(
      (item) => item.statusPerda === 'Perda sem resposta da SES'
    ).length;
    const perdaPrazoProtocolo = dataComCamposCalculados.filter(
      (item) => item.statusPerda === 'Perda de prazo de protocolação'
    ).length;
    // Task #238 (@R 28/08): segredo que mata a cotação é PERDA com esse motivo
    const perdaSegredo = dataComCamposCalculados.filter(
      (item) => item.statusPerda === 'Perda por segredo de justiça'
    ).length;

    return {
      totalProcessos,
      valorTotal,
      perdaJuridico,
      perdaMedico,
      perdaSesSemResposta,
      perdaPrazoProtocolo,
      perdaSegredo,
      perdaSemEspecialista
    };
  }, [dataComCamposCalculados]);

  const onPage = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const onSort = (event: DataTableSortEvent) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder);
  };

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  const precoBodyTemplate = (rowData: PerdaProcessoTableRow) => formatarMoeda(rowData.valor);

  const diasBodyTemplate = (rowData: PerdaProcessoTableRow) => (
    <span className="dias-cell">{rowData.dias}</span>
  );

  const resultadoBodyTemplate = (rowData: PerdaProcessoTableRow) => (
    <Tag
      value={rowData.resultado}
      style={getStatusTagStyle(rowData.resultado)}
      className="status-tag-custom"
    />
  );

  const statusPerdaBodyTemplate = (rowData: PerdaProcessoTableRow) => (
    <Tag
      value={rowData.statusPerda}
      style={getStatusTagStyle(rowData.statusPerda)}
      className="status-tag-custom"
    />
  );

  const filterElement = (options: any, placeholder: string) => {
    return (
      <InputText
        value={options.value || ''}
        onChange={(e) => options.filterApplyCallback(e.target.value)}
        placeholder={placeholder}
        className="p-column-filter"
      />
    );
  };

  return (
    <div className="perdas-page">
      <div className="page-header">
        <div>
          <h1>Perdas</h1>
          <p>Visão consolidada dos processos improcedentes</p>
        </div>
      </div>

      <PainelKpis titulo="Indicadores">
      <div className="kpi-grid kpi-grid-5">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total Processos</span>
            <i className="pi pi-list"></i>
          </div>
          <div className="kpi-value">{kpis.totalProcessos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Perda Pelo Jurídico</span>
            <i className="pi pi-briefcase"></i>
          </div>
          <div className="kpi-value">{kpis.perdaJuridico}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Perda pelo Médico</span>
            <i className="pi pi-user-minus"></i>
          </div>
          <div className="kpi-value">{kpis.perdaMedico}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Perda por falta de especialista</span>
            <i className="pi pi-ban"></i>
          </div>
          <div className="kpi-value">{kpis.perdaSemEspecialista}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>SES sem resposta</span>
            <i className="pi pi-clock"></i>
          </div>
          <div className="kpi-value">{kpis.perdaSesSemResposta}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Prazo de protocolação</span>
            <i className="pi pi-calendar-times"></i>
          </div>
          <div className="kpi-value">{kpis.perdaPrazoProtocolo}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Segredo de justiça</span>
            <i className="pi pi-lock"></i>
          </div>
          <div className="kpi-value">{kpis.perdaSegredo}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Valor Total</span>
            <i className="pi pi-dollar"></i>
          </div>
          <div className="kpi-value">{formatarMoeda(kpis.valorTotal)}</div>
        </div>
      </div>
      </PainelKpis>

      <div className="card">
        <h2 className="mc-tabela-titulo"><i className="pi pi-table" />Pedidos perdidos — motivo e fase em que a perda ocorreu</h2>
          <AcoesTabela>
            <BotaoExportarExcel todos={dataComCamposCalculados} nome="perdas" />
            {colunasCfg.botao}
          </AcoesTabela>
        <DataTable
          aria-label="Pedidos perdidos — motivo e fase em que a perda ocorreu"
          value={dataComCamposCalculados}
          dataKey="id"
          paginator
          rowsPerPageOptions={[10, 20, 50, 100, 200]}
          rows={rows}
          first={first}
          totalRecords={dataComCamposCalculados.length}
          onPage={onPage}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          filters={filters}
          onFilter={(e) => setFilters(e.filters)}
          filterDisplay="row"
          loading={loading}
          selectionMode="multiple"
          selection={selectedRegistros}
          onSelectionChange={(e) => setSelectedRegistros(e.value as PerdaProcessoTableRow[])}
          tableStyle={{ minWidth: '100rem' }}
          emptyMessage="Nenhuma perda encontrada."
          className="perdas-table"
        >
          {colunasCfg.filtrar(<>
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: PerdaProcessoTableRow) => rowData.sequencial}
          />

          <Column
            field="paciente" body={(r: any) => nomeComCopiar(r.paciente)}
            header="Paciente"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '16rem' }}
          />
          {/* Identificação do pedido (task #214): CNJ + SEI com copiar, Comarca + km */}
          {colunaCnj()}
          {colunaSei()}
          {colunaComarca()}
          {colunaCadastro()}
          {colunaSegredo()}
          {colunaInteiroTeor()}
          {colunaSolicitante()}

          <Column
            field="cliente"
            header="Cliente"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '16rem' }}
          />

          <Column
            field="valor"
            header="Valor"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={precoBodyTemplate}
            style={{ minWidth: '10rem' }}
          />

          <Column
            field="dias"
            header="Dias"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={diasBodyTemplate}
            style={{ minWidth: '7rem' }}
          />

          <Column
            field="resultado"
            header="Resultado"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={resultadoBodyTemplate}
            style={{ minWidth: '12rem' }}
          />

          <Column
            field="statusPerda"
            header="Status Perda"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={statusPerdaBodyTemplate}
            style={{ minWidth: '16rem' }}
          />

          <Column field="motivoPerdaCategoria" header="Motivo (categoria)" sortable
            style={{ minWidth: '13rem' }}
            body={(r: any) => r.motivoPerdaCategoria ?? <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>não classificado</span>} />
          <Column
            field="justificativaPerda"
            header="Justificativa Perda"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '24rem' }}
          />
        </>)}
        </DataTable>
      </div>
    </div>
  );
}
