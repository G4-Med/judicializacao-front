import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import './ConfiguracoesPage.css';

interface Area {
  id: number;
  area: string;
}

interface Hospital {
  id: number;
  hospital: string;
}

export function ConfiguracoesPage() {

  const [areas, setAreas] = useState<Area[]>([
    { id: 1, area: "Neurocirurgia" },
    { id: 2, area: "Cardiologia" },
    { id: 3, area: "Ortopedia" }
  ]);

  const [hospitais, setHospitais] = useState<Hospital[]>([
    { id: 1, hospital: "Hospital Albert Einstein" },
    { id: 2, hospital: "Hospital Sírio Libanês" }
  ]);

  const [areaDialog, setAreaDialog] = useState(false);
  const [hospitalDialog, setHospitalDialog] = useState(false);

  const [novaArea, setNovaArea] = useState("");
  const [novoHospital, setNovoHospital] = useState("");

  const salvarArea = () => {
    const novo = {
      id: areas.length + 1,
      area: novaArea
    };

    setAreas([...areas, novo]);
    setNovaArea("");
    setAreaDialog(false);
  };

  const salvarHospital = () => {
    const novo = {
      id: hospitais.length + 1,
      hospital: novoHospital
    };

    setHospitais([...hospitais, novo]);
    setNovoHospital("");
    setHospitalDialog(false);
  };

  const headerAreas = (
    <div className="table-header">
      <h3>Áreas</h3>
      <Button
        label="Cadastrar Área"
        icon="pi pi-plus"
        onClick={() => setAreaDialog(true)}
      />
    </div>
  );

  const headerHospitais = (
    <div className="table-header">
      <h3>Hospitais</h3>
      <Button
        label="Cadastrar Hospital"
        icon="pi pi-plus"
        onClick={() => setHospitalDialog(true)}
      />
    </div>
  );

  return (
    <div className="configuracoes-page">

      <div className="page-header">
        <h1>Configurações</h1>
      </div>

      {/* TABELA AREAS */}

      <div className="card">
        <DataTable
          value={areas}
          header={headerAreas}
          tableStyle={{ minWidth: '40rem' }}
        >
          <Column field="id" header="ID" style={{ width: "120px" }} />
          <Column field="area" header="Área" />
        </DataTable>
      </div>

      {/* TABELA HOSPITAIS */}

      <div className="card">
        <DataTable
          value={hospitais}
          header={headerHospitais}
          tableStyle={{ minWidth: '40rem' }}
        >
          <Column field="id" header="ID" style={{ width: "120px" }} />
          <Column field="hospital" header="Hospital" />
        </DataTable>
      </div>

      {/* MODAL AREA */}

      <Dialog
        header="Cadastrar Área"
        visible={areaDialog}
        style={{ width: "400px" }}
        modal
        onHide={() => setAreaDialog(false)}
      >

        <div className="form-field">
          <label>Nome da Área</label>

          <InputText
            value={novaArea}
            onChange={(e) => setNovaArea(e.target.value)}
          />
        </div>

        <div className="dialog-footer">
          <Button label="Cancelar" outlined onClick={() => setAreaDialog(false)} />
          <Button label="Salvar" onClick={salvarArea} />
        </div>

      </Dialog>

      {/* MODAL HOSPITAL */}

      <Dialog
        header="Cadastrar Hospital"
        visible={hospitalDialog}
        style={{ width: "400px" }}
        modal
        onHide={() => setHospitalDialog(false)}
      >

        <div className="form-field">
          <label>Nome do Hospital</label>

          <InputText
            value={novoHospital}
            onChange={(e) => setNovoHospital(e.target.value)}
          />
        </div>

        <div className="dialog-footer">
          <Button label="Cancelar" outlined onClick={() => setHospitalDialog(false)} />
          <Button label="Salvar" onClick={salvarHospital} />
        </div>

      </Dialog>

    </div>
  );
}