export interface IngredienteDto {
  id: number;
  nombre: string;
  unidadMedida: string;
  costoActual: number;
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

export interface ProductoDto {
  id: number;
  nombre: string;
  tipoProducto: string;
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
