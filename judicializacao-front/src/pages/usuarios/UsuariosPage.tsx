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
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import './UsuariosPage.css';

interface Usuario {
  id: number;
  nomeUsuario: string;
  emailAcesso: string;
  permissao: string;
  status: boolean;
  primeiroAcesso: boolean;
  dataCriacao: string;
  dataAlteracao: string;
  medicosVinculados: number[];
}

interface UsuarioTableRow extends Usuario {
  sequencial: number;
}

interface MedicoVinculo {
  id: number;
  nome: string;
  especialidade: string;
  ativo: boolean;
}

export function UsuariosPage() {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUsuarios, setSelectedUsuarios] = useState<UsuarioTableRow[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<1 | 0 | -1 | null | undefined>(null);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    nomeUsuario: { value: '', matchMode: FilterMatchMode.CONTAINS },
    emailAcesso: { value: '', matchMode: FilterMatchMode.CONTAINS },
    permissao: { value: '', matchMode: FilterMatchMode.CONTAINS },
    status: { value: '', matchMode: FilterMatchMode.CONTAINS }
  });

  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [vincularDialogVisible, setVincularDialogVisible] = useState(false);

  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioTableRow | null>(null);
  const [usuarioVinculando, setUsuarioVinculando] = useState<UsuarioTableRow | null>(null);

  const [medicosDisponiveis, setMedicosDisponiveis] = useState<MedicoVinculo[]>([]);
  const [medicosSelecionados, setMedicosSelecionados] = useState<number[]>([]);

  const permissaoOptions = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Jurídico', value: 'Jurídico' },
    { label: 'Financeiro', value: 'Financeiro' },
    { label: 'Operacional', value: 'Operacional' }
  ];

  useEffect(() => {
    setLoading(true);

    const mockUsuarios: Usuario[] = [
      {
        id: 1,
        nomeUsuario: 'Yagoo Pereira',
        emailAcesso: 'yagoo@g4med.com',
        permissao: 'Administrador',
        status: true,
        primeiroAcesso: true,
        dataCriacao: '2026-03-01',
        dataAlteracao: '2026-03-15',
        medicosVinculados: [1, 2]
      },
      {
        id: 2,
        nomeUsuario: 'Isabela Rocha',
        emailAcesso: 'isabela@g4med.com',
        permissao: 'Jurídico',
        status: true,
        primeiroAcesso: false,
        dataCriacao: '2026-03-03',
        dataAlteracao: '2026-03-11',
        medicosVinculados: [2]
      },
      {
        id: 3,
        nomeUsuario: 'Bruno Alves',
        emailAcesso: 'bruno@g4med.com',
        permissao: 'Operacional',
        status: false,
        primeiroAcesso: false,
        dataCriacao: '2026-03-05',
        dataAlteracao: '2026-03-08',
        medicosVinculados: []
      }
    ];

    const mockMedicos: MedicoVinculo[] = [
      { id: 1, nome: 'Dr. Bruno Fajardo', especialidade: 'Ortopedia', ativo: true },
      { id: 2, nome: 'Dr. Vitor Groppo', especialidade: 'Cardiologia', ativo: true },
      { id: 3, nome: 'IBG Saúde', especialidade: 'Neurocirurgia', ativo: true },
      { id: 4, nome: 'Clínica Prisma', especialidade: 'Cirurgia Geral', ativo: false }
    ];

    const timer = setTimeout(() => {
      setUsuarios(mockUsuarios);
      setMedicosDisponiveis(mockMedicos);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const dataComSequencial = useMemo<UsuarioTableRow[]>(() => {
    return usuarios.map((item, index) => ({
      ...item,
      sequencial: index + 1
    }));
  }, [usuarios]);

  const kpis = useMemo(() => {
    const totalUsuarios = dataComSequencial.length;
    const usuariosAtivos = dataComSequencial.filter((item) => item.status).length;
    const usuariosInativos = dataComSequencial.filter((item) => !item.status).length;
    const semPrimeiraConexao = dataComSequencial.filter((item) => !item.primeiroAcesso).length;

    return {
      totalUsuarios,
      usuariosAtivos,
      usuariosInativos,
      semPrimeiraConexao
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

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const getStatusTag = (ativo: boolean) => {
    return (
      <Tag
        value={ativo ? 'Ativo' : 'Inativo'}
        severity={ativo ? 'success' : 'danger'}
      />
    );
  };

  const editarBodyTemplate = (rowData: UsuarioTableRow) => {
    return (
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="secondary"
        aria-label={`Editar usuário ${rowData.id}`}
        onClick={() => {
          setUsuarioEditando({ ...rowData });
          setEditDialogVisible(true);
        }}
      />
    );
  };

  const vincularBodyTemplate = (rowData: UsuarioTableRow) => {
    return (
      <Button
        label="Vincular Médicos"
        icon="pi pi-link"
        outlined
        onClick={() => {
          setUsuarioVinculando({ ...rowData });
          setMedicosSelecionados([...rowData.medicosVinculados]);
          setVincularDialogVisible(true);
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

  const updateUsuarioEditando = (field: keyof UsuarioTableRow, value: any) => {
    if (!usuarioEditando) return;

    setUsuarioEditando({
      ...usuarioEditando,
      [field]: value
    });
  };

  const handleSalvarEdicao = () => {
    if (!usuarioEditando) return;

    console.log('Salvar usuário:', usuarioEditando);
    setEditDialogVisible(false);
  };

  const handleToggleMedico = (medicoId: number) => {
    setMedicosSelecionados((prev) =>
      prev.includes(medicoId)
        ? prev.filter((id) => id !== medicoId)
        : [...prev, medicoId]
    );
  };

  const handleSalvarVinculos = () => {
    if (!usuarioVinculando) return;

    console.log('Salvar vínculos:', {
      usuario: usuarioVinculando,
      medicosSelecionados
    });

    setVincularDialogVisible(false);
  };

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>Gestão dos usuários do sistema</p>
        </div>

        <div className="page-actions">
          <Button
            label="Novo Usuário"
            icon="pi pi-plus"
          />
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total Usuários</span>
            <i className="pi pi-users"></i>
          </div>
          <div className="kpi-value">{kpis.totalUsuarios}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Usuários Ativos</span>
            <i className="pi pi-check-circle"></i>
          </div>
          <div className="kpi-value">{kpis.usuariosAtivos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Usuários Inativos</span>
            <i className="pi pi-times-circle"></i>
          </div>
          <div className="kpi-value">{kpis.usuariosInativos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Sem Primeira Conexão</span>
            <i className="pi pi-sign-in"></i>
          </div>
          <div className="kpi-value">{kpis.semPrimeiraConexao}</div>
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
          selection={selectedUsuarios}
          onSelectionChange={(e) => setSelectedUsuarios(e.value as UsuarioTableRow[])}
          tableStyle={{ minWidth: '90rem' }}
          emptyMessage="Nenhum usuário encontrado."
          className="usuarios-table"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          <Column
            field="sequencial"
            header="#"
            sortable
            style={{ minWidth: '4rem' }}
            body={(rowData: UsuarioTableRow) => rowData.sequencial}
          />

          <Column
            field="nomeUsuario"
            header="Nome Usuário"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '18rem' }}
          />

          <Column
            field="emailAcesso"
            header="Email Acesso"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '18rem' }}
          />

          <Column
            field="permissao"
            header="Permissão"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            style={{ minWidth: '12rem' }}
          />

          <Column
            field="status"
            header="Status"
            sortable
            filter
            filterElement={(options) => filterElement(options, 'Buscar')}
            body={(rowData: UsuarioTableRow) => getStatusTag(rowData.status)}
            style={{ minWidth: '10rem' }}
          />

          <Column
            header="Editar"
            body={editarBodyTemplate}
            style={{ minWidth: '7rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />

          <Column
            header="Vincular Médicos"
            body={vincularBodyTemplate}
            style={{ minWidth: '12rem' }}
            bodyStyle={{ textAlign: 'center' }}
          />
        </DataTable>
      </div>

      <Dialog
        header="Editar Usuário"
        visible={editDialogVisible}
        style={{ width: '50rem', maxWidth: '95vw' }}
        modal
        onHide={() => setEditDialogVisible(false)}
        className="usuario-edit-dialog"
      >
        {usuarioEditando && (
          <div className="usuario-form-grid">
            <div className="field field-span-2">
              <label>Nome Usuário</label>
              <InputText
                value={usuarioEditando.nomeUsuario}
                onChange={(e) => updateUsuarioEditando('nomeUsuario', e.target.value)}
              />
            </div>

            <div className="field field-span-2">
              <label>Email Acesso</label>
              <InputText
                value={usuarioEditando.emailAcesso}
                onChange={(e) => updateUsuarioEditando('emailAcesso', e.target.value)}
              />
            </div>

            <div className="field">
              <label>Permissão</label>
              <Dropdown
                value={usuarioEditando.permissao}
                options={permissaoOptions}
                onChange={(e) => updateUsuarioEditando('permissao', e.value)}
                placeholder="Selecione"
              />
            </div>

            <div className="field">
              <label>Status</label>
              <div className="status-switch-box">
                <InputSwitch
                  checked={usuarioEditando.status}
                  onChange={(e) => updateUsuarioEditando('status', e.value)}
                />
                <span>{usuarioEditando.status ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>

            <div className="field">
              <label>Data de Criação</label>
              <InputText value={formatarData(usuarioEditando.dataCriacao)} disabled />
            </div>

            <div className="field">
              <label>Data de Alteração</label>
              <InputText value={formatarData(usuarioEditando.dataAlteracao)} disabled />
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

      <Dialog
        header={`Vincular Médicos${usuarioVinculando ? ` - ${usuarioVinculando.nomeUsuario}` : ''}`}
        visible={vincularDialogVisible}
        style={{ width: '56rem', maxWidth: '95vw' }}
        modal
        onHide={() => setVincularDialogVisible(false)}
        className="usuario-vinculo-dialog"
      >
        <div className="medicos-vinculo-lista">
          {medicosDisponiveis.map((medico) => {
            const checked = medicosSelecionados.includes(medico.id);

            return (
              <label key={medico.id} className="medico-vinculo-item">
                <div className="medico-vinculo-left">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleMedico(medico.id)}
                  />

                  <div className="medico-vinculo-info">
                    <strong>{medico.nome}</strong>
                    <span>{medico.especialidade}</span>
                  </div>
                </div>

                <Tag
                  value={medico.ativo ? 'Ativo' : 'Inativo'}
                  severity={medico.ativo ? 'success' : 'danger'}
                />
              </label>
            );
          })}
        </div>

        <div className="dialog-footer-actions">
          <Button
            label="Cancelar"
            outlined
            onClick={() => setVincularDialogVisible(false)}
          />
          <Button
            label="Salvar Vínculos"
            icon="pi pi-check"
            onClick={handleSalvarVinculos}
          />
        </div>
      </Dialog>
    </div>
  );
}