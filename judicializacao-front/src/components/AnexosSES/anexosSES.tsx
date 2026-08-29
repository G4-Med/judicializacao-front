import { useEffect, useState } from 'react';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { cabecalhoComHint } from '../ColunasIdentificacao/colunasIdentificacao';
import { getThreadPedido, postThreadVista } from '../../services/api/integracoes';

/**
 * SES ANEXOS (@R 28/08 22:09): "criar uma coluna com SES Anexos e colocar se veio com anexo /
 * sem anexo / solicitado anexo... um ícone que abre a parte dos anexos que vieram no pedido...
 * recebido anexos para quando ela devolve... um modalzinho com quantos anexos para poder ver
 * e baixar". Um lugar só para as 9 telas de fase, no mesmo molde da coluna "!" (repedido).
 *
 * O estado vem do backend (`sesAnexos`): COM_ANEXO · SEM_ANEXO · SOLICITADO (a confirmação
 * "sem anexo" já pediu) · RECEBIDO (a SES devolveu — a continuação entrou no pedido). A
 * caixinha com número (`emailsNovos`) diz que chegou coisa nova; abrir o modal zera.
 */

const ESTADO: Record<string, { rotulo: string; severity: 'success' | 'warning' | 'info' | 'danger' | undefined; hint: string }> = {
  COM_ANEXO: { rotulo: 'com anexo', severity: 'success', hint: 'O pedido chegou com documentos.' },
  SEM_ANEXO: { rotulo: 'sem anexo', severity: 'danger', hint: 'Chegou sem nenhum documento e ainda não pedimos.' },
  SOLICITADO: { rotulo: 'solicitado', severity: 'warning', hint: 'Chegou sem documento; a resposta automática já pediu à SES. Aguardando.' },
  RECEBIDO: { rotulo: 'recebido', severity: 'info', hint: 'A SES devolveu documentos por e-mail — entraram no pedido (continuação da thread).' },
};

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

const TIPO_ANEXO: Record<string, string> = {
  RELATORIO: 'Relatório / documento', EXAME: 'Exame', LAUDO: 'Laudo', ORCAMENTO: 'Orçamento',
  DECISAO_INTEIRO_TEOR: 'Peça (inteiro teor)', EMAIL_ORIGINAL: 'E-mail original',
};
const TIPO_EMAIL: Record<string, string> = {
  RECEBIMENTO_PEDIDO: 'Confirmação de recebimento', RECEBIMENTO_PEDIDO_SEGREDO: 'Confirmação (segredo de justiça)',
  RECEBIMENTO_PEDIDO_SEM_ANEXO: 'Confirmação + pedido de documentos', PEDIR_EXAMES: 'Pedido de exames',
  ENVIAR_ORCAMENTO: 'Envio de orçamento', DAR_PERDA: 'Perda', SOLICITAR_COTACAO_MEDICO: 'Cotação ao médico',
};
const STATUS_RECEBIDO: Record<string, string> = {
  CRIADO: 'e-mail do pedido', CONTINUACAO: 'continuação — documentos entraram', PROPOSTA_CONTINUACAO: 'parece continuação (confirmar)',
  DUPLICADO_PACIENTE: 're-pedido', RESPOSTA: 'resposta', ERRO: 'falhou',
};

