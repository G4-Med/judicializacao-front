import api from './../api';

export type IntegracaoStatus = 'EXECUTANDO' | 'SUCESSO' | 'ERRO' | null;
export type IntegracaoTriggeredBy = 'CRON' | 'MANUAL';

export interface Integracao {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  ultimaExecucao: string | null;
  ultimaExecucaoFim: string | null;
  ultimaExecucaoStatus: IntegracaoStatus;
  ultimaPedidosCriados: number;
  ultimaTotalProcessados: number;
}

export interface IntegracaoKpis {
  total: number;
  aguardando: number;
  sucesso: number;
  erros: number;
  executando: number;
}

export interface DashboardIntegracoesResposta {
  integracoes: Integracao[];
  kpis: IntegracaoKpis;
}

export interface IntegracaoExecucao {
  id: number;
  integracaoId: number;
  dataInicio: string;
  dataFim: string | null;
  status: Exclude<IntegracaoStatus, null>;
  triggeredBy: IntegracaoTriggeredBy;
  pedidosCriados: number;
  totalProcessados: number;
  sumario: any;
  erroMensagem: string | null;
}

export interface ExecucoesResposta {
  integracao: Integracao;
  page: number;
  pageSize: number;
  total: number;
  execucoes: IntegracaoExecucao[];
}

export interface MonitorEmailConfig {
  id: number;
  intervaloMinutos: number;
  remetentesValidos: string;
  remetentesValidosLista: string[];
  maxPorCiclo: number;
  ativo: boolean;
  updateDate: string;
}

export const getDashboardIntegracoes = () =>
  api.get<DashboardIntegracoesResposta>('/integracoes/dashboard/');

export const getExecucoesIntegracao = (
  integracaoId: number,
  params?: { page?: number; pageSize?: number },
) =>
  api.get<ExecucoesResposta>(`/integracoes/dashboard/${integracaoId}/execucoes/`, { params });

export const executarIntegracao = (integracaoId: number) =>
  api.post(`/integracoes/dashboard/${integracaoId}/executar/`);

export const getMonitorEmailConfig = () =>
  api.get<MonitorEmailConfig>('/integracoes/monitor-email/config/');

export const salvarMonitorEmailConfig = (payload: Partial<{
  intervaloMinutos: number;
  remetentesValidos: string;
  maxPorCiclo: number;
  ativo: boolean;
}>) => api.put<MonitorEmailConfig>('/integracoes/monitor-email/config/', payload);
