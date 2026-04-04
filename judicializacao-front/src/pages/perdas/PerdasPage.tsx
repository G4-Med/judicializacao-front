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
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
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

    return {
      totalProcessos,
      valorTotal,
      perdaJuridico,
      perdaMedico,
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
            <span>Valor Total</span>
            <i className="pi pi-dollar"></i>
          </div>
          <div className="kpi-value">{formatarMoeda(kpis.valorTotal)}</div>
        </div>
      </div>

      <div className="card">
        <DataTable
          value={dataComCamposCalculados}
          dataKey="id"
          paginator
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
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: PerdaProcessoTableRow) => rowData.sequencial}
          />

          <Column
            field="paciente"
            header="Paciente"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '16rem' }}
          />

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

          <Column
            field="justificativaPerda"
            header="Justificativa Perda"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '24rem' }}
          />
        </DataTable>
      </div>
    </div>
  );
}
