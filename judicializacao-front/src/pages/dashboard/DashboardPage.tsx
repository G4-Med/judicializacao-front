import { useMemo, useState } from 'react';
import { Chart } from 'primereact/chart';
import { DatePickerPeriodo, type PeriodoSelecionado } from '../../components/DatePicker/DatePicker';
import './DashboardPage.css';

export function DashboardPage() {


  const kpis = {
    quantidadeProcessos: 248,
    quantidadeClientes: 37,
    processosAtivos: 182,
    processosBaixados: 66,
    mediaPedidos: 18,
    conversao: '62%',
    ganhos: 'R$ 842.500,00',
    perda: 'R$ 318.200,00',
    pedidosPerdidos: 29,
    ativosPraProtocolar: 18,
    ativosProtocolados: 121,
    ativosSegredoJustica: 43
  };

  const pedidosPorMedicoData = useMemo(() => {
    return {
      labels: ['Bruno Fajardo', 'Vitor Groppo', 'IBG', 'Clínica Prisma', 'Carlos Rocha'],
      datasets: [
        {
          label: 'Qtd. Pedidos',
          data: [38, 29, 41, 22, 17]
        }
      ]
    };
  }, []);

  const pedidosPorDiaData = useMemo(() => {
    return {
      labels: ['01/03', '02/03', '03/03', '04/03', '05/03', '06/03', '07/03'],
      datasets: [
        {
          label: 'Qtd. Pedidos por Dia',
          data: [8, 12, 7, 14, 10, 16, 9]
        }
      ]
    };
  }, []);

  const valorOrcamentoPorMedicoData = useMemo(() => {
    return {
      labels: ['Bruno Fajardo', 'Vitor Groppo', 'IBG', 'Clínica Prisma', 'Carlos Rocha'],
      datasets: [
        {
          label: 'Valor Orçamento Enviado',
          data: [185000, 142000, 221000, 98000, 76000]
        }
      ]
    };
  }, []);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
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
  }, []);

      const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoSelecionado>({
        tipo: 'atual',
        dataInicio: null,
        dataFim: null
      });



  return (
    <div className="dashboard-page">
      <div className="page-header dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão consolidada dos processos e indicadores</p>
        </div>

        <div className="dashboard-date-filter">
          <label>Período</label>
          <div className="dashboard-date-filter">
            <DatePickerPeriodo
              value={periodoSelecionado}
              onChange={setPeriodoSelecionado}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header"><span>Quantidade de Processos</span><i className="pi pi-briefcase"></i></div>
          <div className="kpi-value">{kpis.quantidadeProcessos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Quantidade de Clientes</span><i className="pi pi-users"></i></div>
          <div className="kpi-value">{kpis.quantidadeClientes}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Processos Ativos</span><i className="pi pi-check-circle"></i></div>
          <div className="kpi-value">{kpis.processosAtivos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Processos Baixados</span><i className="pi pi-times-circle"></i></div>
          <div className="kpi-value">{kpis.processosBaixados}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Média dos Pedidos</span><i className="pi pi-chart-line"></i></div>
          <div className="kpi-value">{kpis.mediaPedidos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Conversão</span><i className="pi pi-percentage"></i></div>
          <div className="kpi-value">{kpis.conversao}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Ganhos</span><i className="pi pi-arrow-up-right"></i></div>
          <div className="kpi-value kpi-value-success">{kpis.ganhos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Perda</span><i className="pi pi-arrow-down-right"></i></div>
          <div className="kpi-value kpi-value-danger">{kpis.perda}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Pedidos Perdidos</span><i className="pi pi-ban"></i></div>
          <div className="kpi-value">{kpis.pedidosPerdidos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Ativos Pra Protocolar</span><i className="pi pi-file"></i></div>
          <div className="kpi-value">{kpis.ativosPraProtocolar}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Ativos Protocolados</span><i className="pi pi-send"></i></div>
          <div className="kpi-value">{kpis.ativosProtocolados}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span>Ativos Segredo de Justiça</span><i className="pi pi-lock"></i></div>
          <div className="kpi-value">{kpis.ativosSegredoJustica}</div>
        </div>
      </div>

      <div className="dashboard-chart-grid">
        <div className="card chart-card">
          <div className="chart-title">Quantidade de Pedidos x Médicos</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={pedidosPorMedicoData} options={chartOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Quantidade de Pedidos x Dia</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={pedidosPorDiaData} options={chartOptions} />
          </div>
        </div>

        <div className="card chart-card chart-card-full">
          <div className="chart-title">Valor de Orçamento Enviado x Médicos</div>
          <div className="chart-wrapper">
            <Chart type="bar" data={valorOrcamentoPorMedicoData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}