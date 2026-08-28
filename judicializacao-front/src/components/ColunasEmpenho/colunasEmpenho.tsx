import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

/**
 * Colunas de empenho/pagamento do Estado (base 548) — compartilhadas pelas telas
 * 5 Protocolados, 6 Enviado à SES, Perdas e Ganhos/Resultados (@R 28/08 02:2x:
 * "para quem tem pagamento em 5. e 6. e perdas e ganhos vamos colocar lá também
 * para cruzarmos"). Régua T2 da 548: o valor é do EMPENHO (favorecido costuma
 * ser o Tribunal — depósito judicial), nunca o que o prestador recebeu.
 *
 * A linha precisa ter: empenho548 {pago, empenhado, nEmpenhos, anoMax,
 * ultimoPagamento} | null · valorOrcamento (base da diferença).
 */

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDataBr = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

const ehExato = (r: any) =>
  (r.empenho548?.pago ?? 0) > 0 && (r.valorOrcamento ?? 0) > 0 &&
  Math.abs(r.empenho548.pago - r.valorOrcamento) / r.valorOrcamento < 0.005;

export function colunaEmpenhoEstado() {
  return (
    <Column key="empenho548" field="empenho548" header="Empenho Estado" sortable style={{ minWidth: '11rem' }}
      sortFunction={(e: any) => {
        const v = (r: any) => r.empenho548?.pago ?? -1;
        return [...e.data].sort((a: any, b: any) => (v(a) - v(b)) * (e.order ?? 1));
      }}
      body={(r: any) => (r.empenho548
        ? (r.empenho548.pago > 0
          ? (ehExato(r)
            ? <Tag value={`PAGO = ORÇADO ${fmtBRL(r.empenho548.pago)}`} icon="pi pi-star-fill"
                style={{ background: '#7c3aed', color: '#fff' }}
                title="O valor pago pelo Estado BATE com o orçamento enviado (±0,5%) — evidência forte de que é ESTE item. Conferência prioritária." />
            : <Tag value={`PAGO ${fmtBRL(r.empenho548.pago)}`} severity="success" icon="pi pi-check-circle"
                title={`O Estado já PAGOU ${r.empenho548.nEmpenhos} empenho(s) neste CNJ com valor diferente do orçado — pode ser outro item do processo. Valor do EMPENHO, não do prestador.`} />)
          : <Tag value="Empenhado" severity="info" icon="pi pi-wallet"
              title="Há empenho no Estado para este CNJ, ainda sem pagamento registrado." />)
        : <span title="Nenhum empenho localizado para este CNJ na base do Estado (548).">—</span>)} />
  );
}

export function colunaPagoEm() {
  return (
    <Column key="ultimoPagamento" field="empenho548.ultimoPagamento" header="Pago em" sortable style={{ minWidth: '9rem' }}
      sortFunction={(e: any) => {
        const v = (r: any) => r.empenho548?.ultimoPagamento ?? '';
        return [...e.data].sort((a: any, b: any) => v(a).localeCompare(v(b)) * (e.order ?? 1));
      }}
      body={(r: any) => {
        const dt = r.empenho548?.ultimoPagamento;
        if (!dt) return <span style={{ opacity: 0.5 }}>—</span>;
        const dias = Math.floor((Date.now() - new Date(`${dt}T00:00:00`).getTime()) / 86400000);
        return <span title={`Último pagamento do Estado neste CNJ há ${dias} dia(s)`}>
          {fmtDataBr(dt)} <small style={{ opacity: 0.7 }}>({dias}d)</small>
        </span>;
      }} />
  );
}

export function colunaDiferenca() {
  return (
    <Column key="difEmpenho" header="Diferença" sortable field="empenho548.pago" style={{ minWidth: '10rem' }}
      sortFunction={(e: any) => {
        const v = (r: any) => ((r.empenho548?.pago ?? 0) > 0 && (r.valorOrcamento ?? 0) > 0)
          ? r.empenho548.pago - r.valorOrcamento : Number.NEGATIVE_INFINITY;
        return [...e.data].sort((a: any, b: any) => (v(a) - v(b)) * (e.order ?? 1));
      }}
      body={(r: any) => {
        const pago = r.empenho548?.pago ?? 0;
        const orcado = r.valorOrcamento ?? 0;
        if (pago <= 0 || orcado <= 0) return <span style={{ opacity: 0.5 }}>—</span>;
        const dif = pago - orcado;
        const pct = (dif / orcado) * 100;
        const cor = Math.abs(pct) < 0.5 ? '#7c3aed' : dif < 0 ? '#dc2626' : '#0891b2';
        return <span style={{ color: cor, fontVariantNumeric: 'tabular-nums' }}
          title="Pago pelo Estado MENOS o orçamento que enviamos. Valor do empenho, não do prestador.">
          {dif >= 0 ? '+' : ''}{fmtBRL(dif)} <small>({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</small>
        </span>;
      }} />
  );
}

/** Agregados p/ indicadores das telas: soma do pago, soma do orçado e contagens. */
export function kpisEmpenho(linhas: any[]) {
  const pagos = linhas.filter((l) => (l.empenho548?.pago ?? 0) > 0);
  return {
    nPagos: pagos.length,
    somaPago: pagos.reduce((acc, l) => acc + l.empenho548.pago, 0),
    somaValor: linhas.reduce((acc, l) => acc + (l.valorOrcamento || 0), 0),
    nExatos: pagos.filter(ehExato).length,
  };
}

export const fmtBRLEmpenho = fmtBRL;
