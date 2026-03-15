import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type {
  DataTableFilterMeta,
  DataTablePageEvent,
  DataTableSortEvent
} from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { FilterMatchMode } from 'primereact/api';
import { Dialog } from 'primereact/dialog';
import { RadioButton } from 'primereact/radiobutton';
import './ParaProtocolarPage.css';

interface ParaProtocolar {
  id: number;
  paciente: string;
  cliente: string;
  valor: number;
  dataEnvioOrcamento: string;
  observacoes: string;
  numeroProcesso: string;
  procedimento: string;
  status: string;
  anexoNome: string;
}

interface ParaProtocolarTableRow extends ParaProtocolar {
  sequencial: number;
  dias: number;
}

type NaoProtocolarOpcao = 'perda' | 'segredo' | '';

export function ParaProtocolarPage() {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<ParaProtocolar[]>([]);
  const [selectedRegistros, setSelectedRegistros] = useState<ParaProtocolarTableRow[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    cliente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    valor: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dataEnvioOrcamento: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
    status: { value: '', matchMode: FilterMatchMode.CONTAINS }
  });

  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [protocolarDialogVisible, setProtocolarDialogVisible] = useState(false);
  const [naoProtocolarDialogVisible, setNaoProtocolarDialogVisible] = useState(false);

  const [registroEditando, setRegistroEditando] = useState<ParaProtocolarTableRow | null>(null);
  const [registroProtocolando, setRegistroProtocolando] = useState<ParaProtocolarTableRow | null>(null);
  const [registroNaoProtocolar, setRegistroNaoProtocolar] = useState<ParaProtocolarTableRow | null>(null);

  const [dataProtocolacao, setDataProtocolacao] = useState<Date | null>(null);
  const [naoProtocolarOpcao, setNaoProtocolarOpcao] = useState<NaoProtocolarOpcao>('');
  const [naoProtocolarObs, setNaoProtocolarObs] = useState('');

  useEffect(() => {
    setLoading(true);

    const mock: ParaProtocolar[] = [
      {
        id: 1,
        paciente: 'Maria Helena Souza',
        cliente: 'Clínica Alfa',
        valor: 18500,
        dataEnvioOrcamento: '2026-03-10',
        observacoes: 'Aguardando protocolo judicial.',
        numeroProcesso: 'PROC-1001',
        procedimento: 'Artroplastia total de joelho',
        status: 'Aguardando protocolo',
        anexoNome: 'orcamento_maria_helena.pdf'
      },
      {
        id: 2,
        paciente: 'João Pedro Santos',
        cliente: 'Instituto Beta',
        valor: 9200,
        dataEnvioOrcamento: '2026-03-08',
        observacoes: 'Orçamento validado.',
        numeroProcesso: 'PROC-1002',
        procedimento: 'Herniorrafia inguinal',
        status: 'Pendente',
        anexoNome: 'orcamento_joao_pedro.pdf'
      },
      {
        id: 3,
        paciente: 'Ana Cláudia Costa',
        cliente: 'Neuro Gama',
        valor: 27500,
        dataEnvioOrcamento: '2026-03-02',
        observacoes: 'Prioridade alta.',
        numeroProcesso: 'PROC-1003',
        procedimento: 'Cirurgia bariátrica',
        status: 'Em análise',
        anexoNome: 'orcamento_ana_claudia.pdf'
      }
    ];

    const timer = setTimeout(() => {
      setRegistros(mock);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const dataComCamposCalculados = useMemo<ParaProtocolarTableRow[]>(() => {
    const hoje = new Date();

    return registros.map((item, index) => {
      const dataBase = new Date(`${item.dataEnvioOrcamento}T00:00:00`);
      const diferencaMs = hoje.getTime() - dataBase.getTime();
      const dias = Math.max(0, Math.floor(diferencaMs / (1000 * 60 * 60 * 24)));

      return {
        ...item,
        sequencial: index + 1,
        dias
      };
    });
  }, [registros]);

  const kpis = useMemo(() => {
    const quantidade = dataComCamposCalculados.length;
    const valor = dataComCamposCalculados.reduce((acc, item) => acc + item.valor, 0);
    const processoMaisAntigo = dataComCamposCalculados.length
      ? Math.max(...dataComCamposCalculados.map((item) => item.dias))
      : 0;

    return {
      quantidade,
      valor,
      processoMaisAntigo
    };
  }, [dataComCamposCalculados]);

  const onPage = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const onSort = (event: DataTableSortEvent) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder);
  };

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const getStatusSeverity = (status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' => {
    const valor = status.toLowerCase();

    if (['protocolado', 'concluído', 'concluido'].includes(valor)) return 'success';
    if (['pendente', 'aguardando protocolo', 'em análise', 'em analise'].includes(valor)) return 'warning';
    if (['em andamento'].includes(valor)) return 'info';
    if (['perdido', 'indeferido'].includes(valor)) return 'danger';

    return 'secondary';
  };

  const precoBodyTemplate = (rowData: ParaProtocolarTableRow) => formatarMoeda(rowData.valor);
  const dataBodyTemplate = (rowData: ParaProtocolarTableRow) => formatarData(rowData.dataEnvioOrcamento);
  const diasBodyTemplate = (rowData: ParaProtocolarTableRow) => <span className="dias-cell">{rowData.dias}</span>;
  const statusBodyTemplate = (rowData: ParaProtocolarTableRow) => (
    <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
  );

  const anexoBodyTemplate = (rowData: ParaProtocolarTableRow) => {
    return (
      <Button
        icon="pi pi-download"
        rounded
        outlined
        severity="secondary"
        aria-label={`Baixar anexo ${rowData.anexoNome}`}
        onClick={() => {
          console.log('Baixar anexo:', rowData.anexoNome);
        }}
      />
    );
  };

  const editarBodyTemplate = (rowData: ParaProtocolarTableRow) => {
    return (
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="secondary"
        aria-label={`Editar ${rowData.id}`}
        onClick={() => {
          setRegistroEditando({ ...rowData });
          setEditDialogVisible(true);
        }}
      />
    );
  };

  const protocolarBodyTemplate = (rowData: ParaProtocolarTableRow) => {
    return (
      <Button
        label="Protocolar"
        icon="pi pi-send"
        severity="success"
        outlined
        onClick={() => {
          setRegistroProtocolando({ ...rowData });
          setDataProtocolacao(null);
          setProtocolarDialogVisible(true);
        }}
      />
    );
  };

  const excluirBodyTemplate = (rowData: ParaProtocolarTableRow) => {
    return (
      <Button
        label="Não Protocolar"
        icon="pi pi-times"
        severity="danger"
        outlined
        onClick={() => {
          setRegistroNaoProtocolar({ ...rowData });
          setNaoProtocolarOpcao('');
          setNaoProtocolarObs('');
          setNaoProtocolarDialogVisible(true);
        }}
      />
    );
  };

  const filterElement = (options: any, placeholder: string) => {
    return (
      <InputText
        value={options.value || ''}
        onChange={(e) => options.filterApplyCallback(e.target.value)}
        placeholder={placeholder}
        className="p-column-filter"
      />
    );
  };

  const updateRegistroEditando = (field: keyof ParaProtocolarTableRow, value: any) => {
    if (!registroEditando) return;

    setRegistroEditando({
      ...registroEditando,
      [field]: value
    });
  };

  const handleSalvarEdicao = () => {
    if (!registroEditando) return;
    console.log('Salvar edição:', registroEditando);
    setEditDialogVisible(false);
  };

  const handleConfirmarProtocolacao = () => {
    if (!registroProtocolando) return;

    console.log('Protocolar:', {
      registro: registroProtocolando,
      dataProtocolacao
    });

    setProtocolarDialogVisible(false);
  };

  const handleConfirmarNaoProtocolar = () => {
    if (!registroNaoProtocolar || !naoProtocolarOpcao) return;

    console.log('Não protocolar:', {
      registro: registroNaoProtocolar,
      opcao: naoProtocolarOpcao,
      observacao: naoProtocolarObs
    });

    setNaoProtocolarDialogVisible(false);
  };

  return (
    <div className="para-protocolar-page">
      <div className="page-header">
        <div>
          <h1>Para Protocolar</h1>
          <p>Gestão dos processos prontos para protocolação</p>
        </div>

        <div className="page-actions">
          <Button
            label="Novo"
            icon="pi pi-plus"
          />
        </div>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Quantidade de Processos</span>
            <i className="pi pi-list"></i>
          </div>
          <div className="kpi-value">{kpis.quantidade}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Valor</span>
            <i className="pi pi-dollar"></i>
          </div>
          <div className="kpi-value">{formatarMoeda(kpis.valor)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Processo mais antigo em dias</span>
            <i className="pi pi-clock"></i>
          </div>
          <div className="kpi-value">{kpis.processoMaisAntigo}</div>
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
          selection={selectedRegistros}
          onSelectionChange={(e) => setSelectedRegistros(e.value as ParaProtocolarTableRow[])}
          tableStyle={{ minWidth: '95rem' }}
          emptyMessage="Nenhum processo encontrado."
          className="para-protocolar-table"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: ParaProtocolarTableRow) => rowData.sequencial}
          />

          <Column
            field="paciente"
            header="Paciente"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '16rem' }}
          />

          <Column
            field="cliente"
            header="Cliente"
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
            body={precoBodyTemplate}
            style={{ minWidth: '10rem' }}
          />

          <Column
            field="dataEnvioOrcamento"
            header="Data Envio Orçamento"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={dataBodyTemplate}
            style={{ minWidth: '12rem' }}
          />

          <Column
            field="dias"
            header="Dias"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={diasBodyTemplate}
            style={{ minWidth: '7rem' }}
          />

          <Column
            header="Anexo"
            body={anexoBodyTemplate}
            style={{ minWidth: '7rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />

          <Column
            field="status"
            header="Status"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={statusBodyTemplate}
            style={{ minWidth: '12rem' }}
          />

          <Column
            header="Editar"
            body={editarBodyTemplate}
            style={{ minWidth: '7rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />

          <Column
            header="Protocolar"
            body={protocolarBodyTemplate}
            style={{ minWidth: '10rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />

          <Column
            header="Excluir"
            body={excluirBodyTemplate}
            style={{ minWidth: '12rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />
        </DataTable>
      </div>

      <Dialog
        header="Editar Processo"
        visible={editDialogVisible}
        style={{ width: '60rem', maxWidth: '95vw' }}
        modal
        onHide={() => setEditDialogVisible(false)}
        className="pp-dialog"
      >
        {registroEditando && (
          <div className="pp-form-grid">
            <div className="field field-span-2">
              <label>Paciente</label>
              <InputText
                value={registroEditando.paciente}
                onChange={(e) => updateRegistroEditando('paciente', e.target.value)}
              />
            </div>

            <div className="field field-span-2">
              <label>Cliente</label>
              <InputText
                value={registroEditando.cliente}
                onChange={(e) => updateRegistroEditando('cliente', e.target.value)}
              />
            </div>

            <div className="field">
              <label>Valor</label>
              <InputNumber
                value={registroEditando.valor}
                onValueChange={(e) => updateRegistroEditando('valor', e.value)}
                mode="currency"
                currency="BRL"
                locale="pt-BR"
              />
            </div>

            <div className="field">
              <label>Número do Processo</label>
              <InputText
                value={registroEditando.numeroProcesso}
                onChange={(e) => updateRegistroEditando('numeroProcesso', e.target.value)}
              />
            </div>

            <div className="field">
              <label>Data Envio Orçamento</label>
              <InputText value={formatarData(registroEditando.dataEnvioOrcamento)} disabled />
            </div>

            <div className="field">
              <label>Status</label>
              <div className="tag-box">
                <Tag value={registroEditando.status} severity={getStatusSeverity(registroEditando.status)} />
              </div>
            </div>

            <div className="field field-span-4">
              <label>Observações</label>
              <InputTextarea
                value={registroEditando.observacoes}
                onChange={(e) => updateRegistroEditando('observacoes', e.target.value)}
                rows={4}
              />
            </div>

            <div className="field field-span-2 field-button">
              <label>&nbsp;</label>
              <Button
                label="Atualizar Anexo"
                icon="pi pi-upload"
                outlined
                onClick={() => console.log('Atualizar anexo', registroEditando)}
              />
            </div>
          </div>
        )}

        <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setEditDialogVisible(false)} />
          <Button label="Salvar" icon="pi pi-check" onClick={handleSalvarEdicao} />
        </div>
      </Dialog>

      <Dialog
        header="Protocolar Processo"
        visible={protocolarDialogVisible}
        style={{ width: '64rem', maxWidth: '95vw' }}
        modal
        onHide={() => setProtocolarDialogVisible(false)}
        className="pp-dialog"
      >
        {registroProtocolando && (
          <div className="pp-form-grid">
            <div className="field field-span-2">
              <label>Paciente</label>
              <InputText value={registroProtocolando.paciente} disabled />
            </div>

            <div className="field field-span-2">
              <label>Cliente</label>
              <InputText value={registroProtocolando.cliente} disabled />
            </div>

            <div className="field">
              <label>Valor</label>
              <InputNumber
                value={registroProtocolando.valor}
                mode="currency"
                currency="BRL"
                locale="pt-BR"
                disabled
              />
            </div>

            <div className="field">
              <label>Dias</label>
              <InputText value={String(registroProtocolando.dias)} disabled />
            </div>

            <div className="field">
              <label>Número do Processo</label>
              <InputText value={registroProtocolando.numeroProcesso} disabled />
            </div>

            <div className="field">
              <label>Procedimento</label>
              <InputText value={registroProtocolando.procedimento} disabled />
            </div>

            <div className="field field-span-4">
              <label>Observações</label>
              <InputTextarea value={registroProtocolando.observacoes} rows={4} disabled />
            </div>

            <div className="field field-span-2">
              <label>Data Protocolação</label>
              <Calendar
                value={dataProtocolacao}
                onChange={(e) => setDataProtocolacao(e.value as Date)}
                dateFormat="dd/mm/yy"
                showIcon
              />
            </div>

            <div className="field field-span-2 field-button">
              <label>&nbsp;</label>
              <Button
                label="Update Petição"
                icon="pi pi-upload"
                outlined
                onClick={() => console.log('Update petição', registroProtocolando)}
              />
            </div>

            <div className="field field-span-2 field-button">
              <label>&nbsp;</label>
              <Button
                label="Update Arquivo Extra 1"
                icon="pi pi-upload"
                outlined
                onClick={() => console.log('Update arquivo extra 1', registroProtocolando)}
              />
            </div>

            <div className="field field-span-2 field-button">
              <label>&nbsp;</label>
              <Button
                label="Update Arquivo Extra 2"
                icon="pi pi-upload"
                outlined
                onClick={() => console.log('Update arquivo extra 2', registroProtocolando)}
              />
            </div>
          </div>
        )}

        <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setProtocolarDialogVisible(false)} />
          <Button label="Confirmar Protocolação" icon="pi pi-check" onClick={handleConfirmarProtocolacao} />
        </div>
      </Dialog>

      <Dialog
        header="Não Protocolar"
        visible={naoProtocolarDialogVisible}
        style={{ width: '64rem', maxWidth: '95vw' }}
        modal
        onHide={() => setNaoProtocolarDialogVisible(false)}
        className="pp-dialog"
      >
        {registroNaoProtocolar && (
          <div className="pp-form-grid">
            <div className="field field-span-2">
              <label>Paciente</label>
              <InputText value={registroNaoProtocolar.paciente} disabled />
            </div>

            <div className="field field-span-2">
              <label>Cliente</label>
              <InputText value={registroNaoProtocolar.cliente} disabled />
            </div>

            <div className="field">
              <label>Valor</label>
              <InputNumber
                value={registroNaoProtocolar.valor}
                mode="currency"
                currency="BRL"
                locale="pt-BR"
                disabled
              />
            </div>

            <div className="field">
              <label>Dias</label>
              <InputText value={String(registroNaoProtocolar.dias)} disabled />
            </div>

            <div className="field">
              <label>Número do Processo</label>
              <InputText value={registroNaoProtocolar.numeroProcesso} disabled />
            </div>

            <div className="field">
              <label>Procedimento</label>
              <InputText value={registroNaoProtocolar.procedimento} disabled />
            </div>

            <div className="field field-span-4">
              <label>Observações</label>
              <InputTextarea value={registroNaoProtocolar.observacoes} rows={4} disabled />
            </div>

            <div className="field field-span-4">
              <label>Escolha uma opção</label>

              <div className="radio-group">
                <div className="radio-item">
                  <RadioButton
                    inputId="opcaoPerda"
                    name="naoProtocolarOpcao"
                    value="perda"
                    onChange={(e) => setNaoProtocolarOpcao(e.value)}
                    checked={naoProtocolarOpcao === 'perda'}
                  />
                  <label htmlFor="opcaoPerda">Desistir e marcar Perda</label>
                </div>

                <div className="radio-item">
                  <RadioButton
                    inputId="opcaoSegredo"
                    name="naoProtocolarOpcao"
                    value="segredo"
                    onChange={(e) => setNaoProtocolarOpcao(e.value)}
                    checked={naoProtocolarOpcao === 'segredo'}
                  />
                  <label htmlFor="opcaoSegredo">Não Protocolar e marcar como Segredo de Justiça</label>
                </div>
              </div>
            </div>

            <div className="field field-span-4">
              <label>Obs</label>
              <InputTextarea
                value={naoProtocolarObs}
                onChange={(e) => setNaoProtocolarObs(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}

        <div className="dialog-footer-actions">
          <Button label="Cancelar" outlined onClick={() => setNaoProtocolarDialogVisible(false)} />
          <Button
            label="Confirmar"
            icon="pi pi-check"
            severity="danger"
            disabled={!naoProtocolarOpcao}
            onClick={handleConfirmarNaoProtocolar}
          />
        </div>
      </Dialog>
    </div>
  );
}