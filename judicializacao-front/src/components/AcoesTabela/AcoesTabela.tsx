import { ReactNode } from 'react';
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
 */
export function AcoesTabela({ children }: { children: ReactNode }) {
  return <div className="mc-acoes-tabela">{children}</div>;
}
