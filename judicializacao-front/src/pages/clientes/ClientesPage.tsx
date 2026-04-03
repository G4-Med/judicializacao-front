import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type {
  DataTableFilterMeta,
  DataTablePageEvent,
  DataTableSortEvent
} from 'primereact/datatable';
import {
  getMedicos, getMedicosCompleto, createMedico, updateMedico,
  createDadosMedico, updateDadosMedico,
  createEmpresaMedico, updateEmpresaMedico,
  createDadosPessoais, updateDadosPessoais,
  createDadosBancarios, updateDadosBancarios,
  getDadosMedico, getEmpresaMedico,
  getDadosPessoais, getDadosBancarios,
  cadastrarUsuarioMedico, verificarUsuarioMedico,
  getBaseOrcamento, salvarBaseOrcamento
} from '../../services/api/client';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import './ClientesPage.css';

interface Cliente {
  id: number;
  razaoSocial: string;
  nomeMedico: string;
  nomeSistema: string;
  crm: string;
  rqe: string;
  hospital: string;
  especialidade: string;
  subespecialidade: string;
  keywords: string;
  telefone: string;
  email: string;
  cnpj: string;
  grupoWhatsapp: string;
  modoValidacao: string;
  status: boolean;
  emailAcesso: string;
  contrato: boolean;
  procuracao: boolean;
  arquivoAdicional: boolean;
  createDate: string;
  updateDate: string;

  nomeCompleto: string;
  cpf: string;
  rg: string;
  estadoCivil: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;

  fantasia: string;
  pjRua: string;
  pjNumero: string;
  pjComplemento: string;
  pjBairro: string;
  pjCidade: string;
  pjEstado: string;
  pjCep: string;

  nomeConta: string;
  numeroBanco: string;
  nomeBanco: string;
  agencia: string;
  tipoConta: string;
  numeroConta: string;
  chavePix: string;

  contratoArquivo?: File | null;
  procuracaoArquivo?: File | null;
  arquivoAdicionalArquivo?: File | null;

}
interface ClienteTableRow extends Cliente {
  sequencial: number;
}

const baseOrcamentoInicial = {
  honorariosEquipeMedica: false,
  taxasHospitalares: false,
  materiaisOpme: false,
  medicamentosDiaria: false,
  examesPreOperatorios: false,
  consultaPosOperatoria: false,
  atendimentoEnfermagem: false,
  acompanhanteTaxaAdicional: false,
  fisioterapiaPosOperatoria: false,
  medicamentosPosAlta: false,
  ortesesImobilizadores: false,
  examesComplementares: false,
  custoCtiBemodinamica: false,
  linkBaseOrcamento: '',
  linkAssinatura: '',
};

const clienteInicial: ClienteTableRow = {
  id: 0,
  sequencial: 0,
  razaoSocial: '',
  nomeMedico: '',
  nomeSistema: '',
  crm: '',
  rqe: '',
  hospital: '',
  especialidade: '',
  subespecialidade: '',
  keywords: '',
  telefone: '',
  email: '',
  cnpj: '',
  grupoWhatsapp: '',
  modoValidacao: '',
  status: true,
  emailAcesso: '',
  contrato: false,
  procuracao: false,
  arquivoAdicional: false,
  createDate: '',
  updateDate: '',

  nomeCompleto: '',
  cpf: '',
  rg: '',
  estadoCivil: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',

  fantasia: '',
  pjRua: '',
  pjNumero: '',
  pjComplemento: '',
  pjBairro: '',
  pjCidade: '',
  pjEstado: '',
  pjCep: '',

  nomeConta: '',
  numeroBanco: '',
  nomeBanco: '',
  agencia: '',
  tipoConta: '',
  numeroConta: '',
  chavePix: '',
  contratoArquivo: null,
  procuracaoArquivo: null,
  arquivoAdicionalArquivo: null
};

export function ClientesPage() {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedClientes, setSelectedClientes] = useState<ClienteTableRow[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [novoCliente, setNovoCliente] = useState<ClienteTableRow>(clienteInicial);
  const [usuarioCadastrado, setUsuarioCadastrado] = useState(false);
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [baseOrcamentoArquivo, setBaseOrcamentoArquivo] = useState<File | null>(null);
  const [baseOrcamento, setBaseOrcamento] = useState(baseOrcamentoInicial);
  const [assinaturaDialogVisible, setAssinaturaDialogVisible] = useState(false);
  const [savingBase, setSavingBase] = useState(false);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    razaoSocial: { value: '', matchMode: FilterMatchMode.CONTAINS },
    nomeSistema: { value: '', matchMode: FilterMatchMode.CONTAINS },
    crm: { value: '', matchMode: FilterMatchMode.CONTAINS },
    especialidade: { value: '', matchMode: FilterMatchMode.CONTAINS },
    status: { value: '', matchMode: FilterMatchMode.CONTAINS },
    contrato: { value: '', matchMode: FilterMatchMode.CONTAINS },
    procuracao: { value: '', matchMode: FilterMatchMode.CONTAINS }
  });



  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<ClienteTableRow | null>(null);

  const hospitalOptions = [
    { label: 'Hospital Monte Sinai', value: 'Hospital Monte Sinai' },
    { label: 'Hospital Albert Sabin', value: 'Hospital Albert Sabin' },
    { label: 'Hospital Unimed', value: 'Hospital Unimed' }
  ];

  const especialidadeOptions = [
    { label: 'Ortopedia', value: 'Ortopedia' },
    { label: 'Cardiologia', value: 'Cardiologia' },
    { label: 'Neurocirurgia', value: 'Neurocirurgia' },
    { label: 'Cirurgia Geral', value: 'Cirurgia Geral' }
  ];

  const estadoCivilOptions = [
    { label: 'Solteiro(a)', value: 'Solteiro(a)' },
    { label: 'Casado(a)', value: 'Casado(a)' },
    { label: 'Divorciado(a)', value: 'Divorciado(a)' },
    { label: 'Viúvo(a)', value: 'Viúvo(a)' }
  ];

  const cidadeOptions = [
    { label: 'Juiz de Fora', value: 'Juiz de Fora' },
    { label: 'Belo Horizonte', value: 'Belo Horizonte' },
    { label: 'Rio de Janeiro', value: 'Rio de Janeiro' }
  ];

  const estadoOptions = [
    { label: 'MG', value: 'MG' },
    { label: 'RJ', value: 'RJ' },
    { label: 'SP', value: 'SP' }
  ];

  const statusOptions = [
    { label: 'Ativo', value: true },
    { label: 'Inativo', value: false }
  ];

  const bancoOptions = [
    { label: 'Banco do Brasil', value: 'Banco do Brasil' },
    { label: 'Caixa', value: 'Caixa' },
    { label: 'Itaú', value: 'Itaú' },
    { label: 'Bradesco', value: 'Bradesco' },
    { label: 'Santander', value: 'Santander' }
  ];

  const tipoContaOptions = [
    { label: 'Conta Corrente', value: 'Conta Corrente' },
    { label: 'Conta Poupança', value: 'Conta Poupança' }
  ];

  useEffect(() => {
  setLoading(true);
  getMedicosCompleto()
    .then(({ data }) => {
      setClientes(data.map((m: any) => ({
        id: m.id,
        nomeMedico: m.nomeMedico,        // ← era m.nomeCompleto
        nomeSistema: m.nomeSistema,
        especialidade: m.especialidade ?? '',
        subespecialidade: m.subespecialidade ?? '',
        keywords: m.keywords ?? '',
        grupoWhatsapp: m.grupoWhatsapp ?? '',
        status: m.status,
        createDate: m.createDate?.split('T')[0] ?? '',
        updateDate: m.updateDate?.split('T')[0] ?? '',
        crm: m.crm ?? '',              // ← era ''
        razaoSocial: m.razaoSocial ?? '',  // ← era ''
        cnpj: m.cnpj ?? '',
        contrato: m.contrato ?? false,
        procuracao: m.procuracao ?? false,
        arquivoAdicional: m.arquivoAdicional ?? false,
        rqe: '', hospital: '', telefone: '', email: '', modoValidacao: '', emailAcesso: '',
        nomeCompleto: '', cpf: '', rg: '', estadoCivil: '',
        rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '',
        fantasia: m.fantasia ?? '',
        pjRua: '', pjNumero: '', pjComplemento: '', pjBairro: '',
        pjCidade: '', pjEstado: '', pjCep: '',
        nomeConta: '', numeroBanco: '', nomeBanco: '', agencia: '',
        tipoConta: '', numeroConta: '', chavePix: ''
      })));
    })
    .catch(() => console.error('Erro ao carregar médicos'))
    .finally(() => setLoading(false));

    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const dataComSequencial = useMemo<ClienteTableRow[]>(() => {
    return clientes.map((item, index) => ({
      ...item,
      sequencial: index + 1
    }));
  }, [clientes]);

  const kpis = useMemo(() => {
    return {
      totalClientes: dataComSequencial.length,
      clientesAtivos: dataComSequencial.filter((item) => item.status).length,
      cadastrosCompletos: dataComSequencial.filter(
        (item) => item.contrato && item.procuracao && item.arquivoAdicional
      ).length,
      faltaDocumentacao: dataComSequencial.filter(
        (item) => !item.contrato || !item.procuracao || !item.arquivoAdicional
      ).length
    };
  }, [dataComSequencial]);

  const onPage = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const onSort = (event: DataTableSortEvent) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder);
  };

  const getBooleanTag = (value: boolean) => {
    return <Tag value={value ? 'Ativo' : 'Inativo'} severity={value ? 'success' : 'danger'} />;
  };

  const getDocumentoTag = (value: boolean) => {
    return <Tag value={value ? 'Ativo' : 'Inativo'} severity={value ? 'success' : 'danger'} />;
  };

