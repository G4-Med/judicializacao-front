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
import { getPerdas } from '../../services/api/orders';
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
  dias: number;
  statusProcesso: string;
  statusPerda: string;
  justificativaPerda: string;
  analiseJuridicaFinal: string;
  // legados
  cliente: string;
  valor: number;
  numeroProcesso: string;
  dataProtocolo: string;
  status: string;
  resultado: string;
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
    numeroProcesso: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
    status: { value: '', matchMode: FilterMatchMode.CONTAINS },
    resultado: { value: '', matchMode: FilterMatchMode.CONTAINS },
    justificativaPerda: { value: '', matchMode: FilterMatchMode.CONTAINS }
  });


  
const carregarDados = () => {
  setLoading(true);
  getPerdas()
    .then(({ data }) => {
      setRegistros(data.map((o: any) => ({
        id: o.id,
        paciente: o.paciente ?? '',
        nprocesso: o.nprocesso ?? '',
        procedimento: o.procedimento ?? '',
        area: o.area ?? '',
        refPreco: o.refPreco ?? 0,
        valorOrcamento: o.valorOrcamento ?? 0,
        dataPedido: o.dataPedido,
        dias: o.dias ?? 0,
        statusProcesso: o.statusProcesso ?? '',
        statusPerda: o.statusPerda ?? '',
        justificativaPerda: o.justificativaPerda ?? '',
        analiseJuridicaFinal: o.analiseJuridicaFinal ?? '',
        // legados
        cliente: o.area ?? '',
        valor: o.refPreco ?? 0,
        numeroProcesso: o.nprocesso ?? '',
        dataProtocolo: o.dataPedido ?? '',
        status: o.statusProcesso ?? '',
        resultado: 'Perda',
      })));
    })
    .catch(() => console.error('Erro ao carregar perdas'))
    .finally(() => setLoading(false));
};

useEffect(() => { carregarDados(); }, []);  



const dataComCamposCalculados = useMemo<PerdaProcessoTableRow[]>(() => {
  return registros.map((item, index) => ({
    ...item,
    sequencial: index + 1,
    dias: item.dias, // já vem calculado do backend
  }));
}, [registros]);



const kpis = useMemo(() => {
  const totalProcessos = dataComCamposCalculados.length;
  const mediaProcessos = totalProcessos
    ? Math.round(dataComCamposCalculados.reduce((acc, item) => acc + item.dias, 0) / totalProcessos)
    : 0;
  const valorTotal = dataComCamposCalculados.reduce((acc, item) => acc + item.refPreco, 0);

  return {
    totalProcessos,
    mediaProcessos,
    valorTotal,
    ganhosValor: 0,
    perdasValor: valorTotal,
    ganhosPercentual: 0,
    perdasPercentual: valorTotal > 0 ? 100 : 0,
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

  const getResultadoSeverity = (
    resultado: string
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' => {
    const valor = resultado.toLowerCase();

    if (['ganho', 'procedente'].includes(valor)) return 'success';
    if (['perda', 'improcedente'].includes(valor)) return 'danger';

    return 'secondary';
  };

  const precoBodyTemplate = (rowData: PerdaProcessoTableRow) => formatarMoeda(rowData.valor);

  const diasBodyTemplate = (rowData: PerdaProcessoTableRow) => (
    <span className="dias-cell">{rowData.dias}</span>
  );

  const statusBodyTemplate = (rowData: PerdaProcessoTableRow) => (
    <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
  );

  const resultadoBodyTemplate = (rowData: PerdaProcessoTableRow) => (
    <Tag value={rowData.resultado} severity={getResultadoSeverity(rowData.resultado)} />
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
            field="status"
            header="Status"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={statusBodyTemplate}
            style={{ minWidth: '12rem' }}
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
            header="Tipo de Perda"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
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