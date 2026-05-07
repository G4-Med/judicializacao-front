import api from './../api';

export interface AguardandoCirurgiaItem {
  id: number;
  paciente: string;
  procedimento: string;
  idMedico: number | null;
  medico: string;
  valor: number;
  valorOrcamento: number;
  valorGanho: number;
  nprocesso: string;
  dias: number;
  dataPedido: string | null;
  statusProcesso: string;
  takeRate: number;
  comissaoEstimada: number;
}

export interface AguardandoCirurgiaKpis {
  quantidade: number;
  valorGanhos: number;
  comissaoEsperada: number;
}

export interface AguardandoCirurgiaResposta {
  kpis: AguardandoCirurgiaKpis;
  itens: AguardandoCirurgiaItem[];
}

export interface ResultadoFinanceiroItem {
  id: number;
  orderId: number;
  paciente: string;
  procedimento: string;
  idMedico: number | null;
  medico: string;
  valor: number;
  valorComissao: number;
  statusCirurgia: boolean;
  descCirurgiaPerda: string;
  nprocesso: string;
  dias: number;
  diasAteResultado: number;
  dataPedido: string | null;
  dataConfirmacao: string | null;
  createDate: string | null;
}

export interface ResultadosFinanceirosKpis {
  qtdRealizadas: number;
  valorPagoComissao: number;
  qtdARealizar: number;
  valorARepassar: number;
  qtdPerdas: number;
  valorPerdaCirurgia: number;
}

export interface ResultadosFinanceirosResposta {
  kpis: ResultadosFinanceirosKpis;
  itens: ResultadoFinanceiroItem[];
}

export interface FinanceiroDetalhe extends ResultadoFinanceiroItem {}

export const getAguardandoCirurgia = () =>
  api.get<AguardandoCirurgiaResposta>('/financeiro/aguardando-cirurgia/');

export const confirmarCirurgia = (
  orderId: number,
  payload: { valorComissao: number; dataConfirmacao: string },
) => api.post(`/financeiro/${orderId}/confirmar/`, payload);

export const registrarPerdaCirurgia = (
  orderId: number,
  payload: { descCirurgiaPerda: string; dataConfirmacao: string },
) => api.post(`/financeiro/${orderId}/perda/`, payload);

export const getResultadosFinanceiros = () =>
  api.get<ResultadosFinanceirosResposta>('/financeiro/resultados/');

export const getFinanceiroDetalhe = (financeiroId: number) =>
  api.get<FinanceiroDetalhe>(`/financeiro/${financeiroId}/`);
