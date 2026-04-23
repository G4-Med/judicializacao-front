import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type {
  DataTableFilterMeta,
  DataTablePageEvent,
  DataTableSortEvent
} from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getParaProtocolar, salvarProtocolar, uploadAnexoOrder, getOrders, getMedicosCompleto, getAnexosOrder } from '../../services/api/orders';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { FilterMatchMode } from 'primereact/api';
import { Dialog } from 'primereact/dialog';
import { RadioButton } from 'primereact/radiobutton';
import { getStatusTagStyle } from '../../utils/statusTag';
import { ReadOnlyBanner } from '../../components/access/ReadOnlyBanner';
import { useAccess } from '../../access/AccessContext';
import './ParaProtocolarPage.css';

interface ParaProtocolar {
  id: number;
  paciente: string;
  dataNascimento: string | null;
  procedimento: string;
  area: string;
  subarea: string;
  nprocesso: string;
  refPreco: number;
  valorOrcamento: number;
  dataStatusOrcamento: string | null;
  solicitacao: string;
  cliente: string;
  valor: number;
  dataEnvioOrcamento: string;
  observacoes: string;
  numeroProcesso: string;
  status: string;
  anexoNome: string;
  idMedico?: number | null;
}

interface ParaProtocolarTableRow extends ParaProtocolar {
  sequencial: number;
  dias: number;
}

type NaoProtocolarOpcao = 'perda' | 'segredo' | 'diretoria' | '';

