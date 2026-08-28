import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { FilterMatchMode } from 'primereact/api';
import {
  getEnviadoSes, salvarResultadoSegredo, adicionarAcompanhamento, uploadAnexoOrder,
} from '../../services/api/orders';
import { useAccess } from '../../access/AccessContext';
import { ReadOnlyBanner } from '../../components/access/ReadOnlyBanner';
import { CabecalhoFase } from '../../components/CabecalhoFase/CabecalhoFase';
import { ContadorRegistros } from '../../components/ContadorRegistros/ContadorRegistros';
import {
  colunaCnj, colunaSei, colunaComarca, colunaCadastro, colunaSegredo, colunaInteiroTeor,
  colunaSolicitante, tagTipoPaciente, FILTROS_IDENTIFICACAO, nomeComCopiar,
} from '../../components/ColunasIdentificacao/colunasIdentificacao';
import { BotaoExportarExcel } from '../../components/BotaoExportarExcel/BotaoExportarExcel';
import { AcoesTabela } from '../../components/AcoesTabela/AcoesTabela';
import { useColunasVisiveis } from '../../components/ColunasVisiveis/useColunasVisiveis';

/**
 * Enviado à SES (task #235, @R 28/08 00:2x): SÓ os pedidos cujo orçamento foi ao
 * Estado e que NÃO acompanhamos nos autos — sem-protocolo comuns + segredos de
 * justiça aguardando resposta. "Não temos que acompanhar e só podemos aguardar um
 * retorno técnico para sabermos se ganhos" (@R 27/08 23:53). Protocolados NÃO
 * entram aqui (fase 5 tem acompanhamento próprio).
 */

interface LinhaEnviadoSes {
  id: number;
  paciente: string;
  procedimento: string;
  area: string | null;
  idade: number | null;
  tipoPaciente?: string | null;
  valorOrcamento: number;
  dataEnvio: string | null;
  dias: number;
  origem: 'segredo' | 'sem_protocolo';
  statusProcesso: string;
  [k: string]: any;
}

type Resultado = 'ganho' | 'perda' | '';

