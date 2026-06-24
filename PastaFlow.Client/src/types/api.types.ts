export interface AjusteStockDto {
  id: number;
  fechaRegistro: string;
  insumoId: number;
  nombreInsumo: string;
  tipoAjuste: 'Suma' | 'Resta';
  motivo: 'Merma' | 'Rotura' | 'ConteoFisico' | 'CompraManual';
  cantidad: number;
  observaciones: string | null;
}

export interface IngredienteDto {
  id: number;
  nombre: string;
  unidadMedida: string;
  costoActual: number;
  stockActual: number;
  umbralCritico: number;
  ultimaActualizacionCosto: string;
}

export interface ProductProfitabilityDto {
  id: number;
  nombre: string;
  precioVenta: number;
  costoTotal: number;
  margen: number;
}

export interface RecetaItemDto {
  ingredienteId: number;
  nombre: string;
  costoActual: number;
  unidadMedida: string;
  cantidadRequerida: number;
}

export interface RecetaIngredienteDto {
  ingredienteId: number;
  nombreIngrediente: string;
  cantidadRequerida: number;
  unidadMedida: string;
}

export interface ProductoDto {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  stockActual: number;
  tipoProducto: string;
  activoParaTiendaOnline: boolean;
  receta: RecetaIngredienteDto[];
}

export interface RegistrarProductoInput {
  nombre: string;
  descripcion: string;
  precioVenta: number;
  stockInicial: number;
  activoParaTiendaOnline: boolean;
  /** 0 = Simple | 1 = Compuesto */
  tipoProducto: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface StockCriticoItemDto {
  nombre: string;
  stockActual: number;
  unidadMedida: string;
}

export interface UltimaProduccionItemDto {
  nombreProducto: string;
  cantidadProducida: number;
  fechaDeRegistro: string; // ISO 8601
}

export interface HistorialProduccionDto {
  id: number;
  productoId: number;
  nombreProducto: string;
  cantidadProducida: number;
  fechaDeRegistro: string; // ISO 8601
}

export interface DetalleCostoIngredienteDto {
  ingredienteId: number;
  nombreIngrediente: string;
  cantidadRequeridaPorUnidad: number;
  cantidadTotalRequerida: number;
  costoUnitario: number;
  costoParcial: number;
  stockDisponible: number;
  stockSuficiente: boolean;
}

export interface OrdenProduccionDto {
  productoId: number;
  productoNombre: string;
  cantidadProducida: number;
  costoTotal: number;
  precioVentaUnitario: number;
  margenEstimado: number;
  stockSuficiente: boolean;
  esVerificacionPrevia: boolean;
  detalleCostos: DetalleCostoIngredienteDto[];
}

export interface DashboardStatsDto {
  valorTotalInsumos: number;
  produccionHoy: number;
  insumosCriticosCount: number;
  listaStockCritico: StockCriticoItemDto[];
  ultimasProducciones: UltimaProduccionItemDto[];
}

// ─── Ventas ───────────────────────────────────────────────────────────────────

export type MetodoPago = 'Efectivo' | 'Transferencia';

export interface ItemVentaDto {
  productoId: number;
  cantidad: number;
}

export interface RegistrarVentaDto {
  metodoPago: MetodoPago;
  items: ItemVentaDto[];
}

export interface DetalleVentaDto {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaRegistradaDto {
  id: number;
  fecha: string;
  total: number;
  metodoPago: MetodoPago;
  detalles: DetalleVentaDto[];
}

// ─── Financial Dashboard ──────────────────────────────────────────────────────

export interface ProductoMasVendidoDto {
  productoId: number;
  nombreProducto: string;
  totalUnidadesVendidas: number;
  totalFacturado: number;
}

export interface FinancialDashboardDto {
  ventasTotalesHoy: number;
  totalEfectivoHoy: number;
  totalTransferenciaHoy: number;
  top5ProductosMasVendidos: ProductoMasVendidoDto[];
}

export interface ComprasInsightResumenDto {
  id: number;
  generadoEnUtc: string;
  origen: 'Automatico' | 'Manual';
  diaOperativo: string;
  vistaPrevia: string;
}

export interface ComprasInsightDto {
  id: number;
  reporte: string;
  generadoEnUtc: string;
  origen: 'Automatico' | 'Manual';
  diaOperativo: string;
}

export interface ProveedorIngredienteDto {
  ingredienteId: number;
  ingredienteNombre: string;
  unidadMedida: string;
  codigoProveedor: string | null;
  precioReferencia: number;
  esPreferido: boolean;
  tiempoEntregaDias: number | null;
}

export interface ProveedorDto {
  id: number;
  nombre: string;
  contactoNombre: string | null;
  telefono: string | null;
  email: string | null;
  cuit: string | null;
  notas: string | null;
  activo: boolean;
  ingredientes: ProveedorIngredienteDto[];
}
