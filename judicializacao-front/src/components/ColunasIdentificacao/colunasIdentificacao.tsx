import { useState } from 'react';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { BotaoCopiar } from '../BotaoCopiar/BotaoCopiar';
import './colunasIdentificacao.css';

/**
 * Colunas de IDENTIFICAÇÃO do pedido, reutilizáveis em toda tabela (task #214, @R 27/08 13:23:
 * "para todas as tabelas: CNJ/SEI com botões de copiar e a comarca").
 *
 * Contrato: o endpoint da tabela devolve, por linha, os campos que `_identificacao_por_order`
 * (backend/views.py) anexa — nprocesso, numeroSei, familiaSei, comarca, distanciaKm, esfera,
 * geoMotivo. São FUNÇÕES que devolvem <Column> (¬componentes): o DataTable do PrimeReact só
 * enxerga Column como filho direto; um wrapper React o esconderia.
 *
 * Uso:  <DataTable ...>{colunaCnj()}{colunaSei()}{colunaComarca()}...</DataTable>
 *       + no estado `filters`: ...FILTROS_IDENTIFICACAO
 */

export interface ItemCadastro {
  ok: boolean;
  fonte: string | null;
  tom: 'ok' | 'acao' | 'humano';
  acao: string | null;
  dono: string | null;
}

export interface Cadastro {
  cnj: ItemCadastro; sei: ItemCadastro; comarca: ItemCadastro; anexo: ItemCadastro;
  completos: number; total: number; faltas: string[]; completo: boolean;
}

export interface LinhaIdentificada {
  cadastro?: Cadastro | null;
  segredo?: 'sim' | 'possivel' | 'nao' | null;
  segredoFonte?: string | null;
  nprocesso?: string | null;
  numeroSei?: string | null;
  familiaSei?: string | null;
  comarca?: string | null;
  distanciaKm?: number | null;
  esfera?: 'estadual' | 'federal' | 'trabalhista' | 'stf' | 'stj' | 'outra' | null;
  geoMotivo?: string | null;
}

export const FILTROS_IDENTIFICACAO = {
  nprocesso: { value: '', matchMode: 'contains' as const },
  numeroSei: { value: '', matchMode: 'contains' as const },
  comarca: { value: '', matchMode: 'contains' as const },
};

const filtro = (placeholder: string) => (options: any) => (
  <InputText value={options.value || ''} onChange={(e) => options.filterApplyCallback(e.target.value)}
    placeholder={placeholder} className="p-column-filter" />
);

export function colunaCnj(largura = '14rem') {
  return (
    <Column key="col-cnj" field="nprocesso" header={cabecalhoComHint('Nº CNJ', EXPLICA.cnj)} sortable filter
      filterElement={filtro('Buscar CNJ')} style={{ minWidth: largura }}
      body={(r: LinhaIdentificada) => r.nprocesso
        ? <><code className="ident-numero" title="Número CNJ do processo">{r.nprocesso}</code><BotaoCopiar valor={r.nprocesso} rotulo="número CNJ" /></>
        : <span className="ident-vazio">—</span>} />
  );
}

export function colunaSei(largura = '12rem') {
  return (
    <Column key="col-sei" field="numeroSei" header={cabecalhoComHint('Nº SEI', EXPLICA.sei)} sortable filter
      filterElement={filtro('Buscar SEI')} style={{ minWidth: largura }}
      body={(r: LinhaIdentificada) => r.numeroSei
        ? <><code className="ident-numero" title={r.familiaSei ? `Família ${r.familiaSei}` : 'Número SEI'}>{r.numeroSei}</code><BotaoCopiar valor={r.numeroSei} rotulo="número SEI" /></>
        : <span className="ident-vazio">—</span>} />
  );
}

export function colunaComarca(largura = '11rem') {
  return (
    <Column key="col-comarca" field="comarca" header={cabecalhoComHint('Comarca', EXPLICA.comarca)} sortable filter
      filterElement={filtro('Buscar comarca')} style={{ minWidth: largura }}
      body={(r: LinhaIdentificada) => {
        // @R 27/08: "federal não tem distância" — dito na cara, ¬célula vazia.
        if (r.esfera === 'federal') return <Tag value="Federal" severity="info" title="Justiça Federal — sem comarca estadual" />;
        if (!r.comarca) return <span className="ident-vazio" title={r.geoMotivo ?? ''}>
          {r.geoMotivo === 'sem_cnj' ? 'sem nº do processo' : 'comarca não mapeada'}</span>;
        return (
          <span className="ident-geo">
            <strong>{r.comarca}</strong>
            {r.distanciaKm !== null && r.distanciaKm !== undefined && (
              <small>{r.distanciaKm === 0 ? 'aqui (JF)' : `${r.distanciaKm.toLocaleString('pt-BR')} km`}</small>
            )}
          </span>
        );
      }} />
  );
}

