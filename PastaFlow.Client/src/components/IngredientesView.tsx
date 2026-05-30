import { useEffect, useRef, useState } from 'react';
import type { IngredienteDto } from '../types/api.types';
import { actualizarCosto, getIngredientes } from '../services/ingredienteService';

interface Props {
  onCostoActualizado?: () => void;
}

export default function IngredientesView({ onCostoActualizado }: Props) {
  const [ingredientes, setIngredientes] = useState<IngredienteDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function cargarIngredientes(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const data = await getIngredientes();
      setIngredientes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarIngredientes();
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  function handleStartEdit(ingrediente: IngredienteDto): void {
    setEditingId(ingrediente.id);
    setEditingValue(ingrediente.costoActual.toFixed(2));
  }

  function handleCancelEdit(): void {
    setEditingId(null);
    setEditingValue('');
  }

  function showSuccess(message: string): void {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }

  async function handleSave(id: number): Promise<void> {
    const nuevoCosto = parseFloat(editingValue);
    if (isNaN(nuevoCosto) || nuevoCosto < 0) return;

    setSavingId(id);
    try {
      await actualizarCosto(id, nuevoCosto);
      setEditingId(null);
      setEditingValue('');
      await cargarIngredientes();
      showSuccess('Costo actualizado correctamente.');
      onCostoActualizado?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el costo.');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Insumos</h2>

      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-4 py-3 rounded-lg shadow-md">
          <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Nombre</th>
              <th className="px-5 py-3 text-left font-medium">Unidad de Medida</th>
              <th className="px-5 py-3 text-left font-medium">Costo Actual</th>
              <th className="px-5 py-3 text-left font-medium">Última Actualización</th>
              <th className="px-5 py-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {ingredientes.map((ingrediente, index) => {
              const isEditing = editingId === ingrediente.id;
              const isSaving = savingId === ingrediente.id;
              return (
                <tr
                  key={ingrediente.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-5 py-3 text-gray-800 font-medium">{ingrediente.nombre}</td>
                  <td className="px-5 py-3 text-gray-600">{ingrediente.unidadMedida}</td>
                  <td className="px-5 py-3 text-gray-800">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleSave(ingrediente.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="w-24 px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                          autoFocus
                          disabled={isSaving}
                        />
                        <button
                          onClick={() => void handleSave(ingrediente.id)}
                          disabled={isSaving}
                          title="Guardar"
                          className="flex items-center justify-center w-6 h-6 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-60 transition-colors"
                        >
                          {isSaving ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          title="Cancelar"
                          className="flex items-center justify-center w-6 h-6 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-60 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      `$${ingrediente.costoActual.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(ingrediente.ultimaActualizacionCosto).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-3">
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(ingrediente)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 active:bg-blue-800 transition-colors"
                      >
                        Actualizar Costo
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {ingredientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-gray-400">
                  No hay insumos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
