import { useEffect, useMemo, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Link } from 'react-router-dom';
import { getCentralSaude, getCentralEmails, getCentralCaixa, postCentralReprocessar } from '../../services/api/integracoes';
import { cabecalhoComHint } from '../../components/ColunasIdentificacao/colunasIdentificacao';
import './CentralEmailsPage.css';

/**
 * CENTRAL DE E-MAILS (@R 28/08 18:29): "ver a resposta que enviamos para cada email... cada
 * email recebido mesmo que lido ou não lido seja verificado... aba de saúde... a caixa por
 * dias... procurar por nome, email recebido ou assunto... conteúdo anexo... certificação que
 * a resposta de recebimento foi enviada e com o conteúdo".
 *
 * Três abas, nenhuma inventa: Saúde (o monitor está em dia?), Processados (o que o monitor
 * fez com cada e-mail, com anexos e a resposta que saiu) e Caixa (a INBOX inteira, lida ou
 * não, casada com o que foi processado — é onde aparece o e-mail que alguém leu à mão e o
 * monitor nunca viu).
 */

const fmt = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const COR_STATUS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  CRIADO: 'success', DUPLICADO_PACIENTE: 'warning', REMETENTE_INVALIDO: 'secondary', RESPOSTA: 'info', ERRO: 'danger',
};
const ROTULO_STATUS: Record<string, string> = {
  CRIADO: 'Virou pedido', DUPLICADO_PACIENTE: 'Re-pedido (contado)', REMETENTE_INVALIDO: 'Ignorado (remetente)',
  RESPOSTA: 'Resposta a e-mail', ERRO: 'Falhou',
};

/** "Recuperar anexos" / "Processar agora": busca o e-mail na caixa pelo Message-ID e faz o que
 *  o monitor deveria ter feito. Idempotente no backend — clicar duas vezes não duplica. */
function BotaoReprocessar({ messageId, rotulo, aoTerminar }: { messageId: string; rotulo: string; aoTerminar: () => void }) {
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const clicar = async () => {
    setOcupado(true); setMsg(null);
    try {
      const { data } = await postCentralReprocessar(messageId);
      setMsg(data.jaFeito ? 'já feito' : data.processadoAgora ? `processado: ${data.status}` : data.jaProcessado ? 'já processado' : `${data.anexosSubidos ?? 0} anexo(s) subido(s)`);
      aoTerminar();
    } catch (e: any) {
      setMsg(e?.response?.data?.error ?? 'falhou');
    } finally { setOcupado(false); }
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Button label={rotulo} icon="pi pi-replay" size="small" outlined loading={ocupado} onClick={clicar} />
      {msg && <small className="ce-sub">{msg}</small>}
    </span>
  );
}

