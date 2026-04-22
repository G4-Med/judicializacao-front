import { Route, Routes } from 'react-router-dom';

import { MainLayout } from '../layout/MainLayout';

import { LoginPage } from '../../pages/auth/LoginPage';
import { RecuperarSenhaPage } from '../../pages/auth/RecuperarSenhaPage';
import { DashboardPage } from '../../pages/dashboard/DashboardPage';
import { HomePage } from '../../pages/home/HomePage';
import { ProcessosPage } from '../../pages/processos/ProcessosPage';
import { ClientesPage } from '../../pages/clientes/ClientesPage';
import { ParaProtocolarPage } from '../../pages/paraProtocolar/ParaProtocolarPage';
import { ProtocoladosPage } from '../../pages/protocolados/ProtocoladosPage';
import { SegredoJusticaPage } from '../../pages/segredoJustica/SegredoJusticaPage';
import { ResultadosPage } from '../../pages/resultados/ResultadosPage';
import { PerdasPage } from '../../pages/perdas/PerdasPage';
import { UsuariosPage } from '../../pages/usuarios/UsuariosPage';
import { ConfiguracoesPage } from '../../pages/configuracoes/ConfiguracoesPage';
import { LogsPage } from '../../pages/logs/LogsPage';
import { JuridicoPage } from '../../pages/juridico/JuridicoPage';
import { OrcamentoMedicoPage } from '../../pages/orcamentoMedico/OrcamentoMedicoPage';
import { SelecionarMedicoPage } from '../../pages/selecionarMedico/SelecionarMedicoPage';
import { RelatorioResumidoPage } from '../../pages/relatorios/RelatorioResumidoPage';
import { RelatorioConsolidadoPage } from '../../pages/relatorios/RelatorioConsolidadoPage';
import { EmailsPage } from '../../pages/emails/EmailsPage';
import { ConfiguracoesEmailsPage } from '../../pages/configuracoesEmails/ConfiguracoesEmailsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/processos" element={<ProcessosPage />} />
        <Route path="/clientes" element={<ClientesPage />} />

        <Route path="/para-protocolar" element={<ParaProtocolarPage />} />
        <Route path="/protocolados" element={<ProtocoladosPage />} />
        <Route path="/segredo-justica" element={<SegredoJusticaPage />} />
        <Route path="/juridico" element={<JuridicoPage />} />
        <Route path="/selecionar-medico" element={<SelecionarMedicoPage />} />
        <Route path="/orcamento-medico" element={<OrcamentoMedicoPage />} />

        <Route path="/resultados" element={<ResultadosPage />} />
        <Route path="/perdas" element={<PerdasPage />} />
        <Route path="/emails" element={<EmailsPage />} />

        <Route path="/relatorios/resumido" element={<RelatorioResumidoPage />} />
        <Route path="/relatorios/consolidado" element={<RelatorioConsolidadoPage />} />

        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        <Route path="/configuracoes-emails" element={<ConfiguracoesEmailsPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>
    </Routes>
  );
}
