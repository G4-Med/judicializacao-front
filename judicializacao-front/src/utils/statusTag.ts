const STATUS_COLOR_MAP: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
  'aguardando juridico': {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderColor: '#1d4ed8',
  },
  'aguardando orcamento': {
    backgroundColor: '#f97316',
    color: '#ffffff',
    borderColor: '#ea580c',
  },
  'aguardando protocolar': {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    borderColor: '#7c3aed',
  },
  'aguardando resposta': {
    backgroundColor: '#f59e0b',
    color: '#111827',
    borderColor: '#d97706',
  },
  'aguardando resposta - segredo de justica': {
    backgroundColor: '#a16207',
    color: '#ffffff',
    borderColor: '#854d0e',
  },
  ganho: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    borderColor: '#15803d',
  },
  perda: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    borderColor: '#b91c1c',
  },
  cotar: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderColor: '#2563eb',
  },
  'nao cotar': {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    borderColor: '#dc2626',
  },
  'segredo de justica': {
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    borderColor: '#6d28d9',
  },
  'solicitado ao medico': {
    backgroundColor: '#60a5fa',
    color: '#0f172a',
    borderColor: '#3b82f6',
  },
  'solicitar exames': {
    backgroundColor: '#fbbf24',
    color: '#111827',
    borderColor: '#f59e0b',
  },
  'orcamento enviado': {
    backgroundColor: '#22c55e',
    color: '#ffffff',
    borderColor: '#16a34a',
  },
  'perda pelo medico': {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    borderColor: '#dc2626',
  },
  'perda pelo juridico': {
    backgroundColor: '#b91c1c',
    color: '#ffffff',
    borderColor: '#991b1b',
  },
  'perda por falta de especialista': {
    backgroundColor: '#64748b',
    color: '#ffffff',
    borderColor: '#475569',
  },
  'perda pelo orcamento': {
    backgroundColor: '#b45309',
    color: '#ffffff',
    borderColor: '#92400e',
  },
};

function normalizeStatus(status: string) {
  return status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getStatusTagStyle(status: string) {
  const normalizedStatus = normalizeStatus(status || '');

  return (
    STATUS_COLOR_MAP[normalizedStatus] ?? {
      backgroundColor: '#64748b',
      color: '#ffffff',
      borderColor: '#475569',
    }
  );
}
