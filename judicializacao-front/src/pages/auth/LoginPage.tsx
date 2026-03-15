import { useState } from 'react';
import logo from '../../assets/logog4med.png';
import './LoginPage.css';

type ViewType = 'login' | 'register';

interface CardBackgroundProps {
  view: ViewType;
}

const CardBackground = ({ view }: CardBackgroundProps) => {
  const bgClass = view === 'login' ? 'register' : 'login';

  return (
    <>
      <div className={`card-bg card-bg-1 ${bgClass}`}></div>
      <div className={`card-bg card-bg-2 ${bgClass}`}></div>
    </>
  );
};

interface LogoGroupProps {
  logo: string;
  view: ViewType;
}

const LogoGroup = ({ logo, view }: LogoGroupProps) => {
  return (
    <>
      <img
        className={`logo logo-1 ${view === 'register' ? 'active' : ''}`}
        src={logo}
        alt="Logo G4MED"
      />
      <img
        className={`logo logo-2 ${view === 'login' ? 'active' : ''}`}
        src={logo}
        alt="Logo G4MED"
      />
    </>
  );
};

interface LoginFormProps {
  view: ViewType;
  toggleView: () => void;
}

const LoginForm = ({ view, toggleView }: LoginFormProps) => {
  return (
    <>
      <div className={`form login ${view === 'login' ? 'active' : ''}`}>
        <form>
          <h1>Login</h1>

          <div className="input-box">
            <input type="email" placeholder="Email" required />
          </div>

          <div className="input-box">
            <input type="password" placeholder="Senha" required />
          </div>

          <button type="submit" className="btn">
            Entrar
          </button>

          <p>
            Esqueceu sua senha?
            <button type="button" className="link-btn" onClick={toggleView}>
              Recuperar aqui
            </button>
          </p>
        </form>
      </div>

      <div className={`form register ${view === 'register' ? 'active' : ''}`}>
        <form>
          <h1>Recuperar senha</h1>

          <div className="input-box">
            <input type="email" placeholder="Email" required />
          </div>

          <button type="submit" className="btn">
            Enviar
          </button>

          <p>
            Lembrou a senha?
            <button type="button" className="link-btn" onClick={toggleView}>
              Login aqui
            </button>
          </p>
        </form>
      </div>
    </>
  );
};

export const LoginPage = () => {
  const [view, setView] = useState<ViewType>('login');

  const toggleView = () =>
    setView(view === 'login' ? 'register' : 'login');

  return (
    <div className="page">
      <div className="card">
        <CardBackground view={view} />
        <LogoGroup logo={logo} view={view} />
        <LoginForm view={view} toggleView={toggleView} />
      </div>
    </div>
  );
};