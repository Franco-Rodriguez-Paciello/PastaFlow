import { create } from 'zustand';
import type { IngredienteDto, ProductoDto } from '../types/api.types';
import { getIngredientes } from '../services/ingredienteService';
import {
  asignarReceta,
  getProductos,
  getRecetaByProducto,
  registrarProducto,
} from '../services/productoService';
import { mapRecetaItemsToSeleccionados, type IngredienteSeleccionado } from '../lib/recetaMappers';
import { ApiError } from '../lib/apiError';

export type RecetaModo = 'existente' | 'nuevo';

export type RecetaNuevoForm = {
  nombre: string;
  descripcion: string;
  precioVenta: string;
  stockInicial: string;
  activoVentaOnline: boolean;
};

const INITIAL_NUEVO_FORM: RecetaNuevoForm = {
  nombre: '',
  descripcion: '',
  precioVenta: '',
  stockInicial: '',
  activoVentaOnline: false,
};

let successTimer: ReturnType<typeof setTimeout> | null = null;

interface RecetasStore {
  ingredientesDisponibles: IngredienteDto[];
  productos: ProductoDto[];
  loading: boolean;
  error: string | null;

  modo: RecetaModo;
  productoId: string;
  nuevoForm: RecetaNuevoForm;
  busqueda: string;

  ingredientesSeleccionados: IngredienteSeleccionado[];
  loadingReceta: boolean;

  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;

  init: () => Promise<void>;
  setModo: (modo: RecetaModo) => void;
  setBusqueda: (busqueda: string) => void;
  setNuevoFormField: <K extends keyof RecetaNuevoForm>(field: K, value: RecetaNuevoForm[K]) => void;
  toggleActivoVentaOnline: () => void;
  selectProducto: (id: string) => Promise<void>;

  agregarIngrediente: (ingrediente: IngredienteDto) => void;
  removerIngrediente: (id: number) => void;
  actualizarCantidad: (id: number, cantidad: number) => void;
  limpiarReceta: () => void;

  guardarReceta: () => Promise<void>;
  dismissSaveError: () => void;
}

function resetFormulario(): Partial<RecetasStore> {
  return {
    productoId: '',
    nuevoForm: INITIAL_NUEVO_FORM,
    saveError: null,
    saveSuccess: false,
  };
}

