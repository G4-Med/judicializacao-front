import { useEffect, useMemo, useState } from 'react';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import { DatePickerPeriodo, type PeriodoSelecionado } from '../../components/DatePicker/DatePicker';
import { getMedicosCompleto, getOrders, getPerdas, getResultados } from '../../services/api/orders';
import './DashboardPage.css';

interface MedicoOption {
  label: string;
  value: number | null;
}

interface OrderDashboard {
  id: number;
  idMedico?: number | null;
  procedimento?: string | null;
  statusProcesso?: string | null;
  statusOrcamento?: string | null;
  statusPerda?: string | null;
  dataPedido?: string | null;
  valorOrcamento?: number | null;
  valorGanho?: number | null;
}

interface ResultadoDashboard {
  id: number;
  idMedico?: number | null;
  statusProcesso?: string | null;
  dataPedido?: string | null;
  valorOrcamento?: number | null;
  valorGanho?: number | null;
}

interface PerdaDashboard {
  id: number;
  idMedico?: number | null;
  statusPerda?: string | null;
  dataPedido?: string | null;
  valorOrcamento?: number | null;
  refPreco?: number | null;
}

interface MedicoLookup {
  id: number;
  nome: string;
}

/* ============================================================
   MEDCHECK — paleta dos charts
   ============================================================ */
const MC = {
  green:    '#00a651',
  greenDk:  '#008f46',
  greenLt:  '#4fc588',
  navy:     '#0a3d62',
  navyMid:  '#1d5a8a',
  navyLt:   '#3a7aa8',
  rose:     '#c8394d',
  amber:    '#d08a1c',
  muted:    '#5b6b7a',
  border:   '#e3eaef',
};

/* paleta categórica para gráficos com várias categorias */
const MC_CATEGORICAL = [MC.navy, MC.amber, MC.green, MC.navyMid, MC.greenLt, MC.rose, MC.navyLt];

function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const [datePart, timePart] = value.split(' ');
  const bits = datePart?.split(/[/-]/) ?? [];
  if (bits.length !== 3) return null;
  const [first, second, third] = bits.map(Number);
  const hasTime = timePart ? `T${timePart}` : 'T00:00:00';
  if (String(bits[0]).length === 4) {
    const iso = `${first.toString().padStart(4, '0')}-${second.toString().padStart(2, '0')}-${third.toString().padStart(2, '0')}${hasTime}`;
    const result = new Date(iso);
    return Number.isNaN(result.getTime()) ? null : result;
  }
  const br = `${third.toString().padStart(4, '0')}-${second.toString().padStart(2, '0')}-${first.toString().padStart(2, '0')}${hasTime}`;
  const result = new Date(br);
  return Number.isNaN(result.getTime()) ? null : result;
}

function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function endOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999); }

function withinPeriodo(value: string | null | undefined, periodo: PeriodoSelecionado): boolean {
  const parsed = parseApiDate(value);
  if (!parsed) return false;
  const inicio = periodo.dataInicio ? startOfDay(periodo.dataInicio) : null;
  const fim = periodo.dataFim ? endOfDay(periodo.dataFim) : null;
  if (!inicio || !fim) return true;
  return parsed >= inicio && parsed <= fim;
}

