import { create } from 'zustand';
import type { IngredienteDto } from '../types/api.types';

interface IngredienteSeleccionado {
  ingrediente: IngredienteDto;
  cantidad: number;
}

interface RecipeStore {
  ingredientesSeleccionados: IngredienteSeleccionado[];
  agregarIngrediente: (ingrediente: IngredienteDto) => void;
  removerIngrediente: (id: number) => void;
  actualizarCantidad: (id: number, cantidad: number) => void;
  limpiarReceta: () => void;
  cargarRecetaExistente: (ingredientes: IngredienteSeleccionado[]) => void;
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  ingredientesSeleccionados: [],

  agregarIngrediente: (ingrediente) =>
    set((state) => {
      const yaExiste = state.ingredientesSeleccionados.some(
        (item) => item.ingrediente.id === ingrediente.id
      );
      if (yaExiste) return state;
      return {
        ingredientesSeleccionados: [
          ...state.ingredientesSeleccionados,
          { ingrediente, cantidad: 0 },
        ],
      };
    }),

  removerIngrediente: (id) =>
    set((state) => ({
      ingredientesSeleccionados: state.ingredientesSeleccionados.filter(
        (item) => item.ingrediente.id !== id
      ),
    })),

  actualizarCantidad: (id, cantidad) =>
    set((state) => ({
      ingredientesSeleccionados: state.ingredientesSeleccionados.map((item) =>
        item.ingrediente.id === id ? { ...item, cantidad } : item
      ),
    })),

  limpiarReceta: () => set({ ingredientesSeleccionados: [] }),

  cargarRecetaExistente: (ingredientes) =>
    set({ ingredientesSeleccionados: ingredientes }),
}));