/** Coluna Segredo × Sem segredo em TODA tabela (@R 27/08 16:52: "toda coluna tem se o
 *  processo é segredo de justiça ou sem segredo em cada página"). 3 estados do backend:
 *  sim = marca confirmada · possivel = API DataJud sinalizou, aguardando confirmação
 *  humana (aba Candidatos do Segredo) · nao = sem marca nem sinal. */
export function colunaSegredo(largura = '9rem') {
  return (
    <Column key="col-segredo" field="segredo" header={cabecalhoComHint('Segredo', EXPLICA.segredo)} sortable
      style={{ minWidth: largura }}
      body={(r: LinhaIdentificada) => {
        if (r.segredo === 'sim') return <Tag value="Segredo de Justiça" severity="danger" icon="pi pi-lock" title={r.segredoFonte ?? 'Marcado no sistema'} />;
        if (r.segredo === 'possivel') return <Tag value="Possível segredo" severity="warning" icon="pi pi-question-circle" title={`Sinal da API — confirme na tela Segredo de Justiça. ${r.segredoFonte ?? ''}`} />;
        if (r.segredo === 'nao') return <Tag value="Sem segredo" severity="secondary" title={r.segredoFonte ?? 'Sem marca nem sinal da API'} />;
        return <span className="ident-vazio">—</span>;
      }} />
  );
}

/** Tipo do paciente pela idade (@R 27/08 18:51: "pediatria ou adulto... ou idoso").
 *  Pediátrico <18 · Adulto 18-59 · Idoso 60+ (Estatuto do Idoso). Sem data = "—". */
export function tagTipoPaciente(tipo?: string | null) {
  if (!tipo) return <span className="ident-vazio" title="Sem data de nascimento no pedido">—</span>;
  const sev = tipo === 'Pediátrico' ? 'warning' : tipo === 'Idoso' ? 'danger' : 'info';
  return <Tag value={tipo} severity={sev as any} />;
}

/** Célula de nome com botão de copiar — para a coluna Paciente que cada tela já tem. */
export function nomeComCopiar(nome: string | null | undefined) {
  return <>{nome}<BotaoCopiar valor={nome} rotulo="nome do paciente" /></>;
}



/** Hint de coluna (@R 27/08 14:26: "ao lado de cada coluna um hint para abrir um modal
 *  explicando o que é"): ícone ? no cabeçalho → Dialog com a explicação em linguagem de
 *  operação. Reutilizável por qualquer tabela: header={cabecalhoComHint('Nº CNJ', <>...</>)} */
function HintColuna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button type="button" className="hint-coluna" aria-label={`O que é ${titulo}?`}
        title={`O que é ${titulo}?`}
        onClick={(e) => { e.stopPropagation(); setAberto(true); }}>?</button>
      <Dialog header={titulo} visible={aberto} modal style={{ width: '34rem', maxWidth: '94vw' }}
        onHide={() => setAberto(false)} dismissableMask>
        <div className="hint-coluna__corpo">{children}</div>
      </Dialog>
    </>
  );
}

export function cabecalhoComHint(titulo: string, explicacao: React.ReactNode) {
  return (
    <span className="cabecalho-hint">
      {titulo}
      <HintColuna titulo={titulo}>{explicacao}</HintColuna>
    </span>
  );
}

