import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { excluirOrder } from '../../services/api/orders';
import { readAuthProfile } from '../../access/authProfile';

/**
 * Excluir lançamento errado — SÓ ADMIN, em QUALQUER fase (@R 28/08 03:37:
 * "garantir que no modo admin tenhamos botões para excluir registros").
 *
 * O backend faz backup JSON completo (registro + relacionados) em
 * logs/exclusoes/ ANTES do delete — irreversível no banco, reversível pelo
 * backup. Por isso a confirmação diz o que some e o que fica.
 *
 * Devolve `null` para quem não é Admin: a coluna nem entra na tabela, em vez de
 * entrar desabilitada — quem não pode excluir não precisa ver o espaço.
 */
export function colunaExcluirAdmin(aoExcluir?: () => void) {
  const perfil = readAuthProfile();
  if (perfil?.group !== 'ADMIN') return null;

  const excluir = async (r: any) => {
    const ok = window.confirm(
      `EXCLUIR o lançamento #${r.id} — ${r.paciente ?? 'sem paciente'}?\n\n` +
      'O pedido some de todas as telas e dos indicadores. O sistema guarda um ' +
      'backup completo no servidor antes de apagar (logs/exclusoes/), então dá ' +
      'para restaurar — mas só por quem tem acesso ao servidor.',
    );
    if (!ok) return;
    try {
      await excluirOrder(r.id);
      aoExcluir?.();
    } catch {
      alert('Não foi possível excluir. Só Admin pode, e o pedido precisa existir.');
    }
  };

  return (
    <Column key="col-excluir-admin" header="Excluir" style={{ width: '5.5rem' }}
      bodyStyle={{ textAlign: 'center' }}
      body={(r: any) => (
        <Button icon="pi pi-trash" severity="danger" outlined size="small"
          onClick={() => excluir(r)}
          tooltip="Excluir lançamento (só Admin — backup automático antes)"
          aria-label={`Excluir pedido ${r.id}`} />
      )} />
  );
}
