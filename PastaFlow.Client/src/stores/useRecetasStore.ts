import { create } from 'zustand';
import type {
  CostoRecetaSugeridaDto,
  IngredienteDto,
  IngredienteExistenteSugeridoDto,
  IngredientePropuestoSugeridoDto,
  ProductoDto,
  SugerirRecetaResultDto,
} from '../types/api.types';
import { getIngredientes, registrarIngrediente } from '../services/ingredienteService';
import {
  asignarReceta,
  getProductos,
  getRecetaByProducto,
  registrarProducto,
  sugerirReceta,
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

const UNIDAD_MEDIDA_ENUM: Record<string, number> = {
  Kilogramo: 0,
  Litro: 1,
  Unidad: 2,
  Docena: 3,
};

function recalcularCostosSugerencia(
  existentes: IngredienteExistenteSugeridoDto[],
  propuestos: IngredientePropuestoSugeridoDto[],
  prev: CostoRecetaSugeridaDto,
): CostoRecetaSugeridaDto {
  const costoConfirmado = existentes.reduce((acc, item) => acc + item.costoParcial, 0);
  const costoEstimado = propuestos.reduce((acc, item) => acc + item.costoParcialEstimado, 0);
  const total = costoConfirmado + costoEstimado;
  const superaMaximo = prev.costoMaximoPorKg !== null
    && prev.costoMaximoPorKg > 0
    && total > prev.costoMaximoPorKg;
  const margen = prev.precioVentaObjetivo !== null
    ? prev.precioVentaObjetivo - total
    : null;

  return {
    ...prev,
    costoConfirmadoPorKg: costoConfirmado,
    costoEstimadoAdicionalPorKg: costoEstimado,
    costoTotalProyectadoPorKg: total,
    tieneIngredientesPendientes: propuestos.length > 0,
    superaCostoMaximo: superaMaximo,
    margenProyectadoPorKg: margen,
  };
}

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

  asistenteBrief: string;
  asistenteCostoMaximo: string;
  asistentePrecioObjetivo: string;
  sugerencia: SugerirRecetaResultDto | null;
  sugerenciaLoading: boolean;
  sugerenciaError: string | null;
  creandoInsumoClave: string | null;

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

  setAsistenteBrief: (value: string) => void;
  setAsistenteCostoMaximo: (value: string) => void;
  setAsistentePrecioObjetivo: (value: string) => void;
  solicitarSugerenciaReceta: () => Promise<void>;
  descartarSugerencia: () => void;
  aplicarSugerenciaReceta: () => void;
  crearInsumoDesdePropuesta: (
    clavePropuesta: string,
    input: { nombre: string; unidadMedida: string; costoInicial: number },
  ) => Promise<void>;
  dismissSugerenciaError: () => void;
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

  asistenteBrief: '',
  asistenteCostoMaximo: '',
  asistentePrecioObjetivo: '',
  sugerencia: null,
  sugerenciaLoading: false,
  sugerenciaError: null,
  creandoInsumoClave: null,

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

  setAsistenteBrief: (value) => set({ asistenteBrief: value }),
  setAsistenteCostoMaximo: (value) => set({ asistenteCostoMaximo: value }),
  setAsistentePrecioObjetivo: (value) => set({ asistentePrecioObjetivo: value }),
  dismissSugerenciaError: () => set({ sugerenciaError: null }),

  solicitarSugerenciaReceta: async () => {
    const { asistenteBrief, asistenteCostoMaximo, asistentePrecioObjetivo } = get();
    if (!asistenteBrief.trim()) {
      set({ sugerenciaError: 'Describí qué pasta querés desarrollar.' });
      return;
    }

    const costoMax = asistenteCostoMaximo.trim() ? parseFloat(asistenteCostoMaximo) : null;
    const precioObj = asistentePrecioObjetivo.trim() ? parseFloat(asistentePrecioObjetivo) : null;

    set({ sugerenciaLoading: true, sugerenciaError: null });
    try {
      const resultado = await sugerirReceta({
        briefUsuario: asistenteBrief.trim(),
        costoMaximoPorKg: costoMax !== null && !isNaN(costoMax) ? costoMax : null,
        precioVentaObjetivo: precioObj !== null && !isNaN(precioObj) ? precioObj : null,
      });
      set({ sugerencia: resultado });
    } catch (err) {
      const message = err instanceof ApiError
        ? (err.detail ?? err.message)
        : err instanceof Error
          ? err.message
          : 'Error al generar la sugerencia.';
      set({ sugerenciaError: message });
    } finally {
      set({ sugerenciaLoading: false });
    }
  },

  descartarSugerencia: () => set({ sugerencia: null, sugerenciaError: null }),

  aplicarSugerenciaReceta: () => {
    const { sugerencia, ingredientesDisponibles } = get();
    if (!sugerencia) return;

    if (sugerencia.costos.tieneIngredientesPendientes) {
      set({ sugerenciaError: 'Creá todos los insumos nuevos antes de aplicar la receta.' });
      return;
    }

    const seleccionados: IngredienteSeleccionado[] = [];

    for (const item of sugerencia.ingredientesExistentes) {
      const ingrediente = ingredientesDisponibles.find((ing) => ing.id === item.ingredienteId);
      if (!ingrediente) continue;
      seleccionados.push({ ingrediente, cantidad: item.cantidadPorKg });
    }

    if (seleccionados.length === 0) {
      set({ sugerenciaError: 'No hay insumos válidos para aplicar.' });
      return;
    }

    const precioSugerido = sugerencia.costos.precioVentaObjetivo;

    set({
      modo: 'nuevo',
      productoId: '',
      nuevoForm: {
        nombre: sugerencia.nombreProductoSugerido,
        descripcion: sugerencia.descripcion,
        precioVenta: precioSugerido !== null ? String(precioSugerido) : '',
        stockInicial: '',
        activoVentaOnline: false,
      },
      ingredientesSeleccionados: seleccionados,
      sugerencia: null,
      sugerenciaError: null,
      saveError: null,
    });
  },

  crearInsumoDesdePropuesta: async (clavePropuesta, input) => {
    const { sugerencia } = get();
    if (!sugerencia) return;

    const propuesta = sugerencia.ingredientesPropuestos.find(
      (item) => item.clavePropuesta === clavePropuesta,
    );
    if (!propuesta) return;

    set({ creandoInsumoClave: clavePropuesta, sugerenciaError: null });
    try {
      const unidadEnum = UNIDAD_MEDIDA_ENUM[input.unidadMedida] ?? 0;
      const nuevoId = await registrarIngrediente({
        nombre: input.nombre,
        unidadMedida: unidadEnum,
        costoInicial: input.costoInicial,
      });

      const ingredientes = await getIngredientes();
      const nuevoIngrediente = ingredientes.find((ing) => ing.id === nuevoId);
      if (!nuevoIngrediente) {
        throw new Error('El insumo se creó pero no se pudo cargar en la lista.');
      }

      const costoParcial = propuesta.cantidadPorKg * nuevoIngrediente.costoActual;
      const nuevoExistente: IngredienteExistenteSugeridoDto = {
        ingredienteId: nuevoIngrediente.id,
        nombre: nuevoIngrediente.nombre,
        unidadMedida: nuevoIngrediente.unidadMedida,
        cantidadPorKg: propuesta.cantidadPorKg,
        costoUnitario: nuevoIngrediente.costoActual,
        costoParcial,
      };

      const existentes = [...sugerencia.ingredientesExistentes, nuevoExistente];
      const propuestos = sugerencia.ingredientesPropuestos.filter(
        (item) => item.clavePropuesta !== clavePropuesta,
      );

      set({
        ingredientesDisponibles: ingredientes,
        sugerencia: {
          ...sugerencia,
          ingredientesExistentes: existentes,
          ingredientesPropuestos: propuestos,
          costos: recalcularCostosSugerencia(existentes, propuestos, sugerencia.costos),
        },
      });
    } catch (err) {
      const message = err instanceof ApiError
        ? (err.detail ?? err.message)
        : err instanceof Error
          ? err.message
          : 'Error al crear el insumo.';
      set({ sugerenciaError: message });
    } finally {
      set({ creandoInsumoClave: null });
    }
  },
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