export function EnviadoSesPage() {
  const { isReadOnly } = useAccess();
  const readOnly = isReadOnly('protocolados');
  const [loading, setLoading] = useState(false);
  const [linhas, setLinhas] = useState<LinhaEnviadoSes[]>([]);
  const [visiveis, setVisiveis] = useState<LinhaEnviadoSes[]>([]);
  const colunasCfg = useColunasVisiveis('enviado-ses');

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    ...FILTROS_IDENTIFICACAO,
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    procedimento: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });

  // diálogo de resultado (o retorno técnico chegou)
  const [alvo, setAlvo] = useState<LinhaEnviadoSes | null>(null);
  const [resultado, setResultado] = useState<Resultado>('');
  const [valor, setValor] = useState<number | null>(null);
  const [motivoCat, setMotivoCat] = useState<string | null>(null);
  const [parecer, setParecer] = useState('');
  const [salvando, setSalvando] = useState(false);

  // informação avulsa (@R 28/08 01:43: "podemos receber a ligação da médica ou do
  // representante" — a espera não é muda: anotação + anexo entram SEM fechar o pedido)
  const [anotacao, setAnotacao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvandoInfo, setSalvandoInfo] = useState(false);

  const salvarInformacao = async () => {
    if (!alvo) return;
    if (!anotacao.trim() && !arquivo) { alert('Escreva a informação recebida ou escolha um arquivo.'); return; }
    setSalvandoInfo(true);
    try {
      if (arquivo) await uploadAnexoOrder(alvo.id, arquivo, 'ACOMPANHAMENTO');
      if (anotacao.trim() || arquivo) {
        await adicionarAcompanhamento(alvo.id, {
          acompanhamento: 'Retorno recebido na espera da SES',
          descricao: anotacao.trim() || `Anexo recebido: ${arquivo?.name}`,
        });
      }
      setAnotacao('');
      setArquivo(null);
      alert('Informação registrada — o pedido continua aguardando o retorno técnico.');
    } catch {
      alert('Erro ao registrar a informação.');
    } finally {
      setSalvandoInfo(false);
    }
  };

  const carregar = () => {
    setLoading(true);
    getEnviadoSes()
      .then(({ data }) => setLinhas(data))
      .catch(() => setLinhas([]))
      .finally(() => setLoading(false));
  };
  useEffect(carregar, []);
  useEffect(() => { setVisiveis(linhas); }, [linhas]);

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtData = (iso: string | null) => {
    if (!iso) return '—';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  };

  const abrirResultado = (l: LinhaEnviadoSes) => {
    setAlvo(l);
    setResultado('');
    setValor(null);
    setMotivoCat(null);
    setParecer('');
  };

  const salvar = async () => {
    if (!alvo || !resultado) { alert('Selecione Ganho ou Perda.'); return; }
    if (valor === null || valor <= 0) {
      alert(resultado === 'ganho' ? 'Informe o valor ganho.' : 'Informe o valor da causa.');
      return;
    }
    if (resultado === 'perda' && !parecer.trim()) {
      alert('Escreva o motivo da perda (obrigatório).');
      return;
    }
    setSalvando(true);
    try {
      await salvarResultadoSegredo(alvo.id, {
        resultado,
        parecer,
        valorGanho: valor,
        motivoPerdaCategoria: motivoCat ?? undefined,
      });
      setAlvo(null);
      carregar();
    } catch {
      alert('Erro ao salvar o resultado.');
    } finally {
      setSalvando(false);
    }
  };

  const kpis = useMemo(() => ({
    total: visiveis.length,
    segredo: visiveis.filter((l) => l.origem === 'segredo').length,
    semProtocolo: visiveis.filter((l) => l.origem === 'sem_protocolo').length,
    valorTotal: visiveis.reduce((acc, l) => acc + (l.valorOrcamento || 0), 0),
  }), [visiveis]);

  const filterElement = (options: any, placeholder: string) => (
    <InputText value={options.value || ''} onChange={(e) => options.filterApplyCallback(e.target.value)}
      placeholder={placeholder} className="p-column-filter" />
  );

  return (
    <div className="enviado-ses-page">
      <div className="page-header">
        <CabecalhoFase nome="Enviado à SES" screen="protocolados"
          subtitulo="Orçamento já enviado ao Estado, sem acompanhamento nos autos — só aguardamos o retorno técnico (ganho ou perda)" />
      </div>

      {readOnly && <ReadOnlyBanner />}

      <div className="card">
        <h2 className="mc-tabela-titulo">
          <i className="pi pi-send" />Aguardando retorno técnico da SES
          <ContadorRegistros total={linhas.length} visiveis={visiveis.length} substantivo="pedidos"
            fases={[
              { rotulo: 'segredo de justiça', quantidade: kpis.segredo, tom: 'alerta' },
              { rotulo: 'sem protocolo', quantidade: kpis.semProtocolo, tom: 'ok' },
            ]} />
        </h2>
        <AcoesTabela>
          <BotaoExportarExcel todos={linhas} visiveis={visiveis} nome="enviado-ses" />
          {colunasCfg.botao}
        </AcoesTabela>
        <DataTable
          aria-label="Pedidos enviados à SES aguardando retorno técnico"
          value={linhas} dataKey="id" paginator rows={100} rowsPerPageOptions={[10, 20, 50, 100]}
          onValueChange={(v) => setVisiveis(v as LinhaEnviadoSes[])}
          filters={filters} onFilter={(e) => setFilters(e.filters)} filterDisplay="row"
          sortField="dias" sortOrder={-1}
          loading={loading} tableStyle={{ minWidth: '95rem' }}
          emptyMessage="Nenhum pedido aguardando retorno da SES — quando um orçamento for enviado sem protocolo (ou em segredo de justiça), ele aparece aqui."
        >
          {colunasCfg.filtrar(<>
          <Column field="paciente" header="Paciente" sortable filter
            filterElement={(o) => filterElement(o, 'Buscar')}
            body={(r: LinhaEnviadoSes) => nomeComCopiar(r.paciente)} style={{ minWidth: '16rem' }} />
          {colunaCnj()}
          {colunaSei()}
          {colunaComarca()}
          {colunaCadastro()}
          {colunaSegredo()}
          {colunaInteiroTeor()}
          {colunaSolicitante()}
          <Column field="idade" header="Idade" sortable style={{ minWidth: '5rem' }} />
          <Column field="tipoPaciente" header="Tipo" sortable style={{ minWidth: '7rem' }}
            body={(r: LinhaEnviadoSes) => tagTipoPaciente(r.tipoPaciente)} />
          <Column field="procedimento" header="Procedimento" sortable filter
            filterElement={(o) => filterElement(o, 'BUSCAR')} style={{ minWidth: '18rem' }} />
          <Column field="origem" header="Origem" sortable style={{ minWidth: '10rem' }}
            body={(r: LinhaEnviadoSes) => (r.origem === 'segredo'
              ? <Tag value="Segredo de Justiça" severity="danger" icon="pi pi-lock" />
              : <Tag value="Sem protocolo" severity="warning" icon="pi pi-file-excel"
                  title="Orçamento foi à SES, mas o protocolo nos autos ficou de fora (prazo)" />)} />
          <Column field="valorOrcamento" header="Valor enviado" sortable style={{ minWidth: '9rem' }}
            body={(r: LinhaEnviadoSes) => (r.valorOrcamento ? fmtBRL(r.valorOrcamento) : '—')} />
          <Column field="dataEnvio" header="Enviado em" sortable style={{ minWidth: '8rem' }}
            body={(r: LinhaEnviadoSes) => fmtData(r.dataEnvio)} />
          <Column field="dias" header="Dias" sortable filter
            filterElement={(o) => filterElement(o, 'Buscar')} style={{ minWidth: '6rem' }} />
          <Column header="Resultado" style={{ minWidth: '9rem' }} bodyStyle={{ textAlign: 'center' }}
            body={(r: LinhaEnviadoSes) => (!readOnly
              ? <Button label="Registrar" icon="pi pi-flag" size="small" outlined onClick={() => abrirResultado(r)} />
              : null)} />
          </>)}
        </DataTable>
      </div>

      <Dialog header={`Retorno técnico — ${alvo?.paciente ?? ''}`} visible={!!alvo} modal
        style={{ width: '42rem', maxWidth: '96vw' }} onHide={() => setAlvo(null)}>
        <div className="field">
          <label>O que a SES respondeu?</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button label="Procedente (Ganho)" severity={resultado === 'ganho' ? 'success' : 'secondary'}
              outlined={resultado !== 'ganho'}
              onClick={() => { setResultado('ganho'); setValor(alvo?.valorOrcamento || null); }} />
            <Button label="Improcedente (Perda)" severity={resultado === 'perda' ? 'danger' : 'secondary'}
              outlined={resultado !== 'perda'}
              onClick={() => { setResultado('perda'); setValor(null); }} />
          </div>
        </div>
        {resultado !== '' && (
          <div className="field" style={{ marginTop: '12px' }}>
            <label>{resultado === 'ganho' ? 'Valor ganho' : 'Valor da causa'}</label>
            <InputNumber value={valor ?? undefined} onValueChange={(e) => setValor(e.value ?? null)}
              mode="currency" currency="BRL" locale="pt-BR"
              className={valor === null || valor <= 0 ? 'p-invalid' : ''} />
          </div>
        )}
        {resultado === 'perda' && (
          <div className="field" style={{ marginTop: '12px' }}>
            <label>Status da perda (escolha o que aconteceu — o motivo escrito continua obrigatório)</label>
            <Dropdown value={motivoCat} onChange={(e) => setMotivoCat(e.value)}
              options={[
                { label: 'SES não respondeu ao orçamento', value: 'SES_SEM_RESPOSTA' },
                { label: 'Perda de prazo de protocolação', value: 'PRAZO_PROTOCOLACAO' },
                { label: 'Perda por segredo de justiça', value: 'SEGREDO_DE_JUSTICA' },
                { label: 'Sem exames — médico não quis cotar', value: 'SEM_EXAMES' },
                { label: 'Não localizamos profissional', value: 'MEDICO_NAO_LOCALIZADO' },
                { label: 'Médico recusou a cotação', value: 'MEDICO_RECUSOU' },
                { label: 'Outro (ver justificativa)', value: 'OUTRO' },
              ]}
              placeholder="Escolha o status da perda" showClear style={{ width: '100%' }} />
          </div>
        )}
        {resultado !== '' && (
          <div className="field" style={{ marginTop: '12px' }}>
            <label>Parecer{resultado === 'perda' && <span style={{ color: '#ef4444' }}> *obrigatório</span>}</label>
            <InputTextarea value={parecer} onChange={(e) => setParecer(e.target.value)} rows={4} autoResize
              placeholder="Descreva o retorno técnico recebido..." style={{ width: '100%' }} />
          </div>
        )}
        <div className="field" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--surface-border, #e2e8f0)' }}>
          <label style={{ fontWeight: 600 }}>
            <i className="pi pi-phone" style={{ marginRight: '6px' }} />
            Recebeu uma ligação ou documento? Registre sem fechar o pedido
          </label>
          <InputTextarea value={anotacao} onChange={(e) => setAnotacao(e.target.value)} rows={2} autoResize
            placeholder="Ex.: a médica ligou informando que a cirurgia foi agendada..."
            style={{ width: '100%', marginTop: '6px' }} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <input type="file" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
            <Button label="Salvar informação" icon="pi pi-save" size="small" outlined
              loading={salvandoInfo} disabled={salvandoInfo} onClick={salvarInformacao} />
          </div>
        </div>
        <div className="dialog-footer-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button label="Cancelar" outlined onClick={() => setAlvo(null)} />
          <Button label="Salvar resultado" icon="pi pi-check" loading={salvando}
            disabled={salvando || !resultado} onClick={salvar}
            severity={resultado === 'ganho' ? 'success' : resultado === 'perda' ? 'danger' : undefined} />
        </div>
      </Dialog>
    </div>
  );
}
