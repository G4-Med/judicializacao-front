import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type { DataTableFilterMeta, DataTablePageEvent, DataTableSortEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import { getOrcamentoMedico, salvarOrcamentoMedico, getAnexosOrder, uploadAnexoOrder } from '../../services/api/orders';
import './OrcamentoMedicoPage.css';

interface ItemOrcamento { descricao: string; valor: number; }

interface ProcessoOrcamento {
  id: number;
  paciente: string;
  dataNascimento: string | null;
  idade: number;
  procedimento: string;
  area: string;
  subarea: string;
  refPreco: number;
  dataStatusJuridico: string | null;
  dias: number;
  statusOrcamento: string;
  solicitacao: string;
  orcamentosJuridico: string | null;
}

interface ProcessoOrcamentoRow extends ProcessoOrcamento { sequencial: number; }

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

function calcularTotal(
  equipe: ItemOrcamento[], taxas: ItemOrcamento[],
  opme: ItemOrcamento[], medic: ItemOrcamento[]
): number {
  const soma = (arr: ItemOrcamento[]) => arr.reduce((s, i) => s + (i.valor || 0), 0);
  return soma(equipe) + soma(taxas) + soma(opme) + soma(medic);
}

const itemVazio = (): ItemOrcamento => ({ descricao: '', valor: 0 });

export function OrcamentoMedicoPage() {
  const [loading, setLoading] = useState(false);
  const [processos, setProcessos] = useState<ProcessoOrcamento[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [loadingAnexos, setLoadingAnexos] = useState(false)
  const [escolhaVisible, setEscolhaVisible] = useState(false)
  const [arquivoVisible, setArquivoVisible] = useState(false)
  const [valorArquivo, setValorArquivo] = useState<number | null>(null)
  const [enviandoArquivo, setEnviandoArquivo] = useState(false)

  // dialogs
  const [detalheVisible, setDetalheVisible] = useState(false);
  const [orcamentoVisible, setOrcamentoVisible] = useState(false);
  const [examesVisible, setExamesVisible] = useState(false);
  const [processoSelecionado, setProcessoSelecionado] = useState<ProcessoOrcamentoRow | null>(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);

  // campos orçamento
  const [equipeMedica, setEquipeMedica] = useState<ItemOrcamento[]>([itemVazio()]);
  const [taxasHospitalar, setTaxasHospitalar] = useState<ItemOrcamento[]>([itemVazio()]);
  const [opmeMateriais, setOpmeMateriais] = useState<ItemOrcamento[]>([itemVazio()]);
  const [medicamentos, setMedicamentos] = useState<ItemOrcamento[]>([itemVazio()]);
  const [exames, setExames] = useState('');
  

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    procedimento: { value: '', matchMode: FilterMatchMode.CONTAINS },
    area: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });

  const carregarDados = () => {
    setLoading(true);
    getOrcamentoMedico()
      .then(({ data }) => {
        setProcessos(data.map((o: any) => ({
          ...o,
          idade: calcularIdade(o.dataNascimento),
        })));
      })
      .catch(() => console.error('Erro ao carregar orçamentos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregarDados(); }, []);

  const dataComSequencial = useMemo<ProcessoOrcamentoRow[]>(() => {
    return processos.map((item, index) => ({ ...item, sequencial: index + 1 }));
  }, [processos]);

  const kpis = useMemo(() => {
    const total = dataComSequencial.length;
    const soma = dataComSequencial.reduce((acc, p) => acc + (p.refPreco ?? 0), 0);
    const valorMedio = total > 0 ? soma / total : 0;
    const maisAntigo = total > 0 ? Math.max(...dataComSequencial.map(p => p.dias)) : 0;
    return { total, valorMedio, maisAntigo };
  }, [dataComSequencial]);

  const formatarData = (data: string | null) => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const abrirDetalhe = (rowData: ProcessoOrcamentoRow) => {
  setProcessoSelecionado(rowData);
  setDetalheVisible(true);

  // 👇 adiciona isso
  setAnexos([])
  setLoadingAnexos(true)
  getAnexosOrder(rowData.id, 'RELATORIO')
    .then((res: any) => setAnexos(res.data.anexos))
    .catch(() => setAnexos([]))
    .finally(() => setLoadingAnexos(false))
};

  const abrirOrcamento = () => {
    setEquipeMedica([itemVazio()]);
    setTaxasHospitalar([itemVazio()]);
    setOpmeMateriais([itemVazio()]);
    setMedicamentos([itemVazio()]);
    setOrcamentoVisible(true);
  };

  const handleEnviarOrcamento = async () => {
    if (!processoSelecionado) return;
    const valorTotal = calcularTotal(equipeMedica, taxasHospitalar, opmeMateriais, medicamentos);
    try {
      await salvarOrcamentoMedico(processoSelecionado.id, {
        acao: 'enviar_orcamento',
        equipeMedica,
        taxasHospitalar,
        opmeMateriais,
        medicamentos,
        valorTotal,
      });
      setOrcamentoVisible(false);
      setDetalheVisible(false);
      carregarDados();
    } catch (err) {
      alert('Erro ao enviar orçamento.');
    }
  };

  const handleSolicitarExames = async () => {
    if (!processoSelecionado) return;
    try {
      await salvarOrcamentoMedico(processoSelecionado.id, {
        acao: 'solicitar_exames',
        exames,
      });
      setExamesVisible(false);
      setDetalheVisible(false);
      carregarDados();
    } catch (err) {
      alert('Erro ao solicitar exames.');
    }
  };

  const handleNaoFaco = async () => {
    if (!processoSelecionado) return;
    if (!confirm('Confirma que não faz esse procedimento?')) return;
    try {
      await salvarOrcamentoMedico(processoSelecionado.id, { acao: 'nao_faco' });
      setDetalheVisible(false);
      carregarDados();
    } catch (err) {
      alert('Erro ao registrar perda.');
    }
  };

  // Helper para editar linhas de orçamento
  const updateItem = (
    arr: ItemOrcamento[], setArr: React.Dispatch<React.SetStateAction<ItemOrcamento[]>>,
    index: number, field: keyof ItemOrcamento, value: any
  ) => {
    const novo = [...arr];
    novo[index] = { ...novo[index], [field]: value };
    setArr(novo);
  };

  const addItem = (arr: ItemOrcamento[], setArr: React.Dispatch<React.SetStateAction<ItemOrcamento[]>>) =>
    setArr([...arr, itemVazio()]);

  const removeItem = (arr: ItemOrcamento[], setArr: React.Dispatch<React.SetStateAction<ItemOrcamento[]>>, index: number) =>
    setArr(arr.filter((_, i) => i !== index));

  const renderSecaoOrcamento = (
    titulo: string,
    arr: ItemOrcamento[],
    setArr: React.Dispatch<React.SetStateAction<ItemOrcamento[]>>
  ) => (
    <div className="secao-orcamento">
      <h3>{titulo}</h3>
      {arr.map((item, i) => (
        <div key={i} className="orcamento-row">
          <InputText
            value={item.descricao}
            onChange={(e) => updateItem(arr, setArr, i, 'descricao', e.target.value)}
            placeholder="Descrição"
            className="orcamento-descricao"
          />
          <InputNumber
            value={item.valor}
            onValueChange={(e) => updateItem(arr, setArr, i, 'valor', e.value ?? 0)}
            mode="currency" currency="BRL" locale="pt-BR"
            className="orcamento-valor"
          />
          <Button
            icon="pi pi-trash" severity="danger" outlined rounded
            onClick={() => removeItem(arr, setArr, i)}
            disabled={arr.length === 1}
          />
        </div>
      ))}
      <Button
        label="+ Adicionar" text
        onClick={() => addItem(arr, setArr)}
        style={{ marginTop: '4px' }}
      />
    </div>
  );

  const filterElement = (options: any, placeholder: string) => (
    <InputText
      value={options.value || ''}
      onChange={(e) => options.filterApplyCallback(e.target.value)}
      placeholder={placeholder} className="p-column-filter"
    />
  );

  const valorTotal = calcularTotal(equipeMedica, taxasHospitalar, opmeMateriais, medicamentos);


const copiarParaWhatsapp = async (rowData: ProcessoOrcamentoRow) => {
  let linhasAnexos = 'Nenhum anexo'
  try {
    const res: any = await getAnexosOrder(rowData.id, 'RELATORIO')
    const listaAnexos: any[] = res.data.anexos
    if (listaAnexos.length > 0) {
      linhasAnexos = listaAnexos.map((a: any) => a.linkImagem).join('\n')
    }
  } catch {
    linhasAnexos = 'Erro ao carregar anexos'
  }

  const hoje = new Date()
  const dataRef = rowData.dataStatusJuridico
    ? new Date(rowData.dataStatusJuridico + 'T00:00:00')
    : null
  const diasEmAberto = dataRef
    ? Math.max(0, Math.floor((hoje.getTime() - dataRef.getTime()) / (1000 * 60 * 60 * 24)))
    : rowData.dias

  // 👇 campo orcamentosJuridico adicionado
  const orcamentos = rowData.orcamentosJuridico?.trim() || 'Nenhum orçamento registrado'

  const texto = `[#] SOLICITAÇÃO DE ORÇAMENTO
----------------------------------------
👤 Paciente: ${rowData.paciente}
🎂 Idade: ${rowData.idade}
🏥 Procedimento: ${rowData.procedimento}
📋 Área: ${rowData.area}
📁 Subárea: ${rowData.subarea}
📅 Data Solicitação: ${formatarData(rowData.dataStatusJuridico)}
📌 Status: ${rowData.statusOrcamento}
⏰ Dias em Aberto: ${diasEmAberto} dias
💸 Orçamentos:
${orcamentos}
Anexos:
${linhasAnexos}
----------------------------------------`

  // 👇 fallback para localhost sem HTTPS
  const copiar = async (texto: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = texto
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  try {
    await copiar(texto)
    alert('Copiado! Cole no WhatsApp.')
  } catch {
    alert('Não foi possível copiar.')
  }
}


const handleEnviarArquivo = async () => {
  if (!processoSelecionado || !valorArquivo) {
    alert('Informe o valor total do orçamento.');
    return;
  }
  setEnviandoArquivo(true);
  try {
    // 1. Salva o orçamento
    await salvarOrcamentoMedico(processoSelecionado.id, {
      acao: 'enviar_orcamento',
      equipeMedica: [],
      taxasHospitalar: [],
      opmeMateriais: [],
      medicamentos: [],
      valorTotal: valorArquivo,
    });

    // 2. Se tiver arquivo, faz upload
    if (arquivoSelecionado) {
      await uploadAnexoOrder(processoSelecionado.id, arquivoSelecionado, 'ORCAMENTO');
    }

    setArquivoVisible(false);
    setDetalheVisible(false);
    setArquivoSelecionado(null);
    setValorArquivo(null);
    carregarDados();
  } catch {
    alert('Erro ao enviar orçamento.');
  } finally {
    setEnviandoArquivo(false);
  }
};


  return (
    <div className="orcamento-medico-page">
      <div className="page-header">
        <div>
          <h1>Orçamento Médico</h1>
          <p>Processos aguardando orçamento do médico</p>
        </div>
      </div>

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
          value={dataComSequencial} dataKey="id" paginator rows={rows} first={first}
          onPage={(e: DataTablePageEvent) => { setFirst(e.first); setRows(e.rows); }}
          sortField={sortField} sortOrder={sortOrder}
          onSort={(e: DataTableSortEvent) => { setSortField(e.sortField); setSortOrder(e.sortOrder); }}
          filters={filters} onFilter={(e) => setFilters(e.filters)}
          filterDisplay="row" loading={loading}
          emptyMessage="Nenhum processo aguardando orçamento."
          className="orcamento-table"
        >
          <Column field="sequencial" header="#" sortable style={{ minWidth: '4rem' }} />
          <Column field="paciente" header="Paciente" sortable filter
            filterElement={(o) => filterElement(o, 'Buscar')} style={{ minWidth: '16rem' }} />
          <Column field="idade" header="Idade" sortable style={{ minWidth: '7rem' }} />
          <Column field="procedimento" header="Procedimento" sortable filter
            filterElement={(o) => filterElement(o, 'Buscar')} style={{ minWidth: '18rem' }} />
          <Column field="area" header="Área" sortable filter
            filterElement={(o) => filterElement(o, 'Buscar')} style={{ minWidth: '10rem' }} />
          <Column field="subarea" header="Subárea" sortable style={{ minWidth: '12rem' }} />
          <Column field="dataStatusJuridico" header="Data Solicitação"
            body={(r) => formatarData(r.dataStatusJuridico)} sortable style={{ minWidth: '12rem' }} />
          <Column field="dias" header="Dias em Aberto" sortable style={{ minWidth: '10rem' }} />
          <Column field="statusOrcamento" header="Status"
            body={(r) => <Tag value={r.statusOrcamento} severity="warning" />}
            style={{ minWidth: '14rem' }} />
          <Column header="Enviar Orçamento"
            body={(rowData) => (
              <Button label="Abrir" icon="pi pi-folder-open" outlined severity="secondary"
                onClick={() => abrirDetalhe(rowData)} />
            )}
            style={{ minWidth: '10rem' }} bodyStyle={{ textAlign: 'center' }} />
            <Column
              header="Copiar"
              body={(rowData) => (
                <Button
                  label="Copiar"
                  icon="pi pi-copy"
                  outlined
                  severity="secondary"
                  onClick={() => copiarParaWhatsapp(rowData)}
                />
              )}
              style={{ minWidth: '9rem' }}
              bodyStyle={{ textAlign: 'center' }}
            />
        </DataTable>
      </div>

      {/* Dialog Detalhe */}
      <Dialog header="Detalhes do Processo" visible={detalheVisible}
        style={{ width: '70rem', maxWidth: '96vw' }} modal
        onHide={() => setDetalheVisible(false)} className="orcamento-edit-dialog">
        {processoSelecionado && (
          <div className="orcamento-form-grid">
            <div className="field field-span-3">
              <label>Paciente</label>
              <InputText value={processoSelecionado.paciente} disabled />
            </div>
            <div className="field field-span-1">
              <label>Idade</label>
              <InputText value={String(processoSelecionado.idade)} disabled />
            </div>
            <div className="field field-span-4">
              <label>Procedimento</label>
              <InputText value={processoSelecionado.procedimento} disabled />
            </div>
            <div className="field field-span-2">
              <label>Área</label>
              <InputText value={processoSelecionado.area} disabled />
            </div>
            <div className="field field-span-2">
              <label>Subárea</label>
              <InputText value={processoSelecionado.subarea} disabled />
            </div>
            <div className="field field-span-2">
              <label>Data da Solicitação</label>
              <InputText value={formatarData(processoSelecionado.dataStatusJuridico)} disabled />
            </div>
            <div className="field field-span-2">
              <label>Dias em Aberto</label>
              <InputText value={String(processoSelecionado.dias)} disabled />
            </div>

            {processoSelecionado.solicitacao && (
              <div className="field field-span-4">
                <label>Solicitação (corpo do e-mail)</label>
                <InputTextarea value={processoSelecionado.solicitacao} rows={4} disabled autoResize />
              </div>
            )}

            {processoSelecionado.orcamentosJuridico && (
              <div className="field field-span-4">
                <label>Orçamentos (Jurídico)</label>
                <InputTextarea value={processoSelecionado.orcamentosJuridico} rows={3} disabled autoResize />
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

                    return (
                        <a
                        key={anexo.id}
                        href={anexo.linkImagem}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          textDecoration: 'none',
                          color: '#374151',
                          fontSize: '0.9rem',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <i className={icone} style={{ fontSize: '1.1rem', color: '#f97316' }} />
                        <span style={{ flex: 1 }}>{nomeArquivo}</span>
                        <i className="pi pi-download" style={{ color: '#9ca3af', fontSize: '0.85rem' }} />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="field field-span-4 action-buttons">
              <Button
                label="Enviar Orçamento"
                icon="pi pi-send"
                onClick={() => setEscolhaVisible(true)}  // 👈 era onClick={abrirOrcamento}
              />
              <Button label="Solicitar Exames" icon="pi pi-search"
                severity="warning" outlined
                onClick={() => { setExames(''); setExamesVisible(true); }} />
              <Button label="Não faço esse procedimento" icon="pi pi-times"
                severity="danger" outlined onClick={handleNaoFaco} />
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog Escolha de Tipo de Orçamento */}
      <Dialog
        header="Como deseja enviar o orçamento?"
        visible={escolhaVisible}
        style={{ width: '40rem', maxWidth: '96vw' }}
        modal
        onHide={() => setEscolhaVisible(false)}
      >
        <div style={{ display: 'flex', gap: '16px', padding: '8px 0 16px' }}>
          <button
            onClick={() => {
              setEscolhaVisible(false)
              setValorArquivo(null)
              setArquivoVisible(true)
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '32px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#f97316'
              e.currentTarget.style.background = '#fff7ed'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <i className="pi pi-file-import" style={{ fontSize: '2rem', color: '#f97316' }} />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>Importar Arquivo</span>
            <span style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center' }}>
              Envie um PDF ou imagem com o orçamento e informe o valor total
            </span>
          </button>

          <button
            onClick={() => {
              setEscolhaVisible(false)
              abrirOrcamento()
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '32px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#f97316'
              e.currentTarget.style.background = '#fff7ed'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <i className="pi pi-table" style={{ fontSize: '2rem', color: '#f97316' }} />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>Preencher Manualmente</span>
            <span style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center' }}>
              Preencha os itens de equipe, taxas, OPME e medicamentos
            </span>
          </button>
        </div>
      </Dialog>
      {/* Fim dialogo de escolha */}


      {/* Dialog Enviar por Valor */}
      <Dialog
        header="Enviar Orçamento"
        visible={arquivoVisible}
        style={{ width: '38rem', maxWidth: '96vw' }}
        modal
        onHide={() => setArquivoVisible(false)}
      >

<div>
  <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
    Arquivo do Orçamento (opcional)
  </label>
  <input
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
    onChange={(e) => setArquivoSelecionado(e.target.files?.[0] ?? null)}
    style={{ width: '100%' }}
  />
  {arquivoSelecionado && (
    <span style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '6px', display: 'block' }}>
      <i className="pi pi-file" style={{ marginRight: '4px' }} />
      {arquivoSelecionado.name}
    </span>
  )}
</div>


        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0 16px' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
            Informe o valor total do orçamento recebido do médico.
          </p>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Valor Total do Orçamento
            </label>
            <InputNumber
              value={valorArquivo}
              onValueChange={(e) => setValorArquivo(e.value ?? null)}
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              placeholder="R$ 0,00"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setArquivoVisible(false)} />
          <Button
            label={enviandoArquivo ? 'Enviando...' : 'Confirmar'}
            icon="pi pi-check"
            onClick={handleEnviarArquivo}
            disabled={enviandoArquivo || !valorArquivo}
            loading={enviandoArquivo}
          />
        </div>
      </Dialog>



      {/* Dialog Orçamento */}
      <Dialog header="Enviar Orçamento" visible={orcamentoVisible}
        style={{ width: '65rem', maxWidth: '96vw' }} modal
        onHide={() => setOrcamentoVisible(false)} className="orcamento-edit-dialog">
        <div className="orcamento-secoes">
          {renderSecaoOrcamento('1. Equipe Médica', equipeMedica, setEquipeMedica)}
          {renderSecaoOrcamento('2. Taxas Hospitalares', taxasHospitalar, setTaxasHospitalar)}
          {renderSecaoOrcamento('3. OPME / Materiais', opmeMateriais, setOpmeMateriais)}
          {renderSecaoOrcamento('4. Medicamentos', medicamentos, setMedicamentos)}

          <div className="valor-total">
            <strong>VALOR TOTAL: {formatarMoeda(valorTotal)}</strong>
          </div>
        </div>

        <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setOrcamentoVisible(false)} />
          <Button label="Enviar Orçamento" icon="pi pi-check" onClick={handleEnviarOrcamento} />
        </div>
      </Dialog>

      {/* Dialog Exames */}
      <Dialog header="Solicitar Exames" visible={examesVisible}
        style={{ width: '45rem', maxWidth: '96vw' }} modal
        onHide={() => setExamesVisible(false)}>
        <div className="field">
          <label>Descreva os exames necessários</label>
          <InputTextarea
            value={exames}
            onChange={(e) => setExames(e.target.value)}
            rows={6} autoResize
            placeholder="Liste os exames necessários..."
            style={{ width: '100%', marginTop: '8px' }}
          />
        </div>
        <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setExamesVisible(false)} />
          <Button label="Solicitar" icon="pi pi-check" onClick={handleSolicitarExames} />
        </div>
      </Dialog>
    </div>
  );
}