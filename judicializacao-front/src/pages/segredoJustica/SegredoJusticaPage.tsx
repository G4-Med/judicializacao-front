import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type {
  DataTableFilterMeta,
  DataTablePageEvent,
  DataTableSortEvent
} from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { FilterMatchMode } from 'primereact/api';
import { Dialog } from 'primereact/dialog';
import './SegredoJusticaPage.css';

interface DocumentoProcesso {
  label: string;
  nome: string;
}

interface SegredoJustica {
  id: number;
  paciente: string;
  cliente: string;
  valor: number;
  numeroProcesso: string;
  procedimento: string;
  dataEnvioOrcamento: string;
  status: string;
  resultado: string;
  documentos: DocumentoProcesso[];
}

interface SegredoJusticaTableRow extends SegredoJustica {
  sequencial: number;
  dias: number;
}

type ResultadoType = 'ganho' | 'perda' | '';

export function SegredoJusticaPage() {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<SegredoJustica[]>([]);
  const [selectedRegistros, setSelectedRegistros] = useState<SegredoJusticaTableRow[]>([]);
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

  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
  const [registroAtualizando, setRegistroAtualizando] = useState<SegredoJusticaTableRow | null>(null);

  const [resultadoSelecionado, setResultadoSelecionado] = useState<ResultadoType>('');
  const [parecerJuridico, setParecerJuridico] = useState('');

  useEffect(() => {
    setLoading(true);

    const mock: SegredoJustica[] = [
      {
        id: 1,
        paciente: 'Maria Aparecida Mori',
        cliente: 'Instituto Brasileiro de Gestão da Saúde - IBG Saúde',
        valor: 188600,
        numeroProcesso: '#5004687-38.2023.8.13.0309',
        procedimento: 'Implante de válvula mitral transcateter (TAVI)',
        dataEnvioOrcamento: '2026-03-11',
        status: 'Ativo',
        resultado: 'Sem resultado',
        documentos: [
          { label: 'Orçamento', nome: 'orcamento_maria.pdf' }
        ]
      },
      {
        id: 2,
        paciente: 'João Pedro Santos',
        cliente: 'Clínica Alfa',
        valor: 9200,
        numeroProcesso: '#5001111-22.2026.8.13.0001',
        procedimento: 'Herniorrafia inguinal',
        dataEnvioOrcamento: '2026-03-08',
        status: 'Ativo',
        resultado: 'Sem resultado',
        documentos: [
          { label: 'Orçamento', nome: 'orcamento_joao.pdf' }
        ]
      }
    ];

    const timer = setTimeout(() => {
      setRegistros(mock);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const dataComCamposCalculados = useMemo<SegredoJusticaTableRow[]>(() => {
    const hoje = new Date();

    return registros.map((item, index) => {
      const dataBase = new Date(`${item.dataEnvioOrcamento}T00:00:00`);
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
    const ativos = dataComCamposCalculados.filter((item) =>
      ['ativo', 'em andamento', 'protocolado'].includes(item.status.toLowerCase())
    ).length;

    const mediaProcessos = totalProcessos
      ? Math.round(
          dataComCamposCalculados.reduce((acc, item) => acc + item.dias, 0) / totalProcessos
        )
      : 0;

    const valorTotal = dataComCamposCalculados.reduce((acc, item) => acc + item.valor, 0);

    return {
      totalProcessos,
      ativos,
      mediaProcessos,
      valorTotal
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

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const getStatusSeverity = (
    status: string
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' => {
    const valor = status.toLowerCase();

    if (['ativo', 'protocolado', 'concluído', 'concluido'].includes(valor)) return 'success';
    if (['em andamento', 'sem resultado'].includes(valor)) return 'info';
    if (['pendente', 'aguardando'].includes(valor)) return 'warning';
    if (['perdido', 'indeferido'].includes(valor)) return 'danger';

    return 'secondary';
  };

  const getResultadoSeverity = (
    resultado: string
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' => {
    const valor = resultado.toLowerCase();

    if (['ganho', 'procedente'].includes(valor)) return 'success';
    if (['perda', 'improcedente'].includes(valor)) return 'danger';
    if (['em andamento'].includes(valor)) return 'warning';

    return 'secondary';
  };

  const precoBodyTemplate = (rowData: SegredoJusticaTableRow) => formatarMoeda(rowData.valor);
  const diasBodyTemplate = (rowData: SegredoJusticaTableRow) => <span className="dias-cell">{rowData.dias}</span>;
  const statusBodyTemplate = (rowData: SegredoJusticaTableRow) => (
    <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
  );
  const resultadoBodyTemplate = (rowData: SegredoJusticaTableRow) => (
    <Tag value={rowData.resultado} severity={getResultadoSeverity(rowData.resultado)} />
  );

  const atualizarBodyTemplate = (rowData: SegredoJusticaTableRow) => {
    return (
      <Button
        label="Atualizar"
        icon="pi pi-refresh"
        outlined
        onClick={() => {
          setRegistroAtualizando({ ...rowData });
          setResultadoSelecionado('');
          setParecerJuridico('');
          setUpdateDialogVisible(true);
        }}
      />
    );
  };

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

  const handleBaixarDocumento = (nome: string) => {
    console.log('Baixar documento:', nome);
  };

  const handleVisualizarDocumento = (nome: string) => {
    console.log('Visualizar documento:', nome);
  };

  const handleSalvarAtualizacao = () => {
    if (!registroAtualizando) return;

    console.log('Salvar atualização', {
      registro: registroAtualizando,
      resultadoSelecionado,
      parecerJuridico
    });

    setUpdateDialogVisible(false);
  };

  return (
    <div className="segredo-justica-page">
      <div className="page-header">
        <div>
          <h1>Segredos de Justiça</h1>
          <p>Gestão dos processos em segredo de justiça</p>
        </div>

        <div className="page-actions">
          <Button
            label="Novo Protocolo"
            icon="pi pi-plus"
          />
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total Processos</span>
            <i className="pi pi-list"></i>
          </div>
          <div className="kpi-value">{kpis.totalProcessos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Ativos</span>
            <i className="pi pi-check-circle"></i>
          </div>
          <div className="kpi-value">{kpis.ativos}</div>
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
          onSelectionChange={(e) => setSelectedRegistros(e.value as SegredoJusticaTableRow[])}
          tableStyle={{ minWidth: '95rem' }}
          emptyMessage="Nenhum processo encontrado."
          className="segredo-justica-table"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: SegredoJusticaTableRow) => rowData.sequencial}
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
            header="Atualizar"
            body={atualizarBodyTemplate}
            style={{ minWidth: '10rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />
        </DataTable>
      </div>

      <Dialog
        header="Atualização"
        visible={updateDialogVisible}
        style={{ width: '64rem', maxWidth: '96vw' }}
        modal
        onHide={() => setUpdateDialogVisible(false)}
        className="segredo-update-dialog"
      >
        {registroAtualizando && (
          <div className="segredo-update-layout">
            <div className="update-topbar">
              <div className="update-processo-title">
                Processo {registroAtualizando.numeroProcesso}
              </div>

              <Button
                label="Voltar"
                outlined
                onClick={() => setUpdateDialogVisible(false)}
              />
            </div>

            <section className="update-section">
              <h3>Informações do Processo</h3>

              <div className="update-info-grid">
                <div><strong>Paciente</strong><span>{registroAtualizando.paciente}</span></div>
                <div><strong>Cliente</strong><span>{registroAtualizando.cliente}</span></div>
                <div><strong>Procedimento</strong><span>{registroAtualizando.procedimento}</span></div>
                <div><strong>Valor</strong><span>{formatarMoeda(registroAtualizando.valor)}</span></div>
                <div><strong>Data Envio Orçamento</strong><span>{formatarData(registroAtualizando.dataEnvioOrcamento)}</span></div>
                <div><strong>Dias desde o envio do orçamento</strong><span>{registroAtualizando.dias} dias</span></div>
              </div>
            </section>

            <section className="update-section">
              <h3>Documentos do Processo</h3>

              <div className="documentos-grid">
                {registroAtualizando.documentos.map((doc) => (
                  <div key={doc.nome} className="documento-item">
                    <span>{doc.label}</span>
                    <div className="documento-actions">
                      <Button
                        label="Ver PDF"
                        icon="pi pi-eye"
                        text
                        onClick={() => handleVisualizarDocumento(doc.nome)}
                      />
                      <Button
                        label="Baixar"
                        icon="pi pi-download"
                        text
                        onClick={() => handleBaixarDocumento(doc.nome)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="update-section">
              <h3>Resultado</h3>

              <div className="resultado-only-layout">
                <div className="resultado-actions">
                  <Button
                    label="Procedente (Ganho)"
                    severity={resultadoSelecionado === 'ganho' ? 'success' : 'secondary'}
                    outlined={resultadoSelecionado !== 'ganho'}
                    onClick={() => setResultadoSelecionado('ganho')}
                  />
                  <Button
                    label="Improcedente (Perda)"
                    severity={resultadoSelecionado === 'perda' ? 'danger' : 'secondary'}
                    outlined={resultadoSelecionado !== 'perda'}
                    onClick={() => setResultadoSelecionado('perda')}
                  />
                </div>

                <div className="field">
                  <label>Parecer Jurídico</label>
                  <InputTextarea
                    value={parecerJuridico}
                    onChange={(e) => setParecerJuridico(e.target.value)}
                    rows={6}
                    placeholder="Descreva o parecer jurídico..."
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="dialog-footer-actions">
          <Button
            label="Cancelar"
            outlined
            onClick={() => setUpdateDialogVisible(false)}
          />
          <Button
            label="Salvar"
            icon="pi pi-check"
            onClick={handleSalvarAtualizacao}
          />
        </div>
      </Dialog>
    </div>
  );
}