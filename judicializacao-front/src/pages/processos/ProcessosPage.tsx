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
import { FilterMatchMode } from 'primereact/api';
import { TieredMenu } from 'primereact/tieredmenu';
import type { MenuItem } from 'primereact/menuitem';
import { useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import './ProcessosPage.css';

interface Processo {
  id: number;
  paciente: string;
  idade: number;
  procedimento: string;
  refPreco: number;
  medico: string;
  area: string;
  subarea: string;
  dataSolicitacao: string;
  status: string;
  statusJuridico: string;
  dataStatusJuridico: string;
  statusMedico: string;
  statusOrcamento: string;
  dataStatusOrcamento: string;
  valorOrcamento: number | null;
  justificativaPerda: string;
  situacao: string;
  dataSituacao: string;
  valorGanho: number | null;
  nprocesso: string;
  empresa: string;
}

interface ProcessoTableRow extends Processo {
  sequencial: number;
  dias: number;
}

export function ProcessosPage() {
  const [loading, setLoading] = useState(false);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selectedProcessos, setSelectedProcessos] = useState<ProcessoTableRow[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);
  const massActionMenuRef = useRef<TieredMenu>(null);
  const [processoMenuSelecionado, setProcessoMenuSelecionado] = useState<ProcessoTableRow | null>(null);
  const rowActionMenuRef = useRef<TieredMenu>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [processoEditando, setProcessoEditando] = useState<ProcessoTableRow | null>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    paciente: { value: '', matchMode: FilterMatchMode.CONTAINS },
    idade: { value: '', matchMode: FilterMatchMode.CONTAINS },
    procedimento: { value: '', matchMode: FilterMatchMode.CONTAINS },
    refPreco: { value: '', matchMode: FilterMatchMode.CONTAINS },
    medico: { value: '', matchMode: FilterMatchMode.CONTAINS },
    area: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dataSolicitacao: { value: '', matchMode: FilterMatchMode.CONTAINS },
    dias: { value: '', matchMode: FilterMatchMode.CONTAINS },
    status: { value: '', matchMode: FilterMatchMode.CONTAINS },
    statusJuridico: { value: '', matchMode: FilterMatchMode.CONTAINS },
    statusMedico: { value: '', matchMode: FilterMatchMode.CONTAINS }
  });


  const medicoOptions = [
    { label: 'BRUNO FAJARDO', value: 'BRUNO FAJARDO' },
    { label: 'VITOR GROPPO', value: 'VITOR GROPPO' },
    { label: 'IBG', value: 'IBG' }
  ];

  const statusJuridicoOptions = [
    { label: 'Aguardando protocolo', value: 'Aguardando protocolo' },
    { label: 'Protocolado', value: 'Protocolado' },
    { label: 'Em petição', value: 'Em petição' },
    { label: 'Indeferido', value: 'Indeferido' },
    { label: 'Triagem', value: 'Triagem' }
  ];

  const statusOrcamentoOptions = [
    { label: 'Aguardando cotação', value: 'Aguardando cotação' },
    { label: 'Cotado', value: 'Cotado' },
    { label: 'Não cotar', value: 'Não cotar' },
    { label: 'Orçamento enviado', value: 'Orçamento enviado' }
  ];

  const massActionItems: MenuItem[] = [
    {
      label: 'Jurídico',
      icon: 'pi pi-briefcase',
      items: [
        {
          label: 'Cotar',
          icon: 'pi pi-check',
          command: () => handleMassAction('cotar')
        },
        {
          label: 'Não Cotar',
          icon: 'pi pi-times',
          command: () => handleMassAction('nao_cotar')
        },
        {
          label: 'Segredo de Justiça',
          icon: 'pi pi-lock',
          command: () => handleMassAction('segredo_justica')
        }
      ]
    },
    {
      label: 'Definir Médico',
      icon: 'pi pi-user-edit',
      items: [
        {
          label: 'BRUNO FAJARDO',
          command: () => handleMassAction('bruno_fajardo')
        },
        {
          label: 'VITOR GROPPO',
          command: () => handleMassAction('vitor_groppo')
        },
        {
          label: 'IBG',
          command: () => handleMassAction('ibg')
        }
      ]
    },
    {
      label: 'Solicitar Médico',
      icon: 'pi pi-send',
      items: [
        {
          label: 'Solicitado ao médico',
          command: () => handleMassAction('solicitado_medico')
        },
        {
          label: 'Solicitado Exames',
          command: () => handleMassAction('solicitado_exames')
        },
        {
          label: 'Médico Recusou',
          command: () => handleMassAction('medico_recusou')
        }
      ]
    }
  ];

  const handleRowAction = (action: string, rowData: ProcessoTableRow | null) => {
    if (!rowData) return;

    console.log('Ação da linha:', {
      action,
      processo: rowData
    });
  };



  const rowActionItems: MenuItem[] = [
    {
      label: 'Definir Médico',
      icon: 'pi pi-user-edit',
      items: [
        {
          label: 'BRUNO FAJARDO',
          command: () => handleRowAction('bruno_fajardo', processoMenuSelecionado)
        },
        {
          label: 'VITOR GROPPO',
          command: () => handleRowAction('vitor_groppo', processoMenuSelecionado)
        },
        {
          label: 'IBG',
          command: () => handleRowAction('ibg', processoMenuSelecionado)
        }
      ]
    },
    {
      label: 'Jurídico',
      icon: 'pi pi-briefcase',
      items: [
        {
          label: 'Cotar',
          command: () => handleRowAction('cotar', processoMenuSelecionado)
        },
        {
          label: 'Não Cotar',
          command: () => handleRowAction('nao_cotar', processoMenuSelecionado)
        },
        {
          label: 'Segredo de Justiça',
          command: () => handleRowAction('segredo_justica', processoMenuSelecionado)
        }
      ]
    },
    {
      label: 'Solicitar Médico',
      icon: 'pi pi-send',
      items: [
        {
          label: 'Solicitado ao médico',
          command: () => handleRowAction('solicitado_medico', processoMenuSelecionado)
        },
        {
          label: 'Solicitado Exames',
          command: () => handleRowAction('solicitado_exames', processoMenuSelecionado)
        },
        {
          label: 'Médico Recusou',
          command: () => handleRowAction('medico_recusou', processoMenuSelecionado)
        }
      ]
    },
    {
      separator: true
    },
    {
      label: 'Criar Orçamento',
      icon: 'pi pi-file-plus',
      command: () => handleRowAction('criar_orcamento', processoMenuSelecionado)
    },
    {
      label: 'Copiar linha',
      icon: 'pi pi-copy',
      command: () => handleRowAction('copiar_linha', processoMenuSelecionado)
    },
    {
      label: 'Buscar Ref. Preço',
      icon: 'pi pi-search',
      command: () => handleRowAction('buscar_ref_preco', processoMenuSelecionado)
    },
    {
      separator: true
    },
    {
      label: 'Enviar SES',
      icon: 'pi pi-send',
      command: () => handleRowAction('enviar_ses', processoMenuSelecionado)
    },
    {
      label: 'Enviar SES/Protocolar',
      icon: 'pi pi-directions-alt',
      command: () => handleRowAction('enviar_ses_protocolar', processoMenuSelecionado)
    },
    {
      label: 'Enviar Perda',
      icon: 'pi pi-times-circle',
      command: () => handleRowAction('enviar_perda', processoMenuSelecionado)
    }
  ];


  const acoesBodyTemplate = (rowData: ProcessoTableRow) => {
    return (
      <Button
        icon="pi pi-bars"
        rounded
        outlined
        severity="secondary"
        aria-label={`Ações do processo ${rowData.id}`}
        onClick={(event) => {
          setProcessoMenuSelecionado(rowData);
          rowActionMenuRef.current?.toggle(event);
        }}
      />
    );
  };

  useEffect(() => {
    setLoading(true);

    const mock: Processo[] = [
      {
        id: 1,
        paciente: 'Maria Helena Souza',
        idade: 54,
        procedimento: 'Artroplastia total de joelho',
        refPreco: 18500,
        medico: 'BRUNO FAJARDO',
        area: 'Ortopedia',
        subarea: 'Joelho',
        dataSolicitacao: '2026-03-10',
        status: 'Pendente',
        statusJuridico: 'Aguardando protocolo',
        dataStatusJuridico: '2026-03-10',
        statusMedico: 'Em análise',
        statusOrcamento: 'Aguardando cotação',
        dataStatusOrcamento: '2026-03-10',
        valorOrcamento: null,
        justificativaPerda: '',
        situacao: 'Em aberto',
        dataSituacao: '2026-03-10',
        valorGanho: null,
        nprocesso: 'PROC-0001',
        empresa: 'G4MED'
      },
      {
        id: 2,
        paciente: 'João Pedro Santos',
        idade: 37,
        procedimento: 'Herniorrafia inguinal',
        refPreco: 9200,
        medico: 'Dra. Camila Freitas',
        area: 'Cirurgia Geral',
        subarea: 'Geral',
        dataSolicitacao: '2026-03-05',
        status: 'Protocolado',
        statusJuridico: 'Aguardando protocolo',
        dataStatusJuridico: '2026-03-10',
        statusMedico: 'Em análise',
        statusOrcamento: 'Aguardando cotação',
        dataStatusOrcamento: '2026-03-10',
        valorOrcamento: null,
        justificativaPerda: '',
        situacao: 'Em aberto',
        dataSituacao: '2026-03-10',
        valorGanho: null,
        nprocesso: 'PROC-0001',
        empresa: 'G4MED'
      },
      {
        id: 3,
        paciente: 'Ana Cláudia Costa',
        idade: 62,
        procedimento: 'Cirurgia bariátrica',
        refPreco: 27500,
        medico: 'Dr. Felipe Andrade',
        area: 'Gastro',
        subarea: 'Geral',
        dataSolicitacao: '2026-02-28',
        status: 'Em andamento',
        statusJuridico: 'Em petição',
        dataStatusJuridico: '2026-03-10',
        statusMedico: 'Em análise',
        statusOrcamento: 'Aguardando cotação',
        dataStatusOrcamento: '2026-03-10',
        valorOrcamento: null,
        justificativaPerda: '',
        situacao: 'Em aberto',
        dataSituacao: '2026-03-10',
        valorGanho: null,
        nprocesso: 'PROC-0001',
        empresa: 'G4MED'
      },
      {
        id: 4,
        paciente: 'Carlos Eduardo Rocha',
        idade: 45,
        procedimento: 'Discectomia lombar',
        refPreco: 21000,
        medico: 'Dra. Juliana Alves',
        area: 'Neurocirurgia',
        subarea: 'Geral',
        dataSolicitacao: '2026-03-01',
        status: 'Perdido',
        statusJuridico: 'Indeferido',
        dataStatusJuridico: '2026-03-10',
        statusMedico: 'Em análise',
        statusOrcamento: 'Aguardando cotação',
        dataStatusOrcamento: '2026-03-10',
        valorOrcamento: null,
        justificativaPerda: '',
        situacao: 'Em aberto',
        dataSituacao: '2026-03-10',
        valorGanho: null,
        nprocesso: 'PROC-0001',
        empresa: 'G4MED'
      },
      {
        id: 5,
        paciente: 'Fernanda Lopes',
        idade: 29,
        procedimento: 'Mamoplastia redutora',
        refPreco: 14500,
        medico: 'Dr. Henrique Prado',
        area: 'Plástica',
        subarea: 'Geral',
        dataSolicitacao: '2026-03-12',
        status: 'Pendente',
        statusJuridico: 'Triagem',
        dataStatusJuridico: '2026-03-10',
        statusMedico: 'Em análise',
        statusOrcamento: 'Aguardando cotação',
        dataStatusOrcamento: '2026-03-10',
        valorOrcamento: null,
        justificativaPerda: '',
        situacao: 'Em aberto',
        dataSituacao: '2026-03-10',
        valorGanho: null,
        nprocesso: 'PROC-0001',
        empresa: 'G4MED'
      }
    ];


    const timer = setTimeout(() => {
      setProcessos(mock);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);



  const handleMassAction = (action: string) => {
    if (!selectedProcessos.length) return;

    console.log('Ação em massa:', action, selectedProcessos);
  };


  const dataComCamposCalculados = useMemo<ProcessoTableRow[]>(() => {
    const hoje = new Date();

    return processos.map((item, index) => {
      const dataSolicitacao = new Date(`${item.dataSolicitacao}T00:00:00`);
      const diferencaMs = hoje.getTime() - dataSolicitacao.getTime();
      const dias = Math.max(0, Math.floor(diferencaMs / (1000 * 60 * 60 * 24)));

      return {
        ...item,
        sequencial: index + 1,
        dias
      };
    });
  }, [processos]);

  const onPage = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const onSort = (event: DataTableSortEvent) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder);
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const getStatusSeverity = (status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' => {
    const valor = status.toLowerCase();

    if (['protocolado', 'aprovado', 'deferido', 'concluído', 'concluido'].includes(valor)) return 'success';
    if (['pendente', 'triagem', 'em análise', 'em analise', 'aguardando protocolo', 'aguardando laudo'].includes(valor)) return 'warning';
    if (['em andamento', 'em petição', 'em peticao'].includes(valor)) return 'info';
    if (['indeferido', 'perdido', 'negado'].includes(valor)) return 'danger';

    return 'secondary';
  };

  const statusBodyTemplate = (rowData: ProcessoTableRow, field: 'status' | 'statusJuridico' | 'statusMedico') => {
    return <Tag value={rowData[field]} severity={getStatusSeverity(rowData[field])} />;
  };

  const precoBodyTemplate = (rowData: ProcessoTableRow) => {
    return formatarMoeda(rowData.refPreco);
  };

  const dataBodyTemplate = (rowData: ProcessoTableRow) => {
    return formatarData(rowData.dataSolicitacao);
  };

  const diasBodyTemplate = (rowData: ProcessoTableRow) => {
    return <span className="dias-cell">{rowData.dias}</span>;
  };


  const editarBodyTemplate = (rowData: ProcessoTableRow) => {
    return (
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="secondary"
        aria-label={`Editar processo ${rowData.id}`}
        onClick={() => {
          setProcessoEditando({ ...rowData });
          setEditDialogVisible(true);
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



  const kpis = useMemo(() => {
    return {
      pedidosPendentes: dataComCamposCalculados.filter(
        (item) => item.status.toLowerCase() === 'pendente'
      ).length,

      aguardandoJuridico: dataComCamposCalculados.filter(
        (item) =>
          item.statusJuridico.toLowerCase().includes('aguardando') ||
          item.statusJuridico.toLowerCase().includes('triagem')
      ).length,

      aguardandoOrcamento: dataComCamposCalculados.filter(
        (item) =>
          item.statusJuridico.toLowerCase().includes('cotar') ||
          item.statusJuridico.toLowerCase().includes('orçamento') ||
          item.statusJuridico.toLowerCase().includes('orcamento')
      ).length,

      enviadoAoMedico: dataComCamposCalculados.filter(
        (item) =>
          item.statusMedico.toLowerCase().includes('análise') ||
          item.statusMedico.toLowerCase().includes('analise') ||
          item.statusMedico.toLowerCase().includes('aprovado')
      ).length,

      aguardandoExames: dataComCamposCalculados.filter(
        (item) => item.statusMedico.toLowerCase().includes('exames')
      ).length
    };
  }, [dataComCamposCalculados]);




  const updateProcessoEditando = (field: keyof ProcessoTableRow, value: any) => {
    if (!processoEditando) return;

    setProcessoEditando({
      ...processoEditando,
      [field]: value
    });
  };

  const handleSalvarEdicao = () => {
    if (!processoEditando) return;

    console.log('Salvar processo:', processoEditando);

    // depois vamos integrar com backend
    setEditDialogVisible(false);
  };

  return (

    
    <div className="processos-page">
      <div className="page-header">
        <div>
          <h1>Processos</h1>
          <p>Gestão dos processos de judicialização</p>
        </div>

      <div className="page-actions">
        <TieredMenu model={massActionItems} popup ref={massActionMenuRef} id="mass_action_menu" />

      <Button
        label="Ações em massa"
        icon="pi pi-bars"
        outlined
        onClick={(event) => massActionMenuRef.current?.toggle(event)}
        aria-controls="mass_action_menu"
        aria-haspopup
      />

        <Button
          label="Novo processo"
          icon="pi pi-plus"
        />
      </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Pedidos Pendentes</span>
            <i className="pi pi-clock"></i>
          </div>
          <div className="kpi-value">{kpis.pedidosPendentes}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Aguardando Jurídico</span>
            <i className="pi pi-briefcase"></i>
          </div>
          <div className="kpi-value">{kpis.aguardandoJuridico}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Aguardando Orçamento</span>
            <i className="pi pi-file-edit"></i>
          </div>
          <div className="kpi-value">{kpis.aguardandoOrcamento}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Enviado ao Médico</span>
            <i className="pi pi-send"></i>
          </div>
          <div className="kpi-value">{kpis.enviadoAoMedico}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Aguardando Exames</span>
            <i className="pi pi-search"></i>
          </div>
          <div className="kpi-value">{kpis.aguardandoExames}</div>
        </div>
      </div>

      <TieredMenu
        model={rowActionItems}
        popup
        ref={rowActionMenuRef}
        id="row_action_menu"
      />

      <div className="card">
        <DataTable
          value={dataComCamposCalculados}
          dataKey="id"
          paginator
          lazy={false}
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
          onSelectionChange={(e) => setSelectedProcessos(e.value as ProcessoTableRow[])}
          tableStyle={{ minWidth: '110rem' }}
          emptyMessage="Nenhum processo encontrado."
          className="processos-table"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: ProcessoTableRow) => rowData.sequencial}
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
            field="idade"
            header="Idade"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '7rem' }}
          />

          <Column
            field="procedimento"
            header="Procedimento"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '18rem' }}
          />

          <Column
            field="refPreco"
            header="Ref. Preço"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={precoBodyTemplate}
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
            field="area"
            header="Área"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '10rem' }}
          />

          <Column
            field="dataSolicitacao"
            header="Data da Solicitação"
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
            field="status"
            header="Status"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={(rowData: ProcessoTableRow) => statusBodyTemplate(rowData, 'status')}
            style={{ minWidth: '12rem' }}
          />

          <Column
            field="statusJuridico"
            header="Status Jurídico"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={(rowData: ProcessoTableRow) => statusBodyTemplate(rowData, 'statusJuridico')}
            style={{ minWidth: '14rem' }}
          />

          <Column
            field="statusMedico"
            header="Status Médico"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={(rowData: ProcessoTableRow) => statusBodyTemplate(rowData, 'statusMedico')}
            style={{ minWidth: '14rem' }}
          />

          <Column
            header="Ações"
            body={acoesBodyTemplate}
            style={{ minWidth: '7rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />

          <Column
            header="Editar"
            body={editarBodyTemplate}
            style={{ minWidth: '7rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />
        </DataTable>


        {/* Inicio Dialog para edição de processo */}
        <Dialog
          header="Editar Processo"
          visible={editDialogVisible}
          style={{ width: '78rem', maxWidth: '96vw' }}
          modal
          onHide={() => setEditDialogVisible(false)}
          className="processo-edit-dialog"
        >
          {processoEditando && (
            <div className="processo-form-grid-v2">
              <div className="field field-span-3">
                <label>Paciente</label>
                <InputText
                  value={processoEditando.paciente}
                  onChange={(e) => updateProcessoEditando('paciente', e.target.value)}
                />
              </div>

              <div className="field field-span-1">
                <label>Idade do Paciente</label>
                <InputNumber
                  value={processoEditando.idade}
                  onValueChange={(e) => updateProcessoEditando('idade', e.value)}
                  useGrouping={false}
                />
              </div>

              <div className="field field-span-4">
                <label>Procedimento</label>
                <InputText
                  value={processoEditando.procedimento}
                  onChange={(e) => updateProcessoEditando('procedimento', e.target.value)}
                />
              </div>

              <div className="field field-span-2">
                <label>Área</label>
                <InputText
                  value={processoEditando.area}
                  onChange={(e) => updateProcessoEditando('area', e.target.value)}
                />
              </div>

              <div className="field field-span-2">
                <label>Subárea</label>
                <InputText
                  value={processoEditando.subarea}
                  onChange={(e) => updateProcessoEditando('subarea', e.target.value)}
                />
              </div>

              <div className="field field-span-2">
                <label>Médico</label>
                <Dropdown
                  value={processoEditando.medico}
                  options={medicoOptions}
                  onChange={(e) => updateProcessoEditando('medico', e.value)}
                  placeholder="Selecione"
                />
              </div>

              <div className="field field-span-1">
                <label>Ref. Preço</label>
                <InputNumber
                  value={processoEditando.refPreco}
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                  disabled
                />
              </div>

              <div className="field field-span-1 field-button">
                <label>&nbsp;</label>
                <Button
                  label="Atualizar Ref. Preço"
                  icon="pi pi-refresh"
                  outlined
                  onClick={() => console.log('Atualizar referência de preço', processoEditando)}
                />
              </div>

              <div className="field field-span-1">
                <label>Data do Pedido</label>
                <InputText value={formatarData(processoEditando.dataSolicitacao)} disabled />
              </div>

              <div className="field field-span-1">
                <label>Status do Processo</label>
                <div className="tag-readonly tag-box">
                  <Tag
                    value={processoEditando.status}
                    severity={getStatusSeverity(processoEditando.status)}
                  />
                </div>
              </div>

              <div className="field field-span-1">
                <label>Status Jurídico</label>
                <Dropdown
                  value={processoEditando.statusJuridico}
                  options={statusJuridicoOptions}
                  onChange={(e) => updateProcessoEditando('statusJuridico', e.value)}
                  placeholder="Selecione"
                />
              </div>

              <div className="field field-span-1">
                <label>Data Status Jurídico</label>
                <InputText value={formatarData(processoEditando.dataStatusJuridico)} disabled />
              </div>

              <div className="field field-span-1">
                <label>Status Orçamento</label>
                <Dropdown
                  value={processoEditando.statusOrcamento}
                  options={statusOrcamentoOptions}
                  onChange={(e) => updateProcessoEditando('statusOrcamento', e.value)}
                  placeholder="Selecione"
                />
              </div>

              <div className="field field-span-1">
                <label>Data Status Orçamento</label>
                <InputText value={formatarData(processoEditando.dataStatusOrcamento)} disabled />
              </div>

              <div className="field field-span-2">
                <label>Valor Orçamento</label>
                <InputNumber
                  value={processoEditando.valorOrcamento ?? undefined}
                  onValueChange={(e) => updateProcessoEditando('valorOrcamento', e.value)}
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                />
              </div>

              <div className="field field-span-1">
                <label>Situação</label>
                <InputText value={processoEditando.situacao} disabled />
              </div>

              <div className="field field-span-1">
                <label>Data Situação</label>
                <InputText value={formatarData(processoEditando.dataSituacao)} disabled />
              </div>

              <div className="field field-span-4">
                <label>Justificativa Perda</label>
                <InputText value={processoEditando.justificativaPerda} disabled />
              </div>

              <div className="field field-span-2">
                <label>Valor Ganho</label>
                <InputNumber
                  value={processoEditando.valorGanho ?? undefined}
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                  disabled
                />
              </div>

              <div className="field field-span-2">
                <label>Nº Processo</label>
                <InputText value={processoEditando.nprocesso} disabled />
              </div>

              <div className="field field-span-4">
                <label>Empresa</label>
                <InputText value={processoEditando.empresa} disabled />
              </div>
            </div>
          )}

          <div className="dialog-footer-actions">
            <Button
              label="Cancelar"
              outlined
              onClick={() => setEditDialogVisible(false)}
            />
            <Button
              label="Salvar"
              icon="pi pi-check"
              onClick={handleSalvarEdicao}
            />
          </div>
        </Dialog>
        {/* Fim Dialog para edição de processo */}


      </div>
    </div>





  );
}