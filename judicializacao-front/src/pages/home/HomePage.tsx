import { useEffect, useMemo, useState } from 'react';
import { getOrders, getPerdas, getResultados } from '../../services/api/orders';
import './HomePage.css';

interface OrderResumo {
  id: number;
  paciente?: string;
  procedimento?: string;
  dataPedido?: string | null;
  statusProcesso?: string | null;
  statusOrcamento?: string | null;
  refPreco?: number | null;
  valorOrcamento?: number | null;
  valorGanho?: number | null;
  dataStatusOrcamento?: string | null;
}

interface ResultadoResumo {
  id: number;
  procedimento?: string;
  dataPedido?: string | null;
  dataResultado?: string | null;
  valorOrcamento?: number | null;
  valorGanho?: number | null;
  statusProcesso?: string | null;
}

interface PerdaResumo {
  id: number;
  procedimento?: string;
  dataPedido?: string | null;
  dataStatusPerda?: string | null;
  valorOrcamento?: number | null;
  refPreco?: number | null;
}

interface CardMesVida {
  titulo: string;
  icone: string;
  valorMes: number;
  valorVida: number;
}

interface CardValorQuantidade {
  titulo: string;
  icone: string;
  valorPrincipal: number;
  quantidade: number;
  tipo?: 'success' | 'danger' | 'warning' | 'info';
  percentual?: boolean;
}

interface GraficoPerdaProcedimento {
  procedimento: string;
  valorOrcamentoEnviado: number;
  valorOrcamentoGanho: number;
}

const STATUS_AGUARDANDO_ORCAMENTO = 'Aguardando Orçamento';
const STATUS_ORCAMENTO_ENVIADO = 'Orçamento Enviado';
const STATUS_PROCESSO_GANHO = 'Ganho';
const STATUS_PROCESSO_PERDA = 'Perda';

function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (!Number.isNaN(parsed.getTime())) return parsed;

  const [datePart, timePart] = value.split(' ');
  const dateBits = datePart?.split(/[/-]/) ?? [];

  if (dateBits.length === 3) {
    const [first, second, third] = dateBits.map(Number);
    const hasTime = timePart ? `T${timePart}` : 'T00:00:00';

    if (String(dateBits[0]).length === 4) {
      const iso = `${first.toString().padStart(4, '0')}-${second.toString().padStart(2, '0')}-${third
        .toString()
        .padStart(2, '0')}${hasTime}`;
      const isoParsed = new Date(iso);
      return Number.isNaN(isoParsed.getTime()) ? null : isoParsed;
    }

    const br = `${third.toString().padStart(4, '0')}-${second.toString().padStart(2, '0')}-${first
      .toString()
      .padStart(2, '0')}${hasTime}`;
    const brParsed = new Date(br);
    return Number.isNaN(brParsed.getTime()) ? null : brParsed;
  }

  return null;
}

function isSameMonth(reference: Date, value?: string | null): boolean {
  const parsed = parseApiDate(value);
  if (!parsed) return false;

  return parsed.getFullYear() === reference.getFullYear() && parsed.getMonth() === reference.getMonth();
}

function toNumber(value?: number | null): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function truncateProcedimento(value: string): string {
  if (value.length <= 80) return value;
  return `${value.slice(0, 80).trim()}...`;
}

