import { Column } from 'primereact/column';
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
    <Column key="col-cnj" field="nprocesso" header="Nº CNJ" sortable filter
      filterElement={filtro('Buscar CNJ')} style={{ minWidth: largura }}
      body={(r: LinhaIdentificada) => r.nprocesso
        ? <><code className="ident-numero" title="Número CNJ do processo">{r.nprocesso}</code><BotaoCopiar valor={r.nprocesso} rotulo="número CNJ" /></>
        : <span className="ident-vazio">—</span>} />
  );
}

export function colunaSei(largura = '12rem') {
  return (
    <Column key="col-sei" field="numeroSei" header="Nº SEI" sortable filter
      filterElement={filtro('Buscar SEI')} style={{ minWidth: largura }}
      body={(r: LinhaIdentificada) => r.numeroSei
        ? <><code className="ident-numero" title={r.familiaSei ? `Família ${r.familiaSei}` : 'Número SEI'}>{r.numeroSei}</code><BotaoCopiar valor={r.numeroSei} rotulo="número SEI" /></>
        : <span className="ident-vazio">—</span>} />
  );
}

export function colunaComarca(largura = '11rem') {
  return (
    <Column key="col-comarca" field="comarca" header="Comarca" sortable filter
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

/** Célula de nome com botão de copiar — para a coluna Paciente que cada tela já tem. */
export function nomeComCopiar(nome: string | null | undefined) {
  return <>{nome}<BotaoCopiar valor={nome} rotulo="nome do paciente" /></>;
}

const ROTULO_PONTO: Record<string, string> = { cnj: 'CNJ', sei: 'SEI', comarca: 'Comarca', anexo: 'Anexo' };

/** Chip "cadastro" (desenho af56e8f2, nota 94 — GO @R 27/08 14:19): 4 pontos, tooltip com
 *  fonte + próxima ação + dono. verde=tem · âmbar=falta com rota automática · cinza=fila
 *  humana. cadastro null (falha no cálculo) = "indisponível" — a tabela nunca cai (K6). */
export function colunaCadastro(largura = '9rem') {
  return (
    <Column key="col-cadastro" field="cadastro" header="Cadastro" sortable
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
