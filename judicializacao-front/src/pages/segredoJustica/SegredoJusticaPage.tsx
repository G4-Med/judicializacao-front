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
import { getSegredoJustica, salvarResultadoSegredo, getAnexosOrder } from '../../services/api/orders';
import { Dialog } from 'primereact/dialog';
import { getStatusTagStyle } from '../../utils/statusTag';
import './SegredoJusticaPage.css';

interface DocumentoProcesso {
  label: string;
  nome: string;
  url: string;
  tipo: 'pdf' | 'imagem' | 'outro';
}

interface SegredoJustica {
  id: number;
  paciente: string;
  nprocesso: string;
  procedimento: string;
  area: string;
  refPreco: number;
  valorOrcamento: number;
  dataStatusOrcamento: string | null;
  dias: number;
  statusProcesso: string;
  obsProtocolo: string;
  // campos legados para compatibilidade com a tabela existente
  cliente: string;
  valor: number;
  numeroProcesso: string;
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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTipo, setPreviewTipo] = useState<'pdf' | 'imagem' | 'outro'>('outro');
  const [previewNome, setPreviewNome] = useState('');


const carregarDados = () => {
  setLoading(true);
  getSegredoJustica()
    .then(({ data }) => {
      setRegistros(data.map((o: any) => ({
        id: o.id,
        paciente: o.paciente ?? '',
        nprocesso: o.nprocesso ?? '',
        procedimento: o.procedimento ?? '',
        area: o.area ?? '',
        refPreco: o.refPreco ?? 0,
        valorOrcamento: o.valorOrcamento ?? 0,
        dataStatusOrcamento: o.dataStatusOrcamento,
        dias: o.dias ?? 0,
        statusProcesso: o.statusProcesso ?? '',
        obsProtocolo: o.obsProtocolo ?? '',
        // campos legados mapeados
        cliente: o.area ?? '',
        valor: o.valorOrcamento ?? o.refPreco ?? 0,
        numeroProcesso: o.nprocesso ?? '',
        dataEnvioOrcamento: o.dataStatusOrcamento ?? '',
        status: 'Ativo',
        resultado: 'Sem resultado',
        documentos: [],
      })));
    })
    .catch(() => console.error('Erro ao carregar segredo de justiça'))
    .finally(() => setLoading(false));
};

