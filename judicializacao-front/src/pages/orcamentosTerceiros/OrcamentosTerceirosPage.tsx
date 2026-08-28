import { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { getOrcamentosTerceiros } from '../../services/api/orders';
import { cabecalhoComHint } from '../../components/ColunasIdentificacao/colunasIdentificacao';
import { ContadorRegistros } from '../../components/ContadorRegistros/ContadorRegistros';
import './OrcamentosTerceirosPage.css';

/**
 * ORÇAMENTOS DE TERCEIROS (@R 28/08): o preço que OUTROS lugares cobraram pela mesma
 * cirurgia, extraído das peças de inteiro teor. Serve para cotar com margem em vez de
 * por instinto — as 44 "Perda pelo Orçamento" medidas em produção somam R$ 3,42 mi.
 *
 * A régua vem com N sempre à vista: mediana de uma amostra só não é preço de mercado,
 * é um caso. A tela mostra o aviso quando N < 3 em vez de deixar o número parecer régua.
 */

const brl = (v?: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function OrcamentosTerceirosPage() {
  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>({ n: 0, confirmados: 0 });
  const [loading, setLoading] = useState(false);

  const carregar = (procedimento?: string) => {
    setLoading(true);
    getOrcamentosTerceiros(procedimento ? { procedimento } : {})
      .then(({ data }) => { setItens(data.itens ?? []); setResumo(data.resumo ?? { n: 0 }); })
      .catch(() => { setItens([]); setResumo({ n: 0 }); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { carregar(); }, []);

  return (
    <div className="orcterc-page">
      <div className="page-header">
        <h1><i className="pi pi-dollar" /> Orçamentos de terceiros</h1>
        <p className="orcterc-sub">
          Preços que outros prestadores cobraram pelo mesmo procedimento, tirados das peças
          do processo. Busque pelo nome do procedimento — acentos e maiúsculas não importam.
        </p>
      </div>

      <div className="orcterc-busca">
        <span className="p-input-icon-left" style={{ flex: 1 }}>
          <i className="pi pi-search" />
          <InputText value={busca} onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') carregar(busca.trim() || undefined); }}
            placeholder="Ex.: artroplastia de quadril" style={{ width: '100%' }}
            aria-label="Buscar por procedimento" />
        </span>
        <Button label="Buscar" icon="pi pi-search" onClick={() => carregar(busca.trim() || undefined)} />
        <Button label="Limpar" outlined onClick={() => { setBusca(''); carregar(); }} />
      </div>

      <div className="orcterc-cards">
        <div className="orcterc-card">
          <span className="orcterc-rot">Orçamentos com valor</span>
          <strong>{resumo.n ?? 0}</strong>
        </div>
        <div className="orcterc-card">
          <span className="orcterc-rot">Mediana</span>
          <strong>{brl(resumo.mediana)}</strong>
        </div>
        <div className="orcterc-card">
          <span className="orcterc-rot">Menor</span>
          <strong>{brl(resumo.min)}</strong>
        </div>
        <div className="orcterc-card">
          <span className="orcterc-rot">Maior</span>
          <strong>{brl(resumo.max)}</strong>
        </div>
        <div className="orcterc-card">
          <span className="orcterc-rot">Conferidos por alguém</span>
          <strong>{resumo.confirmados ?? 0}</strong>
        </div>
      </div>

      {resumo.aviso && (
        <div className="orcterc-aviso" role="status">
          <i className="pi pi-exclamation-triangle" /> {resumo.aviso}
        </div>
      )}

      <ContadorRegistros total={itens.length} visiveis={itens.length} substantivo="orçamentos de terceiros" />

      <DataTable value={itens} loading={loading} dataKey="id" paginator rows={15}
        rowsPerPageOptions={[15, 30, 50, 100]} sortField="dataOrcamento" sortOrder={-1}
        emptyMessage="Nenhum orçamento de terceiro registrado ainda para esta busca."
        aria-label="Orçamentos de terceiros">
        <Column field="orderId" header="Pedido" sortable style={{ width: '6rem' }} />
        <Column field="paciente" header="Paciente" sortable style={{ minWidth: '12rem' }} />
        <Column field="procedimento" header="Procedimento" sortable style={{ minWidth: '16rem' }} />
        <Column field="prestador" header="Prestador" sortable style={{ minWidth: '12rem' }}
          body={(r) => r.prestador || <span className="orcterc-vazio">não informado</span>} />
        <Column field="valorTotal" header="Valor" sortable style={{ minWidth: '9rem' }}
          bodyStyle={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
          body={(r) => brl(r.valorTotal)} />
        <Column field="dataOrcamento" header="Data do orçamento" sortable style={{ minWidth: '10rem' }}
          body={(r) => r.dataOrcamento || '—'} />
        <Column field="confirmado"
          header={cabecalhoComHint('Conferido', 'Orçamento extraído da peça só vira número confiável depois que alguém confere — antes disso é proposta de leitura')}
          sortable style={{ width: '8rem' }} bodyStyle={{ textAlign: 'center' }}
          body={(r) => r.confirmado
            ? <Tag value={r.confirmadoPor || 'sim'} severity="success" />
            : <Tag value="não conferido" severity="warning" />} />
        <Column header={cabecalhoComHint('Origem', 'Página da peça de inteiro teor de onde este orçamento foi extraído')}
          style={{ width: '7rem' }} bodyStyle={{ textAlign: 'center' }}
          body={(r) => (r.paginaOrigem ? `p. ${r.paginaOrigem}` : '—')} />
        <Column header="Arquivo" style={{ width: '7rem' }} bodyStyle={{ textAlign: 'center' }}
          body={(r) => (r.linkArquivo
            ? <a href={r.linkArquivo} target="_blank" rel="noreferrer"
                className="orcterc-baixar" title="Abrir o documento de origem">
                <i className="pi pi-download" /> baixar
              </a>
            : <span className="orcterc-vazio">—</span>)} />
      </DataTable>
    </div>
  );
}
