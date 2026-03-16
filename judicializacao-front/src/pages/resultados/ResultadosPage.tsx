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
import './ResultadosPage.css';

interface ResultadoProcesso {
  id: number;
  paciente: string;
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
    status: { value: '', matchMode: FilterMatchMode.CONTAINS },
    resultado: { value: '', matchMode: FilterMatchMode.CONTAINS }
  });

  useEffect(() => {
    setLoading(true);

    const mock: ResultadoProcesso[] = [
      {
        id: 1,
        paciente: 'Maria Aparecida Mori',
        cliente: 'IBG Saúde',
        valor: 188600,
        numeroProcesso: '#5004687-38.2023.8.13.0309',
        dataProtocolo: '2026-03-10',
        status: 'Concluído',
        resultado: 'Ganho'
      },
      {
        id: 2,
        paciente: 'João Pedro Santos',
        cliente: 'Clínica Alfa',
        valor: 9200,
        numeroProcesso: '#5001111-22.2026.8.13.0001',
        dataProtocolo: '2026-03-05',
        status: 'Concluído',
        resultado: 'Perda'
      },
      {
        id: 3,
        paciente: 'Ana Cláudia Costa',
        cliente: 'Neuro Gama',
        valor: 27500,
        numeroProcesso: '#5007777-88.2026.8.13.0003',
        dataProtocolo: '2026-02-28',
        status: 'Concluído',
        resultado: 'Ganho'
      },
      {
        id: 4,
        paciente: 'Carlos Eduardo Rocha',
        cliente: 'Hospital Beta',
        valor: 21000,
        numeroProcesso: '#5008888-99.2026.8.13.0004',
        dataProtocolo: '2026-03-01',
        status: 'Concluído',
        resultado: 'Perda'
      },
      {
        id: 5,
        paciente: 'Fernanda Lopes',
        cliente: 'Clínica Prisma',
        valor: 14500,
        numeroProcesso: '#5009999-00.2026.8.13.0005',
        dataProtocolo: '2026-03-12',
        status: 'Concluído',
        resultado: 'Ganho'
      }
    ];

    const timer = setTimeout(() => {
      setRegistros(mock);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const dataComCamposCalculados = useMemo<ResultadoProcessoTableRow[]>(() => {
    const hoje = new Date();

    return registros.map((item, index) => {
      const dataBase = new Date(`${item.dataProtocolo}T00:00:00`);
      const diferencaMs = hoje.getTime() - dataBase.getTime();
      const dias = Math.max(0, Math.floor(diferencaMs / (1000 * 60 * 60 * 24)));

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
      ? Math.round(
          dataComCamposCalculados.reduce((acc, item) => acc + item.dias, 0) / totalProcessos
        )
      : 0;

    const valorTotal = dataComCamposCalculados.reduce((acc, item) => acc + item.valor, 0);

    const ganhosValor = dataComCamposCalculados
      .filter((item) => item.resultado.toLowerCase() === 'ganho')
      .reduce((acc, item) => acc + item.valor, 0);

    const perdasValor = dataComCamposCalculados
      .filter((item) => item.resultado.toLowerCase() === 'perda')
      .reduce((acc, item) => acc + item.valor, 0);

    const ganhosPercentual = valorTotal > 0 ? (ganhosValor / valorTotal) * 100 : 0;
    const perdasPercentual = valorTotal > 0 ? (perdasValor / valorTotal) * 100 : 0;

    return {
      totalProcessos,
      mediaProcessos,
      valorTotal,
      ganhosValor,
      perdasValor,
      ganhosPercentual,
      perdasPercentual
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

  const precoBodyTemplate = (rowData: ResultadoProcessoTableRow) => formatarMoeda(rowData.valor);

  const diasBodyTemplate = (rowData: ResultadoProcessoTableRow) => (
    <span className="dias-cell">{rowData.dias}</span>
  );

  const statusBodyTemplate = (rowData: ResultadoProcessoTableRow) => (
    <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
  );

  const resultadoBodyTemplate = (rowData: ResultadoProcessoTableRow) => (
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
        </DataTable>
      </div>
    </div>
  );
}