useEffect(() => { carregarDados(); }, []);  


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
    const mediaProcessos = totalProcessos
      ? Math.round(
          dataComCamposCalculados.reduce((acc, item) => acc + item.dias, 0) / totalProcessos
        )
      : 0;

    const valorTotal = dataComCamposCalculados.reduce((acc, item) => acc + item.valor, 0);
    const mediaValorProcessos = totalProcessos ? valorTotal / totalProcessos : 0;

    return {
      totalProcessos,
      mediaProcessos,
      valorTotal,
      mediaValorProcessos,
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

  const precoBodyTemplate = (rowData: SegredoJusticaTableRow) => formatarMoeda(rowData.valor);
  const diasBodyTemplate = (rowData: SegredoJusticaTableRow) => <span className="dias-cell">{rowData.dias}</span>;
  const statusBodyTemplate = (rowData: SegredoJusticaTableRow) => (
    <Tag value={rowData.statusProcesso} style={getStatusTagStyle(rowData.statusProcesso)} className="status-tag-custom" />
  );
  const atualizarBodyTemplate = (rowData: SegredoJusticaTableRow) => {
    return (
      <Button
        label="Atualizar"
        icon="pi pi-refresh"
        outlined
        onClick={() => {
          setRegistroAtualizando({ ...rowData, documentos: [] });
          setResultadoSelecionado('');
          setParecerJuridico('');
          getAnexosOrder(rowData.id, 'ORCAMENTO')
            .then((res: any) => {
              const anexos: any[] = res.data.anexos ?? [];
              const documentos = anexos.map((anexo, index) => {
                const nome = anexo.linkImagem.split('/').pop() || `Orçamento ${index + 1}`;
                const extensao = nome.split('.').pop()?.toLowerCase();
                const tipo: 'pdf' | 'imagem' | 'outro' = extensao === 'pdf'
                  ? 'pdf'
                  : ['jpg', 'jpeg', 'png', 'webp'].includes(extensao ?? '')
                    ? 'imagem'
                    : 'outro';

                return {
                  label: `Orçamento ${index + 1}`,
                  nome,
                  url: anexo.linkImagem,
                  tipo,
                };
              });

              setRegistroAtualizando((atual) =>
                atual && atual.id === rowData.id ? { ...atual, documentos } : atual
              );
            })
            .catch(() => {
              setRegistroAtualizando((atual) =>
                atual && atual.id === rowData.id ? { ...atual, documentos: [] } : atual
              );
            });
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

  const abrirPreview = (url: string, nome: string, tipo: 'pdf' | 'imagem' | 'outro') => {
    setPreviewUrl(url);
    setPreviewNome(nome);
    setPreviewTipo(tipo);
    setPreviewVisible(true);
  };

  const handleBaixarDocumento = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleVisualizarDocumento = (url: string, nome: string, tipo: 'pdf' | 'imagem' | 'outro') => {
    abrirPreview(url, nome, tipo);
  };

  const handleSalvarAtualizacao = async () => {
    if (!registroAtualizando || !resultadoSelecionado) {
      alert('Selecione um resultado antes de salvar.');
      return;
    }

    try {
      await salvarResultadoSegredo(registroAtualizando.id, {
        resultado: resultadoSelecionado,
        parecer: parecerJuridico,
      });
      carregarDados();
      setUpdateDialogVisible(false);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Erro ao salvar.');
    }
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
            <span>Média de dias dos Processos</span>
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
            <span>Média Valor Processos</span>
            <i className="pi pi-wallet"></i>
          </div>
          <div className="kpi-value">{formatarMoeda(kpis.mediaValorProcessos)}</div>
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
            field="dias"
            header="Dias"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={diasBodyTemplate}
            style={{ minWidth: '7rem' }}
          />

          <Column
            field="statusProcesso"
            header="Status"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={statusBodyTemplate}
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
                <div><strong>Nº Processo</strong><span>{registroAtualizando.nprocesso || '-'}</span></div>
                <div><strong>Procedimento</strong><span>{registroAtualizando.procedimento}</span></div>
                <div><strong>Valor Orçamento</strong><span>{formatarMoeda(registroAtualizando.valorOrcamento)}</span></div>
                <div><strong>Data Envio Orçamento</strong><span>{registroAtualizando.dataEnvioOrcamento ? formatarData(registroAtualizando.dataEnvioOrcamento) : '-'}</span></div>
                <div><strong>Dias desde o envio</strong><span>{registroAtualizando.dias} dias</span></div>
                {registroAtualizando.obsProtocolo && (
                  <div><strong>Obs Protocolo</strong><span>{registroAtualizando.obsProtocolo}</span></div>
                )}
              </div>
            </section>

            <section className="update-section">
              <h3>Orçamento do Pedido</h3>

              {registroAtualizando.documentos.length === 0 && (
                <div className="timeline-empty">Nenhum orçamento anexado.</div>
              )}

              {registroAtualizando.documentos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {registroAtualizando.documentos.map((doc, index) => {
                    const icone = doc.tipo === 'pdf'
                      ? 'pi pi-file-pdf'
                      : doc.tipo === 'imagem'
                        ? 'pi pi-image'
                        : 'pi pi-file';

                    return (
                      <button
                        key={`${doc.nome}-${index}`}
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          background: 'transparent',
                          color: '#374151',
                          fontSize: '0.9rem',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        onClick={() => handleVisualizarDocumento(doc.url, doc.nome, doc.tipo)}
                      >
                        <i className={icone} style={{ fontSize: '1.1rem', color: '#f97316' }} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{doc.nome || `Orçamento ${index + 1}`}</span>
                        <i className="pi pi-eye" style={{ color: '#9ca3af', fontSize: '0.85rem' }} />
                      </button>
                    );
                  })}
                </div>
              )}
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

      <Dialog
        header={previewNome}
        visible={previewVisible}
        style={{ width: '80vw', maxWidth: '1100px' }}
        modal
        onHide={() => setPreviewVisible(false)}
      >
        <div style={{ minHeight: '70vh' }}>
          {previewTipo === 'pdf' && (
            <iframe
              src={previewUrl}
              title={previewNome}
              width="100%"
              height="700px"
              style={{ border: 'none', borderRadius: '8px' }}
            />
          )}

          {previewTipo === 'imagem' && (
            <img
              src={previewUrl}
              alt={previewNome}
              style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: '0 auto' }}
            />
          )}

          {previewTipo === 'outro' && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <Button
                label="Baixar arquivo"
                icon="pi pi-download"
                onClick={() => handleBaixarDocumento(previewUrl)}
              />
            </div>
          )}
        </div>

        <div className="dialog-footer-actions">
          <Button
            label="Baixar"
            icon="pi pi-download"
            outlined
            onClick={() => handleBaixarDocumento(previewUrl)}
          />
          <Button label="Fechar" onClick={() => setPreviewVisible(false)} />
        </div>
      </Dialog>
    </div>
  );
}
