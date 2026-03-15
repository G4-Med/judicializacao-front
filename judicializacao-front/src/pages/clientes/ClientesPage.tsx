import { useEffect, useMemo, useRef, useState } from 'react';
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
}

interface ClienteTableRow extends Cliente {
  sequencial: number;
}

export function ClientesPage() {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedClientes, setSelectedClientes] = useState<ClienteTableRow[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);

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

    const mock: Cliente[] = [
      {
        id: 1,
        razaoSocial: 'Clínica Ortopédica Alfa',
        nomeMedico: 'Dr. Bruno Fajardo',
        nomeSistema: 'Bruno Fajardo',
        crm: 'CRM-12345',
        rqe: 'RQE-9988',
        hospital: 'Hospital Monte Sinai',
        especialidade: 'Ortopedia',
        subespecialidade: 'Joelho',
        keywords: 'ortopedia, joelho, prótese',
        telefone: '(32) 99999-1111',
        email: 'contato@alfa.com',
        cnpj: '12.345.678/0001-90',
        grupoWhatsapp: 'Grupo Alfa',
        modoValidacao: 'Manual',
        status: true,
        emailAcesso: 'acesso@alfa.com',
        contrato: true,
        procuracao: true,
        arquivoAdicional: false,
        createDate: '2026-03-01',
        updateDate: '2026-03-15',

        nomeCompleto: 'Bruno Fajardo Silva',
        cpf: '123.456.789-00',
        rg: 'MG-12.345.678',
        estadoCivil: 'Casado(a)',
        rua: 'Rua A',
        numero: '100',
        complemento: 'Sala 2',
        bairro: 'Centro',
        cidade: 'Juiz de Fora',
        estado: 'MG',
        cep: '36000-000',

        fantasia: 'Alfa Ortopedia',
        pjRua: 'Av. Brasil',
        pjNumero: '2000',
        pjComplemento: 'Bloco B',
        pjBairro: 'Centro',
        pjCidade: 'Juiz de Fora',
        pjEstado: 'MG',
        pjCep: '36000-100',

        nomeConta: 'Clínica Ortopédica Alfa LTDA',
        numeroBanco: '341',
        nomeBanco: 'Itaú',
        agencia: '1234',
        tipoConta: 'Conta Corrente',
        numeroConta: '98765-4',
        chavePix: 'contato@alfa.com'
      },
      {
        id: 2,
        razaoSocial: 'Instituto Cardio Beta',
        nomeMedico: 'Dr. Vitor Groppo',
        nomeSistema: 'Vitor Groppo',
        crm: 'CRM-54321',
        rqe: 'RQE-1122',
        hospital: 'Hospital Albert Sabin',
        especialidade: 'Cardiologia',
        subespecialidade: 'Hemodinâmica',
        keywords: 'cardio, angioplastia',
        telefone: '(31) 98888-2222',
        email: 'contato@beta.com',
        cnpj: '98.765.432/0001-10',
        grupoWhatsapp: 'Grupo Beta',
        modoValidacao: 'Automática',
        status: true,
        emailAcesso: 'acesso@beta.com',
        contrato: false,
        procuracao: true,
        arquivoAdicional: false,
        createDate: '2026-03-02',
        updateDate: '2026-03-11',

        nomeCompleto: 'Vitor Groppo Andrade',
        cpf: '987.654.321-00',
        rg: 'MG-87.654.321',
        estadoCivil: 'Solteiro(a)',
        rua: 'Rua B',
        numero: '220',
        complemento: '',
        bairro: 'São Mateus',
        cidade: 'Juiz de Fora',
        estado: 'MG',
        cep: '36025-000',

        fantasia: 'Cardio Beta',
        pjRua: 'Av. Rio Branco',
        pjNumero: '1500',
        pjComplemento: '',
        pjBairro: 'Centro',
        pjCidade: 'Juiz de Fora',
        pjEstado: 'MG',
        pjCep: '36010-000',

        nomeConta: 'Instituto Cardio Beta',
        numeroBanco: '001',
        nomeBanco: 'Banco do Brasil',
        agencia: '4567',
        tipoConta: 'Conta Corrente',
        numeroConta: '12345-6',
        chavePix: '98.765.432/0001-10'
      },
      {
        id: 3,
        razaoSocial: 'Neuro Clínica Gama',
        nomeMedico: 'Dr. IBG',
        nomeSistema: 'IBG',
        crm: 'CRM-77777',
        rqe: 'RQE-3333',
        hospital: 'Hospital Unimed',
        especialidade: 'Neurocirurgia',
        subespecialidade: 'Coluna',
        keywords: 'neuro, coluna',
        telefone: '(21) 97777-3333',
        email: 'contato@gama.com',
        cnpj: '11.222.333/0001-44',
        grupoWhatsapp: 'Grupo Gama',
        modoValidacao: 'Manual',
        status: false,
        emailAcesso: 'acesso@gama.com',
        contrato: true,
        procuracao: false,
        arquivoAdicional: false,
        createDate: '2026-03-04',
        updateDate: '2026-03-08',

        nomeCompleto: 'Instituto Brasileiro Gama',
        cpf: '111.222.333-44',
        rg: 'RJ-11.222.333',
        estadoCivil: 'Casado(a)',
        rua: 'Rua C',
        numero: '50',
        complemento: 'Casa',
        bairro: 'Copacabana',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        cep: '22000-000',

        fantasia: 'Gama Neuro',
        pjRua: 'Rua das Flores',
        pjNumero: '10',
        pjComplemento: '',
        pjBairro: 'Centro',
        pjCidade: 'Rio de Janeiro',
        pjEstado: 'RJ',
        pjCep: '22010-000',

        nomeConta: 'Neuro Clínica Gama',
        numeroBanco: '104',
        nomeBanco: 'Caixa',
        agencia: '9999',
        tipoConta: 'Conta Corrente',
        numeroConta: '55555-1',
        chavePix: 'contato@gama.com'
      }
    ];

    const timer = setTimeout(() => {
      setClientes(mock);
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
        onClick={() => {
          setClienteEditando({ ...rowData });
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

  const updateClienteEditando = (field: keyof ClienteTableRow, value: any) => {
    if (!clienteEditando) return;

    setClienteEditando({
      ...clienteEditando,
      [field]: value
    });
  };

  const handleSalvarEdicao = () => {
    if (!clienteEditando) return;

    console.log('Salvar cliente:', clienteEditando);
    setEditDialogVisible(false);
  };

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
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
          tableStyle={{ minWidth: '90rem' }}
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
            <TabPanel header="Básico">
              <div className="cliente-form-grid">
                <div className="field field-span-2">
                  <label>Razão Social</label>
                  <InputText
                    value={clienteEditando.razaoSocial}
                    onChange={(e) => updateClienteEditando('razaoSocial', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Nome Médico</label>
                  <InputText
                    value={clienteEditando.nomeMedico}
                    onChange={(e) => updateClienteEditando('nomeMedico', e.target.value)}
                  />
                </div>

                <div className="field">
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

                <div className="field">
                  <label>Telefone</label>
                  <InputText
                    value={clienteEditando.telefone}
                    onChange={(e) => updateClienteEditando('telefone', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Email</label>
                  <InputText
                    value={clienteEditando.email}
                    onChange={(e) => updateClienteEditando('email', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>CNPJ</label>
                  <InputText
                    value={clienteEditando.cnpj}
                    onChange={(e) => updateClienteEditando('cnpj', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Grupo WhatsApp</label>
                  <InputText
                    value={clienteEditando.grupoWhatsapp}
                    onChange={(e) => updateClienteEditando('grupoWhatsapp', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Modo Validação</label>
                  <InputText
                    value={clienteEditando.modoValidacao}
                    onChange={(e) => updateClienteEditando('modoValidacao', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Status</label>
                  <div className="tag-box">{getBooleanTag(clienteEditando.status)}</div>
                </div>

                <div className="field">
                  <label>Email de Acesso</label>
                  <InputText
                    value={clienteEditando.emailAcesso}
                    onChange={(e) => updateClienteEditando('emailAcesso', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Contrato</label>
                  <div className="tag-box">{getDocumentoTag(clienteEditando.contrato)}</div>
                </div>

                <div className="field field-button">
                  <label>&nbsp;</label>
                  <Button
                    label="Inserir Contrato"
                    icon="pi pi-upload"
                    outlined
                  />
                </div>

                <div className="field">
                  <label>Procuração</label>
                  <div className="tag-box">{getDocumentoTag(clienteEditando.procuracao)}</div>
                </div>

                <div className="field field-button">
                  <label>&nbsp;</label>
                  <Button
                    label="Inserir Procuração"
                    icon="pi pi-upload"
                    outlined
                  />
                </div>

                <div className="field">
                  <label>Arquivo Adicional</label>
                  <div className="tag-box">{getDocumentoTag(clienteEditando.arquivoAdicional)}</div>
                </div>

                <div className="field field-button">
                  <label>&nbsp;</label>
                  <Button
                    label="Inserir Arquivo Adicional"
                    icon="pi pi-upload"
                    outlined
                  />
                </div>

                <div className="field">
                  <label>CreateDate</label>
                  <InputText value={formatarData(clienteEditando.createDate)} disabled />
                </div>

                <div className="field">
                  <label>UpdatedDate</label>
                  <InputText value={formatarData(clienteEditando.updateDate)} disabled />
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

                <div className="field">
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
                  <InputText value={formatarData(clienteEditando.createDate)} disabled />
                </div>

                <div className="field">
                  <label>UpdatedDate</label>
                  <InputText value={formatarData(clienteEditando.updateDate)} disabled />
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Dados PJ">
              <div className="cliente-form-grid">
                <div className="field field-span-2">
                  <label>Fantasia</label>
                  <InputText
                    value={clienteEditando.fantasia}
                    onChange={(e) => updateClienteEditando('fantasia', e.target.value)}
                  />
                </div>

                <div className="field">
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

                <div className="field">
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

                <div className="field">
                  <label>CreateDate</label>
                  <InputText value={formatarData(clienteEditando.createDate)} disabled />
                </div>

                <div className="field">
                  <label>UpdatedDate</label>
                  <InputText value={formatarData(clienteEditando.updateDate)} disabled />
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
                  <InputText value={clienteEditando.numeroBanco} disabled />
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
                  <InputText value={formatarData(clienteEditando.createDate)} disabled />
                </div>

                <div className="field">
                  <label>UpdatedDate</label>
                  <InputText value={formatarData(clienteEditando.updateDate)} disabled />
                </div>
              </div>
            </TabPanel>
          </TabView>
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
    </div>
  );
}

