import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import './AcoesTabela.css';

/**
 * Frame reutilizável para os botões de ação de TODA tabela (Baixar Excel · Colunas
 * · o que vier depois) — @R 27/08 21:05: "vamos criar um container para eles...
 * para botões de ações para todas as tabelas para melhorarmos o frontend".
 *
 * Por que existe: sem um dono único do tamanho, cada página herdava CSS diferente
 * (`.orcamento-table .p-button.p-button-outlined` deixava o Excel com 41px; o
 * Colunas tinha padding próprio de 33px — mesma fileira, alturas desiguais,
 * flagrado no print @R). Este container passa a ser ESSE dono: todo `.p-button`
 * direto dentro dele nasce do mesmo tamanho, sem depender de CSS de página.
 *
 * MODO DE EXIBIÇÃO (@R 28/08 10:5x: "um botão para colunas justificadas para
 * tela, com medida padrão, e uma para o método que usamos hoje"): a escolha é
 * UMA para o sistema inteiro (classe no <body>, lembrada no navegador), porque
 * quem prefere ver tudo na tela prefere em toda tabela — não faz sentido
 * decidir 12 vezes. O CSS do modo vive em App.css (`body.mc-tabelas-justificadas`).
 */

const CHAVE = 'mc:tabelas:modo';
type Modo = 'rolagem' | 'justificada';

function lerModo(): Modo {
  try { return localStorage.getItem(CHAVE) === 'justificada' ? 'justificada' : 'rolagem'; }
  catch { return 'rolagem'; }
}

function aplicarModo(m: Modo) {
  document.body.classList.toggle('mc-tabelas-justificadas', m === 'justificada');
  try { localStorage.setItem(CHAVE, m); } catch { /* navegador sem storage: só não lembra */ }
}

// Aplica o modo lembrado no primeiro paint (antes de qualquer tabela montar).
aplicarModo(lerModo());

export function BotaoModoTabela() {
  const [modo, setModo] = useState<Modo>(lerModo);
  useEffect(() => { aplicarModo(modo); }, [modo]);
  const justificada = modo === 'justificada';
  // <button> cru, não <Button> do PrimeReact: regras de página (.juridico-page .p-button…)
  // engoliam o rótulo e o botão virava um quadrado escuro (print @R 28/08 11:2x).
  return (
    <button type="button" className="mc-modo-tabela"
      onClick={() => setModo(justificada ? 'rolagem' : 'justificada')}
      title={justificada
        ? 'Voltar ao modo de rolagem: cada coluna com sua largura padrão, arraste ou use as barras para ver as demais'
        : 'Ajustar à tela: todas as colunas visíveis cabem na largura da janela (o texto quebra em linhas)'}
      aria-pressed={justificada}
      aria-label="Alternar modo de exibição da tabela">
      <i className={justificada ? 'pi pi-arrows-h' : 'pi pi-window-maximize'} aria-hidden="true" />
      <span>{justificada ? 'Rolagem' : 'Ajustar à tela'}</span>
    </button>
  );
}

export function AcoesTabela({ children }: { children: ReactNode }) {
  return (
    <div className="mc-acoes-tabela">
      {children}
      <BotaoModoTabela />
    </div>
  );
}
