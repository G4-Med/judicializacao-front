import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { getOrders, getStatusOrders, atualizarOrder, getMedicosCompleto, getAnexosOrder } from '../../services/api/orders';
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
  statusPerda: string;
  dataStatusPerda: string;
  idMedico: number | null;
}

interface ProcessoTableRow extends Processo {
  sequencial: number;
  dias: number;
}

interface Anexo {
  id: number
  linkImagem: string
  tipo: string
  createDate: string
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
  const [medicosOptions, setMedicosOptions] = useState<{label: string, value: number}[]>([]);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [loadingAnexos, setLoadingAnexos] = useState(false)
  const [anexosOrcamento, setAnexosOrcamento] = useState<any[]>([]);
  const [loadingAnexosOrcamento, setLoadingAnexosOrcamento] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [previewTipo, setPreviewTipo] = useState<'pdf' | 'imagem' | 'outro'>('outro')
  const [previewNome, setPreviewNome] = useState<string>('')
  const [anexosProtocolo, setAnexosProtocolo] = useState<any[]>([]);
  const [loadingAnexosProtocolo, setLoadingAnexosProtocolo] = useState(false);

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

  const [statusOptions, setStatusOptions] = useState<{
    statusProcesso: string[];
    statusJuridico: string[];
    statusOrcamento: string[];
    statusPerda: string[];
  }>({
    statusProcesso: [],
    statusJuridico: [],
    statusOrcamento: [],
    statusPerda: [],
  });

  

  

  // Troque statusJuridicoOptions por:
  const statusJuridicoOpts = statusOptions.statusJuridico.map(s => ({ label: s, value: s }));

  // Troque statusOrcamentoOptions por:
  const statusOrcamentoOpts = statusOptions.statusOrcamento.map(s => ({ label: s, value: s }));

  // statusPerda novo:
  const statusPerdaOpts = statusOptions.statusPerda.map(s => ({ label: s, value: s }));

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


  

  // No useEffect, carregue junto com os processos:
  useEffect(() => {
    setLoading(true);
    Promise.all([getOrders(), getStatusOrders(), getMedicosCompleto()])
     .then(([ordersRes, statusRes, medicosRes]) => {
        console.log('ordersRes', ordersRes.data);
        console.log('statusRes', statusRes.data);
        console.log('medicosRes', medicosRes.data);
        setStatusOptions(statusRes.data);
        setMedicos(medicosRes.data);


        setMedicosOptions(medicosRes.data.map((m: any) => ({
          label: m.nomeSistema,
          value: m.id,
        })));
        console.log('Médicos carregados:', medicosRes.data);


        setProcessos(ordersRes.data.map((o: any) => ({
          id: o.id,
          paciente: o.paciente ?? '',
          idade: o.dataNascimento ? calcularIdade(o.dataNascimento) : 0,
          procedimento: o.procedimento ?? '',
          refPreco: o.refPreco ?? 0,
          medico: medicosRes.data.find((m: any) => m.id === o.idMedico)?.nomeSistema ?? '',
          area: o.area ?? '',
          subarea: o.subarea ?? '',
          dataSolicitacao: o.dataPedido ?? '',
          status: o.statusProcesso ?? '',
          statusJuridico: o.statusJuridico ?? '',
          dataStatusJuridico: o.dataStatusJuridico ?? '',
          statusMedico: o.statusOrcamento ?? '',
          statusOrcamento: o.statusOrcamento ?? '',
          dataStatusOrcamento: o.dataStatusOrcamento ?? '',
          valorOrcamento: o.valorOrcamento,
          justificativaPerda: o.justificativaPerda ?? '',
          valorGanho: o.valorGanho,
          nprocesso: o.nprocesso ?? '',
          empresa: medicosRes.data.find((m: any) => m.id === o.idMedico)?.razaoSocial ?? '',
          statusPerda: o.statusPerda ?? '',
          dataStatusPerda: o.dataStatusPerda ?? '',
          idMedico: o.idMedico ?? null,
        })));
      })
      .catch(() => console.error('Erro ao carregar processos'))
      .finally(() => setLoading(false));
  }, []);


