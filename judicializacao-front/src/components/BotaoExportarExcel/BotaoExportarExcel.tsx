import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import api from '../../services/api';

/**
 * Baixar Excel em TODA tabela (task #227, @R 27/08 19:32-19:37):
 *  - exporta TODOS os registros (não só a página visível da paginação);
 *  - se há filtro ativo (visiveis ≠ todos), PERGUNTA: filtrados ou completos;
 *  - toda exportação vira RASTRO de auditoria no backend (quem, tela, escopo,
 *    nº de linhas) — fail-soft: falha no log nunca bloqueia o download.
 * xlsx entra por import dinâmico (não pesa o bundle de quem nunca exporta).
 */

const flatten = (linha: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(linha)) {
    if (v === null || v === undefined) { out[k] = ''; continue; }
    if (k === 'cadastro' && typeof v === 'object' && 'completos' in v) {
      out[k] = `${v.completos}/${v.total}`; continue;
    }
    if (typeof v === 'object') continue;      // objetos/arrays não viram célula
    out[k] = v;
  }
  return out;
};

async function gerarXlsx(dados: any[], nome: string) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(dados.map(flatten));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nome.slice(0, 30));
  const hoje = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `medcheck_${nome}_${hoje}.xlsx`);
}

interface Props {
  todos: any[];
  visiveis?: any[];          // linhas pós-filtro (onValueChange); ausente = sem noção de filtro
  nome: string;              // slug da tela (vai no nome do arquivo e no log)
}

export function BotaoExportarExcel({ todos, visiveis, nome }: Props) {
  const [perguntando, setPerguntando] = useState(false);
  const [exportando, setExportando] = useState(false);

  const filtrado = !!visiveis && visiveis.length !== todos.length;

  const exportar = async (escopo: 'filtrado' | 'completo') => {
    const dados = escopo === 'filtrado' && visiveis ? visiveis : todos;
    if (!dados.length) { alert('Nada para exportar.'); return; }
    setExportando(true);
    try {
      await gerarXlsx(dados, nome);
      // rastro de auditoria — fire-and-forget (@R: "colocar para rastrear no log")
      api.post('/auditoria/exportacao/', { tela: nome, escopo, linhas: dados.length })
        .catch(() => undefined);
    } catch {
      alert('Erro ao gerar o Excel.');
    } finally {
      setExportando(false);
      setPerguntando(false);
    }
  };

  return (
    <>
      <Button label="Baixar Excel" icon="pi pi-file-excel" size="small" outlined
        severity="success" loading={exportando} className="botao-exportar-excel"
        onClick={() => (filtrado ? setPerguntando(true) : exportar('completo'))} />
      <Dialog header="Baixar Excel" visible={perguntando} modal
        style={{ width: '26rem', maxWidth: '94vw' }} onHide={() => setPerguntando(false)}>
        <p>A tabela está <strong>filtrada</strong>. O que você quer baixar?</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button label={`Filtrados (${visiveis?.length ?? 0})`} icon="pi pi-filter"
            severity="success" onClick={() => exportar('filtrado')} />
          <Button label={`Completos (${todos.length})`} icon="pi pi-table" outlined
            onClick={() => exportar('completo')} />
        </div>
      </Dialog>
    </>
  );
}