export function HomePage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderResumo[]>([]);
  const [resultados, setResultados] = useState<ResultadoResumo[]>([]);
  const [perdas, setPerdas] = useState<PerdaResumo[]>([]);

  useEffect(() => {
    setLoading(true);

    Promise.all([getOrders(), getResultados(), getPerdas()])
      .then(([ordersRes, resultadosRes, perdasRes]) => {
        setOrders((ordersRes.data as OrderResumo[]) ?? []);
        setResultados((resultadosRes.data as ResultadoResumo[]) ?? []);
        setPerdas((perdasRes.data as PerdaResumo[]) ?? []);
      })
      .catch((error) => {
        console.error('Erro ao carregar dashboard da Home', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const indicadores = useMemo(() => {
    const agora = new Date();

    const pedidosMes = orders.filter((item) => isSameMonth(agora, item.dataPedido)).length;
    const pedidosVida = orders.length;

    const orcamentosEnviadosMes = orders.filter(
      (item) =>
        item.statusOrcamento === STATUS_ORCAMENTO_ENVIADO &&
        isSameMonth(agora, item.dataStatusOrcamento)
    ).length;
    const orcamentosEnviadosVida = orders.filter(
      (item) => item.statusOrcamento === STATUS_ORCAMENTO_ENVIADO
    ).length;

    const aguardandoOrcamentoMes = orders.filter(
      (item) =>
        item.statusProcesso === STATUS_AGUARDANDO_ORCAMENTO && isSameMonth(agora, item.dataPedido)
    ).length;
    const aguardandoOrcamentoVida = orders.filter(
      (item) => item.statusProcesso === STATUS_AGUARDANDO_ORCAMENTO
    ).length;

    const pedidosRecusadosMes = perdas.filter((item) =>
      isSameMonth(agora, item.dataStatusPerda ?? item.dataPedido)
    ).length;
    const pedidosRecusadosVida = perdas.length;

    const pedidosEmAberto = orders.filter(
      (item) =>
        item.statusProcesso !== STATUS_PROCESSO_GANHO && item.statusProcesso !== STATUS_PROCESSO_PERDA
    );
    const pedidosEmAbertoComOrcamento = pedidosEmAberto.filter(
      (item) => toNumber(item.valorOrcamento) > 0
    );

    const valorEmAberto = pedidosEmAbertoComOrcamento.reduce(
      (acc, item) => acc + toNumber(item.valorOrcamento),
      0
    );

    const ganhos = resultados.filter((item) => item.statusProcesso === STATUS_PROCESSO_GANHO);
    const valorGanho = ganhos.reduce(
      (acc, item) => acc + (toNumber(item.valorGanho) || toNumber(item.valorOrcamento)),
      0
    );

    const perdasResultado = resultados.filter((item) => item.statusProcesso === STATUS_PROCESSO_PERDA);
    const valorPerda = perdasResultado.reduce(
      (acc, item) => acc + (toNumber(item.valorOrcamento) || 0),
      0
    );

    const conversaoValorBase = valorGanho + valorPerda;
    const conversaoValor = conversaoValorBase > 0 ? (valorGanho / conversaoValorBase) * 100 : 0;

    const ganhosQuantidade = ganhos.length;
    const perdasQuantidade = perdasResultado.length;
    const conversaoQuantidadeBase = ganhosQuantidade + perdasQuantidade;
    const conversaoQuantidade =
      conversaoQuantidadeBase > 0 ? Math.round((ganhosQuantidade / conversaoQuantidadeBase) * 100) : 0;

    const cardsMesVida: CardMesVida[] = [
      {
        titulo: 'Quantidade de pedidos',
        icone: 'pi pi-inbox',
        valorMes: pedidosMes,
        valorVida: pedidosVida,
      },
      {
        titulo: 'Quantidade de orçamentos enviados',
        icone: 'pi pi-send',
        valorMes: orcamentosEnviadosMes,
        valorVida: orcamentosEnviadosVida,
      },
      {
        titulo: 'Quantidade de aguardando orçamento',
        icone: 'pi pi-clock',
        valorMes: aguardandoOrcamentoMes,
        valorVida: aguardandoOrcamentoVida,
      },
      {
        titulo: 'Quantidade de pedidos recusados',
        icone: 'pi pi-ban',
        valorMes: pedidosRecusadosMes,
        valorVida: pedidosRecusadosVida,
      },
    ];

    const cardsValorQuantidade: CardValorQuantidade[] = [
      {
        titulo: 'Valor em aberto',
        icone: 'pi pi-wallet',
        valorPrincipal: valorEmAberto,
        quantidade: pedidosEmAbertoComOrcamento.length,
        tipo: 'warning',
      },
      {
        titulo: 'Valor ganho',
        icone: 'pi pi-check-circle',
        valorPrincipal: valorGanho,
        quantidade: ganhosQuantidade,
        tipo: 'success',
      },
      {
        titulo: 'Valor perda',
        icone: 'pi pi-times-circle',
        valorPrincipal: valorPerda,
        quantidade: perdasQuantidade,
        tipo: 'danger',
      },
      {
        titulo: 'Conversão valor ganho / (valor ganho + valor perda)',
        icone: 'pi pi-percentage',
        valorPrincipal: conversaoValor,
        quantidade: conversaoQuantidade,
        tipo: 'info',
        percentual: true,
      },
    ];

    const perdasOrders = orders.filter(
      (item) =>
        item.statusProcesso === STATUS_PROCESSO_PERDA &&
        (toNumber(item.valorOrcamento) > 0 || toNumber(item.valorGanho) > 0)
    );

    const mapaGrafico = new Map<string, GraficoPerdaProcedimento>();

    perdasOrders.forEach((item) => {
      const procedimento = item.procedimento?.trim() || 'Procedimento não informado';
      const atual = mapaGrafico.get(procedimento) ?? {
        procedimento,
        valorOrcamentoEnviado: 0,
        valorOrcamentoGanho: 0,
      };

      atual.valorOrcamentoEnviado += toNumber(item.valorOrcamento);
      atual.valorOrcamentoGanho += toNumber(item.valorGanho);
      mapaGrafico.set(procedimento, atual);
    });

    const graficoProcedimentos = Array.from(mapaGrafico.values())
      .sort((a, b) => b.valorOrcamentoEnviado - a.valorOrcamentoEnviado)
      .slice(0, 8);

    const maiorValorGrafico = graficoProcedimentos.reduce((acc, item) => {
      return Math.max(acc, item.valorOrcamentoEnviado, item.valorOrcamentoGanho);
    }, 0);

    const pedidosAbertosQtd = pedidosEmAberto.length;

    return {
      cardsMesVida,
      cardsValorQuantidade,
      graficoProcedimentos,
      maiorValorGrafico,
      mesAtualLabel: agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      pedidosAbertosQtd,
      ganhosQuantidade,
      perdasQuantidade,
    };
  }, [orders, perdas, resultados]);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <span className="home-hero__eyebrow">Home</span>
          <h1>Painel principal da operação</h1>
          <p>
            Acompanhe o volume do mês, o histórico acumulado, os valores em aberto e a conversão
            financeira dos pedidos da operação.
          </p>
        </div>

        <div className="home-hero__panel">
          <div className="home-hero__metric">
            <strong>Mês atual</strong>
            <span>{indicadores.mesAtualLabel}</span>
          </div>
          <div className="home-hero__metric">
            <strong>Pedidos em aberto</strong>
            <span>{loading ? '--' : indicadores.pedidosAbertosQtd}</span>
          </div>
          <div className="home-hero__metric">
            <strong>Ganhos x perdas</strong>
            <span>
              {loading
                ? '--'
                : `${indicadores.ganhosQuantidade} ganhos / ${indicadores.perdasQuantidade} perdas`}
            </span>
          </div>
        </div>
      </section>

      <section className="home-block">
        <div className="home-block__header">
          <h2>Visão mensal x histórico</h2>
          <p>Valor principal do mês atual com apoio do número acumulado de toda a base.</p>
        </div>

        <div className="home-grid home-grid--four">
          {indicadores.cardsMesVida.map((card) => (
            <article key={card.titulo} className="home-card home-card--metric">
              <div className="home-card__icon">
                <i className={card.icone} />
              </div>
              <div className="home-card__body">
                <h3>{card.titulo}</h3>
                <div className="home-card__metric">{loading ? '--' : card.valorMes}</div>
                <p>
                  Vida toda: <strong>{loading ? '--' : card.valorVida}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-block">
        <div className="home-block__header">
          <h2>Valores e conversão</h2>
          <p>Valor financeiro em destaque com a quantidade de processos correspondente embaixo.</p>
        </div>

        <div className="home-grid home-grid--four">
          {indicadores.cardsValorQuantidade.map((card) => (
            <article key={card.titulo} className={`home-card home-card--metric home-card--${card.tipo ?? 'info'}`}>
              <div className="home-card__icon">
                <i className={card.icone} />
              </div>
              <div className="home-card__body">
                <h3>{card.titulo}</h3>
                <div className="home-card__metric">
                  {loading
                    ? '--'
                    : card.percentual
                      ? formatPercent(card.valorPrincipal)
                      : formatCurrency(card.valorPrincipal)}
                </div>
                <p>
                  Quantidade: <strong>{loading ? '--' : card.percentual ? `${card.quantidade}%` : card.quantidade}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-placeholder">
        <div className="home-placeholder__header">
          <h2>Análise de perdas</h2>
          <p>
            Procedimentos perdidos comparando o valor do orçamento enviado com o valor do orçamento ganho.
          </p>
        </div>

        <div className="home-chart-legend">
          <span><i className="home-chart-legend__dot home-chart-legend__dot--orcamento" /> Orçamento enviado</span>
          <span><i className="home-chart-legend__dot home-chart-legend__dot--ganho" /> Orçamento ganho</span>
        </div>

        {indicadores.graficoProcedimentos.length === 0 ? (
          <div className="home-empty-state">Nenhum dado consolidado disponível para montar o gráfico.</div>
        ) : (
          <div className="home-placeholder__canvas home-placeholder__canvas--chart">
            {indicadores.graficoProcedimentos.map((item) => {
              const ganhoWidth =
                indicadores.maiorValorGrafico > 0
                  ? Math.max(4, (item.valorOrcamentoGanho / indicadores.maiorValorGrafico) * 100)
                  : 0;
              const orcamentoWidth =
                indicadores.maiorValorGrafico > 0
                  ? Math.max(4, (item.valorOrcamentoEnviado / indicadores.maiorValorGrafico) * 100)
                  : 0;

              return (
                <article key={item.procedimento} className="home-chart-item">
                  <div className="home-chart-item__title">{truncateProcedimento(item.procedimento)}</div>

                  <div className="home-chart-item__row">
                    <span>Enviado</span>
                    <div className="home-chart-item__track">
                      <div className="home-chart-item__bar home-chart-item__bar--orcamento" style={{ width: `${orcamentoWidth}%` }} />
                    </div>
                    <strong>{formatCurrency(item.valorOrcamentoEnviado)}</strong>
                  </div>

                  <div className="home-chart-item__row">
                    <span>Ganho</span>
                    <div className="home-chart-item__track">
                      <div className="home-chart-item__bar home-chart-item__bar--ganho" style={{ width: `${ganhoWidth}%` }} />
                    </div>
                    <strong>{formatCurrency(item.valorOrcamentoGanho)}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
