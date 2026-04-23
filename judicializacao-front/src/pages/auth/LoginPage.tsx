import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { persistAuthProfile } from '../../access/authProfile';
import { getDefaultRouteForGroup } from '../../access/permissions';
import { login } from '../../services/auth';
import logo from '../../assets/logog4med.png';
import './LoginPage.css';

type ViewType = 'login' | 'recover';

// ============================================================
// CardBackground
// ============================================================
interface LoginCardBackgroundProps {
  view: ViewType;
}

const LoginCardBackground = ({ view }: LoginCardBackgroundProps) => {
  const bgClass = view === 'login' ? 'recover' : 'login';

  return (
    <>
      <div className={`login-page__card-bg login-page__card-bg--left ${bgClass}`}></div>
      <div className={`login-page__card-bg login-page__card-bg--right ${bgClass}`}></div>
    </>
  );
};

// ============================================================
// LogoGroup
// ============================================================
interface LoginLogoGroupProps {
  logo: string;
  view: ViewType;
}

const LoginLogoGroup = ({ logo, view }: LoginLogoGroupProps) => {
  return (
    <>
      <img
        className={`login-page__logo login-page__logo--left ${view === 'recover' ? 'is-active' : ''}`}
        src={logo}
        alt="Logo G4MED"
      />
      <img
        className={`login-page__logo login-page__logo--right ${view === 'login' ? 'is-active' : ''}`}
        src={logo}
        alt="Logo G4MED"
      />
    </>
  );
};

// ============================================================
// LoginForm
// ============================================================
interface LoginFormsProps {
  view: ViewType;
  toggleView: () => void;
}

const LoginForms = ({ view, toggleView }: LoginFormsProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);
      const profile = persistAuthProfile(data);
      console.log('[LoginPage] grupo recebido no login:', {
        rawGroup: profile.rawGroup,
        normalizedGroup: profile.group,
        payload: data,
      });
      navigate(getDefaultRouteForGroup(profile.group));
    } catch {
      setError('Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`login-page__panel login-page__panel--login ${view === 'login' ? 'is-active' : ''}`}>
        <form className="login-page__form" onSubmit={handleLogin}>
          <h1 className="login-page__title">Login</h1>

          <div className="login-page__input-box">
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
            <input
              className="login-page__input"
              type="password"
              placeholder="Senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="login-page__error">{error}</p>
          )}

          <button type="submit" className="login-page__button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="login-page__text">
            Esqueceu sua senha?
            <button type="button" className="login-page__link-button" onClick={toggleView}>
              Recuperar aqui
            </button>
          </p>
        </form>
      </div>

      <div className={`login-page__panel login-page__panel--recover ${view === 'recover' ? 'is-active' : ''}`}>
        <form className="login-page__form">
          <h1 className="login-page__title">Recuperar senha</h1>

          <div className="login-page__input-box">
            <input className="login-page__input" type="email" placeholder="Email" required />
          </div>

          <button type="submit" className="login-page__button">
            Enviar
          </button>

          <p className="login-page__text">
            Lembrou a senha?
            <button type="button" className="login-page__link-button" onClick={toggleView}>
              Login aqui
            </button>
          </p>
        </form>
      </div>
    </>
  );
};

// ============================================================
// LoginPage
// ============================================================
export const LoginPage = () => {
  const [view, setView] = useState<ViewType>('login');

  const toggleView = () => {
    setView((prev) => (prev === 'login' ? 'recover' : 'login'));
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <LoginCardBackground view={view} />
        <LoginLogoGroup logo={logo} view={view} />
        <LoginForms view={view} toggleView={toggleView} />
      </div>
    </div>
  );
};
