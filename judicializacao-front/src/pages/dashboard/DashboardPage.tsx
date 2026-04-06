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
    const iso = `${first.toString().padStart(4, '0')}-${second.toString().padStart(2, '0')}-${third
      .toString()
      .padStart(2, '0')}${hasTime}`;
    const result = new Date(iso);
    return Number.isNaN(result.getTime()) ? null : result;
  }

  const br = `${third.toString().padStart(4, '0')}-${second.toString().padStart(2, '0')}-${first
    .toString()
    .padStart(2, '0')}${hasTime}`;
  const result = new Date(br);
  return Number.isNaN(result.getTime()) ? null : result;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

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
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
}

function createBarOptions(indexAxis: 'x' | 'y' = 'y') {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis,
    plugins: {
      legend: {
        labels: {
          color: '#64748b'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#64748b'
        },
        grid: {
          color: '#e5e7eb'
        }
      },
      y: {
        ticks: {
          color: '#64748b'
        },
        grid: {
          color: '#e5e7eb'
        }
      }
    }
  };
}

function createPieOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#64748b'
        }
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

  const resolveMedicoId = (id: number, idMedico?: number | null) => {
    return idMedico ?? ordersLookup[id]?.idMedico ?? null;
  };

  const resolveMedicoNome = (id: number, idMedico?: number | null) => {
    const resolvedId = resolveMedicoId(id, idMedico);
    return resolvedId ? medicosLookup[resolvedId] || `Médico ${resolvedId}` : 'Sem médico';
  };

  const periodOrders = useMemo(() => {
    return baseOrders.filter((item) => withinPeriodo(item.dataPedido, periodoSelecionado));
  }, [baseOrders, periodoSelecionado]);

  const baseResultados = useMemo(() => {
    if (medicoSelecionado === null) return resultados;
    return resultados.filter((item) => resolveMedicoId(item.id, item.idMedico) === medicoSelecionado);
  }, [resultados, medicoSelecionado, ordersLookup]);

  const periodResultados = useMemo(() => {
    return baseResultados.filter((item) => withinPeriodo(item.dataPedido, periodoSelecionado));
  }, [baseResultados, periodoSelecionado]);

  const basePerdas = useMemo(() => {
    if (medicoSelecionado === null) return perdas;
    return perdas.filter((item) => resolveMedicoId(item.id, item.idMedico) === medicoSelecionado);
  }, [perdas, medicoSelecionado, ordersLookup]);

  const periodPerdas = useMemo(() => {
    return basePerdas.filter((item) => withinPeriodo(item.dataPedido, periodoSelecionado));
  }, [basePerdas, periodoSelecionado]);

  const kpis = useMemo(() => {
    const totalOrders = baseOrders.length;
    const totalOrdersPeriodo = periodOrders.length;

    const totalOrcamentoEnviado = baseOrders.filter((item) => item.statusOrcamento === 'Orçamento Enviado').length;
    const totalOrcamentoEnviadoPeriodo = periodOrders.filter((item) => item.statusOrcamento === 'Orçamento Enviado').length;

    const totalPerdas = basePerdas.length;
    const totalPerdasPeriodo = periodPerdas.length;

    const clientesAtivosTotal = new Set(
      baseOrders
        .filter((item) => item.statusProcesso !== 'Perda' && item.statusProcesso !== 'Ganho')
        .map((item) => item.idMedico)
        .filter(Boolean)
    ).size;
    const clientesAtivosPeriodo = new Set(
      periodOrders
        .filter((item) => item.statusProcesso !== 'Perda' && item.statusProcesso !== 'Ganho')
        .map((item) => item.idMedico)
        .filter(Boolean)
    ).size;

    const emAbertoTotal = baseOrders.filter(
      (item) => item.statusProcesso !== 'Perda' && item.statusProcesso !== 'Ganho' && toNumber(item.valorOrcamento) > 0
    );
    const emAbertoPeriodo = periodOrders.filter(
      (item) => item.statusProcesso !== 'Perda' && item.statusProcesso !== 'Ganho' && toNumber(item.valorOrcamento) > 0
    );

    const ganhosTotal = baseResultados.filter((item) => item.statusProcesso === 'Ganho');
    const ganhosPeriodo = periodResultados.filter((item) => item.statusProcesso === 'Ganho');
    const perdasTotal = basePerdas;
    const perdasPeriodo = periodPerdas;

    const valorEmAbertoTotal = emAbertoTotal.reduce((acc, item) => acc + toNumber(item.valorOrcamento), 0);
    const valorEmAbertoPeriodo = emAbertoPeriodo.reduce((acc, item) => acc + toNumber(item.valorOrcamento), 0);
    const valorGanhoTotal = ganhosTotal.reduce((acc, item) => acc + toNumber(item.valorGanho), 0);
    const valorGanhoPeriodo = ganhosPeriodo.reduce((acc, item) => acc + toNumber(item.valorGanho), 0);
    const valorPerdaTotal = perdasTotal.reduce((acc, item) => acc + (toNumber(item.valorOrcamento) || toNumber(item.refPreco)), 0);
    const valorPerdaPeriodo = perdasPeriodo.reduce(
      (acc, item) => acc + (toNumber(item.valorOrcamento) || toNumber(item.refPreco)),
      0
    );

    const conversaoValorTotalBase = valorGanhoTotal + valorPerdaTotal;
    const conversaoValorPeriodoBase = valorGanhoPeriodo + valorPerdaPeriodo;
    const conversaoValorTotal = conversaoValorTotalBase > 0 ? (valorGanhoTotal / conversaoValorTotalBase) * 100 : 0;
    const conversaoValorPeriodo = conversaoValorPeriodoBase > 0 ? (valorGanhoPeriodo / conversaoValorPeriodoBase) * 100 : 0;

    const qtdeEmAbertoTotal = emAbertoTotal.length;
    const qtdeEmAbertoPeriodo = emAbertoPeriodo.length;
    const qtdeGanhoTotal = ganhosTotal.length;
    const qtdeGanhoPeriodo = ganhosPeriodo.length;
    const qtdePerdaTotal = perdasTotal.length;
    const qtdePerdaPeriodo = perdasPeriodo.length;

    const conversaoQtdeTotalBase = qtdeGanhoTotal + qtdePerdaTotal;
    const conversaoQtdePeriodoBase = qtdeGanhoPeriodo + qtdePerdaPeriodo;
    const conversaoQtdeTotal = conversaoQtdeTotalBase > 0 ? (qtdeGanhoTotal / conversaoQtdeTotalBase) * 100 : 0;
    const conversaoQtdePeriodo = conversaoQtdePeriodoBase > 0 ? (qtdeGanhoPeriodo / conversaoQtdePeriodoBase) * 100 : 0;

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
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(
        data.getDate()
      ).padStart(2, '0')}`;
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

        return {
          nome,
          ganho: item.ganho,
          perda: item.perda,
          percentualGanho,
          percentualPerda,
        };
      })
      .sort((a, b) => (b.ganho + b.perda) - (a.ganho + a.perda));

    return {
      statusPedido: {
        labels: Object.keys(statusPedidoMap),
        datasets: [{ label: 'Quantidade', data: Object.values(statusPedidoMap), backgroundColor: '#3b82f6', borderRadius: 8 }]
      },
      medicoQtd: {
        labels: Object.keys(medicoQtdMap),
        datasets: [{ label: 'Pedidos', data: Object.values(medicoQtdMap), backgroundColor: '#f97316', borderRadius: 8 }]
      },
      medicoValorOrcamento: {
        labels: Object.keys(medicoOrcamentoMap),
        datasets: [{ label: 'Valor Orçamento Enviado', data: Object.values(medicoOrcamentoMap), backgroundColor: '#10b981', borderRadius: 8 }]
      },
      pedidosDia: {
        labels: pedidosPorDiaEntries.map(([label]) => {
          const [ano, mes, dia] = label.split('-');
          return `${dia}/${mes}/${ano}`;
        }),
        datasets: [{ label: 'Pedidos', data: pedidosPorDiaEntries.map(([, value]) => value), backgroundColor: '#6366f1', borderRadius: 8 }]
      },
      statusPerda: {
        labels: Object.keys(statusPerdaMap),
        datasets: [{ label: 'Quantidade', data: Object.values(statusPerdaMap), backgroundColor: '#ef4444', borderRadius: 8 }]
      },
      statusPerdaPizza: {
        labels: Object.keys(statusPerdaMap),
        datasets: [{
          data: Object.values(statusPerdaMap),
          backgroundColor: ['#ef4444', '#f97316', '#8b5cf6', '#64748b', '#0ea5e9'],
          hoverBackgroundColor: ['#dc2626', '#ea580c', '#7c3aed', '#475569', '#0284c7']
        }]
      },
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

  const barOptions = useMemo(() => createBarOptions('y'), []);
  const columnOptions = useMemo(() => createBarOptions('x'), []);
  const pieOptions = useMemo(() => createPieOptions(), []);

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
      <div className="dashboard-chart-grid dashboard-chart-grid--3">
        <div className="card chart-card">
          <div className="chart-title">Status pedido x quantidade</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={charts.statusPedido} options={barOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Médicos x qtde pedidos</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={charts.medicoQtd} options={barOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Médicos x valor orçamento enviado</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={charts.medicoValorOrcamento} options={barOptions} />
          </div>
        </div>
      </div>

      <div className="dashboard-section-title">Evolução diária</div>
      <div className="dashboard-chart-grid">
        <div className="card chart-card chart-card-full">
          <div className="chart-title">Dia x qtde de pedidos</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={charts.pedidosDia} options={columnOptions} />
          </div>
        </div>
      </div>

      <div className="dashboard-section-title">Análise de perdas</div>
      <div className="dashboard-chart-grid">
        <div className="card chart-card">
          <div className="chart-title">Status de perda x quantidade de pedidos</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={charts.statusPerda} options={barOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-title">% de perda x status de perda</div>
          <div className="chart-wrapper">
            <Chart type="pie" data={charts.statusPerdaPizza} options={pieOptions} />
          </div>
        </div>
      </div>

      <div className="dashboard-section-title">Performance por médico</div>
      <div className="dashboard-chart-grid">
        <div className="card chart-card chart-card-full">
          <div className="chart-title">Médico x perda x ganho</div>
          <div className="dashboard-medico-performance">
            {charts.medicoPerdaGanho.length === 0 ? (
              <div className="dashboard-empty-state">Nenhum resultado disponível para o período selecionado.</div>
            ) : (
              <>
                <div className="dashboard-medico-performance__header-row">
                  <div></div>
                  <div className="dashboard-medico-performance__header-cell">ganho</div>
                  <div className="dashboard-medico-performance__header-cell">medico</div>
                  <div className="dashboard-medico-performance__header-cell">perda</div>
                  <div></div>
                </div>

                {charts.medicoPerdaGanho.map((item) => (
                  <div key={item.nome} className="dashboard-medico-performance__row">
                    <div className="dashboard-medico-performance__count">{item.ganho}</div>

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

                    <div className="dashboard-medico-performance__count dashboard-medico-performance__count--right">
                      {item.perda}
                    </div>
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
