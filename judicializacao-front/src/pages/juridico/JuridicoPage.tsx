import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type { DataTableFilterMeta, DataTablePageEvent, DataTableSortEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { FilterMatchMode } from 'primereact/api';
import { getJuridico, salvarJuridico, getStatusOrders, getAnexosOrder } from '../../services/api/orders';
import { useAccess } from '../../access/AccessContext';
import { ReadOnlyBanner } from '../../components/access/ReadOnlyBanner';
import './JuridicoPage.css';

interface ProcessoJuridico {
  id: number;
  paciente: string;
  dataNascimento: string | null;
  idade: number;
  procedimento: string;
  refPreco: number;
  dataPedido: string;
  dias: number;
  statusJuridico: string;
  nprocesso: string;
  solicitacao: string;
  emailSolicitante: string;
}

interface ProcessoJuridicoRow extends ProcessoJuridico {
  sequencial: number;
}

interface Anexo {
  id: number
  linkImagem: string
  tipo: string
  createDate: string
}

function calcularIdade(dataNascimento: string | null): number {
  if (!dataNascimento) return 0;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}



export function JuridicoPage() {
  const { isReadOnly } = useAccess();
  const readOnly = isReadOnly('juridico');
  const [loading, setLoading] = useState(false);
  const [processos, setProcessos] = useState<ProcessoJuridico[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [processoEditando, setProcessoEditando] = useState<ProcessoJuridicoRow | null>(null);
  const [obsObrigatorio, setObsObrigatorio] = useState(false);
  const [nprocessoObrigatorio, setNprocessoObrigatorio] = useState(false);
  const [nprocesso, setNprocesso] = useState('');
  const [statusJuridico, setStatusJuridico] = useState('');
  const [orcamentos, setOrcamentos] = useState('');
  const [obs, setObs] = useState('');
  const [statusJuridicoOpts, setStatusJuridicoOpts] = useState<{label: string, value: string}[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [loadingAnexos, setLoadingAnexos] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [previewTipo, setPreviewTipo] = useState<'pdf' | 'imagem' | 'outro'>('outro')
  const [previewNome, setPreviewNome] = useState<string>('')

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    idade: { value: '', matchMode: FilterMatchMode.CONTAINS },
    procedimento: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });

  const carregarDados = () => {
    setLoading(true);
    getJuridico()
      .then(({ data }) => {
        setProcessos(data.map((o: any) => ({
          ...o,
          idade: calcularIdade(o.dataNascimento),
        })));
      })
      .catch(() => console.error('Erro ao carregar jurídico'))
      .finally(() => setLoading(false));
  };

    useEffect(() => {
    setLoading(true);
    Promise.all([getJuridico(), getStatusOrders()])
        .then(([juridicRes, statusRes]) => {
        setStatusJuridicoOpts(
            statusRes.data.statusJuridico.map((s: string) => ({ label: s, value: s }))
        );
        setProcessos(juridicRes.data.map((o: any) => ({
            ...o,
            idade: calcularIdade(o.dataNascimento),
        })));
        })
        .catch(() => console.error('Erro ao carregar jurídico'))
        .finally(() => setLoading(false));
    }, []);

  const dataComSequencial = useMemo<ProcessoJuridicoRow[]>(() => {
    return processos.map((item, index) => ({ ...item, sequencial: index + 1 }));
  }, [processos]);

  const kpis = useMemo(() => {
    const total = dataComSequencial.length;
    const somaRefPreco = dataComSequencial.reduce((acc, p) => acc + (p.refPreco ?? 0), 0);
    const valorMedio = total > 0 ? somaRefPreco / total : 0;
    const maisAntigo = total > 0 ? Math.max(...dataComSequencial.map(p => p.dias)) : 0;
    return { total, valorMedio, maisAntigo };
  }, [dataComSequencial]);

const abrirEdicao = (rowData: ProcessoJuridicoRow) => {
  setProcessoEditando(rowData);
  setNprocesso(rowData.nprocesso ?? '');
  setStatusJuridico('');
  setOrcamentos('');
  setObs('');
  setObsObrigatorio(false);
  setNprocessoObrigatorio(false);
  setEditDialogVisible(true);

  // adiciona isso
  setAnexos([])
  setLoadingAnexos(true)
  getAnexosOrder(rowData.id, 'RELATORIO')
    .then((res: any) => setAnexos(res.data.anexos))
    .catch(() => setAnexos([]))
    .finally(() => setLoadingAnexos(false))
};

  const handleSalvar = async () => {
    if (!processoEditando) return;

    if (statusJuridico === 'Cotar' && !nprocesso.trim()) {
      setNprocessoObrigatorio(true);
      return;
    }

    if (statusJuridico === 'Não Cotar' && !obs.trim()) {
      setObsObrigatorio(true);
      return;
    }

      const payload = {
        nprocesso: nprocesso || null,
        statusJuridico: statusJuridico || null,
        orcamentos: orcamentos || null,
        obs: obs || null,
    };

      console.log('PAYLOAD ENVIADO PARA salvarJuridico:', payload);
      console.log('PROCESSO EDITANDO:', processoEditando);

    try {
        await salvarJuridico(processoEditando.id, payload);
        carregarDados();
        setEditDialogVisible(false);
    } catch (err: any) {
      console.error('ERRO AO SALVAR JURÍDICO:', err);
        alert(err?.response?.data?.error ?? 'Erro ao salvar. Tente novamente.');
    }
  };

  const formatarData = (data: string) => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const abrirPreview = (url: string, nome: string, tipo: 'pdf' | 'imagem' | 'outro') => {
    setPreviewUrl(url);
    setPreviewNome(nome);
    setPreviewTipo(tipo);
    setPreviewVisible(true);
  };

  const filterElement = (options: any, placeholder: string) => (
    <InputText
      value={options.value || ''}
      onChange={(e) => options.filterApplyCallback(e.target.value)}
      placeholder={placeholder}
      className="p-column-filter"
    />
  );

  const editarBodyTemplate = (rowData: ProcessoJuridicoRow) => (
    <Button
      icon="pi pi-pencil"
      rounded outlined severity="secondary"
      onClick={() => abrirEdicao(rowData)}
    />
  );

  return (
    <div className="juridico-page">
      <div className="page-header">
        <div>
          <h1>Jurídico</h1>
          <p>Processos aguardando análise jurídica</p>
        </div>
      </div>

      {readOnly && <ReadOnlyBanner />}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header"><span>Quantidade de Processos</span><i className="pi pi-list" /></div>
          <div className="kpi-value">{kpis.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header"><span>Valor Médio dos Processos</span><i className="pi pi-dollar" /></div>
          <div className="kpi-value">{formatarMoeda(kpis.valorMedio)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header"><span>Processo mais antigo em dias</span><i className="pi pi-clock" /></div>
          <div className="kpi-value">{kpis.maisAntigo}</div>
        </div>
      </div>

      <div className="card">
        <DataTable
          value={dataComSequencial}
          dataKey="id"
          paginator
          rows={rows}
          first={first}
          onPage={(e: DataTablePageEvent) => { setFirst(e.first); setRows(e.rows); }}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={(e: DataTableSortEvent) => { setSortField(e.sortField); setSortOrder(e.sortOrder); }}
          filters={filters}
          onFilter={(e) => setFilters(e.filters)}
          filterDisplay="row"
          loading={loading}
          emptyMessage="Nenhum processo aguardando jurídico."
          className="juridico-table"
        >
          <Column field="sequencial" header="#" sortable style={{ minWidth: '4rem' }} />
          <Column field="paciente" header="Paciente" sortable filter
            filterElement={(o) => filterElement(o, 'Buscar')} style={{ minWidth: '16rem' }} />
          <Column
            field="idade"
            header="Idade"
            sortable
            filter
            filterElement={(o) => filterElement(o, 'Buscar')}
            style={{ minWidth: '7rem' }}
          />
          <Column field="procedimento" header="Procedimento" sortable filter
            filterElement={(o) => filterElement(o, 'Buscar')} style={{ minWidth: '18rem' }} />
          <Column
            field="dias"
            header="Dias Solicitados"
            sortable
            filter
            filterElement={(o) => filterElement(o, 'Buscar')}
            style={{ minWidth: '10rem' }}
          />
          <Column header="Editar" 
            body={editarBodyTemplate}
            style={{ minWidth: '7rem' }} 
            bodyStyle={{ textAlign: 'center' }} />
        </DataTable>
      </div>

      <Dialog
        header="Análise Jurídica"
        visible={editDialogVisible}
        style={{ width: '60rem', maxWidth: '96vw' }}
        modal
        onHide={() => setEditDialogVisible(false)}
        className="juridico-edit-dialog"
      >
        {processoEditando && (
          <div className="juridico-form-grid">

            {/* Campos somente leitura (readOnly permite selecionar/copiar) */}
            <div className="field field-span-3">
              <label>Paciente</label>
              <InputText value={processoEditando.paciente} readOnly />
            </div>
            <div className="field field-span-1">
              <label>Idade</label>
              <InputText value={String(processoEditando.idade)} readOnly />
            </div>
            <div className="field field-span-4">
              <label>Procedimento</label>
              <InputText value={processoEditando.procedimento} readOnly />
            </div>
            <div className="field field-span-2">
              <label>Data da Solicitação</label>
              <InputText value={formatarData(processoEditando.dataPedido)} readOnly />
            </div>
            <div className="field field-span-2">
              <label>Dias da Solicitação</label>
              <InputText value={String(processoEditando.dias)} readOnly />
            </div>

            {/* Anexos */}
            {processoEditando.solicitacao && (
              <div className="field field-span-4">
                <label>Solicitação (corpo do e-mail)</label>
                <InputTextarea value={processoEditando.solicitacao} rows={5} readOnly autoResize />
              </div>
            )}


            {/* Anexos */}
            <div className="field field-span-4">
              <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                <i className="pi pi-paperclip" style={{ marginRight: '6px' }} />
                Relatórios Anexados
              </label>

              {loadingAnexos && (
                <span style={{ fontSize: '0.9rem', color: '#888' }}>
                  <i className="pi pi-spin pi-spinner" style={{ marginRight: '6px' }} />
                  Carregando arquivos...
                </span>
              )}

              {!loadingAnexos && anexos.length === 0 && (
                <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
                  Nenhum relatório anexado.
                </span>
              )}

              {!loadingAnexos && anexos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {anexos.map((anexo, index) => {
                    const nomeArquivo = anexo.linkImagem.split('/').pop() || `Arquivo ${index + 1}`
                    const extensao = nomeArquivo.split('.').pop()?.toLowerCase()
                    const icone = extensao === 'pdf'
                      ? 'pi pi-file-pdf'
                      : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
                        ? 'pi pi-image'
                        : 'pi pi-file'
                    const tipo: 'pdf' | 'imagem' | 'outro' = extensao === 'pdf'
                      ? 'pdf'
                      : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
                        ? 'imagem'
                        : 'outro'

                    return (
                        <button
                        key={anexo.id}
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
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        onClick={() => abrirPreview(anexo.linkImagem, nomeArquivo, tipo)}
                      >
                        <i className={icone} style={{ fontSize: '1.1rem', color: '#f97316' }} />
                        <span style={{ flex: 1 }}>{nomeArquivo}</span>
                        <i className="pi pi-eye" style={{ color: '#9ca3af', fontSize: '0.85rem' }} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>


            {/* Campos editáveis */}
            <div className="field field-span-2">
              <label>Número do Processo</label>
              <InputText
                value={nprocesso}
                onChange={(e) => {
                  setNprocesso(e.target.value);
                  if (e.target.value.trim()) setNprocessoObrigatorio(false);
                }}
                placeholder="Ex: 0012345-67.2026.8.13.0000"
                className={nprocessoObrigatorio ? 'p-invalid' : ''}
                disabled={readOnly}
              />
              {nprocessoObrigatorio && (
                <small style={{ color: '#ef4444' }}>
                  Número do Processo é obrigatório quando o status é "Cotar"
                </small>
              )}
            </div>

            <div className="field field-span-2">
              <label>Status Jurídico</label>
              <Dropdown
                value={statusJuridico}
                options={statusJuridicoOpts}
                onChange={(e) => {
                  setStatusJuridico(e.value);
                  if (e.value !== 'Cotar') setNprocessoObrigatorio(false);
                  if (e.value !== 'Não Cotar') setObsObrigatorio(false);
                }}
                placeholder="Selecione"
              />
            </div>

            <div className="field field-span-4">
              <label>Orçamentos</label>
              <InputTextarea
                value={orcamentos}
                onChange={(e) => setOrcamentos(e.target.value)}
                rows={4}
                autoResize
                placeholder="Descreva os orçamentos recebidos..."
              />
            </div>

            <div className="field field-span-4">
              <label>
                Observações
                {statusJuridico === 'Não Cotar' && (
                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>*obrigatório</span>
                )}
              </label>
              <InputTextarea
                value={obs}
                onChange={(e) => {
                  setObs(e.target.value);
                  if (e.target.value.trim()) setObsObrigatorio(false);
                }}
                rows={3}
                autoResize
                placeholder="Observações sobre o processo..."
                className={obsObrigatorio ? 'p-invalid' : ''}
                disabled={readOnly}
              />
              {obsObrigatorio && (
                <small style={{ color: '#ef4444' }}>
                  Observações é obrigatório quando o status é "Não Cotar"
                </small>
              )}
            </div>
          </div>
        )}

        <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setEditDialogVisible(false)} />
          {!readOnly && <Button label="Salvar" icon="pi pi-check" onClick={handleSalvar} />}
        </div>
      </Dialog>

      <Dialog
        header={previewNome}
        visible={previewVisible}
        style={{ width: '80vw', maxWidth: '1100px', height: '90vh' }}
        modal
        onHide={() => setPreviewVisible(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              style={{ textDecoration: 'none' }}
            >
              <Button label="Baixar" icon="pi pi-download" outlined />
            </a>
            <Button label="Fechar" onClick={() => setPreviewVisible(false)} />
          </div>
        }
      >
        <div style={{ height: 'calc(90vh - 160px)' }}>
          {previewTipo === 'pdf' && (
            <iframe
              src={previewUrl}
              title={previewNome}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            />
          )}

          {previewTipo === 'imagem' && (
            <div style={{ width: '100%', height: '100%', overflow: 'auto', textAlign: 'center' }}>
              <img
                src={previewUrl}
                alt={previewNome}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          )}

          {previewTipo === 'outro' && (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <i className="pi pi-file" style={{ fontSize: '2rem', color: '#9ca3af', marginBottom: '12px' }} />
                <p style={{ marginBottom: '12px' }}>Visualização não disponível para este tipo de arquivo.</p>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" download>
                  Baixar arquivo
                </a>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}