function Saude() {
  const [s, setS] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const carregar = () => { setLoading(true); getCentralSaude().then(({ data }) => setS(data)).finally(() => setLoading(false)); };
  useEffect(carregar, []);
  if (loading && !s) return <p>Medindo…</p>;
  if (!s) return <p>Não foi possível medir a saúde do monitor.</p>;
  return (
    <div className="ce-saude">
      <div className={`ce-semaforo ${s.emDia ? 'ok' : 'alerta'}`}>
        <i className={`pi ${s.emDia ? 'pi-check-circle' : 'pi-exclamation-triangle'}`} />
        <div>
          <strong>{s.emDia ? 'Monitor em dia' : 'Monitor precisa de atenção'}</strong>
          <div className="ce-sub">Última execução {fmt(s.ultimaExecucao)} ({s.idadeMinutos} min atrás · esperado a cada {s.intervaloEsperadoMinutos} min) · {s.ultimaExecucaoStatus}</div>
        </div>
        <Button icon="pi pi-refresh" text rounded onClick={carregar} aria-label="Medir de novo" />
      </div>
      {s.alertas?.length > 0 && (
        <ul className="ce-alertas">{s.alertas.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
      )}
      <div className="ce-cards">
        <div className="ce-card"><span>Execuções 24 h</span><strong>{s.execucoes24h}</strong></div>
        <div className="ce-card"><span>Com erro 24 h</span><strong className={s.erros24h ? 'ruim' : ''}>{s.erros24h}</strong></div>
        <div className="ce-card"><span>Capturados sem converter</span><strong className={s.pendentesConversao ? 'ruim' : ''}>{s.pendentesConversao}</strong></div>
        <div className="ce-card"><span>Respostas na fila</span><strong>{s.respostasPendentes}</strong></div>
        <div className="ce-card"><span>Respostas com erro</span><strong className={s.respostasComErro ? 'ruim' : ''}>{s.respostasComErro}</strong></div>
      </div>
      <div className="ce-cards">
        {Object.entries(s.emails24hPorStatus || {}).map(([k, v]) => (
          <div className="ce-card" key={k}><span>{ROTULO_STATUS[k] ?? k} (24 h)</span><strong>{v as number}</strong></div>
        ))}
      </div>
      <p className="ce-sub">
        Remetentes válidos: <code>{s.remetentesValidos || '—'}</code> · monitor {s.monitorAtivo ? 'ativo' : 'DESATIVADO'} ·{' '}
        templates de resposta (comum e segredo de justiça): <Link to="/configuracoes-emails">editar</Link>
      </p>
    </div>
  );
}

function Processados() {
  const [dia, setDia] = useState<Date | null>(new Date());
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [dados, setDados] = useState<any>({ itens: [], total: 0, diasComMovimento: {} });
  const [loading, setLoading] = useState(false);
  const [expandidas, setExpandidas] = useState<any>(null);

  const carregar = () => {
    setLoading(true);
    const params: any = {};
    if (q.trim()) params.q = q.trim();
    else if (dia) params.dia = dia.toISOString().slice(0, 10);
    if (status) params.status = status;
    getCentralEmails(params).then(({ data }) => setDados(data)).finally(() => setLoading(false));
  };
  useEffect(carregar, [dia, status]);

  const opcoesStatus = Object.keys(ROTULO_STATUS).map((k) => ({ label: ROTULO_STATUS[k], value: k }));

  const expansor = (r: any) => (
    <div className="ce-expansor">
      <div className="ce-bloco">
        <h4><i className="pi pi-search" /> O que aconteceu</h4>
        <p>{r.depuracao}</p>
        {r.erro && <p className="ruim">Erro: {r.erro}</p>}
        {r.status === 'DUPLICADO_PACIENTE' && r.pedido && !(r.detalhe || '').includes('anexos recuperados') && (
          <p><BotaoReprocessar messageId={r.messageId} rotulo="Recuperar anexos deste e-mail no pedido" aoTerminar={carregar} /></p>
        )}
        <p className="ce-sub">Message-ID <code>{r.messageId}</code> · execução #{r.execucaoId}
          {r.pedido && <> · pedido <strong>#{r.pedido.id}</strong> ({r.pedido.status}{r.pedido.vezesPedido > 1 ? `, pedido ${r.pedido.vezesPedido}×` : ''}{r.pedido.naLixeira ? ', na lixeira' : ''})</>}
        </p>
      </div>
      <div className="ce-bloco">
        <h4><i className="pi pi-paperclip" /> Anexos no pedido ({r.anexos?.length ?? 0})</h4>
        {r.anexos?.length ? (
          <ul>{r.anexos.map((a: any) => (
            <li key={a.id}><a href={a.link} target="_blank" rel="noreferrer">{a.nome || a.tipo}</a> <span className="ce-sub">({a.tipo})</span></li>
          ))}</ul>
        ) : <p className="ce-sub">Nenhum anexo gravado.</p>}
      </div>
      <div className="ce-bloco">
        <h4><i className="pi pi-send" /> Resposta de recebimento</h4>
        {r.resposta ? (
          <>
            <p>
              <Tag value={r.resposta.status} severity={r.resposta.status === 'ENVIADO' ? 'success' : r.resposta.status === 'ERRO' ? 'danger' : 'warning'} />{' '}
              {r.resposta.tipo === 'RECEBIMENTO_PEDIDO_SEGREDO' ? 'template segredo de justiça' : 'template comum'} · para {r.resposta.destinatario}
              {r.resposta.dataEnvio && <> · enviada {fmt(r.resposta.dataEnvio)}</>}
              {r.resposta.aberto && <> · <i className="pi pi-eye" /> aberta</>}
              {r.resposta.rejeitado && <> · <span className="ruim">rejeitada</span></>}
            </p>
            {r.resposta.erroEnvio && <p className="ruim">Erro de envio: {r.resposta.erroEnvio}</p>}
            <details>
              <summary>Ver o conteúdo enviado — {r.resposta.assunto}</summary>
              <pre className="ce-corpo">{r.resposta.corpo}</pre>
            </details>
          </>
        ) : <p className="ce-sub">{r.status === 'CRIADO' ? 'Nenhuma resposta gerada ainda para este pedido.' : 'Não gera resposta (não virou pedido novo).'}</p>}
      </div>
    </div>
  );

  return (
    <div>
      <div className="ce-filtros">
        <Calendar value={dia} onChange={(e) => setDia(e.value as Date)} dateFormat="dd/mm/yy" showIcon placeholder="Dia" disabled={!!q.trim()} />
        <span className="p-input-icon-left" style={{ flex: 1 }}>
          <i className="pi pi-search" />
          <InputText value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') carregar(); }}
            placeholder="Buscar por nome do paciente, remetente ou assunto (ignora o dia)" style={{ width: '100%' }} />
        </span>
        <Dropdown value={status} options={opcoesStatus} onChange={(e) => setStatus(e.value)} placeholder="Todos os status" showClear style={{ minWidth: '13rem' }} />
        <Button label="Buscar" icon="pi pi-search" onClick={carregar} />
      </div>
      <p className="ce-sub">{dados.total} e-mail(s) · dias com movimento nos últimos 60: {Object.keys(dados.diasComMovimento || {}).length}</p>
      <DataTable value={dados.itens} loading={loading} dataKey="id" paginator rows={25} rowsPerPageOptions={[25, 50, 100]}
        expandedRows={expandidas} onRowToggle={(e) => setExpandidas(e.data)} rowExpansionTemplate={expansor}
        rowClassName={(r: any) => (r.falhou ? 'ce-linha-falha' : r.status === 'DUPLICADO_PACIENTE' ? 'ce-linha-repedido' : '')}
        emptyMessage="Nenhum e-mail neste filtro." aria-label="E-mails processados">
        <Column expander style={{ width: '3rem' }} />
        <Column field="recebidoEm" header="Processado em" sortable body={(r) => fmt(r.recebidoEm)} style={{ minWidth: '10rem' }} />
        <Column field="status" header="Resultado" sortable body={(r) => <Tag value={ROTULO_STATUS[r.status] ?? r.status} severity={COR_STATUS[r.status] ?? 'secondary'} />} />
        <Column field="paciente" header="Paciente" sortable style={{ minWidth: '13rem' }} body={(r) => r.paciente || <span className="ce-sub">—</span>} />
        <Column field="remetente" header="Remetente" sortable style={{ minWidth: '14rem' }} body={(r) => (r.remetente || '').replace(/<.*>/, '').trim() || r.remetente} />
        <Column field="assunto" header="Assunto" style={{ minWidth: '18rem' }} />
        <Column header="Pedido" body={(r) => r.pedido ? <>#{r.pedido.id}{r.pedido.vezesPedido > 1 && <span className="mc-repedido-badge" style={{ marginLeft: 6 }}>{r.pedido.vezesPedido}×</span>}</> : '—'} />
        <Column field="vezesChegou" header={cabecalhoComHint('Chegou', 'Quantas vezes um e-mail deste paciente chegou (pedido + re-pedidos)')} sortable style={{ width: '6rem' }} bodyStyle={{ textAlign: 'center' }}
          body={(r) => (r.vezesChegou ?? 1) > 1 ? <span className="mc-repedido-badge">{r.vezesChegou}×</span> : <span className="ce-sub">1×</span>} />
        <Column header={cabecalhoComHint('Resposta', 'A resposta de recebimento que o sistema mandou ao solicitante — abra a linha para ver o conteúdo')}
          body={(r) => r.resposta ? <Tag value={r.resposta.status} severity={r.resposta.status === 'ENVIADO' ? 'success' : r.resposta.status === 'ERRO' ? 'danger' : 'warning'} /> : <span className="ce-sub">—</span>} />
      </DataTable>
    </div>
  );
}

function Caixa() {
  const [dias, setDias] = useState(3);
  const [dados, setDados] = useState<any | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const carregar = () => {
    setLoading(true); setErro(null);
    getCentralCaixa(dias).then(({ data }) => setDados(data))
      .catch((e) => setErro(e?.response?.data?.erro ?? 'Não consegui ler a caixa.'))
      .finally(() => setLoading(false));
  };
  useEffect(carregar, [dias]);
  const linhas = useMemo(() => Object.entries(dados?.porDia || {}).flatMap(([d, its]: any) => its.map((i: any) => ({ ...i, diaGrupo: d }))), [dados]);
  return (
    <div>
      <div className="ce-filtros">
        <Dropdown value={dias} options={[1, 3, 7, 14, 30].map((n) => ({ label: `últimos ${n} dia(s)`, value: n }))} onChange={(e) => setDias(e.value)} />
        <Button icon="pi pi-refresh" label="Ler a caixa" outlined onClick={carregar} loading={loading} />
        {dados && (
          <span className="ce-sub">{dados.total} mensagem(ns) desde {dados.desde} · {dados.naoLidos} não lida(s) ·{' '}
            <strong className={dados.naoVistosPeloMonitor ? 'ruim' : ''}>{dados.naoVistosPeloMonitor} lida(s) que o monitor nunca processou</strong></span>
        )}
      </div>
      {erro && <p className="ruim">{erro}</p>}
      <p className="ce-sub">Lê a INBOX sem marcar nada como lido. O monitor só processa e-mail <em>não lido</em>: se alguém abrir um e-mail antes do ciclo, ele aparece aqui como "lida e não processada" — é o furo que esta aba existe para mostrar.</p>
      <DataTable value={linhas} loading={loading} dataKey="imapId" rowGroupMode="subheader" groupRowsBy="diaGrupo" sortField="data" sortOrder={-1}
        rowGroupHeaderTemplate={(r: any) => <strong>{r.diaGrupo}</strong>}
        rowClassName={(r: any) => (r.naoVistoPeloMonitor ? 'ce-linha-falha' : '')}
        emptyMessage="Nada na caixa neste período." aria-label="Caixa de entrada reconciliada">
        <Column field="data" header="Chegou" body={(r) => fmt(r.data)} style={{ minWidth: '9rem' }} />
        <Column field="lido" header="Lido?" body={(r) => r.lido ? <Tag value="lido" severity="secondary" /> : <Tag value="não lido" severity="info" />} />
        <Column field="de" header="De" style={{ minWidth: '14rem' }} body={(r) => (r.de || '').replace(/<.*>/, '').trim() || r.de} />
        <Column field="assunto" header="Assunto" style={{ minWidth: '20rem' }} />
        <Column header="Monitor" body={(r) => r.processado
          ? <Tag value={ROTULO_STATUS[r.status] ?? r.status} severity={COR_STATUS[r.status] ?? 'secondary'} />
          : <Tag value={r.lido ? 'LIDA, NÃO PROCESSADA' : 'aguardando o ciclo'} severity={r.lido ? 'danger' : 'info'} />} />
        <Column header="Pedido" body={(r) => r.pedidoId ? `#${r.pedidoId}` : '—'} />
        <Column field="chegouVezes" header={cabecalhoComHint('Chegou', 'Mesmo assunto (sem RE:/FW:) no período')} sortable style={{ width: '6rem' }} bodyStyle={{ textAlign: 'center' }}
          body={(r) => (r.chegouVezes ?? 1) > 1 ? <span className="mc-repedido-badge">{r.chegouVezes}×</span> : <span className="ce-sub">1×</span>} />
        <Column header="Ação" style={{ width: '12rem' }} body={(r) => r.naoVistoPeloMonitor && r.messageId
          ? <BotaoReprocessar messageId={r.messageId} rotulo="Processar agora" aoTerminar={carregar} /> : null} />
      </DataTable>
    </div>
  );
}

export function CentralEmailsPage() {
  return (
    <div className="ce-page">
      <div className="page-header">
        <h1><i className="pi pi-inbox" /> Central de E-mails</h1>
        <p className="ce-sub">O monitor está em dia? O que ele fez com cada e-mail? Que resposta saiu? A caixa inteira, lida ou não, conferida contra o que foi processado.</p>
      </div>
      <TabView>
        <TabPanel header="Saúde" leftIcon="pi pi-heart mr-2"><Saude /></TabPanel>
        <TabPanel header="Processados" leftIcon="pi pi-list mr-2"><Processados /></TabPanel>
        <TabPanel header="Caixa (reconciliação)" leftIcon="pi pi-envelope mr-2"><Caixa /></TabPanel>
      </TabView>
    </div>
  );
}
