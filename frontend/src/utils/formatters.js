export function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
}