export function ParaProtocolarPage() {
  const { isReadOnly } = useAccess();
  const readOnly = isReadOnly('paraProtocolar');
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<ParaProtocolar[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);
  const [dataProtocolo, setDataProtocolo] = useState('');
  const [arquivoPeticao, setArquivoPeticao] = useState<File | null>(null)
  const [arquivoExtra1, setArquivoExtra1] = useState<File | null>(null)
  const [arquivoExtra2, setArquivoExtra2] = useState<File | null>(null)
  const [enviandoProtocolo, setEnviandoProtocolo] = useState(false)
  const [, setMedicos] = useState<any[]>([]);
  const [anexosOrcamento, setAnexosOrcamento] = useState<any[]>([]);
  const [loadingAnexosOrcamento, setLoadingAnexosOrcamento] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTipo, setPreviewTipo] = useState<'pdf' | 'imagem' | 'outro'>('outro');
  const [previewNome, setPreviewNome] = useState('');

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    cliente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    valor: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dataEnvioOrcamento: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
    status: { value: '', matchMode: FilterMatchMode.CONTAINS }
  });

  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [protocolarDialogVisible, setProtocolarDialogVisible] = useState(false);
  const [naoProtocolarDialogVisible, setNaoProtocolarDialogVisible] = useState(false);

  const [registroEditando, setRegistroEditando] = useState<ParaProtocolarTableRow | null>(null);
  const [registroProtocolando, setRegistroProtocolando] = useState<ParaProtocolarTableRow | null>(null);
  const [registroNaoProtocolar, setRegistroNaoProtocolar] = useState<ParaProtocolarTableRow | null>(null);

  const [naoProtocolarOpcao, setNaoProtocolarOpcao] = useState<NaoProtocolarOpcao>('');
  const [naoProtocolarObs, setNaoProtocolarObs] = useState('');

  const carregarDados = () => {
    setLoading(true);
    Promise.all([getParaProtocolar(), getOrders(), getMedicosCompleto()])
      .then(([paraProtocolarRes, ordersRes, medicosRes]) => {
        const ordersLookup = (ordersRes.data as any[]).reduce<Record<number, any>>((acc, order) => {
          acc[order.id] = order;
          return acc;
        }, {});
        setMedicos(medicosRes.data);
        setRegistros(
          paraProtocolarRes.data.map((o: any) => {
            const orderCompleta = ordersLookup[o.id];
            const medicoId = o.idMedico ?? orderCompleta?.idMedico ?? null;
            const medico = medicosRes.data.find((item: any) => item.id === medicoId);

            return {
              id: o.id,
              paciente: o.paciente ?? '',
              dataNascimento: o.dataNascimento,
              procedimento: o.procedimento ?? '',
              area: o.area ?? '',
              subarea: o.subarea ?? '',
              nprocesso: o.nprocesso ?? '',
              refPreco: o.refPreco ?? 0,
              valorOrcamento: o.valorOrcamento ?? 0,
              dataStatusOrcamento: o.dataStatusOrcamento,
              solicitacao: o.solicitacao ?? '',
              cliente: medico?.razaoSocial ?? '',
              valor: o.valorOrcamento ?? o.refPreco ?? 0,
              dataEnvioOrcamento: o.dataStatusOrcamento ?? '',
              observacoes: o.solicitacao ?? '',
              numeroProcesso: o.nprocesso ?? '',
              status: o.statusProcesso ?? '',
              anexoNome: '',
              idMedico: medicoId,
            };
          })
        );
      })
      .catch(() => console.error('Erro ao carregar para protocolar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const dataComCamposCalculados = useMemo<ParaProtocolarTableRow[]>(() => {
    const hoje = new Date();

    return registros.map((item, index) => {
      const dataBase = item.dataEnvioOrcamento
        ? new Date(`${item.dataEnvioOrcamento}T00:00:00`)
        : hoje;

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
    const quantidade = dataComCamposCalculados.length;
    const valor = dataComCamposCalculados.reduce((acc, item) => acc + item.valor, 0);
    const processoMaisAntigo = dataComCamposCalculados.length
      ? Math.max(...dataComCamposCalculados.map((item) => item.dias))
      : 0;

    return {
      quantidade,
      valor,
      processoMaisAntigo
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
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const precoBodyTemplate = (rowData: ParaProtocolarTableRow) => formatarMoeda(rowData.valor);
  const dataBodyTemplate = (rowData: ParaProtocolarTableRow) => formatarData(rowData.dataEnvioOrcamento);
  const diasBodyTemplate = (rowData: ParaProtocolarTableRow) => <span className="dias-cell">{rowData.dias}</span>;

  const statusBodyTemplate = (rowData: ParaProtocolarTableRow) => (
    <Tag value={rowData.status} style={getStatusTagStyle(rowData.status)} className="status-tag-custom" />
  );

  const abrirPreview = (url: string, nome: string, tipo: 'pdf' | 'imagem' | 'outro') => {
    setPreviewUrl(url);
    setPreviewNome(nome);
    setPreviewTipo(tipo);
    setPreviewVisible(true);
  };

  const baixarArquivo = async (url: string, nomeArquivo: string) => {
    void nomeArquivo;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const abrirOrcamentoAnexo = async (rowData: ParaProtocolarTableRow, modo: 'preview' | 'download') => {
    try {
      const res: any = await getAnexosOrder(rowData.id, 'ORCAMENTO');
      const listaAnexos: any[] = res.data.anexos ?? [];

      if (listaAnexos.length === 0) {
        alert('Nenhum orÃ§amento anexado para este pedido.');
        return;
      }

      const anexo = listaAnexos[0];
      const nomeArquivo = anexo.linkImagem.split('/').pop() || 'orcamento';
      const extensao = nomeArquivo.split('.').pop()?.toLowerCase();
      const tipo: 'pdf' | 'imagem' | 'outro' = extensao === 'pdf'
        ? 'pdf'
        : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
          ? 'imagem'
          : 'outro';

      if (modo === 'download') {
        await baixarArquivo(anexo.linkImagem, nomeArquivo);
        return;
      }

      abrirPreview(anexo.linkImagem, nomeArquivo, tipo);
    } catch {
      alert('Erro ao carregar o orÃ§amento do pedido.');
    }
  };

  const anexoBodyTemplate = (rowData: ParaProtocolarTableRow) => {
    return (
      <Button
        icon="pi pi-download"
        rounded
        outlined
        severity="secondary"
        aria-label={`Baixar orÃ§amento do pedido ${rowData.id}`}
        onClick={() => abrirOrcamentoAnexo(rowData, 'download')}
      />
    );
  };

  const editarBodyTemplate = (rowData: ParaProtocolarTableRow) => {
    return (
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="secondary"
        aria-label={`Editar ${rowData.id}`}
        onClick={() => {
          setRegistroEditando({ ...rowData });
          setAnexosOrcamento([]);
          setLoadingAnexosOrcamento(true);
          getAnexosOrder(rowData.id, 'ORCAMENTO')
            .then((res: any) => setAnexosOrcamento(res.data.anexos ?? []))
            .catch(() => setAnexosOrcamento([]))
            .finally(() => setLoadingAnexosOrcamento(false));
          setEditDialogVisible(true);
        }}
      />
    );
  };

  const protocolarBodyTemplate = (rowData: ParaProtocolarTableRow) => {
    return (
      <Button
        label="Protocolar"
        icon="pi pi-send"
        severity="success"
        outlined
        onClick={() => {
          setRegistroProtocolando({ ...rowData });
          setDataProtocolo('');
          setAnexosOrcamento([]);
          setLoadingAnexosOrcamento(true);
          getAnexosOrder(rowData.id, 'ORCAMENTO')
            .then((res: any) => setAnexosOrcamento(res.data.anexos ?? []))
            .catch(() => setAnexosOrcamento([]))
            .finally(() => setLoadingAnexosOrcamento(false));
          setProtocolarDialogVisible(true);
        }}
      />
    );
  };

  const excluirBodyTemplate = (rowData: ParaProtocolarTableRow) => {
    return (
      <Button
        label="NÃ£o Protocolar"
        icon="pi pi-times"
        severity="danger"
        outlined
        onClick={() => {
          setRegistroNaoProtocolar({ ...rowData });
          setNaoProtocolarOpcao('');
          setNaoProtocolarObs('');
          setAnexosOrcamento([]);
          setLoadingAnexosOrcamento(true);
          getAnexosOrder(rowData.id, 'ORCAMENTO')
            .then((res: any) => setAnexosOrcamento(res.data.anexos ?? []))
            .catch(() => setAnexosOrcamento([]))
            .finally(() => setLoadingAnexosOrcamento(false));
          setNaoProtocolarDialogVisible(true);
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

  const updateRegistroEditando = (field: keyof ParaProtocolarTableRow, value: any) => {
    if (!registroEditando) return;

    setRegistroEditando({
      ...registroEditando,
      [field]: value
    });
  };

  const handleSalvarEdicao = () => {
    if (!registroEditando) return;
    console.log('Salvar ediÃ§Ã£o:', registroEditando);
    setEditDialogVisible(false);
  };

const handleConfirmarProtocolacao = async () => {
  if (!registroProtocolando) return

  // ValidaÃ§Ãµes obrigatÃ³rias
  if (!dataProtocolo) {
    alert('A data de protocolaÃ§Ã£o Ã© obrigatÃ³ria.')
    return
  }
  if (!arquivoPeticao) {
    alert('O arquivo de petiÃ§Ã£o Ã© obrigatÃ³rio.')
    return
  }

  setEnviandoProtocolo(true)
  try {
    // 1 â€” Upload dos arquivos para R2
    const uploads = []

    uploads.push(uploadAnexoOrder(registroProtocolando.id, arquivoPeticao, 'PROTOCOLO'))

    if (arquivoExtra1) {
      uploads.push(uploadAnexoOrder(registroProtocolando.id, arquivoExtra1, 'PROTOCOLO'))
    }
    if (arquivoExtra2) {
      uploads.push(uploadAnexoOrder(registroProtocolando.id, arquivoExtra2, 'PROTOCOLO'))
    }

    await Promise.all(uploads)

    // 2 â€” Salva o protocolo
    await salvarProtocolar(registroProtocolando.id, {
      acao: 'protocolar',
      obs: registroProtocolando.observacoes || '',
      dataProtocolo
    })

    setProtocolarDialogVisible(false)
    setArquivoPeticao(null)
    setArquivoExtra1(null)
    setArquivoExtra2(null)
    carregarDados()
  } catch (err) {
    alert('Erro ao confirmar protocolaÃ§Ã£o.')
  } finally {
    setEnviandoProtocolo(false)
  }
}


  const handleConfirmarNaoProtocolar = async () => {
    if (!registroNaoProtocolar || !naoProtocolarOpcao) return;

    if (!naoProtocolarObs.trim()) {
      alert('ObservaÃ§Ã£o Ã© obrigatÃ³ria.');
      return;
    }

    const acao = naoProtocolarOpcao === 'segredo' ? 'segredo' : 'perda';

    try {
      await salvarProtocolar(registroNaoProtocolar.id, {
        acao,
        obs: naoProtocolarObs
      });
      carregarDados();
      setNaoProtocolarDialogVisible(false);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Erro ao processar.');
    }
  };

  return (
    <div className="para-protocolar-page">
      <div className="page-header">
        <div>
          <h1>Para Protocolar</h1>
          <p>GestÃ£o dos processos prontos para protocolaÃ§Ã£o</p>
        </div>

        <div className="page-actions">
          {!readOnly && <Button label="Novo" icon="pi pi-plus" />}
        </div>
      </div>

      {readOnly && <ReadOnlyBanner />}

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Quantidade de Processos</span>
            <i className="pi pi-list"></i>
          </div>
          <div className="kpi-value">{kpis.quantidade}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Valor</span>
            <i className="pi pi-dollar"></i>
          </div>
          <div className="kpi-value">{formatarMoeda(kpis.valor)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Processo mais antigo em dias</span>
            <i className="pi pi-clock"></i>
          </div>
          <div className="kpi-value">{kpis.processoMaisAntigo}</div>
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
          tableStyle={{ minWidth: '95rem' }}
          emptyMessage="Nenhum processo encontrado."
          className="para-protocolar-table"
        >
          {!readOnly && (
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          )}

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: ParaProtocolarTableRow) => rowData.sequencial}
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
            style={{ minWidth: '14rem' }}
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
            field="dataEnvioOrcamento"
            header="Data Envio OrÃ§amento"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={dataBodyTemplate}
            style={{ minWidth: '12rem' }}
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
            header="OrÃ§amento"
            body={anexoBodyTemplate}
            style={{ minWidth: '7rem' }}
            bodyStyle={{ textAlign: 'center' }}
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

          {!readOnly && <Column
            header="Editar"
            body={editarBodyTemplate}
            style={{ minWidth: '7rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />}

          {!readOnly && <Column
            header="Protocolar"
            body={protocolarBodyTemplate}
            style={{ minWidth: '10rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />}

          {!readOnly && <Column
            header="Excluir"
            body={excluirBodyTemplate}
            style={{ minWidth: '12rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />}
        </DataTable>
      </div>

      <Dialog
        header="Editar Processo"
        visible={editDialogVisible}
        style={{ width: '60rem', maxWidth: '95vw' }}
        modal
        onHide={() => setEditDialogVisible(false)}
        className="pp-dialog"
      >
        {registroEditando && (
          <div className="pp-form-grid">
            <div className="field field-span-2">
              <label>Paciente</label>
              <InputText
                value={registroEditando.paciente}
                onChange={(e) => updateRegistroEditando('paciente', e.target.value)}
              />
            </div>

            <div className="field field-span-2">
              <label>Cliente</label>
              <InputText
                value={registroEditando.cliente}
                onChange={(e) => updateRegistroEditando('cliente', e.target.value)}
              />
            </div>

            <div className="field">
              <label>Valor</label>
              <InputNumber
                value={registroEditando.valor}
                onValueChange={(e) => updateRegistroEditando('valor', e.value)}
                mode="currency"
                currency="BRL"
                locale="pt-BR"
              />
            </div>

            <div className="field">
              <label>NÃºmero do Processo</label>
              <InputText
                value={registroEditando.numeroProcesso}
                onChange={(e) => updateRegistroEditando('numeroProcesso', e.target.value)}
              />
            </div>

            <div className="field">
              <label>Data Envio OrÃ§amento</label>
              <InputText value={formatarData(registroEditando.dataEnvioOrcamento)} disabled />
            </div>

            <div className="field">
              <label>Status</label>
              <div className="tag-box">
                <Tag value={registroEditando.status} style={getStatusTagStyle(registroEditando.status)} className="status-tag-custom" />
              </div>
            </div>

            <div className="field field-span-4">
              <label>OrÃ§amento do Pedido</label>

              {loadingAnexosOrcamento && (
                <span style={{ fontSize: '0.9rem', color: '#888' }}>
                  <i className="pi pi-spin pi-spinner" style={{ marginRight: '6px' }} />
                  Carregando orÃ§amento...
                </span>
              )}

              {!loadingAnexosOrcamento && anexosOrcamento.length === 0 && (
                <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
                  Nenhum orÃ§amento anexado.
                </span>
              )}

              {!loadingAnexosOrcamento && anexosOrcamento.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {anexosOrcamento.map((anexo, index) => {
                    const nomeArquivo = anexo.linkImagem.split('/').pop() || `OrÃ§amento ${index + 1}`;
                    const extensao = nomeArquivo.split('.').pop()?.toLowerCase();
                    const icone = extensao === 'pdf'
                      ? 'pi pi-file-pdf'
                      : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
                        ? 'pi pi-image'
                        : 'pi pi-file';
                    const tipo: 'pdf' | 'imagem' | 'outro' = extensao === 'pdf'
                      ? 'pdf'
                      : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
                        ? 'imagem'
                        : 'outro';

                    return (
                      <button
                        key={anexo.id ?? index}
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
                        onClick={() => abrirPreview(anexo.linkImagem, nomeArquivo, tipo)}
                      >
                        <i className={icone} style={{ fontSize: '1.1rem', color: '#f97316' }} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{nomeArquivo}</span>
                        <i className="pi pi-eye" style={{ color: '#9ca3af', fontSize: '0.85rem' }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="field field-span-4">
              <label>ObservaÃ§Ãµes</label>
              <InputTextarea
                value={registroEditando.observacoes}
                onChange={(e) => updateRegistroEditando('observacoes', e.target.value)}
                rows={4}
              />
            </div>

            <div className="field field-span-2 field-button">
              <label>&nbsp;</label>
              <Button
                label="Atualizar Anexo"
                icon="pi pi-upload"
                outlined
                onClick={() => console.log('Atualizar anexo', registroEditando)}
              />
            </div>
          </div>
        )}

        {!readOnly && <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setEditDialogVisible(false)} />
          <Button label="Salvar" icon="pi pi-check" onClick={handleSalvarEdicao} />
        </div>}
      </Dialog>

      <Dialog
        header="Protocolar Processo"
        visible={protocolarDialogVisible}
        style={{ width: '64rem', maxWidth: '95vw' }}
        modal
        onHide={() => setProtocolarDialogVisible(false)}
        className="pp-dialog"
      >
        {registroProtocolando && (
          <div className="pp-form-grid">
            <div className="field field-span-2">
              <label>Paciente</label>
              <InputText value={registroProtocolando.paciente} disabled />
            </div>

            <div className="field field-span-2">
              <label>Cliente</label>
              <InputText value={registroProtocolando.cliente} disabled />
            </div>

            <div className="field">
              <label>Valor</label>
              <InputNumber
                value={registroProtocolando.valor}
                mode="currency"
                currency="BRL"
                locale="pt-BR"
                disabled
              />
            </div>

            <div className="field">
              <label>Dias</label>
              <InputText value={String(registroProtocolando.dias)} disabled />
            </div>

            <div className="field">
              <label>NÃºmero do Processo</label>
              <InputText value={registroProtocolando.numeroProcesso} disabled />
            </div>

            <div className="field">
              <label>Procedimento</label>
              <InputText value={registroProtocolando.procedimento} disabled />
            </div>

            <div className="field field-span-4">
              <label>ObservaÃ§Ãµes</label>
              <InputTextarea value={registroProtocolando.observacoes} rows={4} disabled />
            </div>

<div className="field field-span-4">
  <label>OrÃ§amento do Pedido</label>

  {loadingAnexosOrcamento && (
    <span style={{ fontSize: '0.9rem', color: '#888' }}>
      <i className="pi pi-spin pi-spinner" style={{ marginRight: '6px' }} />
      Carregando orÃ§amento...
    </span>
  )}

  {!loadingAnexosOrcamento && anexosOrcamento.length === 0 && (
    <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
      Nenhum orÃ§amento anexado.
    </span>
  )}

  {!loadingAnexosOrcamento && anexosOrcamento.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {anexosOrcamento.map((anexo, index) => {
        const nomeArquivo = anexo.linkImagem.split('/').pop() || `OrÃ§amento ${index + 1}`;
        const extensao = nomeArquivo.split('.').pop()?.toLowerCase();
        const icone = extensao === 'pdf'
          ? 'pi pi-file-pdf'
          : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
            ? 'pi pi-image'
            : 'pi pi-file';
        const tipo: 'pdf' | 'imagem' | 'outro' = extensao === 'pdf'
          ? 'pdf'
          : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
            ? 'imagem'
            : 'outro';

        return (
          <button
            key={anexo.id ?? index}
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
            onClick={() => abrirPreview(anexo.linkImagem, nomeArquivo, tipo)}
          >
            <i className={icone} style={{ fontSize: '1.1rem', color: '#f97316' }} />
            <span style={{ flex: 1, textAlign: 'left' }}>{nomeArquivo}</span>
            <i className="pi pi-eye" style={{ color: '#9ca3af', fontSize: '0.85rem' }} />
          </button>
        );
      })}
    </div>
  )}
</div>

<div className="field field-span-2">
  <label>
    Data ProtocolaÃ§Ã£o
    <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
  </label>
  <Calendar
    value={dataProtocolo ? new Date(dataProtocolo) : null}
    onChange={(e) =>
      setDataProtocolo(
        e.value instanceof Date ? e.value.toISOString().split('T')[0] : ''
      )
    }
    dateFormat="dd/mm/yy"
    showIcon
  />
</div>

<div className="field field-span-2">
  <label>
    PetiÃ§Ã£o
    <span style={{ color: '#ef4444', marginLeft: '4px' }}>*obrigatÃ³rio</span>
  </label>
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      borderRadius: '8px',
      border: `2px dashed ${arquivoPeticao ? '#f97316' : '#d1d5db'}`,
      background: arquivoPeticao ? '#fff7ed' : '#f9fafb',
      cursor: 'pointer',
      fontSize: '0.9rem',
      color: arquivoPeticao ? '#f97316' : '#6b7280',
    }}
  >
    <i className={arquivoPeticao ? 'pi pi-file-check' : 'pi pi-upload'} />
    <span>{arquivoPeticao ? arquivoPeticao.name : 'Selecionar petiÃ§Ã£o...'}</span>
    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      style={{ display: 'none' }}
      onChange={(e) => setArquivoPeticao(e.target.files?.[0] ?? null)}
    />
  </label>
</div>

<div className="field field-span-2">
  <label>Arquivo Extra 1 <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      borderRadius: '8px',
      border: `2px dashed ${arquivoExtra1 ? '#f97316' : '#d1d5db'}`,
      background: arquivoExtra1 ? '#fff7ed' : '#f9fafb',
      cursor: 'pointer',
      fontSize: '0.9rem',
      color: arquivoExtra1 ? '#f97316' : '#6b7280',
    }}
  >
    <i className={arquivoExtra1 ? 'pi pi-file-check' : 'pi pi-upload'} />
    <span>{arquivoExtra1 ? arquivoExtra1.name : 'Selecionar arquivo...'}</span>
    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      style={{ display: 'none' }}
      onChange={(e) => setArquivoExtra1(e.target.files?.[0] ?? null)}
    />
  </label>
</div>

<div className="field field-span-2">
  <label>Arquivo Extra 2 <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      borderRadius: '8px',
      border: `2px dashed ${arquivoExtra2 ? '#f97316' : '#d1d5db'}`,
      background: arquivoExtra2 ? '#fff7ed' : '#f9fafb',
      cursor: 'pointer',
      fontSize: '0.9rem',
      color: arquivoExtra2 ? '#f97316' : '#6b7280',
    }}
  >
    <i className={arquivoExtra2 ? 'pi pi-file-check' : 'pi pi-upload'} />
    <span>{arquivoExtra2 ? arquivoExtra2.name : 'Selecionar arquivo...'}</span>
    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      style={{ display: 'none' }}
      onChange={(e) => setArquivoExtra2(e.target.files?.[0] ?? null)}
    />
  </label>
</div>




          </div>
        )}

        {!readOnly && <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setProtocolarDialogVisible(false)} />
<Button
  label={enviandoProtocolo ? 'Enviando...' : 'Confirmar ProtocolaÃ§Ã£o'}
  icon="pi pi-check"
  onClick={handleConfirmarProtocolacao}
  loading={enviandoProtocolo}
  disabled={enviandoProtocolo}
/>
        </div>}
      </Dialog>

      <Dialog
        header="NÃ£o Protocolar"
        visible={naoProtocolarDialogVisible}
        style={{ width: '64rem', maxWidth: '95vw' }}
        modal
        onHide={() => setNaoProtocolarDialogVisible(false)}
        className="pp-dialog"
      >
        {registroNaoProtocolar && (
          <div className="pp-form-grid">
            <div className="field field-span-2">
              <label>Paciente</label>
              <InputText value={registroNaoProtocolar.paciente} disabled />
            </div>

            <div className="field field-span-2">
              <label>Cliente</label>
              <InputText value={registroNaoProtocolar.cliente} disabled />
            </div>

            <div className="field">
              <label>Valor</label>
              <InputNumber
                value={registroNaoProtocolar.valor}
                mode="currency"
                currency="BRL"
                locale="pt-BR"
                disabled
              />
            </div>

            <div className="field">
              <label>Dias</label>
              <InputText value={String(registroNaoProtocolar.dias)} disabled />
            </div>

            <div className="field">
              <label>NÃºmero do Processo</label>
              <InputText value={registroNaoProtocolar.numeroProcesso} disabled />
            </div>

            <div className="field">
              <label>Procedimento</label>
              <InputText value={registroNaoProtocolar.procedimento} disabled />
            </div>

            <div className="field field-span-4">
              <label>ObservaÃ§Ãµes</label>
              <InputTextarea value={registroNaoProtocolar.observacoes} rows={4} disabled />
            </div>

            <div className="field field-span-4">
              <label>OrÃ§amento do Pedido</label>

              {loadingAnexosOrcamento && (
                <span style={{ fontSize: '0.9rem', color: '#888' }}>
                  <i className="pi pi-spin pi-spinner" style={{ marginRight: '6px' }} />
                  Carregando orÃ§amento...
                </span>
              )}

              {!loadingAnexosOrcamento && anexosOrcamento.length === 0 && (
                <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
                  Nenhum orÃ§amento anexado.
                </span>
              )}

              {!loadingAnexosOrcamento && anexosOrcamento.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {anexosOrcamento.map((anexo, index) => {
                    const nomeArquivo = anexo.linkImagem.split('/').pop() || `OrÃ§amento ${index + 1}`;
                    const extensao = nomeArquivo.split('.').pop()?.toLowerCase();
                    const icone = extensao === 'pdf'
                      ? 'pi pi-file-pdf'
                      : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
                        ? 'pi pi-image'
                        : 'pi pi-file';
                    const tipo: 'pdf' | 'imagem' | 'outro' = extensao === 'pdf'
                      ? 'pdf'
                      : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
                        ? 'imagem'
                        : 'outro';

                    return (
                      <button
                        key={anexo.id ?? index}
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
                        onClick={() => abrirPreview(anexo.linkImagem, nomeArquivo, tipo)}
                      >
                        <i className={icone} style={{ fontSize: '1.1rem', color: '#f97316' }} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{nomeArquivo}</span>
                        <i className="pi pi-eye" style={{ color: '#9ca3af', fontSize: '0.85rem' }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="field field-span-4">
              <label>Escolha uma opÃ§Ã£o</label>

              <div className="radio-group">
                <div className="radio-item">
                  <RadioButton
                    inputId="opcaoPerda"
                    name="naoProtocolarOpcao"
                    value="perda"
                    onChange={(e) => setNaoProtocolarOpcao(e.value)}
                    checked={naoProtocolarOpcao === 'perda'}
                  />
                  <label htmlFor="opcaoPerda">Desistir e marcar Perda</label>
                </div>

                <div className="radio-item">
                  <RadioButton
                    inputId="opcaoSegredo"
                    name="naoProtocolarOpcao"
                    value="segredo"
                    onChange={(e) => setNaoProtocolarOpcao(e.value)}
                    checked={naoProtocolarOpcao === 'segredo'}
                  />
                  <label htmlFor="opcaoSegredo">NÃ£o Protocolar e marcar como Segredo de JustiÃ§a</label>
                </div>

                <div className="radio-item">
                  <RadioButton
                    inputId="opcaoDiretoria"
                    name="naoProtocolarOpcao"
                    value="diretoria"
                    onChange={(e) => setNaoProtocolarOpcao(e.value)}
                    checked={naoProtocolarOpcao === 'diretoria'}
                  />
                  <label htmlFor="opcaoDiretoria">Diretoria falou para nÃ£o protocolar</label>
                </div>
              </div>
            </div>

            <div className="field field-span-4">
              <label>
                Obs <span style={{ color: '#ef4444' }}>*obrigatÃ³rio</span>
              </label>
              <InputTextarea
                value={naoProtocolarObs}
                onChange={(e) => setNaoProtocolarObs(e.target.value)}
                rows={4}
                placeholder="Descreva o motivo..."
              />
            </div>
          </div>
        )}

        {!readOnly && <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setNaoProtocolarDialogVisible(false)} />
          <Button
            label="Confirmar"
            icon="pi pi-check"
            severity="danger"
            disabled={!naoProtocolarOpcao}
            onClick={handleConfirmarNaoProtocolar}
          />
        </div>}
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
                onClick={() => baixarArquivo(previewUrl, previewNome || 'arquivo')}
              />
            </div>
          )}
        </div>

        <div className="dialog-footer-actions">
          <Button
            label="Baixar"
            icon="pi pi-download"
            outlined
            onClick={() => baixarArquivo(previewUrl, previewNome || 'arquivo')}
          />
          <Button label="Fechar" onClick={() => setPreviewVisible(false)} />
        </div>
      </Dialog>
    </div>
  );
}