const editarBodyTemplate = (rowData: ClienteTableRow) => {
  return (
    <Button
      icon="pi pi-pencil"
      rounded
      outlined
      severity="secondary"
      aria-label={`Editar cliente ${rowData.id}`}
      onClick={async () => {
        try {
          const [dadosMed, empresa, pessoais, bancarios] = await Promise.all([
            getDadosMedico(rowData.id),
            getEmpresaMedico(rowData.id),
            getDadosPessoais(rowData.id),
            getDadosBancarios(rowData.id),
          ]);

          const { data: usuarioData } = await verificarUsuarioMedico(rowData.id);
          setUsuarioCadastrado(usuarioData.cadastrado);

          const dm = dadosMed.data[0] ?? {};
          const em = empresa.data[0] ?? {};
          const dp = pessoais.data[0] ?? {};
          const db = bancarios.data[0] ?? {};

          setClienteEditando({
            ...rowData,
            crm: dm.CRM ?? '',
            rqe: dm.RQE ?? '',
            hospital: dm.hospital ?? '',
            telefone: dm.telefone ?? '',
            email: dm.email ?? '',
            emailAcesso: dm.emailAcesso ?? '',
            cnpj: em.CNPJ ?? '',
            razaoSocial: em.razaoSocial ?? '',
            fantasia: em.fantasia ?? '',
            pjRua: em.rua ?? '',
            pjNumero: em.numero ?? '',
            pjComplemento: em.complemento ?? '',
            pjBairro: em.bairro ?? '',
            pjCidade: em.cidade ?? '',
            pjEstado: em.estado ?? '',
            pjCep: em.cep ?? '',
            contrato: em.contrato ?? false,
            procuracao: em.procuracao ?? false,
            arquivoAdicional: em.arquivoAdicional ?? false,
            nomeCompleto: dp.nomeCompleto ?? '',
            cpf: dp.CPF ?? '',
            rg: dp.RG ?? '',
            estadoCivil: dp.estadoCivil ?? '',
            rua: dp.rua ?? '',
            numero: dp.numero ?? '',
            complemento: dp.complemento ?? '',
            bairro: dp.bairro ?? '',
            cidade: dp.cidade ?? '',
            estado: dp.estado ?? '',
            cep: dp.cep ?? '',
            nomeConta: db.nomeConta ?? '',
            numeroBanco: db.numeroBanco ?? '',
            nomeBanco: db.nomeBanco ?? '',
            agencia: db.agencia ?? '',
            tipoConta: db.tipoConta ?? '',
            numeroConta: db.numeroConta ?? '',
            chavePix: db.chavePix ?? '',
          });


          const { data: base } = await getBaseOrcamento(rowData.id);
          if (base.exists) {
            setBaseOrcamento({
              honorariosEquipeMedica: base.honorariosEquipeMedica,
              taxasHospitalares: base.taxasHospitalares,
              materiaisOpme: base.materiaisOpme,
              medicamentosDiaria: base.medicamentosDiaria,
              examesPreOperatorios: base.examesPreOperatorios,
              consultaPosOperatoria: base.consultaPosOperatoria,
              atendimentoEnfermagem: base.atendimentoEnfermagem,
              acompanhanteTaxaAdicional: base.acompanhanteTaxaAdicional,
              fisioterapiaPosOperatoria: base.fisioterapiaPosOperatoria,
              medicamentosPosAlta: base.medicamentosPosAlta,
              ortesesImobilizadores: base.ortesesImobilizadores,
              examesComplementares: base.examesComplementares,
              custoCtiBemodinamica: base.custoCtiBemodinamica,
              linkBaseOrcamento: base.linkBaseOrcamento ?? '',
              linkAssinatura: base.linkAssinatura ?? '',
            });
          } else {
            setBaseOrcamento(baseOrcamentoInicial);
          }

          setEditDialogVisible(true);
        } catch (err) {
          console.error('Erro ao carregar dados do cliente:', err);
        }
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

  const updateClienteEditando = (field: keyof ClienteTableRow, value: any) => {
    if (!clienteEditando) return;

    setClienteEditando({
      ...clienteEditando,
      [field]: value
    });
  };


const formatarData = (data: string) => {
  if (!data || data.includes('T')) {
    // se vier com hora, pega só a parte da data
    data = data?.split('T')[0] ?? '';
  }
  if (!data || data.length < 10) return '-';
  const [ano, mes, dia] = data.split('-');
  if (!ano || !mes || !dia) return '-';
  return `${dia}/${mes}/${ano}`;
};


  const updateNovoCliente = (field: keyof ClienteTableRow, value: any) => {
    setNovoCliente((prev) => ({
      ...prev,
      [field]: value
    }));
  };


  const statusTemplate = (option: any) => {
    if (!option) return null;

    return (
      <Tag
        value={option.label}
        severity={option.value ? 'success' : 'danger'}
      />
    );
  };




  const handleAbrirCadastro = () => {
    const agora = new Date().toISOString().split('T')[0];

    setNovoCliente({
      ...clienteInicial,
      createDate: agora,
      updateDate: agora
    });
    setBaseOrcamento(baseOrcamentoInicial);
    setBaseOrcamentoArquivo(null);

    setCreateDialogVisible(true);
  };


 // ── Salvar cadastro (POST em cascata) ───────────────────
const handleSalvarCadastro = async () => {
  try {
    // 1. Cria o médico
    const { data: medico } = await createMedico({
      nomeCompleto: novoCliente.nomeCompleto,
      nomeSistema: novoCliente.nomeSistema,
      especialidade: novoCliente.especialidade,
      subespecialidade: novoCliente.subespecialidade,
      keywords: novoCliente.keywords,
      grupoWhatsapp: novoCliente.grupoWhatsapp,
      status: novoCliente.status,
    });

    const idMedico = medico.id;

    // 2. Cria dados médico
    await createDadosMedico({
      idMedico,
      CRM: novoCliente.crm,
      RQE: novoCliente.rqe,
      hospital: novoCliente.hospital,
      telefone: novoCliente.telefone,
      email: novoCliente.email,
      emailAcesso: novoCliente.emailAcesso,
    });


    // 3. Cria empresa
    await createEmpresaMedico({
      idMedico,
      CNPJ: novoCliente.cnpj,
      razaoSocial: novoCliente.razaoSocial,
      fantasia: novoCliente.fantasia,
      rua: novoCliente.pjRua,
      numero: novoCliente.pjNumero,
      complemento: novoCliente.pjComplemento,
      bairro: novoCliente.pjBairro,
      cidade: novoCliente.pjCidade,
      estado: novoCliente.pjEstado,
      cep: novoCliente.pjCep,
      contrato: novoCliente.contrato,
      procuracao: novoCliente.procuracao,
      arquivoAdicional: novoCliente.arquivoAdicional,
    });


        // 4. Cria dados pessoais
    await createDadosPessoais({
      idMedico,
      nomeMedico: novoCliente.nomeMedico,
      CPF: novoCliente.cpf,
      RG: novoCliente.rg,
      estadoCivil: novoCliente.estadoCivil,
      rua: novoCliente.rua,
      numero: novoCliente.numero,
      complemento: novoCliente.complemento,
      bairro: novoCliente.bairro,
      cidade: novoCliente.cidade,
      estado: novoCliente.estado,
      cep: novoCliente.cep,
    });

       // 5. Cria dados bancários
    await createDadosBancarios({
      idMedico,
      nomeConta: novoCliente.nomeConta,
      numeroBanco: novoCliente.numeroBanco,
      nomeBanco: novoCliente.nomeBanco,
      agencia: novoCliente.agencia,
      tipoConta: novoCliente.tipoConta,
      numeroConta: novoCliente.numeroConta,
      chavePix: novoCliente.chavePix,
    });

     // Recarrega a lista
    const { data } = await getMedicos();
    setClientes(data);
    setCreateDialogVisible(false);

  } catch (err) {
    console.error('Erro ao salvar cliente:', err);
    alert('Erro ao salvar. Verifique os dados e tente novamente.');
  }
};


// ── Salvar edição (PATCH) ───────────────────────────────
const handleSalvarEdicao = async () => {
  if (!clienteEditando) return;
  try {
    // 1. Atualiza tabela Medico
    await updateMedico(clienteEditando.id, {
      nomeCompleto: clienteEditando.nomeMedico,
      nomeSistema: clienteEditando.nomeSistema,
      especialidade: clienteEditando.especialidade,
      subespecialidade: clienteEditando.subespecialidade,
      keywords: clienteEditando.keywords,
      grupoWhatsapp: clienteEditando.grupoWhatsapp,
      status: clienteEditando.status,
    });

    // 2. Busca IDs dos registros relacionados e atualiza
    const [dadosMed, empresa, pessoais, bancarios] = await Promise.all([
      getDadosMedico(clienteEditando.id),
      getEmpresaMedico(clienteEditando.id),
      getDadosPessoais(clienteEditando.id),
      getDadosBancarios(clienteEditando.id),
    ]);

    // DadosMedico
    if (dadosMed.data[0]) {
      await updateDadosMedico(dadosMed.data[0].id, {
        CRM: clienteEditando.crm,
        RQE: clienteEditando.rqe,
        hospital: clienteEditando.hospital,
        telefone: clienteEditando.telefone,
        email: clienteEditando.email,
        emailAcesso: clienteEditando.emailAcesso,
      });
    }

    // EmpresaMedico
    if (empresa.data[0]) {
      await updateEmpresaMedico(empresa.data[0].id, {
        CNPJ: clienteEditando.cnpj,
        razaoSocial: clienteEditando.razaoSocial,
        fantasia: clienteEditando.fantasia,
        rua: clienteEditando.pjRua,
        numero: clienteEditando.pjNumero,
        complemento: clienteEditando.pjComplemento,
        bairro: clienteEditando.pjBairro,
        cidade: clienteEditando.pjCidade,
        estado: clienteEditando.pjEstado,
        cep: clienteEditando.pjCep,
        contrato: clienteEditando.contrato,
        procuracao: clienteEditando.procuracao,
        arquivoAdicional: clienteEditando.arquivoAdicional,
      });
    }

    // DadosPessoais
    if (pessoais.data[0]) {
      await updateDadosPessoais(pessoais.data[0].id, {
        nomeCompleto: clienteEditando.nomeCompleto,
        CPF: clienteEditando.cpf,
        RG: clienteEditando.rg,
        estadoCivil: clienteEditando.estadoCivil,
        rua: clienteEditando.rua,
        numero: clienteEditando.numero,
        complemento: clienteEditando.complemento,
        bairro: clienteEditando.bairro,
        cidade: clienteEditando.cidade,
        estado: clienteEditando.estado,
        cep: clienteEditando.cep,
      });
    }

    // DadosBancarios
    if (bancarios.data[0]) {
      await updateDadosBancarios(bancarios.data[0].id, {
        nomeConta: clienteEditando.nomeConta,
        numeroBanco: clienteEditando.numeroBanco,
        nomeBanco: clienteEditando.nomeBanco,
        agencia: clienteEditando.agencia,
        tipoConta: clienteEditando.tipoConta,
        numeroConta: clienteEditando.numeroConta,
        chavePix: clienteEditando.chavePix,
      });
    }

    const { data } = await getMedicos();
    setClientes(data.map((m: any) => ({
      id: m.id,
      nomeMedico: m.nomeCompleto,
      nomeSistema: m.nomeSistema,
      especialidade: m.especialidade ?? '',
      subespecialidade: m.subespecialidade ?? '',
      keywords: m.keywords ?? '',
      grupoWhatsapp: m.grupoWhatsapp ?? '',
      status: m.status,
      createDate: m.createDate?.split('T')[0] ?? '',
      updateDate: m.updateDate?.split('T')[0] ?? '',
      razaoSocial: '', crm: '', rqe: '', hospital: '', telefone: '',
      email: '', cnpj: '', modoValidacao: '', emailAcesso: '',
      contrato: false, procuracao: false, arquivoAdicional: false,
      nomeCompleto: '', cpf: '', rg: '', estadoCivil: '',
      rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '',
      fantasia: '', pjRua: '', pjNumero: '', pjComplemento: '', pjBairro: '',
      pjCidade: '', pjEstado: '', pjCep: '',
      nomeConta: '', numeroBanco: '', nomeBanco: '', agencia: '',
      tipoConta: '', numeroConta: '', chavePix: ''
    })));

    setEditDialogVisible(false);
  } catch (err) {
    console.error('Erro ao editar cliente:', err);
    alert('Erro ao salvar edição.');
  }
};




  const getArquivoTag = (arquivo?: File | null) => {
    return (
      <Tag
        value={arquivo ? 'Documento enviado' : 'Documento não enviado'}
        severity={arquivo ? 'success' : 'danger'}
      />
    );
  };



  const handleNovoClienteArquivo = (
    field: 'contratoArquivo' | 'procuracaoArquivo' | 'arquivoAdicionalArquivo',
    file: File | null
  ) => {
    setNovoCliente((prev) => ({
      ...prev,
      [field]: file,
      contrato: field === 'contratoArquivo' ? !!file : prev.contrato,
      procuracao: field === 'procuracaoArquivo' ? !!file : prev.procuracao,
      arquivoAdicional: field === 'arquivoAdicionalArquivo' ? !!file : prev.arquivoAdicional
    }));
  };

  const handleClienteEditandoArquivo = (
    field: 'contratoArquivo' | 'procuracaoArquivo' | 'arquivoAdicionalArquivo',
    file: File | null
  ) => {
    if (!clienteEditando) return;

    setClienteEditando({
      ...clienteEditando,
      [field]: file,
      contrato: field === 'contratoArquivo' ? !!file : clienteEditando.contrato,
      procuracao: field === 'procuracaoArquivo' ? !!file : clienteEditando.procuracao,
      arquivoAdicional: field === 'arquivoAdicionalArquivo' ? !!file : clienteEditando.arquivoAdicional
    });
  };



  const renderUploadSimples = (
    id: string,
    label: string,
    arquivo: File | null | undefined,
    onChangeArquivo: (file: File | null) => void
  ) => {
    return (
      <div className="field field-span-2">
        <label>{label}</label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {getArquivoTag(arquivo)}

          <input
            id={id}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => onChangeArquivo(e.target.files?.[0] || null)}
          />

          <Button
            label="Upload"
            icon="pi pi-upload"
            outlined
            onClick={() => document.getElementById(id)?.click()}
          />

          {arquivo && (
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              {arquivo.name}
            </span>
          )}
        </div>
      </div>
    );
  };


  const handleSalvarBaseOrcamento = async () => {
    if (!clienteEditando) return;
    setSavingBase(true);
    try {
      const form = new FormData();
      if (baseOrcamentoArquivo) form.append('baseOrcamento', baseOrcamentoArquivo);
      Object.entries(baseOrcamento).forEach(([key, value]) => {
        if (typeof value === 'boolean') form.append(key, String(value));
      });
      await salvarBaseOrcamento(clienteEditando.id, form);
      alert('Base de orçamento salva!');
    } catch {
      alert('Erro ao salvar base de orçamento.');
    } finally {
      setSavingBase(false);
    }
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const iniciarDesenho = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const desenhar = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const pararDesenho = () => setIsDrawing(false);

  const limparAssinatura = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const salvarAssinatura = async () => {
    if (!clienteEditando || !canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'assinatura.png', { type: 'image/png' });
      const form = new FormData();
      form.append('assinatura', file);
      try {
        await salvarBaseOrcamento(clienteEditando.id, form);
        const url = URL.createObjectURL(blob);
        setBaseOrcamento(prev => ({ ...prev, linkAssinatura: url }));
        setAssinaturaDialogVisible(false);
        alert('Assinatura salva!');
      } catch {
        alert('Erro ao salvar assinatura.');
      }
    }, 'image/png');
  };  



  return (
    <div className="clientes-page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Gestão dos clientes cadastrados</p>
        </div>

        <div className="page-actions">
          <Button
            label="Cadastrar Cliente"
            icon="pi pi-plus"
            onClick={handleAbrirCadastro}
          />
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total Clientes</span>
            <i className="pi pi-users"></i>
          </div>
          <div className="kpi-value">{kpis.totalClientes}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Clientes Ativos</span>
            <i className="pi pi-check-circle"></i>
          </div>
          <div className="kpi-value">{kpis.clientesAtivos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Cadastros Completos</span>
            <i className="pi pi-id-card"></i>
          </div>
          <div className="kpi-value">{kpis.cadastrosCompletos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Falta Documentação</span>
            <i className="pi pi-file-excel"></i>
          </div>
          <div className="kpi-value">{kpis.faltaDocumentacao}</div>
        </div>
      </div>

      <div className="card">
        <DataTable
          value={dataComSequencial}
          dataKey="id"
          paginator
          rows={rows}
          first={first}
          totalRecords={dataComSequencial.length}
          onPage={onPage}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          filters={filters}
          onFilter={(e) => setFilters(e.filters)}
          filterDisplay="row"
          loading={loading}
          selectionMode="multiple"
          selection={selectedClientes}
          onSelectionChange={(e) => setSelectedClientes(e.value as ClienteTableRow[])}
          tableStyle={{ width: '100%' }}
          emptyMessage="Nenhum cliente encontrado."
          className="clientes-table"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: ClienteTableRow) => rowData.sequencial}
          />

          <Column
            field="razaoSocial"
            header="Razão Social"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '18rem' }}
          />

          <Column
            field="nomeSistema"
            header="Nome Sistema"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '14rem' }}
          />

          <Column
            field="crm"
            header="CRM"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '10rem' }}
          />

          <Column
            field="especialidade"
            header="Especialidade"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '14rem' }}
          />

          <Column
            field="status"
            header="Status"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={(rowData: ClienteTableRow) => getBooleanTag(rowData.status)}
            style={{ minWidth: '10rem' }}
          />

          <Column
            field="contrato"
            header="Contrato"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={(rowData: ClienteTableRow) => getDocumentoTag(rowData.contrato)}
            style={{ minWidth: '10rem' }}
          />

          <Column
            field="procuracao"
            header="Procuração"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={(rowData: ClienteTableRow) => getDocumentoTag(rowData.procuracao)}
            style={{ minWidth: '10rem' }}
          />

          <Column
            header="Editar"
            body={editarBodyTemplate}
            style={{ minWidth: '7rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />
        </DataTable>

      </div>












      {/* Modal para cadastrar cliente */}
      <Dialog
        header="Cadastrar Cliente"
        visible={createDialogVisible}
        style={{ width: '82rem', maxWidth: '96vw' }}
        modal
        onHide={() => setCreateDialogVisible(false)}
        className="cliente-edit-dialog"
      >

        <TabView>
          <TabPanel header="Médico">
            <div className="cliente-form-grid">
              <div className="field field-span-2">
                <label>Nome Médico</label>
                <InputText
                  value={novoCliente.nomeMedico}
                  onChange={(e) => updateNovoCliente('nomeMedico', e.target.value)}
                />
              </div>
              <div className="field field-span-2">
                <label>Nome Sistema</label>
                <InputText
                  value={novoCliente.nomeSistema}
                  onChange={(e) => updateNovoCliente('nomeSistema', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Especialidade</label>
                <Dropdown
                  value={novoCliente.especialidade}
                  options={especialidadeOptions}
                  onChange={(e) => updateNovoCliente('especialidade', e.value)}
                  placeholder="Selecione"
                />
              </div>
              <div className="field">
                <label>Subespecialidade</label>
                <InputText
                  value={novoCliente.subespecialidade}
                  onChange={(e) => updateNovoCliente('subespecialidade', e.target.value)}
                />
              </div>
              <div className="field field-span-2">
                <label>Keywords</label>
                <InputText
                  value={novoCliente.keywords}
                  onChange={(e) => updateNovoCliente('keywords', e.target.value)}
                />
              </div>
              <div className="field field-span-2">
                <label>Grupo WhatsApp</label>
                <InputText
                  value={novoCliente.grupoWhatsapp}
                  onChange={(e) => updateNovoCliente('grupoWhatsapp', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Status</label>
                <Dropdown
                  value={novoCliente.status}
                  options={statusOptions}
                  optionLabel="label"
                  onChange={(e) => updateNovoCliente('status', e.value)}
                  itemTemplate={statusTemplate}
                  valueTemplate={statusTemplate}
                  placeholder="Selecione"
                />
              </div>

              {/* Cadastrar Usuário */}
              <div className="field field-span-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '8px' }}>
                <Button
                  label="Cadastrar Usuário"
                  icon="pi pi-user-plus"
                  disabled={
                    usuarioCadastrado ||
                    !clienteEditando?.nomeMedico ||
                    !clienteEditando?.nomeSistema ||
                    !clienteEditando?.especialidade
                  }
                  loading={loadingUsuario}
                  onClick={async () => {
                    if (!clienteEditando) return;
                    setLoadingUsuario(true);
                    try {
                      await cadastrarUsuarioMedico(clienteEditando.id);
                      setUsuarioCadastrado(true);
                      alert('Usuário cadastrado com sucesso!');
                    } catch (err: any) {
                      alert(err?.response?.data?.error ?? 'Erro ao cadastrar usuário.');
                    } finally {
                      setLoadingUsuario(false);
                    }
                  }}
                />

                <Tag
                  value={usuarioCadastrado ? 'Cadastrado' : 'Não cadastrado'}
                  severity={usuarioCadastrado ? 'success' : 'danger'}
                />
              </div>



              <div className="field">
                <label>CreateDate</label>
                <InputText
                  value={formatarData(novoCliente.createDate)}
                  disabled
                />
              </div>
              <div className="field">
                <label>UpdateDate</label>
                <InputText
                  value={formatarData(novoCliente.updateDate)}
                  disabled
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Dados Médico">
            <div className="cliente-form-grid">
              <div className="field field-span-2">
                <label>Nome Médico</label>
                <InputText
                  value={novoCliente.nomeMedico}
                  onChange={(e) => updateNovoCliente('nomeMedico', e.target.value)}
                />
              </div>
              <div className="field field-span-2">
                <label>Nome Sistema</label>
                <InputText
                  value={novoCliente.nomeSistema}
                  onChange={(e) => updateNovoCliente('nomeSistema', e.target.value)}
                />
              </div>
              <div className="field">
                <label>CRM</label>
                <InputText
                  value={novoCliente.crm}
                  onChange={(e) => updateNovoCliente('crm', e.target.value)}
                />
              </div>

              <div className="field">
                <label>RQE</label>
                <InputText
                  value={novoCliente.rqe}
                  onChange={(e) => updateNovoCliente('rqe', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Hospital</label>
                <Dropdown
                  value={novoCliente.hospital}
                  options={hospitalOptions}
                  onChange={(e) => updateNovoCliente('hospital', e.value)}
                  placeholder="Selecione"
                />
              </div>
              <div className="field">
                <label>Telefone</label>
                <InputText
                  value={novoCliente.telefone}
                  onChange={(e) => updateNovoCliente('telefone', e.target.value)}
                />
              </div>

              <div className="field field-span-2">
                <label>Email</label>
                <InputText
                  value={novoCliente.email}
                  onChange={(e) => updateNovoCliente('email', e.target.value)}
                />
              </div>
              <div className="field field-span-2">
                <label>Email de Acesso</label>
                <InputText
                  value={novoCliente.emailAcesso}
                  onChange={(e) => updateNovoCliente('emailAcesso', e.target.value)}
                />
              </div>
              <div className="field">
                <label>CreateDate</label>
                <InputText
                  value={formatarData(novoCliente.createDate)}
                  disabled
                />
              </div>
              <div className="field">
                <label>UpdateDate</label>
                <InputText
                  value={formatarData(novoCliente.updateDate)}
                  disabled
                />
              </div>
            </div>
          </TabPanel>
          <TabPanel header="Dados Empresa">
            <div className="cliente-form-grid">
              <div className="field">
                <label>CNPJ</label>
                <InputText
                  value={novoCliente.cnpj}
                  onChange={(e) => updateNovoCliente('cnpj', e.target.value)}
                />
              </div>
              <div className="field field-span-2">
                <label>Razão Social</label>
                <InputText
                  value={novoCliente.razaoSocial}
                  onChange={(e) => updateNovoCliente('razaoSocial', e.target.value)}
                />
              </div>
              <div className="field field-span-2">
                <label>Fantasia</label>
                <InputText
                  value={novoCliente.fantasia}
                  onChange={(e) => updateNovoCliente('fantasia', e.target.value)}
                />
              </div>
              <div className="field field-span-2">
                <label>Rua</label>
                <InputText
                  value={novoCliente.pjRua}
                  onChange={(e) => updateNovoCliente('pjRua', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Número</label>
                <InputText
                  value={novoCliente.pjNumero}
                  onChange={(e) => updateNovoCliente('pjNumero', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Complemento</label>
                <InputText
                  value={novoCliente.pjComplemento}
                  onChange={(e) => updateNovoCliente('pjComplemento', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Bairro</label>
                <InputText
                  value={novoCliente.pjBairro}
                  onChange={(e) => updateNovoCliente('pjBairro', e.target.value)}
                />
              </div>

              <div className="field field-span-2">
                <label>Cidade</label>
                <InputText
                  value={novoCliente.pjCidade}
                  onChange={(e) => updateNovoCliente('pjCidade', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Estado</label>
                <InputText
                  value={novoCliente.pjEstado}
                  onChange={(e) => updateNovoCliente('pjEstado', e.target.value)}
                />
              </div>

              <div className="field">
                <label>CEP</label>
                <InputText
                  value={novoCliente.pjCep}
                  onChange={(e) => updateNovoCliente('pjCep', e.target.value)}
                />
              </div>
              <div className='form-grid'>
                <div className="field">
                  <label>CreateDate</label>
                  <InputText
                    value={formatarData(novoCliente.createDate)}
                    disabled
                  />
                </div>
                <div className="field">
                  <label>UpdateDate</label>
                  <InputText
                    value={formatarData(novoCliente.updateDate)}
                    disabled
                  />
                </div>
                <div className='upload-row'>
                  {renderUploadSimples(
                    'novo-contrato-arquivo',
                    'Contrato',
                    novoCliente.contratoArquivo,
                    (file) => handleNovoClienteArquivo('contratoArquivo', file)
                  )}
                  {renderUploadSimples(
                    'novo-procuracao-arquivo',
                    'Procuração',
                    novoCliente.procuracaoArquivo,
                    (file) => handleNovoClienteArquivo('procuracaoArquivo', file)
                  )}
                  {renderUploadSimples(
                    'novo-arquivo-adicional-arquivo',
                    'Arquivo Adicional',
                    novoCliente.arquivoAdicionalArquivo,
                    (file) => handleNovoClienteArquivo('arquivoAdicionalArquivo', file)
                  )}
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Dados Pessoais">
            <div className="cliente-form-grid">
              <div className="field field-span-2">
                <label>Nome Completo</label>
                <InputText
                  value={novoCliente.nomeCompleto}
                  onChange={(e) => updateNovoCliente('nomeCompleto', e.target.value)}
                />
              </div>
              <div className="field">
                <label>CPF</label>
                <InputText
                  value={novoCliente.cpf}
                  onChange={(e) => updateNovoCliente('cpf', e.target.value)}
                />
              </div>
              <div className="field">
                <label>RG</label>
                <InputText
                  value={novoCliente.rg}
                  onChange={(e) => updateNovoCliente('rg', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Estado Civil</label>
                <Dropdown
                  value={novoCliente.estadoCivil}
                  options={estadoCivilOptions}
                  onChange={(e) => updateNovoCliente('estadoCivil', e.value)}
                />
              </div>

              <div className="field field-span-2">
                <label>Rua</label>
                <InputText
                  value={novoCliente.rua}
                  onChange={(e) => updateNovoCliente('rua', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Número</label>
                <InputText
                  value={novoCliente.numero}
                  onChange={(e) => updateNovoCliente('numero', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Complemento</label>
                <InputText
                  value={novoCliente.complemento}
                  onChange={(e) => updateNovoCliente('complemento', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Bairro</label>
                <InputText
                  value={novoCliente.bairro}
                  onChange={(e) => updateNovoCliente('bairro', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Cidade</label>
                <Dropdown
                  value={novoCliente.cidade}
                  options={cidadeOptions}
                  onChange={(e) => updateNovoCliente('cidade', e.value)}
                />
              </div>

              <div className="field">
                <label>Estado</label>
                <Dropdown
                  value={novoCliente.estado}
                  options={estadoOptions}
                  onChange={(e) => updateNovoCliente('estado', e.value)}
                />
              </div>

              <div className="field">
                <label>CEP</label>
                <InputText
                  value={novoCliente.cep}
                  onChange={(e) => updateNovoCliente('cep', e.target.value)}
                />
              </div>
              <div className="field">
                <label>CreateDate</label>
                <InputText
                  value={formatarData(novoCliente.createDate)}
                  disabled
                />
              </div>
              <div className="field">
                <label>UpdateDate</label>
                <InputText
                  value={formatarData(novoCliente.updateDate)}
                  disabled
                />
              </div>
            </div>
          </TabPanel>


          <TabPanel header="Dados Bancários">
            <div className="cliente-form-grid">
              <div className="field field-span-2">
                <label>Nome Conta</label>
                <InputText
                  value={novoCliente.nomeConta}
                  onChange={(e) => updateNovoCliente('nomeConta', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Número Banco</label>
                <InputText
                  value={novoCliente.numeroBanco}
                  onChange={(e) => updateNovoCliente('numeroBanco', e.target.value)} disabled
                />
              </div>

              <div className="field">
                <label>Nome Banco</label>
                <Dropdown
                  value={novoCliente.nomeBanco}
                  options={bancoOptions}
                  onChange={(e) => updateNovoCliente('nomeBanco', e.value)}
                />
              </div>

              <div className="field">
                <label>Agência</label>
                <InputText
                  value={novoCliente.agencia}
                  onChange={(e) => updateNovoCliente('agencia', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Tipo da Conta</label>
                <Dropdown
                  value={novoCliente.tipoConta}
                  options={tipoContaOptions}
                  onChange={(e) => updateNovoCliente('tipoConta', e.value)}
                />
              </div>

              <div className="field">
                <label>Número da Conta</label>
                <InputText
                  value={novoCliente.numeroConta}
                  onChange={(e) => updateNovoCliente('numeroConta', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Chave Pix</label>
                <InputText
                  value={novoCliente.chavePix}
                  onChange={(e) => updateNovoCliente('chavePix', e.target.value)}
                />
              </div>
              <div className="field">
                <label>CreateDate</label>
                <InputText
                  value={formatarData(novoCliente.createDate)}
                  disabled
                />
              </div>
              <div className="field">
                <label>UpdateDate</label>
                <InputText
                  value={formatarData(novoCliente.updateDate)}
                  disabled
                />
              </div>

            </div>
          </TabPanel>


          <TabPanel header="Base Orçamento">
            <div className="cliente-form-grid">

              {/* Upload da base */}
              <div className="field field-span-4">
                <label style={{ fontWeight: 600 }}>Folha Timbrada (PDF)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '6px' }}>
                  {baseOrcamento.linkBaseOrcamento && (
                    <a href={baseOrcamento.linkBaseOrcamento} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#f97316', fontSize: '0.9rem' }}>
                      <i className="pi pi-file-pdf" style={{ marginRight: '4px' }} />
                      Ver PDF atual
                    </a>
                  )}
                  <input type="file" accept=".pdf"
                    onChange={(e) => setBaseOrcamentoArquivo(e.target.files?.[0] ?? null)}
                    style={{ flex: 1 }} />
                </div>
                {baseOrcamentoArquivo && (
                  <span style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                    <i className="pi pi-file" style={{ marginRight: '4px' }} />
                    {baseOrcamentoArquivo.name}
                  </span>
                )}
              </div>

              {/* Assinatura */}
              <div className="field field-span-4">
                <label style={{ fontWeight: 600 }}>Assinatura</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '6px' }}>
                  {baseOrcamento.linkAssinatura ? (
                    <img src={baseOrcamento.linkAssinatura} alt="Assinatura"
                      style={{ height: '60px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px' }} />
                  ) : (
                    <span style={{ fontSize: '0.9rem', color: '#aaa' }}>Nenhuma assinatura cadastrada</span>
                  )}
                  <Button label="Criar Assinatura" icon="pi pi-pencil" outlined
                    onClick={() => setAssinaturaDialogVisible(true)} />
                </div>
              </div>

              {/* Divisor */}
              <div className="field field-span-4" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                  {/* INCLUSOS */}
                  <div>
                    <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: '12px' }}>
                      INCLUSOS (marque o que está incluso)
                    </p>
                    {[
                      { key: 'honorariosEquipeMedica', label: 'Honorários da equipe médica' },
                      { key: 'taxasHospitalares', label: 'Taxas hospitalares' },
                      { key: 'materiaisOpme', label: 'Materiais e OPME' },
                      { key: 'medicamentosDiaria', label: 'Medicamentos durante a diária do pós-operatório' },
                      { key: 'examesPreOperatorios', label: 'Exames pré-operatórios básicos' },
                      { key: 'consultaPosOperatoria', label: '1 Consulta pós-operatória' },
                      { key: 'atendimentoEnfermagem', label: 'Atendimento de enfermagem 24h' },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <input type="checkbox"
                          checked={baseOrcamento[key as keyof typeof baseOrcamento] as boolean}
                          onChange={(e) => setBaseOrcamento(prev => ({ ...prev, [key]: e.target.checked }))}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        <label style={{ fontSize: '0.9rem', color: '#374151', cursor: 'pointer' }}>{label}</label>
                      </div>
                    ))}
                  </div>

                  {/* NAO INCLUSOS */}
                  <div>
                    <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: '12px' }}>
                      NÃO INCLUSOS (marque o que NÃO está incluso)
                    </p>
                    {[
                      { key: 'acompanhanteTaxaAdicional', label: 'Acompanhante (taxa adicional)' },
                      { key: 'fisioterapiaPosOperatoria', label: 'Fisioterapia pós-operatória' },
                      { key: 'medicamentosPosAlta', label: 'Medicamentos pós-alta' },
                      { key: 'ortesesImobilizadores', label: 'Órteses e imobilizadores' },
                      { key: 'examesComplementares', label: 'Exames complementares extras' },
                      { key: 'custoCtiBemodinamica', label: 'Custo com CTI e hemodinâmica' },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <input type="checkbox"
                          checked={baseOrcamento[key as keyof typeof baseOrcamento] as boolean}
                          onChange={(e) => setBaseOrcamento(prev => ({ ...prev, [key]: e.target.checked }))}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        <label style={{ fontSize: '0.9rem', color: '#374151', cursor: 'pointer' }}>{label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botão salvar */}
              <div className="field field-span-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button label="Salvar Base de Orçamento" icon="pi pi-check"
                  loading={savingBase} onClick={handleSalvarBaseOrcamento} />
              </div>

            </div>
          </TabPanel>




        </TabView>


        <div className="dialog-footer-actions">
          <Button
            label="Cancelar"
            outlined
            onClick={() => setCreateDialogVisible(false)}
          />
          <Button
            label="Salvar"
            icon="pi pi-check"
            onClick={handleSalvarCadastro}
          />
        </div>
      </Dialog>
      {/* fim do modal de cadastrar cliente */}


































      {/* Inicio Modal Editar Cliente */}
      <Dialog
        header="Editar Cliente"
        visible={editDialogVisible}
        style={{ width: '82rem', maxWidth: '96vw' }}
        modal
        onHide={() => setEditDialogVisible(false)}
        className="cliente-edit-dialog"
      >
        {clienteEditando && (
          <TabView>
            <TabPanel header="Médico">
              <div className="cliente-form-grid">
                <div className="field field-span-2">
                  <label>Nome Médico</label>
                  <InputText
                    value={clienteEditando.nomeMedico}
                    onChange={(e) => updateClienteEditando('nomeMedico', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Nome Sistema</label>
                  <InputText
                    value={clienteEditando.nomeSistema}
                    onChange={(e) => updateClienteEditando('nomeSistema', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Especialidade</label>
                  <Dropdown
                    value={clienteEditando.especialidade}
                    options={especialidadeOptions}
                    onChange={(e) => updateClienteEditando('especialidade', e.value)}
                    placeholder="Selecione"
                  />
                </div>

                <div className="field">
                  <label>Subespecialidade</label>
                  <InputText
                    value={clienteEditando.subespecialidade}
                    onChange={(e) => updateClienteEditando('subespecialidade', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Keywords</label>
                  <InputText
                    value={clienteEditando.keywords}
                    onChange={(e) => updateClienteEditando('keywords', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Grupo WhatsApp</label>
                  <InputText
                    value={clienteEditando.grupoWhatsapp}
                    onChange={(e) => updateClienteEditando('grupoWhatsapp', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Status</label>
                  <Dropdown
                    value={clienteEditando.status}
                    options={statusOptions}
                    optionLabel="label"
                    onChange={(e) => updateClienteEditando('status', e.value)}
                    itemTemplate={statusTemplate}
                    valueTemplate={statusTemplate}
                    placeholder="Selecione"
                  />
                </div>


                {/* Cadastrar Usuário */}
                <div className="field field-span-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '8px' }}>
                  <Button
                    label="Cadastrar Usuário"
                    icon="pi pi-user-plus"
                    disabled={
                      usuarioCadastrado ||
                      !clienteEditando?.nomeMedico ||
                      !clienteEditando?.nomeSistema ||
                      !clienteEditando?.especialidade
                    }
                    loading={loadingUsuario}
                    onClick={async () => {
                      if (!clienteEditando) return;
                      
                      console.log('=== Cadastrar Usuário ===');
                      console.log('medico_id:', clienteEditando.id);
                      
                      setLoadingUsuario(true);
                      try {
                        const response = await cadastrarUsuarioMedico(clienteEditando.id);
                        console.log('Resposta:', response.data);
                        setUsuarioCadastrado(true);
                        alert('Usuário cadastrado com sucesso!');
                      } catch (err: any) {
                        console.log('Erro completo:', err);
                        console.log('Erro response:', err?.response?.data);
                        alert(err?.response?.data?.error ?? 'Erro ao cadastrar usuário.');
                      } finally {
                        setLoadingUsuario(false);
                      }
                    }}
                  />

                  <Tag
                    value={usuarioCadastrado ? 'Cadastrado' : 'Não cadastrado'}
                    severity={usuarioCadastrado ? 'success' : 'danger'}
                  />
                </div>





                <div className="field">
                  <label>CreateDate</label>
                  <InputText
                    value={formatarData(clienteEditando.createDate)}
                    disabled
                  />
                </div>

                <div className="field">
                  <label>UpdateDate</label>
                  <InputText
                    value={formatarData(clienteEditando.updateDate)}
                    disabled
                  />
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Dados Médico">
              <div className="cliente-form-grid">
                <div className="field field-span-2">
                  <label>Nome Médico</label>
                  <InputText
                    value={clienteEditando.nomeMedico}
                    onChange={(e) => updateClienteEditando('nomeMedico', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Nome Sistema</label>
                  <InputText
                    value={clienteEditando.nomeSistema}
                    onChange={(e) => updateClienteEditando('nomeSistema', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>CRM</label>
                  <InputText
                    value={clienteEditando.crm}
                    onChange={(e) => updateClienteEditando('crm', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>RQE</label>
                  <InputText
                    value={clienteEditando.rqe}
                    onChange={(e) => updateClienteEditando('rqe', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Hospital</label>
                  <Dropdown
                    value={clienteEditando.hospital}
                    options={hospitalOptions}
                    onChange={(e) => updateClienteEditando('hospital', e.value)}
                    placeholder="Selecione"
                  />
                </div>

                <div className="field">
                  <label>Telefone</label>
                  <InputText
                    value={clienteEditando.telefone}
                    onChange={(e) => updateClienteEditando('telefone', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Email</label>
                  <InputText
                    value={clienteEditando.email}
                    onChange={(e) => updateClienteEditando('email', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Email de Acesso</label>
                  <InputText
                    value={clienteEditando.emailAcesso}
                    onChange={(e) => updateClienteEditando('emailAcesso', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>CreateDate</label>
                  <InputText
                    value={formatarData(clienteEditando.createDate)}
                    disabled
                  />
                </div>

                <div className="field">
                  <label>UpdateDate</label>
                  <InputText
                    value={formatarData(clienteEditando.updateDate)}
                    disabled
                  />
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Dados Empresa">
              <div className="cliente-form-grid">
                <div className="field">
                  <label>CNPJ</label>
                  <InputText
                    value={clienteEditando.cnpj}
                    onChange={(e) => updateClienteEditando('cnpj', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Razão Social</label>
                  <InputText
                    value={clienteEditando.razaoSocial}
                    onChange={(e) => updateClienteEditando('razaoSocial', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Fantasia</label>
                  <InputText
                    value={clienteEditando.fantasia}
                    onChange={(e) => updateClienteEditando('fantasia', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Rua</label>
                  <InputText
                    value={clienteEditando.pjRua}
                    onChange={(e) => updateClienteEditando('pjRua', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Número</label>
                  <InputText
                    value={clienteEditando.pjNumero}
                    onChange={(e) => updateClienteEditando('pjNumero', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Complemento</label>
                  <InputText
                    value={clienteEditando.pjComplemento}
                    onChange={(e) => updateClienteEditando('pjComplemento', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Bairro</label>
                  <InputText
                    value={clienteEditando.pjBairro}
                    onChange={(e) => updateClienteEditando('pjBairro', e.target.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Cidade</label>
                  <InputText
                    value={clienteEditando.pjCidade}
                    onChange={(e) => updateClienteEditando('pjCidade', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Estado</label>
                  <InputText
                    value={clienteEditando.pjEstado}
                    onChange={(e) => updateClienteEditando('pjEstado', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>CEP</label>
                  <InputText
                    value={clienteEditando.pjCep}
                    onChange={(e) => updateClienteEditando('pjCep', e.target.value)}
                  />
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label>CreateDate</label>
                    <InputText
                      value={formatarData(clienteEditando.createDate)}
                      disabled
                    />
                  </div>

                  <div className="field">
                    <label>UpdateDate</label>
                    <InputText
                      value={formatarData(clienteEditando.updateDate)}
                      disabled
                    />
                  </div>

                  <div className="upload-row">
                    {renderUploadSimples(
                      'editar-contrato-arquivo',
                      'Contrato',
                      clienteEditando.contratoArquivo,
                      (file) => handleClienteEditandoArquivo('contratoArquivo', file)
                    )}

                    {renderUploadSimples(
                      'editar-procuracao-arquivo',
                      'Procuração',
                      clienteEditando.procuracaoArquivo,
                      (file) => handleClienteEditandoArquivo('procuracaoArquivo', file)
                    )}

                    {renderUploadSimples(
                      'editar-arquivo-adicional-arquivo',
                      'Arquivo Adicional',
                      clienteEditando.arquivoAdicionalArquivo,
                      (file) => handleClienteEditandoArquivo('arquivoAdicionalArquivo', file)
                    )}
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Dados Pessoais">
              <div className="cliente-form-grid">
                <div className="field field-span-2">
                  <label>Nome Completo</label>
                  <InputText
                    value={clienteEditando.nomeCompleto}
                    onChange={(e) => updateClienteEditando('nomeCompleto', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>CPF</label>
                  <InputText
                    value={clienteEditando.cpf}
                    onChange={(e) => updateClienteEditando('cpf', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>RG</label>
                  <InputText
                    value={clienteEditando.rg}
                    onChange={(e) => updateClienteEditando('rg', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Estado Civil</label>
                  <Dropdown
                    value={clienteEditando.estadoCivil}
                    options={estadoCivilOptions}
                    onChange={(e) => updateClienteEditando('estadoCivil', e.value)}
                  />
                </div>

                <div className="field field-span-2">
                  <label>Rua</label>
                  <InputText
                    value={clienteEditando.rua}
                    onChange={(e) => updateClienteEditando('rua', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Número</label>
                  <InputText
                    value={clienteEditando.numero}
                    onChange={(e) => updateClienteEditando('numero', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Complemento</label>
                  <InputText
                    value={clienteEditando.complemento}
                    onChange={(e) => updateClienteEditando('complemento', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Bairro</label>
                  <InputText
                    value={clienteEditando.bairro}
                    onChange={(e) => updateClienteEditando('bairro', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Cidade</label>
                  <Dropdown
                    value={clienteEditando.cidade}
                    options={cidadeOptions}
                    onChange={(e) => updateClienteEditando('cidade', e.value)}
                  />
                </div>

                <div className="field">
                  <label>Estado</label>
                  <Dropdown
                    value={clienteEditando.estado}
                    options={estadoOptions}
                    onChange={(e) => updateClienteEditando('estado', e.value)}
                  />
                </div>

                <div className="field">
                  <label>CEP</label>
                  <InputText
                    value={clienteEditando.cep}
                    onChange={(e) => updateClienteEditando('cep', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>CreateDate</label>
                  <InputText
                    value={formatarData(clienteEditando.createDate)}
                    disabled
                  />
                </div>

                <div className="field">
                  <label>UpdateDate</label>
                  <InputText
                    value={formatarData(clienteEditando.updateDate)}
                    disabled
                  />
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Dados Bancários">
              <div className="cliente-form-grid">
                <div className="field field-span-2">
                  <label>Nome Conta</label>
                  <InputText
                    value={clienteEditando.nomeConta}
                    onChange={(e) => updateClienteEditando('nomeConta', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Número Banco</label>
                  <InputText
                    value={clienteEditando.numeroBanco}
                    onChange={(e) => updateClienteEditando('numeroBanco', e.target.value)}
                    disabled
                  />
                </div>

                <div className="field">
                  <label>Nome Banco</label>
                  <Dropdown
                    value={clienteEditando.nomeBanco}
                    options={bancoOptions}
                    onChange={(e) => updateClienteEditando('nomeBanco', e.value)}
                  />
                </div>

                <div className="field">
                  <label>Agência</label>
                  <InputText
                    value={clienteEditando.agencia}
                    onChange={(e) => updateClienteEditando('agencia', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Tipo da Conta</label>
                  <Dropdown
                    value={clienteEditando.tipoConta}
                    options={tipoContaOptions}
                    onChange={(e) => updateClienteEditando('tipoConta', e.value)}
                  />
                </div>

                <div className="field">
                  <label>Número da Conta</label>
                  <InputText
                    value={clienteEditando.numeroConta}
                    onChange={(e) => updateClienteEditando('numeroConta', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Chave Pix</label>
                  <InputText
                    value={clienteEditando.chavePix}
                    onChange={(e) => updateClienteEditando('chavePix', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>CreateDate</label>
                  <InputText
                    value={formatarData(clienteEditando.createDate)}
                    disabled
                  />
                </div>

                <div className="field">
                  <label>UpdateDate</label>
                  <InputText
                    value={formatarData(clienteEditando.updateDate)}
                    disabled
                  />
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Base Orçamento">
              <div className="cliente-form-grid">
                <div className="field field-span-4">
                  <label style={{ fontWeight: 600 }}>Folha Timbrada (PDF)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '6px' }}>
                    {baseOrcamento.linkBaseOrcamento && (
                      <a
                        href={baseOrcamento.linkBaseOrcamento}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#f97316', fontSize: '0.9rem' }}
                      >
                        <i className="pi pi-file-pdf" style={{ marginRight: '4px' }} />
                        Ver PDF atual
                      </a>
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setBaseOrcamentoArquivo(e.target.files?.[0] ?? null)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  {baseOrcamentoArquivo && (
                    <span style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                      <i className="pi pi-file" style={{ marginRight: '4px' }} />
                      {baseOrcamentoArquivo.name}
                    </span>
                  )}
                </div>

                <div className="field field-span-4">
                  <label style={{ fontWeight: 600 }}>Assinatura</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '6px' }}>
                    {baseOrcamento.linkAssinatura ? (
                      <img
                        src={baseOrcamento.linkAssinatura}
                        alt="Assinatura"
                        style={{ height: '60px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: '#aaa' }}>Nenhuma assinatura cadastrada</span>
                    )}
                    <Button
                      label="Criar Assinatura"
                      icon="pi pi-pencil"
                      outlined
                      onClick={() => setAssinaturaDialogVisible(true)}
                    />
                  </div>
                </div>

                <div className="field field-span-4" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: '12px' }}>
                        INCLUSOS (marque o que está incluso)
                      </p>
                      {[
                        { key: 'honorariosEquipeMedica', label: 'Honorários da equipe médica' },
                        { key: 'taxasHospitalares', label: 'Taxas hospitalares' },
                        { key: 'materiaisOpme', label: 'Materiais e OPME' },
                        { key: 'medicamentosDiaria', label: 'Medicamentos durante a diária do pós-operatório' },
                        { key: 'examesPreOperatorios', label: 'Exames pré-operatórios básicos' },
                        { key: 'consultaPosOperatoria', label: '1 Consulta pós-operatória' },
                        { key: 'atendimentoEnfermagem', label: 'Atendimento de enfermagem 24h' },
                      ].map(({ key, label }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <input
                            type="checkbox"
                            checked={baseOrcamento[key as keyof typeof baseOrcamento] as boolean}
                            onChange={(e) => setBaseOrcamento((prev) => ({ ...prev, [key]: e.target.checked }))}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <label style={{ fontSize: '0.9rem', color: '#374151', cursor: 'pointer' }}>{label}</label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: '12px' }}>
                        NÃO INCLUSOS (marque o que NÃO está incluso)
                      </p>
                      {[
                        { key: 'acompanhanteTaxaAdicional', label: 'Acompanhante (taxa adicional)' },
                        { key: 'fisioterapiaPosOperatoria', label: 'Fisioterapia pós-operatória' },
                        { key: 'medicamentosPosAlta', label: 'Medicamentos pós-alta' },
                        { key: 'ortesesImobilizadores', label: 'Órteses e imobilizadores' },
                        { key: 'examesComplementares', label: 'Exames complementares extras' },
                        { key: 'custoCtiBemodinamica', label: 'Custo com CTI e hemodinâmica' },
                      ].map(({ key, label }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <input
                            type="checkbox"
                            checked={baseOrcamento[key as keyof typeof baseOrcamento] as boolean}
                            onChange={(e) => setBaseOrcamento((prev) => ({ ...prev, [key]: e.target.checked }))}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <label style={{ fontSize: '0.9rem', color: '#374151', cursor: 'pointer' }}>{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="field field-span-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    label="Salvar Base de Orçamento"
                    icon="pi pi-check"
                    loading={savingBase}
                    onClick={handleSalvarBaseOrcamento}
                  />
                </div>
              </div>
            </TabPanel>
          </TabView>
        )}


        {/* Dialog Assinatura */}
        <Dialog
          header="Criar Assinatura"
          visible={assinaturaDialogVisible}
          style={{ width: '500px' }}
          modal
          onHide={() => setAssinaturaDialogVisible(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              Assine no campo abaixo usando o mouse ou touchscreen.
            </p>
            <canvas
              ref={canvasRef}
              width={460}
              height={200}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'crosshair',
                background: '#fff',
                touchAction: 'none',
              }}
              onMouseDown={iniciarDesenho}
              onMouseMove={desenhar}
              onMouseUp={pararDesenho}
              onMouseLeave={pararDesenho}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button label="Limpar" icon="pi pi-trash" outlined severity="danger"
                onClick={limparAssinatura} />
              <Button label="Salvar Assinatura" icon="pi pi-check"
                onClick={salvarAssinatura} />
            </div>
          </div>
        </Dialog>




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
      {/* Fim Modal Editar Cliente */}


    </div>
  );
}

