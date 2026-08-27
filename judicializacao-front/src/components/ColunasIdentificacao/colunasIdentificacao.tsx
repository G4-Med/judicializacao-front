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

export interface LinhaIdentificada {
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
