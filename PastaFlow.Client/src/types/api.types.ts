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

export interface DashboardStatsDto {
  valorTotalInsumos: number;
  produccionHoy: number;
  insumosCriticosCount: number;
  listaStockCritico: StockCriticoItemDto[];
  ultimasProducciones: UltimaProduccionItemDto[];
}
