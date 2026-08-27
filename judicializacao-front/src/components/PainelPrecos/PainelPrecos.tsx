import { useEffect, useState } from 'react';
import { Chart } from 'primereact/chart';
import { getPrecosProcedimento } from '../../services/api/orders';
import './PainelPrecos.css';

/**
 * Painel de preços do procedimento (task #207, 27/08/2026 — mandato @R na tela Jurídico).
 *
 * POR QUE: ao analisar um pedido, o jurídico precisa saber quanto o Estado vem pagando por
 * AQUELA cirurgia — não a média solta, mas a distribuição, os últimos pagamentos com data e
 * ONDE aconteceram. Abre dentro da própria linha da tabela: a decisão acontece ali, não em
 * outra tela.
 *
 * Carrega SÓ quando a linha é expandida (a consulta leva ~5s na 1ª vez; o backend cacheia 6h).
 * A escala do gráfico usa a MEDIANA como linha-guia, não a média: em quadril a média é
 * R$ 54 mil contra mediana de R$ 38 mil porque um pagamento de R$ 121 mil puxa tudo.
 */

interface Pagamento {
  data: string;
  valor: number;
  comarca: string | null;
  distancia_km: number | null;
  num_empenho: string | null;
}

interface Precos {
  estatistica: {
    n: number;
    moda: number | null;
    moda_frequencia: number;
    media: number | null;
    mediana: number | null;
    minimo: number | null;
    maximo: number | null;
  };
  serie: Pagamento[];
  pagamentos: Pagamento[];
  janela_dias: number | null;
  janela_ampliada: boolean;
  total_na_fonte: number;
  base_distancia: string;
  sem_comarca: number;
  erro: string | null;
}

