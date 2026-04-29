import api from './../api';


export const getOrders = () => api.get('/orders/listar/');
export const getProcessosResumo = () => api.get('/orders/processos-resumo/');
export const getStatusOrders = () => api.get('/orders/status/');
export const atualizarOrder = (id: number, data: any) => api.patch(`/orders/${id}/atualizar/`, data);
export const getMedicosSelect = () => api.get('/client/medicos/');
export const getJuridico = () => api.get('/orders/juridico/');
export const salvarJuridico = (id: number, data: any) => api.post(`/orders/juridico/${id}/salvar/`, data);
export const getOrcamentoMedico = () => api.get('/orders/orcamento-medico/');
export const salvarOrcamentoMedico = (id: number, data: any) => api.post(`/orders/orcamento-medico/${id}/salvar/`, data);
export const marcarSemProfissional = (id: number) => api.post(`/orders/orcamento-medico/${id}/sem-profissional/`);
export const getParaProtocolar = () => api.get('/orders/para-protocolar/');
export const salvarProtocolar = (id: number, data: any) => api.post(`/orders/para-protocolar/${id}/salvar/`, data);
export const getSegredoJustica = () => api.get('/orders/segredo-justica/');
export const salvarResultadoSegredo = (id: number, data: any) => api.post(`/orders/segredo-justica/${id}/salvar/`, data);
export const getProtocolados = () => api.get('/orders/protocolados/');
export const salvarResultadoProtocolado = (id: number, data: any) => api.post(`/orders/protocolados/${id}/salvar/`, data);
export const adicionarAcompanhamento = (id: number, data: any) => api.post(`/orders/protocolados/${id}/acompanhamento/`, data);
export const getResultados = () => api.get('/orders/resultados/');
export const getPerdas = () => api.get('/orders/perdas/');
export const getMedicosCompleto = () => api.get('client/medico-completo/lista/');
export const getEmailsPendentes = (params?: { status?: string; tipoEmail?: string }) =>
  api.get('/orders/emails/', { params });
export const getEmailsPendentesKpis = () => api.get('/orders/emails/kpis/');
export const getEmailsPendentesCount = () => api.get('/orders/emails/pendentes-count/');
export const enviarEmailPendente = (id: number) => api.post(`/orders/emails/${id}/enviar/`);
export const enviarEmailsPendentesLote = (ids: number[]) => api.post('/orders/emails/enviar-lote/', { ids });
export const enviarEmailDireto = (payload: {
  emailPendenteId?: number;
  destinatario: string;
  assunto: string;
  corpo: string;
  anexoUrl?: string;
}) => api.post('/emails/enviar/', payload);
export const getConfiguracoesEmails = () => api.get('/emails/configuracoes/');
export const salvarConfiguracaoEmail = (payload: {
  tipoEmail: string;
  assunto: string;
  corpo: string;
  ativo?: boolean;
}) => api.post('/emails/configuracoes/', payload);
export const getEspecialidades = () => api.get('/client/especialidades/');
export const salvarEspecialidade = (payload: { especialidade: string }) => api.post('/client/especialidades/', payload);
export const getSubespecialidades = () => api.get('/client/subespecialidades/');
export const salvarSubespecialidade = (payload: { subespecialidade: string }) => api.post('/client/subespecialidades/', payload);
export const getHospitais = () => api.get('/client/hospitais/');
export const salvarHospital = (payload: { hospital: string }) => api.post('/client/hospitais/', payload);
export const getBancos = () => api.get('/client/bancos/');
export const salvarBanco = (payload: { codBanco: string; nomeBanco: string }) => api.post('/client/bancos/', payload);
export const atualizarConfiguracaoEmail = (
  id: number,
  payload: {
    assunto?: string;
    corpo?: string;
    ativo?: boolean;
  }
) => api.patch(`/emails/configuracoes/${id}/`, payload);
export function enviarOrcamentoArquivo(orderId: number, valorTotal: number) {
  return api.post('/api/orcamento/arquivo/', { orderId, valorTotal })
}
export const uploadAnexoOrder = (orderId: number, file: File, tipo: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('tipo', tipo);
  return api.post(`/orders/${orderId}/anexos/upload/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const getAnexosOrder = (orderId: number, tipo?: string) => {
  const params = tipo ? `?tipo=${tipo}` : '';
  return api.get(`/orders/${orderId}/anexos/${params}`);
};


export const getBaseOrcamento = (medicoId: number) =>
  api.get(`/client/medico/${medicoId}/base-orcamento/`);

export const criarOrderProcess = (payload: { json: Record<string, any>; processado: boolean }) =>
  api.post('/integracoes/order-process/', payload);

export const processarOrderProcess = () =>
  api.post('/integracoes/processar/', {});

export const uploadArquivoIntegracao = (file: File) => {
  const form = new FormData();
  form.append('file', file);

  return api.post('/integracoes/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// ============================================================
// IA — sugestão de médico
// ============================================================
export interface SugestaoIAResposta {
  sugestaoId: number;
  orderId: number;
  idMedico: number | null;
  nomeMedico: string | null;
  justificativa: string;
  confianca: 'alta' | 'media' | 'baixa';
  isFallback: boolean;
}

export const sugerirMedicoIA = (orderId: number) =>
  api.post(`/ia/sugerir-medico/${orderId}/`);

export const aplicarSugestaoIA = (sugestaoId: number, idMedico: number) =>
  api.post(`/ia/sugestoes/${sugestaoId}/aplicar/`, { idMedico });
