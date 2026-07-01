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

// ─── Asistente de Recetas (IA) ────────────────────────────────────────────────

export interface IngredienteExistenteSugeridoDto {
  ingredienteId: number;
  nombre: string;
  unidadMedida: string;
  cantidadPorKg: number;
  costoUnitario: number;
  costoParcial: number;
}

export interface IngredientePropuestoSugeridoDto {
  clavePropuesta: string;
  nombreSugerido: string;
  unidadMedida: string;
  cantidadPorKg: number;
  costoUnitarioEstimado: number;
  motivo: string | null;
  insumoSimilarId: number | null;
  nombreInsumoSimilar: string | null;
  costoParcialEstimado: number;
}

export interface CostoRecetaSugeridaDto {
  costoConfirmadoPorKg: number;
  costoEstimadoAdicionalPorKg: number;
  costoTotalProyectadoPorKg: number;
  tieneIngredientesPendientes: boolean;
  superaCostoMaximo: boolean;
  margenProyectadoPorKg: number | null;
  costoMaximoPorKg: number | null;
  precioVentaObjetivo: number | null;
}

export interface SugerirRecetaResultDto {
  nombreProductoSugerido: string;
  descripcion: string;
  notasElaboracion: string | null;
  ingredientesExistentes: IngredienteExistenteSugeridoDto[];
  ingredientesPropuestos: IngredientePropuestoSugeridoDto[];
  advertencias: string[];
  costos: CostoRecetaSugeridaDto;
}

export interface SugerirRecetaInput {
  briefUsuario: string;
  costoMaximoPorKg?: number | null;
  precioVentaObjetivo?: number | null;
}

export interface SugerenciaRecetaAnteriorInput {
  nombreProductoSugerido: string;
  descripcion: string;
  notasElaboracion: string | null;
  ingredientesExistentes: IngredienteExistenteSugeridoDto[];
  ingredientesPropuestos: IngredientePropuestoSugeridoDto[];
}

export interface RefinarRecetaSugeridaInput {
  briefUsuario: string;
  mensajeRefinamiento: string;
  sugerenciaAnterior: SugerenciaRecetaAnteriorInput;
  costoMaximoPorKg?: number | null;
  precioVentaObjetivo?: number | null;
}

// ─── Planificación de Producción (Predicción de demanda) ───────────────────────

export interface RangoAnalisisDemandaDto {
  desde: string;
  hasta: string;
  diasAnalizados: number;
  totalVentas: number;
}

export interface ClimaPronosticoDto {
  disponible: boolean;
  tempMaxC: number | null;
  precipMm: number | null;
  esFrioOLluvioso: boolean;
  descripcion: string;
}

export interface PrediccionProductoDto {
  productoId: number;
  nombre: string;
  promedioDiario: number;
  promedioDiaTipo: number;
  factorDia29: number;
  factorClima: number;
  prediccionUnidades: number;
  factores: string[];
}

export interface PrediccionDemandaDto {
  fechaObjetivo: string;
  esFinDeSemana: boolean;
  esDia29: boolean;
  clima: ClimaPronosticoDto;
  rango: RangoAnalisisDemandaDto;
  productos: PrediccionProductoDto[];
  totalUnidadesPredichas: number;
  recomendacionIa: string | null;
}

export interface SerieDiariaDto {
  fecha: string;
  unidades: number;
}

export interface PuntoBacktestDto {
  fecha: string;
  real: number;
  predicho: number;
}

export interface BacktestDemandaDto {
  mape: number;
  precision: number;
  diasEvaluados: number;
  testDesde: string;
  testHasta: string;
  serie: PuntoBacktestDto[];
}

// ─── Hoja de producción del día ───────────────────────────────────────────────

export interface HojaProduccionLineaDto {
  productoId: number;
  nombre: string;
  cantidadPredicha: number;
  stockTerminadoActual: number;
  cantidadProducidaHoy: number;
  cantidadFaltaProducir: number;
  esCompuesto: boolean;
  tieneReceta: boolean;
  stockInsumosSuficiente: boolean;
  costoEstimado: number | null;
  margenEstimado: number | null;
  detalleInsumos: DetalleCostoIngredienteDto[];
}

export interface InsumoAgregadoHojaDto {
  ingredienteId: number;
  nombre: string;
  cantidadRequeridaTotal: number;
  stockDisponible: number;
  faltante: number;
  suficiente: boolean;
}

export interface HojaProduccionDiaDto {
  fechaObjetivo: string;
  esFinDeSemana: boolean;
  esDia29: boolean;
  clima: ClimaPronosticoDto;
  totalPredicho: number;
  totalFaltaProducir: number;
  lineasConFalta: number;
  lineasStockOk: number;
  puedeProducirTodo: boolean;
  lineas: HojaProduccionLineaDto[];
  insumosAgregados: InsumoAgregadoHojaDto[];
}

// ─── Compras / Ingreso de mercadería ──────────────────────────────────────────

export interface CompraLineaDto {
  ingredienteId: number;
  nombreIngrediente: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CompraResumenDto {
  id: number;
  fechaIngreso: string;
  proveedorNombre: string | null;
  numeroFactura: string | null;
  cantidadLineas: number;
  total: number;
}

export interface CompraDetalleDto {
  id: number;
  fechaIngreso: string;
  proveedorId: number | null;
  proveedorNombre: string | null;
  numeroFactura: string | null;
  observaciones: string | null;
  total: number;
  lineas: CompraLineaDto[];
}

export interface SugerenciaCompraDto {
  ingredienteId: number;
  nombre: string;
  unidadMedida: string;
  stockActual: number;
  cantidadSugerida: number;
  precioReferencia: number | null;
  motivo: 'FaltanteProduccion' | 'StockCritico';
}

export interface RegistrarCompraInput {
  proveedorId?: number | null;
  numeroFactura?: string | null;
  observaciones?: string | null;
  actualizarCosto: boolean;
  lineas: {
    ingredienteId: number;
    cantidad: number;
    precioUnitario: number;
  }[];
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

export interface ComprasInsightsPaginadoDto {
  items: ComprasInsightResumenDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ComprasInsightsFiltros {
  fechaDesde?: string;
  fechaHasta?: string;
  origen?: 'Automatico' | 'Manual';
  page?: number;
  pageSize?: number;
}

export interface ComprasInsightDto {
  id: number;
  reporte: string;
  generadoEnUtc: string;
  origen: 'Automatico' | 'Manual';
  diaOperativo: string;
}

export type ComprasInsightEmailEstado =
  | 'NoSolicitado'
  | 'Deshabilitado'
  | 'SinDestinatarios'
  | 'Enviado'
  | 'Error';

export interface GenerateComprasInsightResultDto {
  insight: ComprasInsightDto;
  emailEstado: ComprasInsightEmailEstado;
  emailDetalle: string | null;
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
