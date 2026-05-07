import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { FilterMatchMode } from 'primereact/api';
import { getAnexosOrder } from '../../services/api/orders';
import {
  getAguardandoCirurgia,
  confirmarCirurgia,
  registrarPerdaCirurgia,
} from '../../services/api/financeiro';
import type {
  AguardandoCirurgiaItem,
  AguardandoCirurgiaKpis,
} from '../../services/api/financeiro';
import './AguardandoCirurgiaPage.css';

interface Anexo {
  id: number;
  linkImagem: string;
  tipo: string;
  createDate: string;
}

function formatarMoeda(value: number) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(value: string | null) {
  if (!value) return '-';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

export function AguardandoCirurgiaPage() {
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState<AguardandoCirurgiaItem[]>([]);
  const [kpis, setKpis] = useState<AguardandoCirurgiaKpis>({ quantidade: 0, valorGanhos: 0, comissaoEsperada: 0 });

  const [dialogVisible, setDialogVisible] = useState(false);
  const [registroAtual, setRegistroAtual] = useState<AguardandoCirurgiaItem | null>(null);
  const [valorComissao, setValorComissao] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [perdaModo, setPerdaModo] = useState(false);
  const [descPerda, setDescPerda] = useState('');
  const [dataConfirmacao, setDataConfirmacao] = useState<Date | null>(new Date());

  const [anexosRelatorio, setAnexosRelatorio] = useState<Anexo[]>([]);
  const [anexosOrcamento, setAnexosOrcamento] = useState<Anexo[]>([]);
  const [anexosProtocolo, setAnexosProtocolo] = useState<Anexo[]>([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    medico: { value: '', matchMode: FilterMatchMode.CONTAINS },
    valor: { value: '', matchMode: FilterMatchMode.CONTAINS },
    nprocesso: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });

  const filterElement = (options: any, placeholder: string) => (
    <InputText
      value={options.value || ''}
      onChange={(e) => options.filterApplyCallback(e.target.value)}
      placeholder={placeholder}
      className="p-column-filter"
    />
  );

  const carregar = async () => {
    setLoading(true);
    try {
      const { data } = await getAguardandoCirurgia();
      setItens(data.itens ?? []);
      setKpis(data.kpis ?? { quantidade: 0, valorGanhos: 0, comissaoEsperada: 0 });
    } catch (err) {
      console.error('Erro ao carregar aguardando cirurgia:', err);
      alert('Erro ao carregar a lista.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const linhas = useMemo(
    () => itens.map((item, index) => ({ ...item, sequencial: index + 1 })),
    [itens],
  );

  const abrirConfirmar = async (rowData: AguardandoCirurgiaItem) => {
    setRegistroAtual(rowData);
    // Pré-preenche pela comissão estimada (calculada no backend usando o
    // takeRate cadastrado no médico). Operador pode editar se quiser.
    setValorComissao(Number((rowData.comissaoEstimada || 0).toFixed(2)));
    setPerdaModo(false);
    setDescPerda('');
    setDataConfirmacao(new Date());
    setAnexosRelatorio([]);
    setAnexosOrcamento([]);
    setAnexosProtocolo([]);
    setDialogVisible(true);

    setCarregandoAnexos(true);
    try {
      const [rel, orc, prot] = await Promise.all([
        getAnexosOrder(rowData.id, 'RELATORIO').catch(() => ({ data: { anexos: [] } })),
        getAnexosOrder(rowData.id, 'ORCAMENTO').catch(() => ({ data: { anexos: [] } })),
        getAnexosOrder(rowData.id, 'PROTOCOLO').catch(() => ({ data: { anexos: [] } })),
      ]);
      setAnexosRelatorio((rel.data as any)?.anexos ?? []);
      setAnexosOrcamento((orc.data as any)?.anexos ?? []);
      setAnexosProtocolo((prot.data as any)?.anexos ?? []);
    } finally {
      setCarregandoAnexos(false);
    }
  };

  const fecharDialog = () => {
    setDialogVisible(false);
    setRegistroAtual(null);
    setValorComissao(null);
    setPerdaModo(false);
    setDescPerda('');
    setDataConfirmacao(new Date());
  };

  const formatarDataIso = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleConfirmarCirurgia = async () => {
    if (!registroAtual) return;
    if (valorComissao === null || Number.isNaN(valorComissao)) {
      alert('Informe o valor da comissão.');
      return;
    }
    if (!dataConfirmacao) {
      alert('Informe a data da confirmação.');
      return;
    }
    setSalvando(true);
    try {
      await confirmarCirurgia(registroAtual.id, {
        valorComissao,
        dataConfirmacao: formatarDataIso(dataConfirmacao),
      });
      alert('Cirurgia confirmada e registro financeiro criado.');
      fecharDialog();
      await carregar();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      console.error('Erro ao confirmar cirurgia:', err);
      alert(detail || 'Erro ao confirmar cirurgia.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRegistrarPerda = async () => {
    if (!registroAtual) return;
    if (!descPerda.trim()) {
      alert('Informe o motivo da perda.');
      return;
    }
    if (!dataConfirmacao) {
      alert('Informe a data.');
      return;
    }
    setSalvando(true);
    try {
      await registrarPerdaCirurgia(registroAtual.id, {
        descCirurgiaPerda: descPerda.trim(),
        dataConfirmacao: formatarDataIso(dataConfirmacao),
      });
      alert('Perda registrada.');
      fecharDialog();
      await carregar();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      console.error('Erro ao registrar perda:', err);
      alert(detail || 'Erro ao registrar perda.');
    } finally {
      setSalvando(false);
    }
  };

  const renderValor = (rowData: AguardandoCirurgiaItem) => formatarMoeda(rowData.valor);
  const renderConfirmar = (rowData: AguardandoCirurgiaItem) => (
    <Button
      label="Confirmar"
      icon="pi pi-check"
      severity="success"
      size="small"
      onClick={() => abrirConfirmar(rowData)}
    />
  );

  const renderListaAnexos = (lista: Anexo[]) => {
    if (lista.length === 0) {
      return <div className="ag-cir-anexos__empty">Nenhum arquivo anexado.</div>;
    }
    return (
      <div className="ag-cir-anexos__list">
        {lista.map((a, index) => {
          const nome = a.linkImagem.split('/').pop() || `Anexo ${index + 1}`;
          const ext = nome.split('.').pop()?.toLowerCase();
          const icone = ext === 'pdf'
            ? 'pi pi-file-pdf'
            : ['jpg', 'jpeg', 'png'].includes(ext ?? '')
              ? 'pi pi-image'
              : 'pi pi-file';
          return (
            <button
              key={a.id ?? index}
              type="button"
              className="ag-cir-anexo-item"
              onClick={() => window.open(a.linkImagem, '_blank', 'noopener,noreferrer')}
              title={nome}
            >
              <i className={`${icone} ag-cir-anexo-item__icon`} />
              <span className="ag-cir-anexo-item__nome">{nome}</span>
              <i className="pi pi-external-link ag-cir-anexo-item__action" />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="aguardando-cirurgia-page">
      <div className="page-header">
        <div>
          <h1>Aguardando Cirurgia</h1>
          <p>Pedidos com ganho confirmado aguardando realização da cirurgia.</p>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Quantidade de Ganhos</span>
            <i className="pi pi-check-circle"></i>
          </div>
          <div className="kpi-value">{kpis.quantidade}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Valor dos Ganhos</span>
            <i className="pi pi-wallet"></i>
          </div>
          <div className="kpi-value">{formatarMoeda(kpis.valorGanhos)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Comissão Esperada</span>
            <i className="pi pi-percentage"></i>
          </div>
          <div className="kpi-value">{formatarMoeda(kpis.comissaoEsperada)}</div>
        </div>
      </div>

      <div className="card">
        <DataTable
          value={linhas}
          loading={loading}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 50]}
          filters={filters}
          onFilter={(e) => setFilters(e.filters)}
          filterDisplay="row"
          emptyMessage="Nenhum pedido aguardando cirurgia."
          className="ag-cir-table"
        >
          <Column field="sequencial" header="#" sortable style={{ minWidth: '4rem' }} />
          <Column
            field="paciente"
            header="Paciente"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '16rem' }}
          />
          <Column
            field="medico"
            header="Médico"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '14rem' }}
          />
          <Column
            field="valor"
            header="Valor"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={renderValor}
            style={{ minWidth: '10rem' }}
          />
          <Column
            field="nprocesso"
            header="Processo"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="dias"
            header="Dias"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '7rem' }}
          />
          <Column header="Confirmar" body={renderConfirmar} style={{ minWidth: '10rem', textAlign: 'center' }} />
        </DataTable>
      </div>

      <Dialog
        header={registroAtual ? `Cirurgia — ${registroAtual.paciente}` : 'Cirurgia'}
        visible={dialogVisible}
        style={{ width: '60rem', maxWidth: '96vw' }}
        modal
        onHide={fecharDialog}
      >
        {registroAtual && (
          <div className="ag-cir-form">
            <div className="ag-cir-form__grid">
              <div className="ag-cir-field ag-cir-field--span-2">
                <label>Paciente</label>
                <InputText value={registroAtual.paciente} disabled />
              </div>
              <div className="ag-cir-field ag-cir-field--span-4">
                <label>Procedimento</label>
                <InputTextarea value={registroAtual.procedimento || ''} rows={2} autoResize disabled />
              </div>
              <div className="ag-cir-field ag-cir-field--span-2">
                <label>Médico</label>
                <InputText value={registroAtual.medico || '-'} disabled />
              </div>
              <div className="ag-cir-field ag-cir-field--span-1">
                <label>Valor</label>
                <InputText value={formatarMoeda(registroAtual.valor)} disabled />
              </div>
              <div className="ag-cir-field ag-cir-field--span-1">
                <label>Processo</label>
                <InputText value={registroAtual.nprocesso || '-'} disabled />
              </div>
              <div className="ag-cir-field ag-cir-field--span-1">
                <label>Dias</label>
                <InputText value={String(registroAtual.dias)} disabled />
              </div>
              <div className="ag-cir-field ag-cir-field--span-1">
                <label>Data Pedido</label>
                <InputText value={formatarData(registroAtual.dataPedido)} disabled />
              </div>

              <div className="ag-cir-field ag-cir-field--span-2">
                <label>Valor da Comissão *</label>
                <InputNumber
                  value={valorComissao ?? undefined}
                  onValueChange={(e) => setValorComissao(e.value ?? null)}
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                  disabled={perdaModo}
                />
              </div>
              <div className="ag-cir-field ag-cir-field--span-1">
                <label>% sobre o valor da cirurgia</label>
                <InputText
                  value={
                    valorComissao !== null && registroAtual.valor > 0
                      ? `${((valorComissao / registroAtual.valor) * 100).toFixed(2)}%`
                      : '-'
                  }
                  disabled
                />
              </div>
              <div className="ag-cir-field ag-cir-field--span-1">
                <label>Data {perdaModo ? 'da Perda' : 'da Cirurgia'} *</label>
                <Calendar
                  value={dataConfirmacao}
                  onChange={(e) => setDataConfirmacao(e.value as Date | null)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  locale="pt-BR"
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>

            <div className="ag-cir-anexos">
              <div className="ag-cir-anexos__bloco">
                <h3>Relatórios Anexados</h3>
                {carregandoAnexos ? <div>Carregando...</div> : renderListaAnexos(anexosRelatorio)}
              </div>
              <div className="ag-cir-anexos__bloco">
                <h3>Orçamentos Anexados</h3>
                {carregandoAnexos ? <div>Carregando...</div> : renderListaAnexos(anexosOrcamento)}
              </div>
              <div className="ag-cir-anexos__bloco">
                <h3>Protocolos Anexados</h3>
                {carregandoAnexos ? <div>Carregando...</div> : renderListaAnexos(anexosProtocolo)}
              </div>
            </div>

            {perdaModo && (
              <div className="ag-cir-perda-bloco">
                <label>Motivo da perda *</label>
                <InputTextarea
                  value={descPerda}
                  onChange={(e) => setDescPerda(e.target.value)}
                  rows={3}
                  autoResize
                  placeholder="Descreva o motivo da perda da cirurgia"
                />
              </div>
            )}

            <div className="ag-cir-actions">
              <Button
                label="Cancelar"
                outlined
                onClick={fecharDialog}
                disabled={salvando}
              />
              {!perdaModo ? (
                <>
                  <Button
                    label="Perda"
                    icon="pi pi-times"
                    severity="danger"
                    outlined
                    onClick={() => setPerdaModo(true)}
                    disabled={salvando}
                  />
                  <Button
                    label={salvando ? 'Salvando...' : 'Confirmar Cirurgia'}
                    icon="pi pi-check"
                    severity="success"
                    onClick={handleConfirmarCirurgia}
                    loading={salvando}
                  />
                </>
              ) : (
                <>
                  <Button
                    label="Voltar"
                    icon="pi pi-arrow-left"
                    outlined
                    onClick={() => { setPerdaModo(false); setDescPerda(''); }}
                    disabled={salvando}
                  />
                  <Button
                    label={salvando ? 'Salvando...' : 'Registrar Perda'}
                    icon="pi pi-times"
                    severity="danger"
                    onClick={handleRegistrarPerda}
                    loading={salvando}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
