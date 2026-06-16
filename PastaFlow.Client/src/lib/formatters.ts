export function fmt(n: number) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

export function stockColor(stockDespues: number, stockActual: number) {
  if (stockDespues < 0) return 'text-red-600 font-semibold';
  if (stockDespues < stockActual * 0.2) return 'text-amber-600 font-semibold';
  return 'text-green-600';
}
