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
import { getResultados, getOrders, getMedicosCompleto } from '../../services/api/orders';
import { getStatusTagStyle } from '../../utils/statusTag';
import './ResultadosPage.css';

interface ResultadoProcesso {
  id: number;
  paciente: string;
  nprocesso: string;
  procedimento: string;
  area: string;
  refPreco: number;
  valorOrcamento: number;
  valorGanho: number;
  dataPedido: string | null;
  dataResultado?: string | null;
  dias: number;
  statusProcesso: string;
  statusPerda: string;
  analiseJuridicaFinal: string;
  idMedico?: number | null;
  // legados para tabela
  cliente: string;
  valor: number;
  numeroProcesso: string;
  dataProtocolo: string;
  status: string;
  resultado: string;
}


interface ResultadoProcessoTableRow extends ResultadoProcesso {
  sequencial: number;
  dias: number;
}

export function ResultadosPage() {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<ResultadoProcesso[]>([]);
  const [selectedRegistros, setSelectedRegistros] = useState<ResultadoProcessoTableRow[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    cliente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    valor: { value: '', matchMode: FilterMatchMode.CONTAINS },
    numeroProcesso: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
    resultado: { value: '', matchMode: FilterMatchMode.CONTAINS }
  });

const carregarDados = () => {
  setLoading(true);
  Promise.all([getResultados(), getOrders(), getMedicosCompleto()])
    .then(([resultadosRes, ordersRes, medicosRes]) => {
      const ordersLookup = (ordersRes.data as any[]).reduce<Record<number, any>>((acc, order) => {
        acc[order.id] = order;
        return acc;
      }, {});

      setRegistros(resultadosRes.data.map((o: any) => {
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
          valorGanho: o.valorGanho ?? 0,
          dataPedido: o.dataPedido,
          dataResultado: o.dataResultado ?? null,
          dias: o.dias ?? 0,
          statusProcesso: o.statusProcesso ?? '',
          statusPerda: o.statusPerda ?? '',
          analiseJuridicaFinal: o.analiseJuridicaFinal ?? '',
          idMedico: medicoId,
          // legados
          cliente: medico?.razaoSocial ?? '',
          valor: valorOrcamento,
          numeroProcesso: o.nprocesso ?? '',
          dataProtocolo: o.dataResultado ?? '',
          status: o.statusProcesso ?? '',
          resultado: o.statusProcesso === 'Ganho' ? 'Ganho' : 'Perda',
        };
      }));
    })
    .catch(() => console.error('Erro ao carregar resultados'))
    .finally(() => setLoading(false));
};

useEffect(() => { carregarDados(); }, []);




  const dataComCamposCalculados = useMemo<ResultadoProcessoTableRow[]>(() => {
    return registros.map((item, index) => {
      const dataPedido = item.dataPedido ? new Date(`${item.dataPedido}T00:00:00`) : null;
      const dataResultado = item.dataResultado ? new Date(`${item.dataResultado}T00:00:00`) : null;
      const dias =
        dataPedido && dataResultado
          ? Math.max(0, Math.floor((dataResultado.getTime() - dataPedido.getTime()) / (1000 * 60 * 60 * 24)))
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

  const mediaProcessos = totalProcessos
    ? Math.round(dataComCamposCalculados.reduce((acc, item) => acc + item.dias, 0) / totalProcessos)
    : 0;

  const ganhos = dataComCamposCalculados.filter(
    (item) => item.statusProcesso === 'Ganho'
  );
  const perdas = dataComCamposCalculados.filter(
    (item) => item.statusProcesso === 'Perda'
  );

  const ganhosValor = ganhos.reduce((acc, item) => acc + (item.valorGanho || item.valorOrcamento), 0);
  const perdasValor = perdas.reduce((acc, item) => acc + (item.valorOrcamento || item.refPreco), 0);
  const valorTotal = ganhosValor + perdasValor;

  const ganhosPercentual = valorTotal > 0 ? (ganhosValor / valorTotal) * 100 : 0;
  const perdasPercentual = valorTotal > 0 ? (perdasValor / valorTotal) * 100 : 0;

  return {
    totalProcessos,
    mediaProcessos,
    valorTotal,
    ganhosValor,
    perdasValor,
    ganhosPercentual,
    perdasPercentual,
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

  const formatarPercentual = (valor: number) =>
    `${valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}%`;

  const getStatusSeverity = (
    status: string
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' => {
    const valor = status.toLowerCase();

    if (['concluído', 'concluido', 'finalizado'].includes(valor)) return 'success';
    if (['em andamento'].includes(valor)) return 'warning';
    if (['indeferido'].includes(valor)) return 'danger';

    return 'secondary';
  };

  const precoBodyTemplate = (rowData: ResultadoProcessoTableRow) => formatarMoeda(rowData.valor);

  const diasBodyTemplate = (rowData: ResultadoProcessoTableRow) => (
    <span className="dias-cell">{rowData.dias}</span>
  );

  const resultadoBodyTemplate = (rowData: ResultadoProcessoTableRow) => (
    <Tag
      value={rowData.resultado}
      severity={getStatusSeverity(rowData.resultado)}
      style={getStatusTagStyle(rowData.resultado)}
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
    <div className="resultados-page">
      <div className="page-header">
        <div>
          <h1>Resultados</h1>
          <p>Visão consolidada dos processos finalizados</p>
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
            <span>Média/Processos</span>
            <i className="pi pi-chart-line"></i>
          </div>
          <div className="kpi-value">{kpis.mediaProcessos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Valor Total</span>
            <i className="pi pi-dollar"></i>
          </div>
          <div className="kpi-value">{formatarMoeda(kpis.valorTotal)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Ganhos</span>
            <i className="pi pi-check-circle"></i>
          </div>
          <div className="kpi-value kpi-value-success">{formatarMoeda(kpis.ganhosValor)}</div>
          <div className="kpi-subvalue">{formatarPercentual(kpis.ganhosPercentual)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Perdas</span>
            <i className="pi pi-times-circle"></i>
          </div>
          <div className="kpi-value kpi-value-danger">{formatarMoeda(kpis.perdasValor)}</div>
          <div className="kpi-subvalue">{formatarPercentual(kpis.perdasPercentual)}</div>
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
          onSelectionChange={(e) => setSelectedRegistros(e.value as ResultadoProcessoTableRow[])}
          tableStyle={{ minWidth: '90rem' }}
          emptyMessage="Nenhum resultado encontrado."
          className="resultados-table"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: ResultadoProcessoTableRow) => rowData.sequencial}
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
            field="numeroProcesso"
            header="Processo"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '16rem' }}
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
        </DataTable>
      </div>
    </div>
  );
}