const EXPLICA = {
  cnj: <>
    <p>O <strong>número CNJ</strong> é a identidade nacional do processo judicial (padrão do
    Conselho Nacional de Justiça): <code>NNNNNNN-DD.AAAA.J.TR.OOOO</code>.</p>
    <p>É por ele que cruzamos o pedido com os pagamentos do Estado. O sistema valida o
    dígito verificador — número com DV errado não entra.</p>
    <p><em>De onde vem:</em> lido automaticamente dos PDFs anexados ao e-mail, ou digitado
    pelo jurídico na análise. Um clique no número seleciona tudo para copiar.</p>
  </>,
  sei: <>
    <p>O <strong>número SEI</strong> é o protocolo do processo ADMINISTRATIVO no Estado
    (SEI-MG) — o par do CNJ: o CNJ acha o processo na Justiça, o SEI acha o pagamento
    dentro do Estado.</p>
    <p><em>De onde vem:</em> do carimbo do SEI-MG impresso nas páginas dos PDFs anexados
    (extraído automaticamente). A família PAGADOR é a que casa com o empenho do depósito
    judicial — aparece ao passar o mouse.</p>
  </>,
  comarca: <>
    <p>A <strong>comarca</strong> é onde o processo corre — derivada dos 4 últimos dígitos
    do próprio número CNJ, com a distância em linha reta até Juiz de Fora.</p>
    <p>Processo na <strong>Justiça Federal</strong> não tem comarca estadual (a etiqueta
    diz isso). "Comarca não mapeada" = código ainda sem tradução no nosso mapa — a aliança
    de dados completa aos poucos.</p>
  </>,
  segredo: <>
    <p>Diz se o processo corre em <strong>segredo de justiça</strong>:</p>
    <p><strong>Segredo de Justiça</strong> = confirmado no sistema (fluxo próprio: folha
    timbrada e e-mails específicos) · <strong>Possível segredo</strong> = a consulta
    automática ao DataJud/CNJ sinalizou (sigilo declarado ou classe protegida por lei,
    como Infância e Juventude), mas ninguém confirmou ainda — confirme na tela Segredo
    de Justiça · <strong>Sem segredo</strong> = processo comum.</p>
    <p><em>De onde vem:</em> consulta automática à base pública do CNJ na chegada do
    pedido + confirmação humana. Passe o mouse na etiqueta para ver a fonte.</p>
  </>,
  cadastro: <>
    <p>O <strong>cadastro</strong> resume, em 4 pontos, o que este pedido tem e o que falta:
    CNJ · SEI · Comarca · Anexo.</p>
    <p><span style={{color:'#00a651'}}>●</span> <strong>verde</strong> = temos (o tooltip diz a fonte) ·{' '}
    <span style={{color:'#f59e0b'}}>●</span> <strong>âmbar</strong> = falta, mas há uma rota
    automática em curso (ex.: releitura dos anexos hoje à noite) ·{' '}
    <span style={{color:'#9aa7a1'}}>●</span> <strong>cinza</strong> = falta e depende de pessoa
    (o tooltip diz quem).</p>
    <p>Passe o mouse no chip para ver, item a item, a fonte de cada dado e a próxima ação
    com o responsável. Nenhuma falta fica sem rota.</p>
  </>,
};

const ROTULO_PONTO: Record<string, string> = { cnj: 'CNJ', sei: 'SEI', comarca: 'Comarca', anexo: 'Anexo' };

/** Chip "cadastro" (desenho af56e8f2, nota 94 — GO @R 27/08 14:19): 4 pontos, tooltip com
 *  fonte + próxima ação + dono. verde=tem · âmbar=falta com rota automática · cinza=fila
 *  humana. cadastro null (falha no cálculo) = "indisponível" — a tabela nunca cai (K6). */
export function colunaCadastro(largura = '9rem') {
  return (
    <Column key="col-cadastro" field="cadastro" header={cabecalhoComHint('Cadastro', EXPLICA.cadastro)} sortable
      sortField="cadastro.completos" style={{ minWidth: largura }}
      body={(r: LinhaIdentificada) => {
        const c = r.cadastro;
        if (c === null) return <span className="ident-vazio" title="Falha ao calcular — a análise segue normalmente">indisponível</span>;
        if (!c) return <span className="ident-vazio">—</span>;
        const titulo = (['cnj', 'sei', 'comarca', 'anexo'] as const).map((k) => {
          const i = c[k];
          if (i.ok) return `${ROTULO_PONTO[k]}: ok${i.fonte ? ` (${i.fonte})` : ''}`;
          return `${ROTULO_PONTO[k]}: FALTA — ${i.acao ?? ''}${i.dono ? ` · ${i.dono}` : ''}`;
        }).join('\n');
        return (
          <span className={`chip-cadastro${c.completo ? ' chip-cadastro--completo' : ''}`} title={titulo}
            aria-label={`Cadastro ${c.completos} de ${c.total} completos${c.faltas.length ? `; faltando ${c.faltas.join(', ')}` : ''}`}>
            {(['cnj', 'sei', 'comarca', 'anexo'] as const).map((k) => (
              <span key={k} className={`cc-ponto cc-ponto--${c[k].tom}`} aria-hidden="true" />
            ))}
            <small>{c.completos}/{c.total}</small>
          </span>
        );
      }} />
  );
}
