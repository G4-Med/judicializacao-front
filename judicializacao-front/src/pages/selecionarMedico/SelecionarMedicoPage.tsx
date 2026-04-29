import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type { DataTablePageEvent, DataTableSortEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import {
  atualizarOrder,
  getMedicosCompleto,
  getProcessosResumo,
  marcarSemProfissional,
  sugerirMedicoIA,
  type SugestaoIAResposta,
} from '../../services/api/orders';
import { useAccess } from '../../access/AccessContext';
import { ReadOnlyBanner } from '../../components/access/ReadOnlyBanner';
import './SelecionarMedicoPage.css';

interface ProcessoResumo {
  id: number;
  paciente: string;
  procedimento: string;
  area: string;
  subarea: string;
  dataPedido: string;
  diasSolicitados: number;
  refPreco: number;
  idMedico: number | null;
  medico: string;
}

interface ProcessoResumoTableRow extends ProcessoResumo {
  sequencial: number;
  dias: number;
}

interface MedicoOption {
  label: string;
  value: number;
}

export function SelecionarMedicoPage() {
  const { isReadOnly, filterMedicosByAccess } = useAccess();
  const readOnly = isReadOnly('selecionarMedico');
  const [loading, setLoading] = useState(false);
  const [processos, setProcessos] = useState<ProcessoResumo[]>([]);
  const [selectedProcessos, setSelectedProcessos] = useState<ProcessoResumoTableRow[]>([]);
  const [medicosOptions, setMedicosOptions] = useState<MedicoOption[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMassaVisible, setDialogMassaVisible] = useState(false);
  const [processoSelecionado, setProcessoSelecionado] = useState<ProcessoResumoTableRow | null>(null);
  const [medicoSelecionado, setMedicoSelecionado] = useState<number | null>(null);
  const [medicoSelecionadoMassa, setMedicoSelecionadoMassa] = useState<number | null>(null);
  const [salvandoMedico, setSalvandoMedico] = useState(false);
  const [executandoAcaoMassa, setExecutandoAcaoMassa] = useState(false);
  const [iaLoadingId, setIaLoadingId] = useState<number | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    procedimento: { value: '', matchMode: FilterMatchMode.CONTAINS },
    area: { value: '', matchMode: FilterMatchMode.CONTAINS },
    subarea: { value: '', matchMode: FilterMatchMode.CONTAINS },
    medico: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [processosRes, medicosRes] = await Promise.all([
        getProcessosResumo(),
        getMedicosCompleto(),
      ]);

      const medicos = filterMedicosByAccess(
        Array.isArray(medicosRes.data) ? medicosRes.data : [],
        (item: any) => item?.id
      );
      const medicosLookup = new Map<number, string>(
        medicos.map((item: any) => [item.id, item.nomeSistema ?? item.nomeCompleto ?? ''])
      );

      setMedicosOptions(
        medicos.map((item: any) => ({
          label: item.nomeSistema ?? item.nomeCompleto ?? `Médico ${item.id}`,
          value: item.id,
        }))
      );

      const lista = Array.isArray(processosRes.data) ? processosRes.data : [];
      setProcessos(
        lista.map((item: any) => ({
          id: item.id,
          paciente: item.paciente ?? '',
          procedimento: item.procedimento ?? '',
          area: item.area ?? '',
          subarea: item.subarea ?? '',
          dataPedido: item.dataPedido ?? '',
          diasSolicitados: Number(item.diasSolicitados ?? 0),
          refPreco: Number(item.refPreco ?? 0),
          idMedico: item.idMedico ?? null,
          medico:
            item.medico ??
            (item.idMedico ? medicosLookup.get(item.idMedico) ?? '' : ''),
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar processos resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  const dataComCamposCalculados = useMemo<ProcessoResumoTableRow[]>(() => {
    return processos.map((item, index) => {
      return {
        ...item,
        sequencial: index + 1,
        dias: Number(item.diasSolicitados ?? 0),
      };
    });
  }, [processos]);

  const kpis = useMemo(() => {
    const total = dataComCamposCalculados.length;
    const somaRefPreco = dataComCamposCalculados.reduce(
      (acc, item) => acc + (item.refPreco ?? 0),
      0,
    );
    const valorMedio = total > 0 ? somaRefPreco / total : 0;
    const maisAntigo = total > 0 ? Math.max(...dataComCamposCalculados.map((p) => p.dias)) : 0;

    return {
      total,
      valorMedio,
      maisAntigo,
    };
  }, [dataComCamposCalculados]);

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const onPage = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const onSort = (event: DataTableSortEvent) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder);
  };

  const filterElement = (options: any, placeholder: string) => (
    <InputText
      value={options.value || ''}
      onChange={(e) => options.filterApplyCallback(e.target.value)}
      placeholder={placeholder}
      className="p-column-filter"
    />
  );

  const abrirDialog = (rowData: ProcessoResumoTableRow) => {
    setProcessoSelecionado(rowData);
    setMedicoSelecionado(rowData.idMedico ?? null);
    setDialogVisible(true);
  };

  const handleSalvarMedico = async () => {
    if (!processoSelecionado || !medicoSelecionado) {
      alert('Selecione um médico.');
      return;
    }

    setSalvandoMedico(true);
    try {
      await atualizarOrder(processoSelecionado.id, { idMedico: medicoSelecionado });
      await carregarDados();
      setDialogVisible(false);
      setProcessoSelecionado(null);
      setMedicoSelecionado(null);
    } catch (error) {
      console.error('Erro ao selecionar médico:', error);
      alert('Erro ao salvar o médico do processo.');
    } finally {
      setSalvandoMedico(false);
    }
  };

  const handleMarcarSemProfissional = async (rowData: ProcessoResumoTableRow) => {
    try {
      await marcarSemProfissional(rowData.id);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao marcar perda por falta de profissional:', error);
      alert('Erro ao marcar perda por falta de profissional.');
    }
  };

  const handleMarcarSemProfissionalEmMassa = async () => {
    if (selectedProcessos.length === 0) {
      alert('Selecione pelo menos um processo.');
      return;
    }

    setExecutandoAcaoMassa(true);
    try {
      await Promise.all(selectedProcessos.map((item) => marcarSemProfissional(item.id)));
      await carregarDados();
      setSelectedProcessos([]);
    } catch (error) {
      console.error('Erro ao marcar perda por falta de profissional em massa:', error);
      alert('Erro ao marcar perda por falta de profissional em massa.');
    } finally {
      setExecutandoAcaoMassa(false);
    }
  };

  const abrirDialogMassa = () => {
    if (selectedProcessos.length === 0) {
      alert('Selecione pelo menos um processo.');
      return;
    }

    setMedicoSelecionadoMassa(null);
    setDialogMassaVisible(true);
  };

  const handleSelecionarMedicoEmMassa = async () => {
    if (!medicoSelecionadoMassa) {
      alert('Selecione um médico.');
      return;
    }

    setExecutandoAcaoMassa(true);
    try {
      await Promise.all(
        selectedProcessos.map((item) => atualizarOrder(item.id, { idMedico: medicoSelecionadoMassa }))
      );
      await carregarDados();
      setSelectedProcessos([]);
      setDialogMassaVisible(false);
      setMedicoSelecionadoMassa(null);
    } catch (error) {
      console.error('Erro ao selecionar médico em massa:', error);
      alert('Erro ao salvar o médico em massa.');
    } finally {
      setExecutandoAcaoMassa(false);
    }
  };

  const handleSugerirMedicoIA = async (rowData: ProcessoResumoTableRow) => {
    setIaLoadingId(rowData.id);
    try {
      const { data } = await sugerirMedicoIA(rowData.id);
      const sug = data as SugestaoIAResposta;

      // TODO Front-3: substituir alert por dialog de confirmação
      const fallbackTxt = sug.isFallback ? '\n\n⚠️ FALLBACK (Hospital IBG)' : '';
      alert(
        `🤖 Sugestão da IA:\n\n` +
        `${sug.nomeMedico ?? '(nenhum)'}\n\n` +
        `Justificativa: ${sug.justificativa}\n\n` +
        `Confiança: ${sug.confianca}` +
        fallbackTxt +
        `\n\nsugestaoId: ${sug.sugestaoId}`,
      );
    } catch (error: any) {
      console.error('Erro ao sugerir médico via IA:', error);
      alert(error?.response?.data?.detail ?? 'Erro ao gerar sugestão.');
    } finally {
      setIaLoadingId(null);
    }
  };

  return (
    <div className="selecionar-medico-page">
      <div className="page-header">
        <div>
          <h1>Selecionar Médico</h1>
          <p>Defina o médico responsável para os processos pendentes.</p>
        </div>
        {!readOnly && (
          <div className="page-actions">
            <Button
              label=""
              tooltip='Sugerir médico via IA (em lote) — em breve'
              tooltipOptions={{ position: 'bottom' }}
              icon="pi pi-sparkles"
              outlined
              disabled
            />
            <Button
              label=""
              tooltip='Selecionar médico Manualmente'
              tooltipOptions={ { position: 'bottom' } }
              icon="pi pi-user-edit"
              outlined
              onClick={abrirDialogMassa}
              disabled={executandoAcaoMassa}
            />
            <Button
              label={executandoAcaoMassa ? 'Processando...' : ''}
              tooltip='Perda por falta de profissional'
              tooltipOptions={ { position: 'bottom' } }
              icon="pi pi-user-minus"
              severity="danger"
              outlined
              onClick={() => void handleMarcarSemProfissionalEmMassa()}
              loading={executandoAcaoMassa}
            />
          </div>
        )}
      </div>

      {readOnly && <ReadOnlyBanner />}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total de Processos</span>
            <i className="pi pi-list" />
          </div>
          <div className="kpi-value">{kpis.total}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Valor Médio dos Processos</span>
            <i className="pi pi-dollar" />
          </div>
          <div className="kpi-value">{formatarMoeda(kpis.valorMedio)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Processo mais antigo em dias</span>
            <i className="pi pi-clock" />
          </div>
          <div className="kpi-value">{kpis.maisAntigo}</div>
        </div>
      </div>

      <div className="card">
        <DataTable
          value={dataComCamposCalculados}
          dataKey="id"
          paginator
          rows={rows}
          first={first}
          totalRecords={dataComCamposCalculados.length}
          onPage={onPage}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          filters={filters}
          onFilter={(e) => setFilters(e.filters)}
          filterDisplay="row"
          loading={loading}
          selectionMode="multiple"
          selection={selectedProcessos}
          onSelectionChange={(e) => setSelectedProcessos((e.value ?? []) as ProcessoResumoTableRow[])}
          tableStyle={{ minWidth: '92rem' }}
          className="selecionar-medico-table"
          emptyMessage="Nenhum processo encontrado."
        >
          {!readOnly && <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />}
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
            field="procedimento"
            header="Procedimento"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '22rem' }}
          />
          <Column
            field="area"
            header="Área"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '10rem' }}
          />
          <Column
            field="subarea"
            header="Subárea"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '10rem' }}
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
            field="dias"
            header="Dias"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '7rem' }}
          />
          {!readOnly && (
            <Column
              header="Sugerir IA"
              body={(rowData: ProcessoResumoTableRow) => (
                <Button
                  label=""
                  tooltip="Sugerir médico via IA"
                  tooltipOptions={{ position: 'bottom' }}
                  icon="pi pi-sparkles"
                  outlined
                  loading={iaLoadingId === rowData.id}
                  disabled={iaLoadingId !== null && iaLoadingId !== rowData.id}
                  onClick={() => void handleSugerirMedicoIA(rowData)}
                />
              )}
              style={{ minWidth: '7rem' }}
              bodyStyle={{ textAlign: 'center' }}
            />
          )}
          {!readOnly && (
            <Column
              header="Selecionar Médico"
              body={(rowData: ProcessoResumoTableRow) => (
                <Button
                  label=""
                  icon="pi pi-user-edit"
                  outlined
                  onClick={() => abrirDialog(rowData)}
                />
              )}
              style={{ minWidth: '8rem' }}
              bodyStyle={{ textAlign: 'center' }}
            />
          )}
          {!readOnly && (
            <Column
              header="Perda"
              body={(rowData: ProcessoResumoTableRow) => (
                <Button
                  label=""
                  icon="pi pi-user-minus"
                  severity="danger"
                  outlined
                  onClick={() => void handleMarcarSemProfissional(rowData)}
                />
              )}
              style={{ minWidth: '5rem' }}
              bodyStyle={{ textAlign: 'center' }}
            />
          )}
        </DataTable>
      </div>

      <Dialog
        header="Selecionar Médico"
        visible={dialogVisible}
        style={{ width: '42rem', maxWidth: '96vw' }}
        modal
        onHide={() => setDialogVisible(false)}
        className="selecionar-medico-dialog"
      >
        {processoSelecionado && (
          <div className="selecionar-medico-dialog-content">
            <div className="selecionar-medico-resumo">
              <div>
                <span className="resumo-label">Paciente</span>
                <strong>{processoSelecionado.paciente}</strong>
              </div>
              <div>
                <span className="resumo-label">Procedimento</span>
                <strong>{processoSelecionado.procedimento}</strong>
              </div>
              <div>
                <span className="resumo-label">Área</span>
                <strong>{processoSelecionado.area || '-'}</strong>
              </div>
              <div>
                <span className="resumo-label">Subárea</span>
                <strong>{processoSelecionado.subarea || '-'}</strong>
              </div>
            </div>

            <div className="field">
              <label>Médico</label>
              <Dropdown
                value={medicoSelecionado}
                options={medicosOptions}
                onChange={(e) => setMedicoSelecionado(e.value)}
                placeholder="Selecione o médico"
                filter
                disabled={readOnly}
              />
            </div>

            <div className="dialog-footer-actions">
              <Button label="Cancelar" outlined onClick={() => setDialogVisible(false)} />
              {!readOnly && (
                <Button
                  label={salvandoMedico ? 'Salvando...' : 'Salvar'}
                  icon="pi pi-check"
                  onClick={handleSalvarMedico}
                  loading={salvandoMedico}
                />
              )}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        header="Selecionar Médico em Massa"
        visible={dialogMassaVisible}
        style={{ width: '36rem', maxWidth: '96vw' }}
        modal
        onHide={() => setDialogMassaVisible(false)}
        className="selecionar-medico-dialog"
      >
        <div className="selecionar-medico-dialog-content">
          <div className="selecionar-medico-resumo">
            <div>
              <span className="resumo-label">Processos selecionados</span>
              <strong>{selectedProcessos.length}</strong>
            </div>
            <div>
              <span className="resumo-label">Ação</span>
              <strong>Selecionar médico em lote</strong>
            </div>
          </div>

          <div className="field">
            <label>Médico</label>
            <Dropdown
              value={medicoSelecionadoMassa}
              options={medicosOptions}
              onChange={(e) => setMedicoSelecionadoMassa(e.value)}
              placeholder="Selecione o médico"
              filter
            />
          </div>

          <div className="dialog-footer-actions">
            <Button label="Cancelar" outlined onClick={() => setDialogMassaVisible(false)} />
            {!readOnly && (
              <Button
                label={executandoAcaoMassa ? 'Salvando...' : 'Salvar'}
                icon="pi pi-check"
                onClick={handleSelecionarMedicoEmMassa}
                loading={executandoAcaoMassa}
              />
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}


