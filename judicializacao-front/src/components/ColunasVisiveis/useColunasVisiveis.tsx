import { ReactNode, isValidElement, useEffect, useRef, useState } from 'react';
import React from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import api from '../../services/api';

/**
 * Personalização de colunas POR USUÁRIO (task #228, @R 27/08 19:46: "botão que
 * podemos ocultar as colunas de cada tabela e deixar salvo para cada usuário").
 *
 * Uso na página:
 *   const colunasCfg = useColunasVisiveis('juridico');
 *   ...  {colunasCfg.botao}  ...
 *   <DataTable ...>{colunasCfg.filtrar(<> ...colunas... </>)}</DataTable>
 *
 * Como funciona: filtrar() varre os children (Column elements), identifica cada
 * coluna pelo `field` (colunas SEM field — expander, seleção, Ações — são de
 * sistema e ficam SEMPRE visíveis) e remove as que o usuário ocultou. A escolha
 * grava no servidor (/preferencias/colunas_ocultas:<tela>/) — vale em qualquer
 * máquina — com localStorage como cache/fallback (API fora nunca quebra a tela).
 */

interface ColunaInfo { id: string; label: string }

function rotuloDe(el: any, fallback: string): string {
  const h = el.props?.header;
  if (typeof h === 'string') return h;
  if (isValidElement(h)) {
    const kids = React.Children.toArray((h.props as any)?.children ?? []);
    const texto = kids.find((k) => typeof k === 'string');
    if (typeof texto === 'string' && texto.trim()) return texto.trim();
  }
  return fallback;
}

function achatar(nodes: ReactNode): any[] {
  const out: any[] = [];
  React.Children.forEach(nodes as any, (n: any) => {
    if (n === null || n === undefined || n === false) return;
    if (Array.isArray(n)) { out.push(...achatar(n)); return; }
    if (isValidElement(n) && n.type === React.Fragment) {
      out.push(...achatar((n.props as any).children));
      return;
    }
    out.push(n);
  });
  return out;
}

export function useColunasVisiveis(tela: string) {
  const chave = `colunas_ocultas:${tela}`;
  const lsKey = `mc_${chave}`;
  const [ocultas, setOcultas] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(lsKey) || '[]'); } catch { return []; }
  });
  const [aberto, setAberto] = useState(false);
  const conhecidas = useRef<ColunaInfo[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    api.get(`/preferencias/${encodeURIComponent(chave)}/`)
      .then(({ data }) => {
        const doServidor = data?.valor?.ocultas;
        if (Array.isArray(doServidor)) {
          setOcultas(doServidor);
          try { localStorage.setItem(lsKey, JSON.stringify(doServidor)); } catch { /* cheio/bloqueado */ }
        }
      })
      .catch(() => undefined);   // API fora → fica o cache local
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const salvar = (novas: string[]) => {
    setOcultas(novas);
    try { localStorage.setItem(lsKey, JSON.stringify(novas)); } catch { /* fail-soft */ }
    api.put(`/preferencias/${encodeURIComponent(chave)}/`, { valor: { ocultas: novas } })
      .catch(() => undefined);
  };

  const filtrar = (children: ReactNode) => {
    const els = achatar(children);
    const achadas: ColunaInfo[] = [];
    const resultado = els.filter((el) => {
      const field = el?.props?.field;
      if (typeof field !== 'string' || !field) return true;   // coluna de sistema
      achadas.push({ id: field, label: rotuloDe(el, field) });
      return !ocultas.includes(field);
    });
    // registra o cardápio de colunas p/ o painel (sem loop de render)
    if (JSON.stringify(achadas) !== JSON.stringify(conhecidas.current)) {
      conhecidas.current = achadas;
      setTimeout(() => force((v) => v + 1), 0);
    }
    return resultado;
  };

  const botao = (
    <>
      <Button label="Colunas" icon="pi pi-sliders-h" size="small" outlined severity="secondary"
        onClick={() => setAberto(true)}
        title="Escolha quais colunas aparecem — a escolha fica salva para o seu usuário" />
      <Dialog header="Colunas visíveis" visible={aberto} modal onHide={() => setAberto(false)}
        style={{ width: '24rem', maxWidth: '94vw' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {conhecidas.current.map((c) => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Checkbox checked={!ocultas.includes(c.id)}
                onChange={(e) => salvar(e.checked
                  ? ocultas.filter((o) => o !== c.id)
                  : [...ocultas, c.id])} />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
          <Button label="Restaurar padrão" text size="small" onClick={() => salvar([])} />
          <Button label="Fechar" size="small" onClick={() => setAberto(false)} />
        </div>
      </Dialog>
    </>
  );

  return { filtrar, botao, ocultas };
}
