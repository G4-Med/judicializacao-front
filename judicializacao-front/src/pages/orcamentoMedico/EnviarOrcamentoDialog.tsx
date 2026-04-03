import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import html2canvas from 'html2canvas';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getBaseOrcamento } from '../../services/api/client';
import { salvarOrcamentoMedico, uploadAnexoOrder } from '../../services/api/orders';
import './OrcamentoMedicoPage.css';

GlobalWorkerOptions.workerSrc = pdfWorker;

interface ItemOrcamento {
  descricao: string;
  valor: number;
}

interface BaseOrcamento {
  exists: boolean;
  linkBaseOrcamento: string;
  linkAssinatura: string;
  honorariosEquipeMedica: boolean;
  taxasHospitalares: boolean;
  materiaisOpme: boolean;
  medicamentosDiaria: boolean;
  examesPreOperatorios: boolean;
  consultaPosOperatoria: boolean;
  atendimentoEnfermagem: boolean;
  acompanhanteTaxaAdicional: boolean;
  fisioterapiaPosOperatoria: boolean;
  medicamentosPosAlta: boolean;
  ortesesImobilizadores: boolean;
  examesComplementares: boolean;
  custoCtiBemodinamica: boolean;
}

export interface OrcamentoProcessoBase {
  id: number;
  paciente: string;
  procedimento: string;
  area?: string;
  subarea?: string;
  nomeMedico?: string;
  medico?: string;
  hospital?: string;
  nomeHospital?: string;
  medicoId?: number | null;
  idMedico?: number | null;
  medico_id?: number | null;
  nprocesso?: string;
}

interface EnviarOrcamentoDialogProps {
  visible: boolean;
  processo: OrcamentoProcessoBase | null;
  orderLookup?: Record<string, unknown> | null;
  onHide: () => void;
  onSuccess: () => void | Promise<void>;
}

const baseOrcamentoInicial: BaseOrcamento = {
  exists: false,
  linkBaseOrcamento: '',
  linkAssinatura: '',
  honorariosEquipeMedica: false,
  taxasHospitalares: false,
  materiaisOpme: false,
  medicamentosDiaria: false,
  examesPreOperatorios: false,
  consultaPosOperatoria: false,
  atendimentoEnfermagem: false,
  acompanhanteTaxaAdicional: false,
  fisioterapiaPosOperatoria: false,
  medicamentosPosAlta: false,
  ortesesImobilizadores: false,
  examesComplementares: false,
  custoCtiBemodinamica: false,
};

const itemVazio = (): ItemOrcamento => ({ descricao: '', valor: 0 });

function calcularTotal(
  equipe: ItemOrcamento[],
  taxas: ItemOrcamento[],
  opme: ItemOrcamento[],
  medic: ItemOrcamento[]
): number {
  const soma = (arr: ItemOrcamento[]) => arr.reduce((s, i) => s + (i.valor || 0), 0);
  return soma(equipe) + soma(taxas) + soma(opme) + soma(medic);
}

function filtrarItensPreenchidos(arr: ItemOrcamento[]): ItemOrcamento[] {
  return arr.filter((item) => item.descricao.trim() || item.valor > 0);
}

function extrairMedicoId(dados: Record<string, unknown>): number | null {
  const candidatosDiretos = [
    dados.medicoId,
    dados.idMedico,
    dados.medico_id,
    dados.id_medico,
    dados.medicoResponsavelId,
    dados.medico_responsavel_id,
    dados.clienteMedicoId,
    dados.cliente_medico_id,
  ];

  for (const valor of candidatosDiretos) {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string' && valor.trim() && !Number.isNaN(Number(valor))) {
      return Number(valor);
    }
  }

  const candidatosObjetos = [
    dados.medico,
    dados.medicoResponsavel,
    dados.medico_responsavel,
    dados.clienteMedico,
    dados.cliente_medico,
  ];

  for (const valor of candidatosObjetos) {
    if (typeof valor === 'number') return valor;
    if (valor && typeof valor === 'object') {
      const nested = valor as Record<string, unknown>;
      const nestedId = nested.id ?? nested.medicoId ?? nested.idMedico ?? nested.medico_id ?? nested.id_medico;
      if (typeof nestedId === 'number') return nestedId;
      if (typeof nestedId === 'string' && nestedId.trim() && !Number.isNaN(Number(nestedId))) {
        return Number(nestedId);
      }
    }
  }

  return null;
}

