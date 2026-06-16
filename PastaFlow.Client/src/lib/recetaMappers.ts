import type { IngredienteDto, RecetaItemDto } from '../types/api.types';

export interface IngredienteSeleccionado {
  ingrediente: IngredienteDto;
  cantidad: number;
}

/**
 * Convierte ítems de receta (API) en selecciones del borrador,
 * resolviendo el IngredienteDto completo desde el catálogo cargado.
 */
export function mapRecetaItemsToSeleccionados(
  items: RecetaItemDto[],
  catalogo: IngredienteDto[],
): IngredienteSeleccionado[] {
  return items.map((item) => {
    const ingrediente = catalogo.find((i) => i.id === item.ingredienteId);
    return {
      ingrediente: ingrediente ?? fallbackIngredienteFromRecetaItem(item),
      cantidad: Number(item.cantidadRequerida),
    };
  });
}

/** Fallback cuando el insumo no está en catálogo (p. ej. recién eliminado). */
function fallbackIngredienteFromRecetaItem(item: RecetaItemDto): IngredienteDto {
  return {
    id: item.ingredienteId,
    nombre: item.nombre,
    unidadMedida: item.unidadMedida,
    costoActual: item.costoActual,
    stockActual: 0,
    umbralCritico: 0,
    ultimaActualizacionCosto: '',
  };
}
