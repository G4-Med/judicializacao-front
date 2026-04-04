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
import { Timeline } from 'primereact/timeline';
import { getProtocolados, salvarResultadoProtocolado, adicionarAcompanhamento, getAnexosOrder } from '../../services/api/orders';
import { InputNumber } from 'primereact/inputnumber';
import { getStatusTagStyle } from '../../utils/statusTag';
import './ProtocoladosPage.css';

interface HistoricoAcompanhamento {
  id: number;
  acompanhamento: string;
  descricao: string;
  createDate: string;
}

interface DocumentoProcesso {
  label: string;
  nome: string;
  url: string;
  tipo: 'pdf' | 'imagem' | 'outro';
}

interface Protocolado {
  id: number;
  paciente: string;
  nprocesso: string;
  procedimento: string;
  area: string;
  refPreco: number;
  valorOrcamento: number;
  dataStatusOrcamento: string | null;
  dataProtocoloApi?: string | null;
  dias: number;
  statusProcesso: string;
  obsProtocolo: string;
  analiseJuridicaFinal: string;
  historico: HistoricoAcompanhamento[];
  // campos legados
  cliente: string;
  valor: number;
  numeroProcesso: string;
  dataProtocolo: string;
  status: string;
  resultado: string;
  documentos: DocumentoProcesso[];
}

interface ProtocoladoTableRow extends Protocolado {
  sequencial: number;
  dias: number;
}

type ResultadoType = 'ganho' | 'perda' | '';

