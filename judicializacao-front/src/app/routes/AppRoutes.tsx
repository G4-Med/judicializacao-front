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
import { AguardandoCirurgiaPage } from '../../pages/aguardandoCirurgia/AguardandoCirurgiaPage';
import { ResultadosFinanceirosPage } from '../../pages/resultadosFinanceiros/ResultadosFinanceirosPage';
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
import { MonitorIntegracaoPage } from '../../pages/monitorIntegracao/MonitorIntegracaoPage';
import { AccessProvider } from '../../access/AccessContext';
import { ProtectedScreen, RequireAuth } from '../../access/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />

      <Route
        element={(
          <RequireAuth>
            <AccessProvider>
              <MainLayout />
            </AccessProvider>
          </RequireAuth>
        )}
      >
        <Route path="/" element={<ProtectedScreen screen="home"><HomePage /></ProtectedScreen>} />
        <Route path="/home" element={<ProtectedScreen screen="home"><HomePage /></ProtectedScreen>} />
        <Route path="/dashboard" element={<ProtectedScreen screen="dashboard"><DashboardPage /></ProtectedScreen>} />

        <Route path="/processos" element={<ProtectedScreen screen="processos"><ProcessosPage /></ProtectedScreen>} />
        <Route path="/clientes" element={<ProtectedScreen screen="clientes"><ClientesPage /></ProtectedScreen>} />

        <Route path="/para-protocolar" element={<ProtectedScreen screen="paraProtocolar"><ParaProtocolarPage /></ProtectedScreen>} />
        <Route path="/protocolados" element={<ProtectedScreen screen="protocolados"><ProtocoladosPage /></ProtectedScreen>} />
        <Route path="/segredo-justica" element={<ProtectedScreen screen="segredoJustica"><SegredoJusticaPage /></ProtectedScreen>} />
        <Route path="/juridico" element={<ProtectedScreen screen="juridico"><JuridicoPage /></ProtectedScreen>} />
        <Route path="/selecionar-medico" element={<ProtectedScreen screen="selecionarMedico"><SelecionarMedicoPage /></ProtectedScreen>} />
        <Route path="/orcamento-medico" element={<ProtectedScreen screen="orcamentoMedico"><OrcamentoMedicoPage /></ProtectedScreen>} />

        <Route path="/resultados" element={<ProtectedScreen screen="resultados"><ResultadosPage /></ProtectedScreen>} />
        <Route path="/aguardando-cirurgia" element={<ProtectedScreen screen="aguardandoCirurgia"><AguardandoCirurgiaPage /></ProtectedScreen>} />
        <Route path="/resultados-financeiros" element={<ProtectedScreen screen="resultadosFinanceiros"><ResultadosFinanceirosPage /></ProtectedScreen>} />
        <Route path="/perdas" element={<ProtectedScreen screen="perdas"><PerdasPage /></ProtectedScreen>} />
        <Route path="/emails" element={<ProtectedScreen screen="emails"><EmailsPage /></ProtectedScreen>} />

        <Route path="/relatorios/resumido" element={<ProtectedScreen screen="relatorioResumido"><RelatorioResumidoPage /></ProtectedScreen>} />
        <Route path="/relatorios/consolidado" element={<ProtectedScreen screen="relatorioConsolidado"><RelatorioConsolidadoPage /></ProtectedScreen>} />

        <Route path="/usuarios" element={<ProtectedScreen screen="usuarios"><UsuariosPage /></ProtectedScreen>} />
        <Route path="/configuracoes" element={<ProtectedScreen screen="configuracoes"><ConfiguracoesPage /></ProtectedScreen>} />
        <Route path="/configuracoes-emails" element={<ProtectedScreen screen="configuracoesEmails"><ConfiguracoesEmailsPage /></ProtectedScreen>} />
        <Route path="/monitor-integracao" element={<ProtectedScreen screen="monitorIntegracao"><MonitorIntegracaoPage /></ProtectedScreen>} />
        <Route path="/logs" element={<ProtectedScreen screen="logs"><LogsPage /></ProtectedScreen>} />
      </Route>
    </Routes>
  );
}