export function EnviarOrcamentoDialog({
  visible,
  processo,
  orderLookup,
  onHide,
  onSuccess,
}: EnviarOrcamentoDialogProps) {
  const [modo, setModo] = useState<'escolha' | 'arquivo' | 'manual'>('escolha');
  const [valorArquivo, setValorArquivo] = useState<number | null>(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [enviandoManual, setEnviandoManual] = useState(false);
  const [equipeMedica, setEquipeMedica] = useState<ItemOrcamento[]>([itemVazio()]);
  const [taxasHospitalar, setTaxasHospitalar] = useState<ItemOrcamento[]>([itemVazio()]);
  const [opmeMateriais, setOpmeMateriais] = useState<ItemOrcamento[]>([itemVazio()]);
  const [medicamentos, setMedicamentos] = useState<ItemOrcamento[]>([itemVazio()]);
  const [baseOrcamento, setBaseOrcamento] = useState<BaseOrcamento>(baseOrcamentoInicial);
  const [loadingBaseOrcamento, setLoadingBaseOrcamento] = useState(false);
  const [basePdfCaptureReady, setBasePdfCaptureReady] = useState(false);

  const previewDocumentoRef = useRef<HTMLDivElement>(null);
  const basePdfCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible) return;
    setModo('escolha');
    setValorArquivo(null);
    setArquivoSelecionado(null);
    setEquipeMedica([itemVazio()]);
    setTaxasHospitalar([itemVazio()]);
    setOpmeMateriais([itemVazio()]);
    setMedicamentos([itemVazio()]);
    setBaseOrcamento(baseOrcamentoInicial);
    setBasePdfCaptureReady(false);
  }, [visible, processo?.id]);

  useEffect(() => {
    let cancelado = false;

    const renderizarBasePdf = async () => {
      const canvas = basePdfCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setBasePdfCaptureReady(false);

      if (!baseOrcamento.linkBaseOrcamento) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      try {
        const response = await fetch(baseOrcamento.linkBaseOrcamento);
        if (!response.ok) {
          throw new Error(`Falha ao baixar PDF base: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const loadingTask = getDocument({ data: buffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.2 });

        if (cancelado) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        await page.render({
          canvas,
          canvasContext: ctx,
          viewport,
        }).promise;

        setBasePdfCaptureReady(true);
      } catch (error) {
        console.error('[EnviarOrcamentoDialog] erro ao renderizar PDF base', error);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setBasePdfCaptureReady(false);
      }
    };

    renderizarBasePdf();

    return () => {
      cancelado = true;
    };
  }, [baseOrcamento.linkBaseOrcamento]);

  const valorTotal = useMemo(
    () => calcularTotal(equipeMedica, taxasHospitalar, opmeMateriais, medicamentos),
    [equipeMedica, taxasHospitalar, opmeMateriais, medicamentos]
  );
  const equipePreview = useMemo(() => filtrarItensPreenchidos(equipeMedica), [equipeMedica]);
  const taxasPreview = useMemo(() => filtrarItensPreenchidos(taxasHospitalar), [taxasHospitalar]);
  const opmePreview = useMemo(() => filtrarItensPreenchidos(opmeMateriais), [opmeMateriais]);
  const medicamentosPreview = useMemo(() => filtrarItensPreenchidos(medicamentos), [medicamentos]);
  const totalEquipe = useMemo(() => equipePreview.reduce((acc, item) => acc + item.valor, 0), [equipePreview]);
  const totalTaxas = useMemo(() => taxasPreview.reduce((acc, item) => acc + item.valor, 0), [taxasPreview]);
  const totalOpme = useMemo(() => opmePreview.reduce((acc, item) => acc + item.valor, 0), [opmePreview]);
  const totalMedicamentos = useMemo(() => medicamentosPreview.reduce((acc, item) => acc + item.valor, 0), [medicamentosPreview]);
  const dataHoje = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);
  const nomeMedicoPreview = (processo?.nomeMedico ?? processo?.medico ?? 'Médico responsável') as string;
  const hospitalPreview = (processo?.hospital ?? processo?.nomeHospital ?? 'Hospital a definir') as string;
  const assinaturaSrc = useMemo(() => {
    if (!baseOrcamento.linkAssinatura) return '';
    const separador = baseOrcamento.linkAssinatura.includes('?') ? '&' : '?';
    return `${baseOrcamento.linkAssinatura}${separador}v=${encodeURIComponent(baseOrcamento.linkAssinatura)}`;
  }, [baseOrcamento.linkAssinatura]);

  const itensInclusos = useMemo(() => {
    const itens = [
      { ativo: baseOrcamento.honorariosEquipeMedica, label: 'Honorários da equipe médica' },
      { ativo: baseOrcamento.taxasHospitalares, label: 'Taxas hospitalares' },
      { ativo: baseOrcamento.materiaisOpme, label: 'Materiais e OPME' },
      { ativo: baseOrcamento.medicamentosDiaria, label: 'Medicamentos durante a diária do pós-operatório' },
      { ativo: baseOrcamento.examesPreOperatorios, label: 'Exames pré-operatórios básicos' },
      { ativo: baseOrcamento.consultaPosOperatoria, label: '1 consulta pós-operatória' },
      { ativo: baseOrcamento.atendimentoEnfermagem, label: 'Atendimento de enfermagem 24h' },
    ];
    return itens.filter((item) => item.ativo);
  }, [baseOrcamento]);

  const itensNaoInclusos = useMemo(() => {
    const itens = [
      { ativo: baseOrcamento.acompanhanteTaxaAdicional, label: 'Acompanhante (taxa adicional)' },
      { ativo: baseOrcamento.fisioterapiaPosOperatoria, label: 'Fisioterapia pós-operatória' },
      { ativo: baseOrcamento.medicamentosPosAlta, label: 'Medicamentos pós-alta' },
      { ativo: baseOrcamento.ortesesImobilizadores, label: 'Órteses e imobilizadores' },
      { ativo: baseOrcamento.examesComplementares, label: 'Exames complementares extras' },
      { ativo: baseOrcamento.custoCtiBemodinamica, label: 'Custos com CTI e hemodinâmica' },
    ];
    return itens.filter((item) => item.ativo);
  }, [baseOrcamento]);

  const abrirOrcamentoManual = async () => {
    if (!processo) return;
    setModo('manual');
    setEquipeMedica([itemVazio()]);
    setTaxasHospitalar([itemVazio()]);
    setOpmeMateriais([itemVazio()]);
    setMedicamentos([itemVazio()]);
    setBaseOrcamento(baseOrcamentoInicial);

    const medicoId =
      extrairMedicoId(processo as unknown as Record<string, unknown>) ??
      extrairMedicoId((orderLookup ?? {}) as Record<string, unknown>);
    if (!medicoId) {
      console.warn('[EnviarOrcamentoDialog] nenhum medicoId encontrado para o processo', processo.id);
      return;
    }

    setLoadingBaseOrcamento(true);
    try {
      const { data } = await getBaseOrcamento(medicoId);
      setBaseOrcamento({
        ...baseOrcamentoInicial,
        ...data,
        exists: Boolean(data?.exists),
      });
    } catch (error) {
      console.error('[EnviarOrcamentoDialog] erro ao carregar base de orçamento', error);
      setBaseOrcamento(baseOrcamentoInicial);
    } finally {
      setLoadingBaseOrcamento(false);
    }
  };

  const handleClose = () => {
    if (enviandoArquivo || enviandoManual) return;
    onHide();
  };

  const handleSuccess = async () => {
    onHide();
    await onSuccess();
  };

  const handleEnviarArquivo = async () => {
    if (!processo || !valorArquivo) {
      alert('Informe o valor total do orçamento.');
      return;
    }

    setEnviandoArquivo(true);
    try {
      await salvarOrcamentoMedico(processo.id, {
        acao: 'enviar_orcamento',
        equipeMedica: [],
        taxasHospitalar: [],
        opmeMateriais: [],
        medicamentos: [],
        valorTotal: valorArquivo,
      });

      if (arquivoSelecionado) {
        await uploadAnexoOrder(processo.id, arquivoSelecionado, 'ORCAMENTO');
      }

      setArquivoSelecionado(null);
      setValorArquivo(null);
      await handleSuccess();
    } catch (error) {
      console.error('[EnviarOrcamentoDialog] erro ao enviar orçamento por arquivo', error);
      alert('Erro ao enviar orçamento.');
    } finally {
      setEnviandoArquivo(false);
    }
  };

  const handleEnviarOrcamentoManual = async () => {
    if (!processo) return;

    if (baseOrcamento.linkBaseOrcamento && !basePdfCaptureReady) {
      alert('A base do orçamento ainda está carregando. Aguarde um instante e tente novamente.');
      return;
    }

    setEnviandoManual(true);
    try {
      await salvarOrcamentoMedico(processo.id, {
        acao: 'enviar_orcamento',
        equipeMedica,
        taxasHospitalar,
        opmeMateriais,
        medicamentos,
        valorTotal,
      });

      const previewNode = previewDocumentoRef.current;
      if (previewNode) {
        const cloneWrapper = document.createElement('div');
        const clone = previewNode.cloneNode(true) as HTMLDivElement;
        const larguraPreview = previewNode.getBoundingClientRect().width || previewNode.offsetWidth;
        const alturaPreview = previewNode.getBoundingClientRect().height || previewNode.offsetHeight;
        const basePdfCanvas = basePdfCanvasRef.current;

        cloneWrapper.style.position = 'fixed';
        cloneWrapper.style.left = '-10000px';
        cloneWrapper.style.top = '0';
        cloneWrapper.style.width = `${larguraPreview}px`;
        cloneWrapper.style.height = `${alturaPreview}px`;
        cloneWrapper.style.pointerEvents = 'none';
        cloneWrapper.style.opacity = '1';
        cloneWrapper.style.zIndex = '-1';
        cloneWrapper.style.background = '#ffffff';

        clone.style.width = `${larguraPreview}px`;
        clone.style.height = `${alturaPreview}px`;
        clone.style.transform = 'none';
        clone.style.margin = '0';

        const fundoClone = clone.querySelector('.orcamento-documento__fundo');
        if (fundoClone && basePdfCanvas && basePdfCanvas.width > 0 && basePdfCanvas.height > 0) {
          const fundoImagem = document.createElement('img');
          fundoImagem.src = basePdfCanvas.toDataURL('image/png');
          fundoImagem.alt = 'Base do orçamento';
          fundoImagem.className = 'orcamento-documento__fundo';
          fundoImagem.crossOrigin = 'anonymous';
          fundoClone.replaceWith(fundoImagem);
        }

        cloneWrapper.appendChild(clone);
        document.body.appendChild(cloneWrapper);

        try {
          const imagens = Array.from(clone.querySelectorAll('img'));
          await Promise.all(
            imagens.map(
              (img) =>
                new Promise<void>((resolve) => {
                  if (img.complete) {
                    resolve();
                    return;
                  }
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                })
            )
          );

          const canvas = await html2canvas(clone, {
            backgroundColor: '#ffffff',
            scale: 4,
            useCORS: true,
            logging: false,
            width: larguraPreview,
            height: alturaPreview,
            windowWidth: larguraPreview,
            windowHeight: alturaPreview,
          });

          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (blob) {
            const file = new File([blob], `orcamento-manual-order-${processo.id}.png`, { type: 'image/png' });
            await uploadAnexoOrder(processo.id, file, 'ORCAMENTO');
          }
        } finally {
          cloneWrapper.remove();
        }
      }

      await handleSuccess();
    } catch (error) {
      console.error('[EnviarOrcamentoDialog] erro ao enviar orçamento manual', error);
      alert('Erro ao enviar orçamento.');
    } finally {
      setEnviandoManual(false);
    }
  };

  const updateItem = (
    arr: ItemOrcamento[],
    setArr: React.Dispatch<React.SetStateAction<ItemOrcamento[]>>,
    index: number,
    field: keyof ItemOrcamento,
    value: string | number
  ) => {
    const novo = [...arr];
    novo[index] = { ...novo[index], [field]: value };
    setArr(novo);
  };

  const addItem = (arr: ItemOrcamento[], setArr: React.Dispatch<React.SetStateAction<ItemOrcamento[]>>) => {
    setArr([...arr, itemVazio()]);
  };

  const removeItem = (
    arr: ItemOrcamento[],
    setArr: React.Dispatch<React.SetStateAction<ItemOrcamento[]>>,
    index: number
  ) => {
    setArr(arr.filter((_, i) => i !== index));
  };

  const renderSecaoOrcamento = (
    titulo: string,
    arr: ItemOrcamento[],
    setArr: React.Dispatch<React.SetStateAction<ItemOrcamento[]>>
  ) => (
    <div className="secao-orcamento">
      <h3>{titulo}</h3>
      {arr.map((item, i) => (
        <div key={`${titulo}-${i}`} className="orcamento-row">
          <InputText
            value={item.descricao}
            onChange={(e) => updateItem(arr, setArr, i, 'descricao', e.target.value)}
            placeholder="Descrição"
            className="orcamento-descricao"
          />
          <InputNumber
            value={item.valor}
            onValueChange={(e) => updateItem(arr, setArr, i, 'valor', e.value ?? 0)}
            mode="currency"
            currency="BRL"
            locale="pt-BR"
            className="orcamento-valor"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            outlined
            rounded
            onClick={() => removeItem(arr, setArr, i)}
            disabled={arr.length === 1}
          />
        </div>
      ))}
      <Button label="+ Adicionar" text onClick={() => addItem(arr, setArr)} style={{ marginTop: '4px' }} />
    </div>
  );

  return (
    <>
      <Dialog
        header="Como deseja enviar o orçamento?"
        visible={visible && modo === 'escolha'}
        style={{ width: '40rem', maxWidth: '96vw' }}
        modal
        onHide={handleClose}
      >
        <div style={{ display: 'flex', gap: '16px', padding: '8px 0 16px' }}>
          <button
            onClick={() => setModo('arquivo')}
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
          >
            <i className="pi pi-file-import" style={{ fontSize: '2rem', color: '#f97316' }} />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>Importar Arquivo</span>
            <span style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center' }}>
              Envie um PDF ou imagem com o orçamento e informe o valor total
            </span>
          </button>

          <button
            onClick={abrirOrcamentoManual}
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
          >
            <i className="pi pi-table" style={{ fontSize: '2rem', color: '#f97316' }} />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>Preencher Manualmente</span>
            <span style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center' }}>
              Preencha os itens de equipe, taxas, OPME e medicamentos
            </span>
          </button>
        </div>
      </Dialog>

      <Dialog
        header="Enviar Orçamento"
        visible={visible && modo === 'arquivo'}
        style={{ width: '38rem', maxWidth: '96vw' }}
        modal
        onHide={handleClose}
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
          <Button label="Voltar" outlined onClick={() => setModo('escolha')} />
          <Button
            label={enviandoArquivo ? 'Enviando...' : 'Confirmar'}
            icon="pi pi-check"
            onClick={handleEnviarArquivo}
            disabled={enviandoArquivo || !valorArquivo}
            loading={enviandoArquivo}
          />
        </div>
      </Dialog>

      <Dialog
        header="Enviar Orçamento"
        visible={visible && modo === 'manual'}
        style={{ width: '86rem', maxWidth: '99vw' }}
        modal
        onHide={handleClose}
        className="orcamento-edit-dialog"
      >
        <div className="orcamento-dialog-layout">
          <div className="orcamento-secoes">
            {renderSecaoOrcamento('1. Equipe Médica', equipeMedica, setEquipeMedica)}
            {renderSecaoOrcamento('2. Taxas Hospitalares', taxasHospitalar, setTaxasHospitalar)}
            {renderSecaoOrcamento('3. OPME / Materiais', opmeMateriais, setOpmeMateriais)}
            {renderSecaoOrcamento('4. Medicamentos', medicamentos, setMedicamentos)}

            <div className="valor-total">
              <strong>VALOR TOTAL: {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
          </div>

          <div className="orcamento-preview">
            <div className="orcamento-documento" ref={previewDocumentoRef}>
              {baseOrcamento.linkBaseOrcamento ? (
                <object
                  data={`${baseOrcamento.linkBaseOrcamento}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  type="application/pdf"
                  className="orcamento-documento__fundo"
                  aria-label="Base do orçamento"
                >
                  <div className="orcamento-documento__fallback">
                    Não foi possível renderizar a base do orçamento.
                  </div>
                </object>
              ) : (
                <div className="orcamento-documento__fallback">
                  {loadingBaseOrcamento ? 'Carregando base do médico...' : 'Base do orçamento não encontrada para este médico.'}
                </div>
              )}

              <div className="orcamento-documento__conteudo">
                <div className="orcamento-documento__cabecalho">
                  <div className="orcamento-documento__procedimento">{processo?.procedimento || 'PROCEDIMENTO NÃO INFORMADO'}</div>
                  <div className="orcamento-documento__meta-central">Paciente: {processo?.paciente || 'Não informado'}</div>
                  <div className="orcamento-documento__meta-central">Médico Responsável: {nomeMedicoPreview}</div>
                  <div className="orcamento-documento__meta-central">Hospital: {hospitalPreview}</div>
                  <div className="orcamento-documento__regra" />
                  <div className="orcamento-documento__subtexto">
                    Conforme solicitado, segue orçamento para realização do procedimento abaixo:
                  </div>
                </div>

                <div className="orcamento-documento__miolo">
                  <div className="orcamento-documento__coluna-itens">
                    <div className="orcamento-documento__bloco">
                      <div className="orcamento-documento__titulo-bloco">1. EQUIPE MÉDICA</div>
                      {equipePreview.map((item, index) => (
                        <div key={`doc-eq-${index}`} className="orcamento-documento__linha-item">
                          <span>{item.descricao || 'Item sem descrição'}</span>
                          <strong>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                      ))}
                      <div className="orcamento-documento__subtotal">
                        Subtotal: <strong>{totalEquipe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      </div>
                    </div>

                    <div className="orcamento-documento__bloco">
                      <div className="orcamento-documento__titulo-bloco">2. TAXAS HOSPITALARES</div>
                      {taxasPreview.map((item, index) => (
                        <div key={`doc-tax-${index}`} className="orcamento-documento__linha-item">
                          <span>{item.descricao || 'Item sem descrição'}</span>
                          <strong>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                      ))}
                      <div className="orcamento-documento__subtotal">
                        Subtotal: <strong>{totalTaxas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      </div>
                    </div>

                    <div className="orcamento-documento__bloco">
                      <div className="orcamento-documento__titulo-bloco">3. OPME / MATERIAIS</div>
                      {opmePreview.map((item, index) => (
                        <div key={`doc-opme-${index}`} className="orcamento-documento__linha-item">
                          <span>{item.descricao || 'Item sem descrição'}</span>
                          <strong>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                      ))}
                      <div className="orcamento-documento__subtotal">
                        Subtotal: <strong>{totalOpme.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      </div>
                    </div>

                    <div className="orcamento-documento__bloco">
                      <div className="orcamento-documento__titulo-bloco">4. MEDICAMENTOS</div>
                      {medicamentosPreview.map((item, index) => (
                        <div key={`doc-med-${index}`} className="orcamento-documento__linha-item">
                          <span>{item.descricao || 'Item sem descrição'}</span>
                          <strong>{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </div>
                      ))}
                      <div className="orcamento-documento__subtotal">
                        Subtotal: <strong>{totalMedicamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="orcamento-documento__coluna-checklist">
                    <div className="orcamento-documento__checklist">
                      <div className="orcamento-documento__titulo-bloco">INCLUSOS</div>
                      {itensInclusos.length > 0
                        ? itensInclusos.map((item) => (
                            <div key={item.label} className="orcamento-documento__linha-check">
                              {item.label}
                            </div>
                          ))
                        : null}
                    </div>

                    <div className="orcamento-documento__checklist">
                      <div className="orcamento-documento__titulo-bloco">NÃO INCLUSOS</div>
                      {itensNaoInclusos.length > 0
                        ? itensNaoInclusos.map((item) => (
                            <div key={item.label} className="orcamento-documento__linha-check">
                              {item.label}
                            </div>
                          ))
                        : null}
                    </div>
                  </div>
                </div>

                <div className="orcamento-documento__rodape-centro">
                  <div className="orcamento-documento__total">
                    VALOR TOTAL: <strong>{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  </div>
                  <div className="orcamento-documento__infos-finais">
                    <span>Referência: CBHPM / Tabela Própria</span>
                    <span>Validade: 60 dias</span>
                  </div>
                </div>

                <div className="orcamento-documento__assinatura">
                  <div>{`Juiz de Fora, ${dataHoje}.`}</div>
                  {assinaturaSrc && <img src={assinaturaSrc} crossOrigin="anonymous" alt="Assinatura do médico" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dialog-footer-actions">
          <Button label="Voltar" outlined onClick={() => setModo('escolha')} />
          <Button
            label="Enviar Orçamento"
            icon="pi pi-check"
            onClick={handleEnviarOrcamentoManual}
            loading={enviandoManual}
            disabled={enviandoManual || (Boolean(baseOrcamento.linkBaseOrcamento) && !basePdfCaptureReady)}
          />
        </div>
      </Dialog>

      <canvas ref={basePdfCanvasRef} style={{ display: 'none' }} aria-hidden="true" />
    </>
  );
}