/** O modal: anexos (ver/baixar) + a thread de e-mails (enviados e recebidos) do pedido. */
function ModalAnexosSES({ orderId, paciente, aberto, fechar }: { orderId: number; paciente?: string; aberto: boolean; fechar: () => void }) {
  const [dados, setDados] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!aberto) return;
    setLoading(true);
    getThreadPedido(orderId)
      .then(({ data }) => { setDados(data); if (data?.emailsNovos > 0) postThreadVista(orderId).catch(() => undefined); })
      .catch(() => setDados({ anexos: [], enviados: [], recebidos: [], erro: true }))
      .finally(() => setLoading(false));
  }, [aberto, orderId]);
  const anexos = dados?.anexos ?? [];
  return (
    <Dialog visible={aberto} onHide={fechar} style={{ width: 'min(60rem, 95vw)' }} dismissableMask
      header={<span><i className="pi pi-paperclip" /> Anexos e e-mails da SES — pedido #{orderId}{paciente ? ` · ${paciente}` : ''}</span>}>
      {loading && !dados ? <p>Carregando…</p> : (
        <TabView>
          <TabPanel header={`Anexos (${anexos.length})`} leftIcon="pi pi-file mr-2">
            {anexos.length === 0
              ? <p className="mc-ses-vazio">Nenhum documento neste pedido ainda. {dados?.statusDocumentos === 'AGUARDANDO' ? 'A SES foi avisada e estamos aguardando.' : ''}</p>
              : (
                <table className="mc-ses-tabela">
                  <thead><tr><th>Documento</th><th>Tipo</th><th>Chegou em</th><th>Processamento</th><th /></tr></thead>
                  <tbody>
                    {anexos.map((a: any) => (
                      <tr key={a.id}>
                        <td>{a.nome}</td>
                        <td>{TIPO_ANEXO[a.tipo] ?? a.tipo}</td>
                        <td>{fmt(a.criadoEm)}</td>
                        <td>{a.processamento ? <Tag value={String(a.processamento).toLowerCase()} severity={a.processamento === 'PROCESSADO' ? 'success' : 'info'} /> : <span className="mc-ses-vazio">—</span>}</td>
                        <td>{a.link ? <a href={a.link} target="_blank" rel="noreferrer" className="mc-ses-link"><i className="pi pi-download" /> ver / baixar</a> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </TabPanel>
          <TabPanel header={`E-mails da thread (${(dados?.enviados?.length ?? 0) + (dados?.recebidos?.length ?? 0)})`} leftIcon="pi pi-envelope mr-2">
            <p className="mc-ses-sub">O rastro completo desta conversa com a SES: o que recebemos (à esquerda) e o que enviamos (à direita), em ordem de tempo.</p>
            <ul className="mc-ses-thread">
              {[...(dados?.recebidos ?? []).map((r: any) => ({ ...r, _dir: 'in', _ts: r.recebidoEm })),
                ...(dados?.enviados ?? []).map((e: any) => ({ ...e, _dir: 'out', _ts: e.enviadoEm || e.montadoEm }))]
                .sort((a, b) => (a._ts || '').localeCompare(b._ts || ''))
                .map((m: any, i: number) => (
                  <li key={`${m._dir}-${m.id}-${i}`} className={`mc-ses-msg mc-ses-msg--${m._dir}`}>
                    <div className="mc-ses-msg-cab">
                      <strong>{m._dir === 'in' ? `↓ ${m.de || 'SES'}` : `↑ para ${m.para || 'SES'}`}</strong>
                      <span>{fmt(m._ts)}</span>
                      <Tag value={m._dir === 'in' ? (STATUS_RECEBIDO[m.status] ?? m.status) : `${TIPO_EMAIL[m.tipo] ?? m.tipo} · ${m.status === 'ENVIADO' ? 'enviada' : m.status === 'PENDENTE' ? 'na fila' : m.status?.toLowerCase()}`}
                        severity={m._dir === 'in' ? (m.status === 'CONTINUACAO' ? 'success' : 'info') : (m.status === 'ENVIADO' ? 'success' : m.status === 'ERRO' ? 'danger' : 'warning')} />
                    </div>
                    <div className="mc-ses-msg-assunto">{m.assunto}</div>
                    {m._dir === 'in' && m.detalhe ? <div className="mc-ses-msg-detalhe">{m.detalhe}</div> : null}
                    {m._dir === 'out' && m.corpo ? <details><summary>ver o texto enviado</summary><pre className="mc-ses-corpo">{m.corpo}</pre></details> : null}
                  </li>
                ))}
            </ul>
          </TabPanel>
        </TabView>
      )}
    </Dialog>
  );
}

/** A célula: badge do estado + caixinha com número de e-mails novos + clique abre o modal. */
function CelulaAnexosSES({ r }: { r: any }) {
  const [aberto, setAberto] = useState(false);
  const [novos, setNovos] = useState<number>(r?.emailsNovos ?? 0);
  const est = ESTADO[r?.sesAnexos] ?? null;
  const n = r?.anexosN ?? 0;
  return (
    <>
      <button type="button" className="mc-ses-btn" onClick={() => setAberto(true)}
        title={`${est ? est.hint : 'Ver anexos e e-mails da SES'} — ${n} documento(s)${novos ? ` · ${novos} e-mail(s) novo(s)` : ''}`}
        aria-label={`Anexos da SES do pedido ${r?.id}`}>
        <span className="mc-ses-icone"><i className="pi pi-paperclip" />{n > 0 && <span className="mc-ses-n">{n}</span>}</span>
        {est && <Tag value={est.rotulo} severity={est.severity} className="mc-ses-tag" />}
        {novos > 0 && <span className="mc-ses-novos" title={`${novos} e-mail(s) novo(s) nesta thread`}><i className="pi pi-envelope" /> {novos}</span>}
      </button>
      {aberto && <ModalAnexosSES orderId={r.id} paciente={r.paciente} aberto={aberto} fechar={() => { setAberto(false); setNovos(0); }} />}
    </>
  );
}

/** Coluna "SES Anexos" — cola nas 9 telas ao lado da coluna "!". */
export const colunaAnexosSES = () => (
  <Column
    key="sesAnexos"
    field="sesAnexos"
    header={cabecalhoComHint('SES Anexos', 'O que a SES mandou de documento: com anexo · sem anexo · solicitado (pedimos) · recebido (devolveram). O número no clipe é quantos documentos; o envelope é quantos e-mails novos. Clique para ver, baixar e ler a thread.')}
    sortable
    style={{ width: '11rem' }}
    bodyStyle={{ textAlign: 'left' }}
    body={(r: any) => <CelulaAnexosSES r={r} />}
  />
);
