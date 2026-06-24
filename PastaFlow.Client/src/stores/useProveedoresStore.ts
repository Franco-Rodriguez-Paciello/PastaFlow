import { create } from 'zustand';
import type { ProveedorDto } from '../types/api.types';
import type { IngredienteDto } from '../types/api.types';
import {
  getProveedores,
  registrarProveedor,
  actualizarProveedor,
  vincularIngrediente,
  desvincularIngrediente,
  type RegistrarProveedorInput,
  type ActualizarProveedorInput,
  type VincularIngredienteInput,
} from '../services/proveedorService';
import { getIngredientes } from '../services/ingredienteService';
import { ApiError } from '../lib/apiError';

interface ProveedoresStore {
  proveedores: ProveedorDto[];
  ingredientes: IngredienteDto[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;

  modalOpen: boolean;
  editingProveedor: ProveedorDto | null;
  vincularModalOpen: boolean;
  vincularProveedorId: number | null;
  saving: boolean;

  init: () => Promise<void>;
  fetchProveedores: () => Promise<void>;
  openCreateModal: () => void;
  openEditModal: (proveedor: ProveedorDto) => void;
  closeModal: () => void;
  saveProveedor: (input: RegistrarProveedorInput | ActualizarProveedorInput) => Promise<void>;
  openVincularModal: (proveedorId: number) => void;
  closeVincularModal: () => void;
  vincularInsumo: (input: VincularIngredienteInput) => Promise<void>;
  desvincularInsumo: (proveedorId: number, ingredienteId: number) => Promise<void>;
  dismissMessages: () => void;
}

export const useProveedoresStore = create<ProveedoresStore>((set, get) => ({
  proveedores: [],
  ingredientes: [],
  loading: false,
  error: null,
  successMessage: null,

  modalOpen: false,
  editingProveedor: null,
  vincularModalOpen: false,
  vincularProveedorId: null,
  saving: false,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const [proveedores, ingredientes] = await Promise.all([
        getProveedores(),
        getIngredientes(),
      ]);
      set({ proveedores, ingredientes });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar proveedores.',
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchProveedores: async () => {
    try {
      const proveedores = await getProveedores();
      set({ proveedores });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al actualizar la lista.',
      });
    }
  },

  openCreateModal: () => set({ modalOpen: true, editingProveedor: null, error: null }),
  openEditModal: (proveedor) => set({ modalOpen: true, editingProveedor: proveedor, error: null }),
  closeModal: () => set({ modalOpen: false, editingProveedor: null }),

  saveProveedor: async (input) => {
    const editing = get().editingProveedor;
    set({ saving: true, error: null, successMessage: null });
    try {
      if (editing) {
        await actualizarProveedor(editing.id, input as ActualizarProveedorInput);
        set({ successMessage: 'Proveedor actualizado correctamente.' });
      } else {
        await registrarProveedor(input);
        set({ successMessage: 'Proveedor registrado correctamente.' });
      }
      await get().fetchProveedores();
      set({ modalOpen: false, editingProveedor: null });
    } catch (err) {
      const message = err instanceof ApiError
        ? err.detail ?? err.message
        : err instanceof Error
          ? err.message
          : 'Error al guardar el proveedor.';
      set({ error: message });
    } finally {
      set({ saving: false });
    }
  },

  openVincularModal: (proveedorId) =>
    set({ vincularModalOpen: true, vincularProveedorId: proveedorId, error: null }),
  closeVincularModal: () => set({ vincularModalOpen: false, vincularProveedorId: null }),

  vincularInsumo: async (input) => {
    const proveedorId = get().vincularProveedorId;
    if (!proveedorId) return;

    set({ saving: true, error: null, successMessage: null });
    try {
      await vincularIngrediente(proveedorId, input);
      await get().fetchProveedores();
      set({
        vincularModalOpen: false,
        vincularProveedorId: null,
        successMessage: 'Insumo vinculado correctamente.',
      });
    } catch (err) {
      const message = err instanceof ApiError
        ? err.detail ?? err.message
        : err instanceof Error
          ? err.message
          : 'Error al vincular el insumo.';
      set({ error: message });
    } finally {
      set({ saving: false });
    }
  },

  desvincularInsumo: async (proveedorId, ingredienteId) => {
    set({ error: null, successMessage: null });
    try {
      await desvincularIngrediente(proveedorId, ingredienteId);
      await get().fetchProveedores();
      set({ successMessage: 'Insumo desvinculado.' });
    } catch (err) {
      const message = err instanceof ApiError
        ? err.detail ?? err.message
        : err instanceof Error
          ? err.message
          : 'Error al desvincular el insumo.';
      set({ error: message });
    }
  },

  dismissMessages: () => set({ error: null, successMessage: null }),
}));

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}