export const useRecetasStore = create<RecetasStore>((set, get) => ({
  ingredientesDisponibles: [],
  productos: [],
  loading: false,
  error: null,

  modo: 'existente',
  productoId: '',
  nuevoForm: INITIAL_NUEVO_FORM,
  busqueda: '',

  ingredientesSeleccionados: [],
  loadingReceta: false,

  saving: false,
  saveError: null,
  saveSuccess: false,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const [ings, prods] = await Promise.all([getIngredientes(), getProductos()]);
      set({ ingredientesDisponibles: ings, productos: prods });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al cargar datos.' });
    } finally {
      set({ loading: false });
    }
  },

  setModo: (modo) => {
    if (modo === get().modo) return;
    set({
      modo,
      ...resetFormulario(),
      ingredientesSeleccionados: [],
    });
  },

  setBusqueda: (busqueda) => set({ busqueda }),

  setNuevoFormField: (field, value) => {
    set((state) => ({
      nuevoForm: { ...state.nuevoForm, [field]: value },
    }));
  },

  toggleActivoVentaOnline: () => {
    set((state) => ({
      nuevoForm: {
        ...state.nuevoForm,
        activoVentaOnline: !state.nuevoForm.activoVentaOnline,
      },
    }));
  },

  selectProducto: async (id) => {
    set({ productoId: id });
    if (!id) {
      set({ ingredientesSeleccionados: [] });
      return;
    }

    set({ loadingReceta: true });
    try {
      const receta = await getRecetaByProducto(Number(id));
      const { ingredientesDisponibles } = get();
      set({
        ingredientesSeleccionados: receta.length === 0
          ? []
          : mapRecetaItemsToSeleccionados(receta, ingredientesDisponibles),
      });
    } catch {
      set({ ingredientesSeleccionados: [] });
    } finally {
      set({ loadingReceta: false });
    }
  },

  agregarIngrediente: (ingrediente) => {
    set((state) => {
      const yaExiste = state.ingredientesSeleccionados.some(
        (item) => item.ingrediente.id === ingrediente.id,
      );
      if (yaExiste) return state;
      return {
        ingredientesSeleccionados: [
          ...state.ingredientesSeleccionados,
          { ingrediente, cantidad: 0 },
        ],
      };
    });
  },

  removerIngrediente: (id) => {
    set((state) => ({
      ingredientesSeleccionados: state.ingredientesSeleccionados.filter(
        (item) => item.ingrediente.id !== id,
      ),
    }));
  },

  actualizarCantidad: (id, cantidad) => {
    set((state) => ({
      ingredientesSeleccionados: state.ingredientesSeleccionados.map((item) =>
        item.ingrediente.id === id ? { ...item, cantidad } : item,
      ),
    }));
  },

  limpiarReceta: () => set({ ingredientesSeleccionados: [] }),

  guardarReceta: async () => {
    const {
      ingredientesSeleccionados,
      modo,
      productoId,
      nuevoForm,
    } = get();

    if (ingredientesSeleccionados.length === 0) {
      set({ saveError: 'La receta no tiene ningún insumo.' });
      return;
    }

    if (modo === 'nuevo') {
      if (!nuevoForm.nombre.trim()) {
        set({ saveError: 'Ingresá el nombre del producto.' });
        return;
      }
      const precio = parseFloat(nuevoForm.precioVenta);
      if (isNaN(precio) || precio < 0) {
        set({ saveError: 'Ingresá un precio de venta válido.' });
        return;
      }
      if (!nuevoForm.descripcion.trim()) {
        set({ saveError: 'Ingresá una descripción para el producto.' });
        return;
      }
    } else if (!productoId) {
      set({ saveError: 'Seleccioná un producto antes de guardar.' });
      return;
    }

    set({ saving: true, saveError: null, saveSuccess: false });
    try {
      let idFinal = Number(productoId);
      if (modo === 'nuevo') {
        idFinal = await registrarProducto({
          nombre: nuevoForm.nombre.trim(),
          descripcion: nuevoForm.descripcion.trim(),
          precioVenta: parseFloat(nuevoForm.precioVenta),
          stockInicial: nuevoForm.stockInicial !== '' ? parseFloat(nuevoForm.stockInicial) : 0,
          activoParaTiendaOnline: nuevoForm.activoVentaOnline,
          tipoProducto: 1,
        });
        set({ productoId: String(idFinal) });
        const prods = await getProductos();
        set({ productos: prods });
      }

      await asignarReceta(
        idFinal,
        ingredientesSeleccionados.map((item) => ({
          ingredienteId: item.ingrediente.id,
          cantidadRequerida: item.cantidad,
        })),
      );

      set({ saveSuccess: true });
      if (successTimer) clearTimeout(successTimer);
      successTimer = setTimeout(() => set({ saveSuccess: false }), 4000);
    } catch (err) {
      const message = err instanceof ApiError
        ? (err.detail ?? err.message)
        : err instanceof Error
          ? err.message
          : 'Error al guardar la receta.';
      set({ saveError: message });
    } finally {
      set({ saving: false });
    }
  },

  dismissSaveError: () => set({ saveError: null }),
}));

export function selectIngredientesFiltrados(
  ingredientes: IngredienteDto[],
  busqueda: string,
): IngredienteDto[] {
  const term = busqueda.toLowerCase();
  return ingredientes.filter((ing) => ing.nombre.toLowerCase().includes(term));
}

export function selectCostoTotal(items: IngredienteSeleccionado[]): number {
  return items.reduce((acc, item) => acc + item.cantidad * item.ingrediente.costoActual, 0);
}

export function selectTieneItemsEnCero(items: IngredienteSeleccionado[]): boolean {
  return items.some((item) => item.cantidad <= 0);
}

export function selectIdsSeleccionados(items: IngredienteSeleccionado[]): Set<number> {
  return new Set(items.map((i) => i.ingrediente.id));
}

export function selectGuardarDisabled(state: {
  saving: boolean;
  loadingReceta: boolean;
  ingredientesSeleccionados: IngredienteSeleccionado[];
  modo: RecetaModo;
  productoId: string;
  nuevoForm: RecetaNuevoForm;
}): boolean {
  return (
    state.saving ||
    state.loadingReceta ||
    state.ingredientesSeleccionados.length === 0 ||
    selectTieneItemsEnCero(state.ingredientesSeleccionados) ||
    (state.modo === 'existente' && !state.productoId) ||
    (state.modo === 'nuevo' && (
      !state.nuevoForm.nombre.trim() ||
      !state.nuevoForm.descripcion.trim() ||
      !state.nuevoForm.precioVenta
    ))
  );
}
