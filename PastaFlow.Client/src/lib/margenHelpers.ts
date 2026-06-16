export function calcMargenPct(precioVenta: number, margen: number): number {
  return precioVenta > 0 ? (margen / precioVenta) * 100 : 0;
}

export function getMargenClasses(margenPct: number): string {
  if (margenPct < 30) return 'text-red-600 font-semibold';
  if (margenPct <= 50) return 'text-yellow-600 font-semibold';
  return 'text-green-600 font-semibold';
}

export function getMargenBadge(margenPct: number): string {
  if (margenPct < 30) return 'Alerta de pérdida';
  if (margenPct <= 50) return 'Rentabilidad media';
  return 'Alta rentabilidad';
}

export function getMargenBadgeClasses(margenPct: number): string {
  if (margenPct < 30) return 'bg-red-100 text-red-700 border border-red-200';
  if (margenPct <= 50) return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-green-100 text-green-700 border border-green-200';
}