const moeda = (v: number | null) =>
  v === null || v === undefined
    ? '—'
    : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const dataCurta = (iso: string) => {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano.slice(2)}`;
};

/** Frase honesta sobre QUAL período está na tela — número sem janela engana. */
function textoJanela(p: Precos): string {
  if (p.janela_dias === null) {
    return `sem pagamentos no último ano — mostrando todo o histórico (${p.estatistica.n} desde o registro mais antigo)`;
  }
  if (p.janela_ampliada) {
    return `poucos pagamentos em 90 dias — ampliado para 12 meses (${p.estatistica.n} pagamentos)`;
  }
  return `últimos 90 dias · ${p.estatistica.n} pagamentos de ${p.total_na_fonte} no histórico`;
}

export function PainelPrecos({ orderId, procedimento, nossoPreco }: {
  orderId: number;
  procedimento: string;
  nossoPreco?: number | null;
}) {
  const [dados, setDados] = useState<Precos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setFalhou(false);
    getPrecosProcedimento(orderId)
      .then(({ data }) => { if (vivo) setDados(data); })
      .catch(() => { if (vivo) setFalhou(true); })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [orderId]);

  if (carregando) {
    return (
      <div className="painel-precos painel-precos--aviso">
        <i className="pi pi-spin pi-spinner" />
        <span>Consultando os pagamentos públicos deste procedimento… (a primeira consulta leva alguns segundos)</span>
      </div>
    );
  }

  if (falhou || !dados) {
    return (
      <div className="painel-precos painel-precos--aviso">
        <i className="pi pi-exclamation-triangle" />
        <span>Não foi possível consultar os preços agora. A análise do pedido segue normalmente.</span>
      </div>
    );
  }

  if (dados.erro || dados.estatistica.n === 0) {
    return (
      <div className="painel-precos painel-precos--aviso">
        <i className="pi pi-info-circle" />
        <span>Sem pagamentos públicos registrados para <strong>{procedimento}</strong>. {dados.erro ? `(${dados.erro})` : ''}</span>
      </div>
    );
  }

  const e = dados.estatistica;
  const mediana = e.mediana ?? 0;

  // Outlier: mais que o dobro da mediana. Marcado em cinza para não sequestrar a escala —
  // sem isso, um pagamento de R$ 121 mil achata visualmente todos os de R$ 30-40 mil.
  const ehOutlier = (v: number) => v > mediana * 2;

  const dadosGrafico = {
    labels: dados.serie.map((p) => dataCurta(p.data)),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Pagamento do Estado',
        data: dados.serie.map((p) => p.valor),
        backgroundColor: dados.serie.map((p) => (ehOutlier(p.valor) ? '#cbd5e1' : '#3b82f6')),
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'line' as const,
        label: `Mediana (${moeda(mediana)})`,
        data: dados.serie.map(() => mediana),
        borderColor: '#f59e0b',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        order: 1,
      },
      ...(nossoPreco
        ? [{
            type: 'line' as const,
            label: `Nosso orçamento (${moeda(nossoPreco)})`,
            data: dados.serie.map(() => nossoPreco),
            borderColor: '#16a34a',
            borderWidth: 2,
            pointRadius: 0,
            order: 0,
          }]
        : []),
    ],
  };

  const opcoesGrafico = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          afterLabel: (ctx: any) => {
            const p = dados.serie[ctx.dataIndex];
            if (!p) return '';
            const onde = p.comarca ?? 'comarca não informada';
            const km = p.distancia_km !== null ? ` · ${p.distancia_km} km daqui` : '';
            return `${onde}${km}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: (v: any) => moeda(Number(v)), font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: { ticks: { font: { size: 10 } }, grid: { display: false } },
    },
  };

  const numeros = [
    { rotulo: 'Moda', valor: e.moda, nota: e.moda ? `${e.moda_frequencia}× repetido` : 'nenhum valor se repete' },
    { rotulo: 'Média', valor: e.media, nota: 'puxada por valores extremos' },
    { rotulo: 'Mediana', valor: e.mediana, nota: 'o valor do meio', destaque: true },
    { rotulo: 'Mínimo', valor: e.minimo, nota: 'menor pago' },
    { rotulo: 'Máximo', valor: e.maximo, nota: 'maior pago' },
  ];

  return (
    <div className="painel-precos">
      <div className="painel-precos__cabecalho">
        <h3><i className="pi pi-chart-bar" /> Quanto o Estado pagou por “{procedimento}”</h3>
        <span className="painel-precos__janela">{textoJanela(dados)}</span>
      </div>

      <div className="painel-precos__corpo">
        <div className="painel-precos__grafico">
          <Chart type="bar" data={dadosGrafico} options={opcoesGrafico} style={{ height: '260px' }} />
        </div>

        <div className="painel-precos__lateral">
          <div className="painel-precos__numeros">
            {numeros.map((n) => (
              <div key={n.rotulo} className={`ppc-numero${n.destaque ? ' ppc-numero--destaque' : ''}`}>
                <span className="ppc-numero__rotulo">{n.rotulo}</span>
                <span className="ppc-numero__valor">{moeda(n.valor)}</span>
                <span className="ppc-numero__nota">{n.nota}</span>
              </div>
            ))}
          </div>

          <table className="painel-precos__tabela">
            <caption>Últimos pagamentos {dados.sem_comarca > 0 && `· ${dados.sem_comarca} sem comarca informada`}</caption>
            <thead>
              <tr><th>Data</th><th>Comarca</th><th>Distância</th><th>Valor</th></tr>
            </thead>
            <tbody>
              {dados.pagamentos.map((p, i) => (
                <tr key={`${p.data}-${p.num_empenho ?? i}`}>
                  <td>{dataCurta(p.data)}</td>
                  <td>{p.comarca ?? <span className="ppc-vazio">não informada</span>}</td>
                  <td className="ppc-num">
                    {p.distancia_km !== null ? `${p.distancia_km} km` : <span className="ppc-vazio">—</span>}
                  </td>
                  <td className="ppc-num">{moeda(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="painel-precos__rodape">
            Distâncias em linha reta a partir de <strong>{dados.base_distancia}</strong>. Fonte: empenhos públicos do Estado.
          </p>
        </div>
      </div>
    </div>
  );
}