export function ProtocoladosPage() {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<Protocolado[]>([]);
  const [selectedRegistros, setSelectedRegistros] = useState<ProtocoladoTableRow[]>([]);
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
  const [registroAtualizando, setRegistroAtualizando] = useState<ProtocoladoTableRow | null>(null);

  const [novoAcompanhamento, setNovoAcompanhamento] = useState('');
  const [parecerJuridico, setParecerJuridico] = useState('');
  const [resultadoSelecionado, setResultadoSelecionado] = useState<ResultadoType>('');



  
  // estado para valor ganho
  const [valorGanho, setValorGanho] = useState<number | null>(null);
  // estado para tipo de ação no form
  const [tipoAcao, setTipoAcao] = useState<'acompanhamento' | 'decisao' | ''>('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTipo, setPreviewTipo] = useState<'pdf' | 'imagem' | 'outro'>('outro');
  const [previewNome, setPreviewNome] = useState('');

  const fecharDialogAtualizacao = () => {
    setUpdateDialogVisible(false);
    setTipoAcao('');
    setNovoAcompanhamento('');
    setParecerJuridico('');
    setResultadoSelecionado('');
    setValorGanho(null);
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data } = await getProtocolados();
      const registrosMapeados = data.map((o: any) => ({
          id: o.id,
          paciente: o.paciente ?? '',
          nprocesso: o.nprocesso ?? '',
          procedimento: o.procedimento ?? '',
          area: o.area ?? '',
          refPreco: o.refPreco ?? 0,
          valorOrcamento: o.valorOrcamento ?? 0,
          dataStatusOrcamento: o.dataStatusOrcamento,
          dataProtocoloApi: o.dataProtocolo ?? null,
          dias: o.dias ?? 0,
          statusProcesso: o.statusProcesso ?? '',
          obsProtocolo: o.obsProtocolo ?? '',
          analiseJuridicaFinal: o.analiseJuridicaFinal ?? '',
          historico: o.historico ?? [],
          // legados
          cliente: o.area ?? '',
          valor: o.valorOrcamento ?? o.refPreco ?? 0,
          numeroProcesso: o.nprocesso ?? '',
          dataProtocolo: o.dataProtocolo ?? '',
          status: 'Protocolado',
          resultado: 'Em andamento',
          documentos: [],
        }));

      setRegistros(registrosMapeados);
      return registrosMapeados;
    } catch {
      console.error('Erro ao carregar protocolados');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void carregarDados(); }, []);

  const handleSalvarAcompanhamento = async () => {
    if (!registroAtualizando || !novoAcompanhamento.trim()) return;
    try {
      await adicionarAcompanhamento(registroAtualizando.id, {
        acompanhamento: 'Acompanhamento',
        descricao: novoAcompanhamento,
      });
      const registrosAtualizados = await carregarDados();
      const registroAtualizado = registrosAtualizados.find(
        (item: Protocolado) => item.id === registroAtualizando.id
      );
      if (registroAtualizado) {
        setRegistroAtualizando((atual) =>
          atual ? { ...atual, ...registroAtualizado } as ProtocoladoTableRow : atual
        );
      }
      setNovoAcompanhamento('');
      setTipoAcao('');
    } catch (err) {
      alert('Erro ao salvar acompanhamento.');
    }
  };

  const handleSalvarDecisao = async () => {
    if (!registroAtualizando || !resultadoSelecionado) {
      alert('Selecione Ganho ou Perda antes de salvar.');
      return;
    }
    try {
      await salvarResultadoProtocolado(registroAtualizando.id, {
        acao: resultadoSelecionado,
        analise: parecerJuridico,
        valorGanho: resultadoSelecionado === 'ganho' ? valorGanho : null,
      });
      await carregarDados();
      setTipoAcao('');
      fecharDialogAtualizacao();
    } catch (err) {
      alert('Erro ao salvar decisão.');
    }
  };




  const dataComCamposCalculados = useMemo<ProtocoladoTableRow[]>(() => {
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



  const getResultadoSeverity = (
    resultado: string
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' => {
    const valor = resultado.toLowerCase();

    if (['ganho', 'procedente'].includes(valor)) return 'success';
    if (['perda', 'improcedente'].includes(valor)) return 'danger';
    if (['em andamento'].includes(valor)) return 'warning';

    return 'secondary';
  };

  const precoBodyTemplate = (rowData: ProtocoladoTableRow) => formatarMoeda(rowData.valor);
  const diasBodyTemplate = (rowData: ProtocoladoTableRow) => <span className="dias-cell">{rowData.dias}</span>;
  const statusBodyTemplate = (rowData: ProtocoladoTableRow) => (
    <Tag value={rowData.status} style={getStatusTagStyle(rowData.status)} className="status-tag-custom" />
  );
  const resultadoBodyTemplate = (rowData: ProtocoladoTableRow) => (
    <Tag value={rowData.resultado} severity={getResultadoSeverity(rowData.resultado)} />
  );

  const atualizarBodyTemplate = (rowData: ProtocoladoTableRow) => {
    return (
      <Button
        label="Atualizar"
        icon="pi pi-refresh"
        outlined
        onClick={() => {
          setRegistroAtualizando({ ...rowData, documentos: [] });
          setNovoAcompanhamento('');
          setParecerJuridico('');
          setResultadoSelecionado('');
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




  return (
    <div className="protocolados-page">
      <div className="page-header">
        <div>
          <h1>Protocolados</h1>
          <p>Gestão dos processos protocolados</p>
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
          onSelectionChange={(e) => setSelectedRegistros(e.value as ProtocoladoTableRow[])}
          tableStyle={{ minWidth: '95rem' }}
          emptyMessage="Nenhum processo encontrado."
          className="protocolados-table"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: ProtocoladoTableRow) => rowData.sequencial}
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
        style={{ width: '72rem', maxWidth: '96vw' }}
        modal
        onHide={fecharDialogAtualizacao}
        className="protocolado-update-dialog"
      >
        {registroAtualizando && (
          <div className="update-processo-layout">
            <div className="update-topbar">
              <div className="update-processo-title">
                Processo {registroAtualizando.numeroProcesso}
              </div>

              <Button
                label="Voltar"
                outlined
                onClick={fecharDialogAtualizacao}
              />
            </div>

            <section className="update-section">
              <h3>Informações do Processo</h3>

              <div className="update-info-grid">
                <div><strong>Paciente</strong><span>{registroAtualizando.paciente}</span></div>
                <div><strong>Cliente</strong><span>{registroAtualizando.cliente}</span></div>
                <div><strong>Procedimento</strong><span>{registroAtualizando.procedimento}</span></div>
                <div><strong>Valor</strong><span>{formatarMoeda(registroAtualizando.valor)}</span></div>
                <div><strong>Data Protocolo</strong><span>{formatarData(registroAtualizando.dataProtocolo)}</span></div>
                <div><strong>Dias desde o protocolo</strong><span>{registroAtualizando.dias} dias</span></div>
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
              <h3>Histórico de Acompanhamento</h3>
              {registroAtualizando.historico.length > 0 ? (
                <Timeline
                  value={registroAtualizando.historico}
                  align="left"
                  content={(item: HistoricoAcompanhamento) => (
                    <div className="timeline-card">
                      <div className="timeline-date">
                        {item.createDate?.split('T')[0]?.split('-').reverse().join('/') ?? '-'}
                      </div>
                      <div className="timeline-title">{item.acompanhamento}</div>
                      <div className="timeline-description">{item.descricao}</div>
                    </div>
                  )}
                  className="processo-timeline"
                />
              ) : (
                <div className="timeline-empty">Nenhum acompanhamento registrado.</div>
              )}
            </section>

            <section className="update-section">
              <h3>Adicionar Acompanhamento</h3>
              <div className="resultado-actions">
                <Button
                  label="Acompanhamento"
                  severity={tipoAcao === 'acompanhamento' ? 'info' : 'secondary'}
                  outlined={tipoAcao !== 'acompanhamento'}
                  onClick={() => setTipoAcao('acompanhamento')}
                />
                <Button
                  label="Decisão do Processo"
                  severity={tipoAcao === 'decisao' ? 'warning' : 'secondary'}
                  outlined={tipoAcao !== 'decisao'}
                  onClick={() => setTipoAcao('decisao')}
                />
              </div>

              {tipoAcao === 'acompanhamento' && (
                <div className="update-form-grid">
                  <div className="field field-span-4">
                    <label>Descrição</label>
                    <InputTextarea
                      value={novoAcompanhamento}
                      onChange={(e) => setNovoAcompanhamento(e.target.value)}
                      rows={4}
                      placeholder="Digite a atualização do processo..."
                    />
                  </div>
                  <div className="field field-span-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button label="Salvar Acompanhamento" icon="pi pi-check"
                      onClick={handleSalvarAcompanhamento} />
                  </div>
                </div>
              )}

              {tipoAcao === 'decisao' && (
                <div className="update-form-grid">
                  <div className="field field-span-4">
                    <label>Resultado</label>
                    <div className="resultado-actions">
                      <Button
                        label="Procedente (Ganho)"
                        severity={resultadoSelecionado === 'ganho' ? 'success' : 'secondary'}
                        outlined={resultadoSelecionado !== 'ganho'}
                        onClick={() => {
                          setResultadoSelecionado('ganho');
                          setValorGanho(registroAtualizando.valorOrcamento);
                        }}
                      />
                      <Button
                        label="Improcedente (Perda)"
                        severity={resultadoSelecionado === 'perda' ? 'danger' : 'secondary'}
                        outlined={resultadoSelecionado !== 'perda'}
                        onClick={() => {
                          setResultadoSelecionado('perda');
                          setValorGanho(null);
                        }}
                      />
                    </div>
                  </div>

                  {resultadoSelecionado !== '' && (
                    <div className="field field-span-2">
                      <label>{resultadoSelecionado === 'ganho' ? 'Valor Ganho' : 'Valor da Causa'}</label>
                      <InputNumber
                        value={valorGanho ?? undefined}
                        onValueChange={(e) => setValorGanho(e.value ?? null)}
                        mode="currency" currency="BRL" locale="pt-BR"
                      />
                    </div>
                  )}
                  <div className="field field-span-4">
                    <label>Análise Jurídica Final</label>
                    <InputTextarea
                      value={parecerJuridico}
                      onChange={(e) => setParecerJuridico(e.target.value)}
                      rows={5}
                      placeholder="Descreva o parecer jurídico final..."
                    />
                  </div>

                  <div className="field field-span-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button label="Salvar Decisão" icon="pi pi-check"
                      severity={resultadoSelecionado === 'ganho' ? 'success' : 'danger'}
                      onClick={handleSalvarDecisao} />
                  </div>
                </div>
              )}
            </section>


          </div>
        )}
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