function toNumber(value?: number | null): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCurrencyShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`;
  return formatCurrency(value);
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/* ============================================================
   Chart options — barras VERTICAIS coloridas (status pedido / perda)
   ============================================================ */
function createVerticalBarOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: MC.navy, titleColor: '#fff', bodyColor: '#fff',
        borderColor: MC.green, borderWidth: 1, padding: 10, cornerRadius: 8,
      }
    },
    scales: {
      x: {
        ticks: { color: MC.muted, font: { family: 'Inter, sans-serif', size: 12 }, maxRotation: 90, autoSkip: false },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { color: MC.muted, font: { family: 'Inter, sans-serif', size: 11 }, precision: 0 },
        grid: { color: MC.border, drawBorder: false }
      }
    }
  };
}

/* coluna por dia */
function createColumnOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: MC.navy, titleColor: '#fff', bodyColor: '#fff',
        borderColor: MC.green, borderWidth: 1, padding: 10, cornerRadius: 8,
      }
    },
    scales: {
      x: {
        ticks: { color: MC.muted, font: { family: 'Inter, sans-serif', size: 11 } },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { color: MC.muted, font: { family: 'Inter, sans-serif', size: 11 }, precision: 0 },
        grid: { color: MC.border, drawBorder: false }
      }
    }
  };
}

/* doughnut da % de perda */
function createDoughnutOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: MC.navy, titleColor: '#fff', bodyColor: '#fff',
        padding: 10, cornerRadius: 8,
      }
    }
  };
}

export function DashboardPage() {
  const [medicosOptions, setMedicosOptions] = useState<MedicoOption[]>([
    { label: 'Todos os médicos', value: null }
  ]);
  const [medicoSelecionado, setMedicoSelecionado] = useState<number | null>(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoSelecionado>({
    tipo: 'atual',
    dataInicio: null,
    dataFim: null
  });
  const [orders, setOrders] = useState<OrderDashboard[]>([]);
  const [resultados, setResultados] = useState<ResultadoDashboard[]>([]);
  const [perdas, setPerdas] = useState<PerdaDashboard[]>([]);
  const [medicosLookup, setMedicosLookup] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([getOrders(), getResultados(), getPerdas(), getMedicosCompleto()])
      .then(([ordersRes, resultadosRes, perdasRes, medicosRes]) => {
        setOrders((ordersRes.data as OrderDashboard[]) ?? []);
        setResultados((resultadosRes.data as ResultadoDashboard[]) ?? []);
        setPerdas((perdasRes.data as PerdaDashboard[]) ?? []);

        const medicos = (medicosRes.data as any[]).map((medico) => ({
          id: medico.id,
          nome: medico.nomeSistema || medico.razaoSocial || medico.nome || `Médico ${medico.id}`,
        })) as MedicoLookup[];

        setMedicosOptions([
          { label: 'Todos os médicos', value: null },
          ...medicos.map((medico) => ({ label: medico.nome, value: medico.id }))
        ]);

        setMedicosLookup(
          medicos.reduce<Record<number, string>>((acc, medico) => {
            acc[medico.id] = medico.nome;
            return acc;
          }, {})
        );
      })
      .catch((error) => console.error('Erro ao carregar dashboard', error));
  }, []);

  const baseOrders = useMemo(() => {
    if (medicoSelecionado === null) return orders;
    return orders.filter((item) => item.idMedico === medicoSelecionado);
  }, [orders, medicoSelecionado]);

  const ordersLookup = useMemo(() => {
    return orders.reduce<Record<number, OrderDashboard>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [orders]);

  const resolveMedicoId = (id: number, idMedico?: number | null) => idMedico ?? ordersLookup[id]?.idMedico ?? null;
  const resolveMedicoNome = (id: number, idMedico?: number | null) => {
    const resolvedId = resolveMedicoId(id, idMedico);
    return resolvedId ? medicosLookup[resolvedId] || `Médico ${resolvedId}` : 'Sem médico';
  };

  const periodOrders = useMemo(() => baseOrders.filter((item) => withinPeriodo(item.dataPedido, periodoSelecionado)), [baseOrders, periodoSelecionado]);

  const baseResultados = useMemo(() => {
    if (medicoSelecionado === null) return resultados;
    return resultados.filter((item) => resolveMedicoId(item.id, item.idMedico) === medicoSelecionado);
  }, [resultados, medicoSelecionado, ordersLookup]);

  const periodResultados = useMemo(() => baseResultados.filter((item) => withinPeriodo(item.dataPedido, periodoSelecionado)), [baseResultados, periodoSelecionado]);

  const basePerdas = useMemo(() => {
    if (medicoSelecionado === null) return perdas;
    return perdas.filter((item) => resolveMedicoId(item.id, item.idMedico) === medicoSelecionado);
  }, [perdas, medicoSelecionado, ordersLookup]);

  const periodPerdas = useMemo(() => basePerdas.filter((item) => withinPeriodo(item.dataPedido, periodoSelecionado)), [basePerdas, periodoSelecionado]);

  const kpis = useMemo(() => {
    const totalOrders = baseOrders.length;
    const totalOrdersPeriodo = periodOrders.length;
    const totalOrcamentoEnviado = baseOrders.filter((item) => item.statusOrcamento === 'Orçamento Enviado').length;
    const totalOrcamentoEnviadoPeriodo = periodOrders.filter((item) => item.statusOrcamento === 'Orçamento Enviado').length;
    const totalPerdas = basePerdas.length;
    const totalPerdasPeriodo = periodPerdas.length;

    const clientesAtivosTotal = new Set(baseOrders.filter((i) => i.statusProcesso !== 'Perda' && i.statusProcesso !== 'Ganho').map((i) => i.idMedico).filter(Boolean)).size;
    const clientesAtivosPeriodo = new Set(periodOrders.filter((i) => i.statusProcesso !== 'Perda' && i.statusProcesso !== 'Ganho').map((i) => i.idMedico).filter(Boolean)).size;

    const emAbertoTotal = baseOrders.filter((i) => i.statusProcesso !== 'Perda' && i.statusProcesso !== 'Ganho' && toNumber(i.valorOrcamento) > 0);
    const emAbertoPeriodo = periodOrders.filter((i) => i.statusProcesso !== 'Perda' && i.statusProcesso !== 'Ganho' && toNumber(i.valorOrcamento) > 0);

    const ganhosTotal = baseResultados.filter((i) => i.statusProcesso === 'Ganho');
    const ganhosPeriodo = periodResultados.filter((i) => i.statusProcesso === 'Ganho');

    const valorEmAbertoTotal = emAbertoTotal.reduce((acc, i) => acc + toNumber(i.valorOrcamento), 0);
    const valorEmAbertoPeriodo = emAbertoPeriodo.reduce((acc, i) => acc + toNumber(i.valorOrcamento), 0);
    const valorGanhoTotal = ganhosTotal.reduce((acc, i) => acc + toNumber(i.valorGanho), 0);
    const valorGanhoPeriodo = ganhosPeriodo.reduce((acc, i) => acc + toNumber(i.valorGanho), 0);
    const valorPerdaTotal = basePerdas.reduce((acc, i) => acc + (toNumber(i.valorOrcamento) || toNumber(i.refPreco)), 0);
    const valorPerdaPeriodo = periodPerdas.reduce((acc, i) => acc + (toNumber(i.valorOrcamento) || toNumber(i.refPreco)), 0);

    const cvtBase = valorGanhoTotal + valorPerdaTotal;
    const cvpBase = valorGanhoPeriodo + valorPerdaPeriodo;
    const conversaoValorTotal = cvtBase > 0 ? (valorGanhoTotal / cvtBase) * 100 : 0;
    const conversaoValorPeriodo = cvpBase > 0 ? (valorGanhoPeriodo / cvpBase) * 100 : 0;

    const qtdeEmAbertoTotal = emAbertoTotal.length;
    const qtdeEmAbertoPeriodo = emAbertoPeriodo.length;
    const qtdeGanhoTotal = ganhosTotal.length;
    const qtdeGanhoPeriodo = ganhosPeriodo.length;
    const qtdePerdaTotal = basePerdas.length;
    const qtdePerdaPeriodo = periodPerdas.length;

    const cqtBase = qtdeGanhoTotal + qtdePerdaTotal;
    const cqpBase = qtdeGanhoPeriodo + qtdePerdaPeriodo;
    const conversaoQtdeTotal = cqtBase > 0 ? (qtdeGanhoTotal / cqtBase) * 100 : 0;
    const conversaoQtdePeriodo = cqpBase > 0 ? (qtdeGanhoPeriodo / cqpBase) * 100 : 0;

    return {
      quantidadeProcessos: { periodo: totalOrdersPeriodo, total: totalOrders },
      quantidadeOrcamentoEnviado: { periodo: totalOrcamentoEnviadoPeriodo, total: totalOrcamentoEnviado },
      quantidadePerdas: { periodo: totalPerdasPeriodo, total: totalPerdas },
      quantidadeClientesAtivos: { periodo: clientesAtivosPeriodo, total: clientesAtivosTotal },
      valorEmAberto: { periodo: valorEmAbertoPeriodo, total: valorEmAbertoTotal },
      valorGanho: { periodo: valorGanhoPeriodo, total: valorGanhoTotal },
      valorPerda: { periodo: valorPerdaPeriodo, total: valorPerdaTotal },
      conversaoValor: { periodo: conversaoValorPeriodo, total: conversaoValorTotal },
      qtdeEmAberto: { periodo: qtdeEmAbertoPeriodo, total: qtdeEmAbertoTotal },
      qtdeGanho: { periodo: qtdeGanhoPeriodo, total: qtdeGanhoTotal },
      qtdePerda: { periodo: qtdePerdaPeriodo, total: qtdePerdaTotal },
      conversaoQtde: { periodo: conversaoQtdePeriodo, total: conversaoQtdeTotal },
    };
  }, [baseOrders, periodOrders, baseResultados, periodResultados, basePerdas, periodPerdas]);

  const charts = useMemo(() => {
    const statusPedidoMap = periodOrders.reduce<Record<string, number>>((acc, item) => {
      const chave = item.statusProcesso || 'Sem status';
      acc[chave] = (acc[chave] ?? 0) + 1;
      return acc;
    }, {});

    const medicoQtdMap = periodOrders.reduce<Record<string, number>>((acc, item) => {
      const nome = resolveMedicoNome(item.id, item.idMedico);
      acc[nome] = (acc[nome] ?? 0) + 1;
      return acc;
    }, {});

    const medicoOrcamentoMap = periodOrders.reduce<Record<string, number>>((acc, item) => {
      if (item.statusOrcamento !== 'Orçamento Enviado') return acc;
      const nome = resolveMedicoNome(item.id, item.idMedico);
      acc[nome] = (acc[nome] ?? 0) + toNumber(item.valorOrcamento);
      return acc;
    }, {});

    const pedidosPorDiaMap = periodOrders.reduce<Record<string, number>>((acc, item) => {
      const data = parseApiDate(item.dataPedido);
      if (!data) return acc;
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      acc[chave] = (acc[chave] ?? 0) + 1;
      return acc;
    }, {});

    const statusPerdaMap = periodPerdas.reduce<Record<string, number>>((acc, item) => {
      const chave = item.statusPerda || 'Sem status de perda';
      acc[chave] = (acc[chave] ?? 0) + 1;
      return acc;
    }, {});

    const medicoResultadoMap = baseResultados.reduce<Record<string, { ganho: number; perda: number }>>((acc, item) => {
      if (item.statusProcesso !== 'Ganho' && item.statusProcesso !== 'Perda') return acc;
      const nome = resolveMedicoNome(item.id, item.idMedico);
      const atual = acc[nome] ?? { ganho: 0, perda: 0 };
      if (item.statusProcesso === 'Ganho') atual.ganho += 1;
      if (item.statusProcesso === 'Perda') atual.perda += 1;
      acc[nome] = atual;
      return acc;
    }, {});

    const pedidosPorDiaEntries = Object.entries(pedidosPorDiaMap).sort((a, b) => a[0].localeCompare(b[0]));

    const medicoResultadoEntries = Object.entries(medicoResultadoMap)
      .filter(([, item]) => item.ganho > 0 || item.perda > 0)
      .map(([nome, item]) => {
        const total = item.ganho + item.perda;
        const percentualGanho = total > 0 ? Number(((item.ganho / total) * 100).toFixed(1)) : 0;
        const percentualPerda = total > 0 ? Number((100 - percentualGanho).toFixed(1)) : 0;
        return { nome, ganho: item.ganho, perda: item.perda, percentualGanho, percentualPerda };
      })
      .sort((a, b) => (b.ganho + b.perda) - (a.ganho + a.perda));

    /* ===== Médicos x qtde — TOP 6 ordenado, formato lista ===== */
    const medicoQtdList = Object.entries(medicoQtdMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nome, value]) => ({ nome, value }));
    const medicoQtdMax = Math.max(1, ...medicoQtdList.map((i) => i.value));

    /* ===== Médicos x valor orçamento — TOP 6 ordenado, formato lista ===== */
    const medicoOrcamentoList = Object.entries(medicoOrcamentoMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nome, value]) => ({ nome, value }));
    const medicoOrcamentoMax = Math.max(1, ...medicoOrcamentoList.map((i) => i.value));

    /* ===== Status perda donut: total + percentuais ===== */
    const statusPerdaLabels = Object.keys(statusPerdaMap);
    const statusPerdaValues = Object.values(statusPerdaMap);
    const statusPerdaTotal = statusPerdaValues.reduce((a, b) => a + b, 0);
    const statusPerdaItems = statusPerdaLabels.map((label, idx) => ({
      label,
      value: statusPerdaValues[idx],
      pct: statusPerdaTotal > 0 ? (statusPerdaValues[idx] / statusPerdaTotal) * 100 : 0,
      color: MC_CATEGORICAL[idx % MC_CATEGORICAL.length],
    }));

    return {
      /* Status pedido — barras VERTICAIS coloridas (cada barra cor diferente) */
      statusPedido: {
        labels: Object.keys(statusPedidoMap),
        datasets: [{
          label: 'Quantidade',
          data: Object.values(statusPedidoMap),
          backgroundColor: Object.keys(statusPedidoMap).map((_, i) => MC_CATEGORICAL[i % MC_CATEGORICAL.length]),
          borderRadius: 8,
          maxBarThickness: 56,
        }]
      },
      /* Médicos qtde — formato LISTA */
      medicoQtdList, medicoQtdMax,
      /* Médicos valor — formato LISTA */
      medicoOrcamentoList, medicoOrcamentoMax,
      /* Pedidos por dia — barras verdes verticais */
      pedidosDia: {
        labels: pedidosPorDiaEntries.map(([label]) => {
          const [, mes, dia] = label.split('-');
          return `${dia}/${mes}`;
        }),
        datasets: [{
          label: 'Pedidos',
          data: pedidosPorDiaEntries.map(([, value]) => value),
          backgroundColor: MC.green,
          borderRadius: 6,
          maxBarThickness: 32,
        }]
      },
      /* Status perda — barras VERTICAIS rosa (todas mesma cor) */
      statusPerda: {
        labels: Object.keys(statusPerdaMap),
        datasets: [{
          label: 'Quantidade',
          data: Object.values(statusPerdaMap),
          backgroundColor: MC.rose,
          borderRadius: 8,
          maxBarThickness: 60,
        }]
      },
      /* Donut perda */
      statusPerdaDonut: {
        labels: statusPerdaLabels,
        datasets: [{
          data: statusPerdaValues,
          backgroundColor: statusPerdaItems.map((i) => i.color),
          borderColor: '#fff',
          borderWidth: 3,
        }]
      },
      statusPerdaItems,
      statusPerdaTotal,
      medicoPerdaGanho: medicoResultadoEntries
    };
  }, [periodOrders, periodPerdas, baseResultados, medicosLookup, ordersLookup]);

  const cards = [
    { titulo: 'Qtde processos', valor: kpis.quantidadeProcessos.periodo, total: kpis.quantidadeProcessos.total, icone: 'pi pi-briefcase' },
    { titulo: 'Qtde orçamento enviado', valor: kpis.quantidadeOrcamentoEnviado.periodo, total: kpis.quantidadeOrcamentoEnviado.total, icone: 'pi pi-send' },
    { titulo: 'Qtde perdas', valor: kpis.quantidadePerdas.periodo, total: kpis.quantidadePerdas.total, icone: 'pi pi-times-circle' },
    { titulo: 'Qtde de clientes ativos', valor: kpis.quantidadeClientesAtivos.periodo, total: kpis.quantidadeClientesAtivos.total, icone: 'pi pi-users' },
    { titulo: 'Valor em aberto', valor: formatCurrency(kpis.valorEmAberto.periodo), total: formatCurrency(kpis.valorEmAberto.total), icone: 'pi pi-wallet' },
    { titulo: 'Valor ganho', valor: formatCurrency(kpis.valorGanho.periodo), total: formatCurrency(kpis.valorGanho.total), icone: 'pi pi-check-circle', classeValor: 'kpi-value-success' },
    { titulo: 'Valor perda', valor: formatCurrency(kpis.valorPerda.periodo), total: formatCurrency(kpis.valorPerda.total), icone: 'pi pi-ban', classeValor: 'kpi-value-danger' },
    { titulo: 'Conversão valor', valor: formatPercent(kpis.conversaoValor.periodo), total: formatPercent(kpis.conversaoValor.total), icone: 'pi pi-percentage' },
    { titulo: 'Qtde em aberto', valor: kpis.qtdeEmAberto.periodo, total: kpis.qtdeEmAberto.total, icone: 'pi pi-inbox' },
    { titulo: 'Qtde ganho', valor: kpis.qtdeGanho.periodo, total: kpis.qtdeGanho.total, icone: 'pi pi-arrow-up-right', classeValor: 'kpi-value-success' },
    { titulo: 'Qtde perda', valor: kpis.qtdePerda.periodo, total: kpis.qtdePerda.total, icone: 'pi pi-arrow-down-right', classeValor: 'kpi-value-danger' },
    { titulo: 'Conversão qtde', valor: formatPercent(kpis.conversaoQtde.periodo), total: formatPercent(kpis.conversaoQtde.total), icone: 'pi pi-chart-line' },
  ];

  const verticalBarOptions = useMemo(() => createVerticalBarOptions(), []);
  const columnOptions = useMemo(() => createColumnOptions(), []);
  const doughnutOptions = useMemo(() => createDoughnutOptions(), []);

  return (
    <div className="dashboard-page">
      <div className="page-header dashboard-header">
        <div className="dashboard-header__title">
          <h1>Dashboard</h1>
          <p>Visão geral da companhia para gestão e diretoria.</p>
        </div>

        <div className="dashboard-medico-filter">
          <label>Médico</label>
          <Dropdown
            value={medicoSelecionado}
            options={medicosOptions}
            onChange={(e) => setMedicoSelecionado(e.value)}
            placeholder="Selecione um médico"
            className="dashboard-medico-dropdown"
          />
        </div>

        <div className="dashboard-date-filter">
          <label>Período</label>
          <div className="dashboard-date-filter__control">
            <DatePickerPeriodo value={periodoSelecionado} onChange={setPeriodoSelecionado} />
          </div>
        </div>
      </div>

      <div className="dashboard-kpi-grid">
        {cards.map((card) => (
          <div className="kpi-card" key={card.titulo}>
            <div className="kpi-header"><span>{card.titulo}</span><i className={card.icone}></i></div>
            <div className={`kpi-value ${card.classeValor ?? ''}`}>{card.valor}</div>
            <div className="dashboard-kpi-subvalue">Total: <strong>{card.total}</strong></div>
          </div>
        ))}
      </div>

      <div className="dashboard-section-title">Análises operacionais</div>
      <div className="dashboard-section-subtitle">Status, distribuição por médico e ticket médio do período.</div>
      <div className="dashboard-chart-grid dashboard-chart-grid--3">
        <div className="card chart-card">
          <div className="chart-title">Status pedido × quantidade</div>
          <div className="chart-subtitle">Volume por etapa do processo.</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={charts.statusPedido} options={verticalBarOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Médicos × qtde pedidos</div>
          <div className="chart-subtitle">Top {charts.medicoQtdList.length} médicos do período.</div>
          <div className="medico-list">
            {charts.medicoQtdList.length === 0 ? (
              <div className="dashboard-empty-state">Nenhum dado para o período.</div>
            ) : charts.medicoQtdList.map((item) => (
              <div className="medico-list__row" key={item.nome}>
                <div className="medico-list__name" title={item.nome}>{item.nome}</div>
                <div className="medico-list__bar">
                  <div
                    className="medico-list__bar-fill medico-list__bar-fill--navy"
                    style={{ width: `${(item.value / charts.medicoQtdMax) * 100}%` }}
                  />
                </div>
                <div className="medico-list__value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Médicos × valor orçamento enviado</div>
          <div className="chart-subtitle">Volume financeiro por médico.</div>
          <div className="medico-list">
            {charts.medicoOrcamentoList.length === 0 ? (
              <div className="dashboard-empty-state">Nenhum dado para o período.</div>
            ) : charts.medicoOrcamentoList.map((item) => (
              <div className="medico-list__row" key={item.nome}>
                <div className="medico-list__name" title={item.nome}>{item.nome}</div>
                <div className="medico-list__bar">
                  <div
                    className="medico-list__bar-fill medico-list__bar-fill--green"
                    style={{ width: `${(item.value / charts.medicoOrcamentoMax) * 100}%` }}
                  />
                </div>
                <div className="medico-list__value medico-list__value--money">{formatCurrencyShort(item.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-section-title">Evolução diária</div>
      <div className="dashboard-section-subtitle">Volume de pedidos por dia.</div>
      <div className="dashboard-chart-grid">
        <div className="card chart-card chart-card-full">
          <div className="chart-title">Dia × qtde de pedidos</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={charts.pedidosDia} options={columnOptions} />
          </div>
        </div>
      </div>

      <div className="dashboard-section-title">Análise de perdas</div>
      <div className="dashboard-section-subtitle">Status da perda e composição percentual.</div>
      <div className="dashboard-chart-grid">
        <div className="card chart-card">
          <div className="chart-title">Status de perda × quantidade</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={charts.statusPerda} options={verticalBarOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-title">% de perda × status</div>
          <div className="chart-subtitle">Distribuição percentual.</div>
          <div className="donut-block">
            <div className="donut-block__chart">
              <Chart type="doughnut" data={charts.statusPerdaDonut} options={doughnutOptions} />
              <div className="donut-block__center">
                <div className="donut-block__center-value">{charts.statusPerdaTotal}</div>
                <div className="donut-block__center-label">perdas totais</div>
              </div>
            </div>
            <div className="donut-block__legend">
              {charts.statusPerdaItems.map((item) => (
                <div className="donut-block__row" key={item.label}>
                  <span className="donut-block__dot" style={{ background: item.color }} />
                  <span className="donut-block__label" title={item.label}>{item.label}</span>
                  <span className="donut-block__pct">{Math.round(item.pct)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section-title">Performance por médico</div>
      <div className="dashboard-section-subtitle">Comparativo ganho × perda por profissional.</div>
      <div className="dashboard-chart-grid">
        <div className="card chart-card chart-card-full">
          <div className="chart-title">Médico × perda × ganho</div>
          <div className="dashboard-medico-performance">
            {charts.medicoPerdaGanho.length === 0 ? (
              <div className="dashboard-empty-state">Nenhum resultado disponível para o período selecionado.</div>
            ) : (
              <>
                <div className="dashboard-medico-performance__header-row">
                  <div className="dashboard-medico-performance__header-cell dashboard-medico-performance__header-cell--right">qt.</div>
                  <div className="dashboard-medico-performance__header-cell dashboard-medico-performance__header-cell--right" style={{ color: 'var(--mc-green-600)' }}>ganho</div>
                  <div className="dashboard-medico-performance__header-cell">médico</div>
                  <div className="dashboard-medico-performance__header-cell" style={{ color: 'var(--mc-rose)' }}>perda</div>
                  <div className="dashboard-medico-performance__header-cell">qt.</div>
                </div>

                {charts.medicoPerdaGanho.map((item) => (
                  <div key={item.nome} className="dashboard-medico-performance__row">
                    <div className="dashboard-medico-performance__count dashboard-medico-performance__count--right">{item.ganho}</div>

                    <div className="dashboard-medico-performance__mini-bar dashboard-medico-performance__mini-bar--ganho">
                      <div
                        className="dashboard-medico-performance__mini-fill dashboard-medico-performance__mini-fill--ganho"
                        style={{ width: `${item.percentualGanho}%` }}
                      >
                        {formatPercent(item.percentualGanho)}
                      </div>
                    </div>

                    <div className="dashboard-medico-performance__doctor">
                      <strong>{item.nome}</strong>
                    </div>

                    <div className="dashboard-medico-performance__mini-bar dashboard-medico-performance__mini-bar--perda">
                      <div
                        className="dashboard-medico-performance__mini-fill dashboard-medico-performance__mini-fill--perda"
                        style={{ width: `${item.percentualPerda}%` }}
                      >
                        {formatPercent(item.percentualPerda)}
                      </div>
                    </div>

                    <div className="dashboard-medico-performance__count">{item.perda}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
