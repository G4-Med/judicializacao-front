import api from './../api';


export const getOrders = () => api.get('/orders/listar/');
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

