import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { persistAuthProfile } from '../../access/authProfile';
import { getDefaultRouteForGroup } from '../../access/permissions';
import { login } from '../../services/auth';
import './LoginPage.css';

type ViewType = 'login' | 'recover';

/* ============================================================
   Brand mark — MEDCHECK (sem dependência de arquivo de imagem)
   ============================================================ */
interface BrandProps { compact?: boolean }
const BrandMark = ({ compact = false }: BrandProps) => (
  <div className={`login-page__brand ${compact ? 'login-page__brand--compact' : ''}`}>
    <span className="login-page__brand-mark" aria-hidden>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" />
        <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
      </svg>
    </span>
    <div className="login-page__brand-text">
      <div>MED<span>CHECK</span></div>
      <small>Urgência e Emergência Judicial</small>
    </div>
  </div>
);

/* ============================================================
   Backgrounds (rotação preservada)
   ============================================================ */
interface LoginCardBackgroundProps { view: ViewType }
const LoginCardBackground = ({ view }: LoginCardBackgroundProps) => {
  const bgClass = view === 'login' ? 'recover' : 'login';
  return (
    <>
      <div className={`login-page__card-bg login-page__card-bg--left ${bgClass}`}>
        <div className="login-page__bg-pattern" />
      </div>
      <div className={`login-page__card-bg login-page__card-bg--right ${bgClass}`}>
        <div className="login-page__bg-pattern" />
      </div>
    </>
  );
};

/* ============================================================
   Logo flutuante de cada lado (transição preservada)
   ============================================================ */
interface LoginLogoGroupProps { view: ViewType }
const LoginLogoGroup = ({ view }: LoginLogoGroupProps) => (
  <>
    <div className={`login-page__logo login-page__logo--left ${view === 'recover' ? 'is-active' : ''}`}>
      <BrandMark />
      <p className="login-page__tagline">
        Gestão integrada de casos de urgência e emergência judicial em saúde.
      </p>
    </div>
    <div className={`login-page__logo login-page__logo--right ${view === 'login' ? 'is-active' : ''}`}>
      <BrandMark />
      <p className="login-page__tagline">
        Recupere seu acesso com segurança<br />e volte à operação em segundos.
      </p>
    </div>
  </>
);

/* ============================================================
   Formulários
   ============================================================ */
interface LoginFormsProps { view: ViewType; toggleView: () => void }
const LoginForms = ({ view, toggleView }: LoginFormsProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoverSent, setRecoverSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      const profile = persistAuthProfile(data);
      navigate(getDefaultRouteForGroup(profile.group));
    } catch {
      setError('Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverSent(true);
  };

  return (
    <>
      {/* ---------- LOGIN ---------- */}
      <div className={`login-page__panel login-page__panel--login ${view === 'login' ? 'is-active' : ''}`}>
        <form className="login-page__form" onSubmit={handleLogin}>
          <span className="login-page__eyebrow">Acesso ao sistema</span>
          <h1 className="login-page__title">Bem-vindo de volta</h1>
          <p className="login-page__subtitle">Entre com suas credenciais para continuar.</p>

          <div className="login-page__input-box">
            <i className="pi pi-user login-page__input-icon" />
            <input
              className="login-page__input"
              type="text"
              placeholder="Usuário"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="login-page__input-box">
            <i className="pi pi-lock login-page__input-icon" />
            <input
              className="login-page__input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="login-page__input-trailing"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <i className={showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'} />
            </button>
          </div>

          {error && (
            <p className="login-page__error">
              <i className="pi pi-exclamation-circle" /> {error}
            </p>
          )}

          <button type="submit" className="login-page__button" disabled={loading}>
            {loading ? (
              <><i className="pi pi-spin pi-spinner" /> Entrando...</>
            ) : (
              <>Entrar <i className="pi pi-arrow-right" /></>
            )}
          </button>

          <p className="login-page__text">
            Esqueceu sua senha?
            <button type="button" className="login-page__link-button" onClick={() => navigate('/recuperar-senha')}>
              Recuperar aqui
            </button>
          </p>

          <div className="login-page__footer">
            <span><i className="pi pi-shield" /> Conexão protegida por SSL</span>
          </div>
        </form>
      </div>

      {/* ---------- RECUPERAR ---------- */}
      <div className={`login-page__panel login-page__panel--recover ${view === 'recover' ? 'is-active' : ''}`}>
        <form className="login-page__form" onSubmit={handleRecover}>
          <span className="login-page__eyebrow">Recuperação de senha</span>
          <h1 className="login-page__title">Esqueceu sua senha?</h1>
          <p className="login-page__subtitle">
            Informe seu email cadastrado e enviaremos um link para redefinir sua senha.
          </p>

          <div className="login-page__input-box">
            <i className="pi pi-envelope login-page__input-icon" />
            <input
              className="login-page__input"
              type="email"
              placeholder="seuemail@dominio.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {recoverSent && (
            <p className="login-page__success">
              <i className="pi pi-check-circle" /> Se o email estiver cadastrado, você receberá as instruções em breve.
            </p>
          )}

          <button type="submit" className="login-page__button">
            Enviar link de recuperação <i className="pi pi-send" />
          </button>

          <p className="login-page__text">
            Lembrou a senha?
            <button type="button" className="login-page__link-button" onClick={toggleView}>
              Voltar ao login
            </button>
          </p>

          <div className="login-page__footer">
            <span><i className="pi pi-info-circle" /> O link expira em 30 minutos</span>
          </div>
        </form>
      </div>
    </>
  );
};

/* ============================================================
   Página
   ============================================================ */
export const LoginPage = () => {
  const [view, setView] = useState<ViewType>('login');
  const toggleView = () => setView((prev) => (prev === 'login' ? 'recover' : 'login'));

  return (
    <div className="login-page">
      <div className="login-page__card">
        <LoginCardBackground view={view} />
        <LoginLogoGroup view={view} />
        <LoginForms view={view} toggleView={toggleView} />
      </div>
      <p className="login-page__copyright">© {new Date().getFullYear()} MEDCHECK · Sistema de Judicialização</p>
    </div>
  );
};
