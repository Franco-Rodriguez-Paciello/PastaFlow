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