  function calcularIdade(dataNascimento: string): number {
    if (!dataNascimento) return 0;
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }


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


  const formatarData = (data?: string | null) => {
    if (!data) return '';

    const partes = data.split('-');
    if (partes.length !== 3) return '';

    const [ano, mes, dia] = partes;
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
          setProcessoEditando({ ...rowData })
          setEditDialogVisible(true)

          // 👇 carrega os anexos do tipo RELATORIO
          setAnexos([])
          setLoadingAnexos(true)
          getAnexosOrder(rowData.id, 'RELATORIO')
            .then((res) => setAnexos(res.data.anexos))
            .catch(() => setAnexos([]))
            .finally(() => setLoadingAnexos(false))

            // Busca anexos ORCAMENTO
            setLoadingAnexosOrcamento(true);
            getAnexosOrder(rowData.id, 'ORCAMENTO')
              .then((res: any) => setAnexosOrcamento(res.data.anexos))
              .catch(() => setAnexosOrcamento([]))
              .finally(() => setLoadingAnexosOrcamento(false));


            // Busca anexos PROTOCOLO
            setLoadingAnexosProtocolo(true);
            getAnexosOrder(rowData.id, 'PROTOCOLO')
              .then((res: any) => setAnexosProtocolo(res.data.anexos))
              .catch(() => setAnexosProtocolo([]))
              .finally(() => setLoadingAnexosProtocolo(false));
        }}
      />
    )
  }

  

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


  const handleSalvarEdicao = async () => {
    if (!processoEditando) return;
    try {


    const payload: any = {
      paciente: processoEditando.paciente,
      procedimento: processoEditando.procedimento,
      area: processoEditando.area,
      subarea: processoEditando.subarea,
      statusJuridico: processoEditando.statusJuridico || null,
      statusOrcamento: processoEditando.statusOrcamento || null,
      statusPerda: processoEditando.statusPerda || null,
      justificativaPerda: processoEditando.justificativaPerda || null,
      nprocesso: processoEditando.nprocesso || null,
      valorOrcamento: processoEditando.valorOrcamento,
      valorGanho: processoEditando.valorGanho,
      idMedico: processoEditando.idMedico,
    };

    console.log('🚀 PAYLOAD ENVIADO PARA API:', payload);      


      await atualizarOrder(processoEditando.id, {
        paciente: processoEditando.paciente,
        procedimento: processoEditando.procedimento,
        area: processoEditando.area,
        subarea: processoEditando.subarea,
        statusJuridico: processoEditando.statusJuridico || null,
        statusOrcamento: processoEditando.statusOrcamento || null,
        statusPerda: processoEditando.statusPerda || null,
        justificativaPerda: processoEditando.justificativaPerda || null,
        nprocesso: processoEditando.nprocesso || null,
        valorOrcamento: processoEditando.valorOrcamento,
        valorGanho: processoEditando.valorGanho,
        idMedico: processoEditando.idMedico,
      });

      // Recarrega a lista
      const { data } = await getOrders();
      setProcessos(data.map((o: any) => ({
        id: o.id,
        paciente: o.paciente ?? '',
        idade: o.dataNascimento ? calcularIdade(o.dataNascimento) : 0,
        procedimento: o.procedimento ?? '',
        refPreco: o.refPreco ?? 0,
        medico: medicos.find((m: any) => m.id === o.idMedico)?.nomeSistema ?? '',
        area: o.area ?? '',
        subarea: o.subarea ?? '',
        dataSolicitacao: o.dataPedido ?? '',
        status: o.statusProcesso ?? '',
        statusJuridico: o.statusJuridico ?? '',
        dataStatusJuridico: o.dataStatusJuridico ?? '',
        statusMedico: o.statusOrcamento ?? '',
        statusOrcamento: o.statusOrcamento ?? '',
        dataStatusOrcamento: o.dataStatusOrcamento ?? '',
        valorOrcamento: o.valorOrcamento,
        justificativaPerda: o.justificativaPerda ?? '',
        valorGanho: o.valorGanho,
        nprocesso: o.nprocesso ?? '',
        empresa: medicos.find((m: any) => m.id === o.idMedico)?.razaoSocial ?? '',
        statusPerda: o.statusPerda ?? '',
        dataStatusPerda: o.dataStatusPerda ?? '',
      })));

      setEditDialogVisible(false);
    } catch (err) {
      console.error('Erro ao salvar processo:', err);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  console.log('processos:', processos.length);
  console.log('dataComCamposCalculados:', dataComCamposCalculados.length);



 const renderAnexos = (lista: any[], loading: boolean, titulo: string) => (
  <div className="field field-span-4" style={{ marginTop: '1rem' }}>
    <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
      <i className="pi pi-paperclip" style={{ marginRight: '6px' }} />
      {titulo}
    </label>

    {loading && (
      <span style={{ fontSize: '0.9rem', color: '#888' }}>
        <i className="pi pi-spin pi-spinner" style={{ marginRight: '6px' }} />
        Carregando arquivos...
      </span>
    )}

    {!loading && lista.length === 0 && (
      <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
        Nenhum arquivo anexado.
      </span>
    )}

    {!loading && lista.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {lista.map((anexo, index) => {
          const nomeArquivo = anexo.linkImagem.split('/').pop() || `Arquivo ${index + 1}`
          const extensao = nomeArquivo.split('.').pop()?.toLowerCase()
          const icone = extensao === 'pdf'
            ? 'pi pi-file-pdf'
            : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
              ? 'pi pi-image'
              : 'pi pi-file'
          const tipo: 'pdf' | 'imagem' | 'outro' = extensao === 'pdf'
            ? 'pdf'
            : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
              ? 'imagem'
              : 'outro'

          return (
            <div
              key={anexo.id}
              onClick={() => {
                setPreviewUrl(anexo.linkImagem)
                setPreviewNome(nomeArquivo)
                setPreviewTipo(tipo)
                setPreviewVisible(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                textDecoration: 'none',
                color: '#374151',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <i className={icone} style={{ fontSize: '1.1rem', color: '#f97316' }} />
              <span style={{ flex: 1 }}>{nomeArquivo}</span>
              <i className="pi pi-eye" style={{ color: '#9ca3af', fontSize: '0.85rem' }} />
            </div>
          )
        })}
      </div>
    )}
  </div>
)
  


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
                  value={processoEditando.idMedico}
                  options={medicosOptions}
                  onChange={(e) => {
                    const medicoSelecionado = medicos.find((m: any) => m.id === e.value);

                    setProcessoEditando(prev => prev ? {
                      ...prev,
                      idMedico: e.value,
                      medico: medicoSelecionado?.nomeSistema ?? '',
                      empresa: medicoSelecionado?.razaoSocial ?? '',
                    } : null);
                  }}
                  placeholder="Selecione"
                  disabled={processoEditando.status !== 'Aguardando Orçamento'}
                  tooltip={processoEditando.status !== 'Aguardando Orçamento'
                    ? 'Disponível apenas quando status é Aguardando Orçamento'
                    : undefined}
                  tooltipOptions={{ position: 'top' }}
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
                  options={statusJuridicoOpts}
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
                  options={statusOrcamentoOpts}
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


              <div className="field field-span-2">
                <label>Status Perda</label>
                <Dropdown
                  value={processoEditando.statusPerda}
                  options={statusPerdaOpts}
                  onChange={(e) => updateProcessoEditando('statusPerda', e.value)}
                  placeholder="Selecione"
                />
              </div>

              <div className="field field-span-2">
                <label>Justificativa Perda</label>
                <InputText
                  value={processoEditando.justificativaPerda}
                  onChange={(e) => updateProcessoEditando('justificativaPerda', e.target.value)}
                />
              </div>

              <div className="field field-span-2">
                <label>Data Status Perda</label>
                <InputText
                  value={formatarData(processoEditando.dataStatusPerda)}
                  disabled
                />
              </div>

              <div className="field field-span-2">
                <label>Nº Processo</label>
                <InputText
                  value={processoEditando.nprocesso}
                  onChange={(e) => updateProcessoEditando('nprocesso', e.target.value)}
                />
              </div>

              <div className="field field-span-2">
                <label>Valor Ganho</label>
                <InputNumber
                  value={processoEditando.valorGanho ?? undefined}
                  onValueChange={(e) => updateProcessoEditando('valorGanho', e.value)}
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                />
              </div>

              <div className="field field-span-4">
                <label>Empresa</label>
                <InputText value={processoEditando.empresa} disabled />
              </div>
            </div>
          )}


          {/* Inicio Anexos */}
          {/* <div className="field field-span-4" style={{ marginTop: '1rem' }}>
            <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
              <i className="pi pi-paperclip" style={{ marginRight: '6px' }} />
              Relatórios Anexados
            </label>

            {loadingAnexos && (
              <span style={{ fontSize: '0.9rem', color: '#888' }}>
                <i className="pi pi-spin pi-spinner" style={{ marginRight: '6px' }} />
                Carregando arquivos...
              </span>
            )}

            {!loadingAnexos && anexos.length === 0 && (
              <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
                Nenhum relatório anexado.
              </span>
            )}

            {!loadingAnexos && anexos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {anexos.map((anexo, index) => {
                const nomeArquivo = anexo.linkImagem.split('/').pop() || `Arquivo ${index + 1}`
                const extensao = nomeArquivo.split('.').pop()?.toLowerCase()
                const icone = extensao === 'pdf'
                  ? 'pi pi-file-pdf'
                  : ['jpg', 'jpeg', 'png'].includes(extensao ?? '')
                    ? 'pi pi-image'
                    : 'pi pi-file'

              return (
                <a
                  key={anexo.id}
                  href={anexo.linkImagem}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '0.9rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                    <i className={icone} style={{ fontSize: '1.1rem', color: '#f97316' }} />
                    <span style={{ flex: 1 }}>{nomeArquivo}</span>
                    <i className="pi pi-download" style={{ color: '#9ca3af', fontSize: '0.85rem' }} />
                  </a>
                )
              })}

              </div>
            )}
          </div> */}

          {/* Dialog Preview de Arquivo */}
          <Dialog
            header={previewNome}
            visible={previewVisible}
            style={{ width: '80vw', maxWidth: '1100px', height: '90vh' }}
            modal
            onHide={() => setPreviewVisible(false)}
            footer={
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Button label="Baixar" icon="pi pi-download" outlined />
                </a>
                <Button label="Fechar" onClick={() => setPreviewVisible(false)} />
              </div>
            }
          >
            <div style={{ height: 'calc(90vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewTipo === 'pdf' && (
                <iframe
                  src={previewUrl}
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                  title={previewNome}
                />
              )}

              {previewTipo === 'imagem' && (
                <img
                  src={previewUrl}
                  alt={previewNome}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
                />
              )}

              {previewTipo === 'outro' && (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                  <i className="pi pi-file" style={{ fontSize: '3rem', marginBottom: '12px', display: 'block' }} />
                  <p>Este tipo de arquivo não pode ser visualizado inline.</p>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" download>
                    <Button label="Baixar arquivo" icon="pi pi-download" />
                  </a>
                </div>
              )}
            </div>
          </Dialog>

          {renderAnexos(anexos, loadingAnexos, 'Relatórios Anexados')}
          {/* Fim Anexos */}


          {/* Inicio Orçamentos */}


          {renderAnexos(anexosOrcamento, loadingAnexosOrcamento, 'Orçamentos Anexados')}
          {/* Fim dos Orçamentos */}


          {/* Inicio Protocolos */}
          {renderAnexos(anexosProtocolo, loadingAnexosProtocolo, 'Protocolos Anexados')}
          {/* Fim dos Protocolos */}
          


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