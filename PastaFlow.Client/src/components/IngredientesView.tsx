import { useEffect, useRef, useState } from 'react';
import type { IngredienteDto } from '../types/api.types';
import { actualizarCosto, ajustarStock, getIngredientes } from '../services/ingredienteService';

interface Props {
  onCostoActualizado?: () => void;
}

// ─── Micro icons ──────────────────────────────────────────────────────────────

function IconPencil() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 013.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

// ─── Minimal inline save/cancel ───────────────────────────────────────────────

interface SaveCancelProps {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  accentClass?: string; // e.g. "text-emerald-600 hover:text-emerald-700"
}

function SaveCancelButtons({ onSave, onCancel, isSaving, accentClass = 'text-emerald-600 hover:text-emerald-700' }: SaveCancelProps) {
  return (
    <>
      <button
        onClick={onSave}
        disabled={isSaving}
        title="Guardar (Enter)"
        className={`${accentClass} disabled:opacity-40 transition-colors`}
      >
        {isSaving ? <IconSpinner /> : <IconCheck />}
      </button>
      <button
        onClick={onCancel}
        disabled={isSaving}
        title="Cancelar (Esc)"
        className="text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
      >
        <IconX />
      </button>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IngredientesView({ onCostoActualizado }: Props) {
  const [ingredientes, setIngredientes] = useState<IngredienteDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cost editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [savingId, setSavingId] = useState<number | null>(null);

  // Stock editing
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<string>('');
  const [savingStockId, setSavingStockId] = useState<number | null>(null);

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
    void cargarIngredientes();
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  function showSuccess(message: string): void {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }

  // ── Cost handlers ────────────────────────────────────────────────────────

  function handleStartEditCosto(ingrediente: IngredienteDto): void {
    setEditingStockId(null);
    setEditingStockValue('');
    setEditingId(ingrediente.id);
    setEditingValue(ingrediente.costoActual.toFixed(2));
  }

  function handleCancelEditCosto(): void {
    setEditingId(null);
    setEditingValue('');
  }

  async function handleSaveCosto(id: number): Promise<void> {
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

  // ── Stock handlers ───────────────────────────────────────────────────────

  function handleStartEditStock(ingrediente: IngredienteDto): void {
    setEditingId(null);
    setEditingValue('');
    setEditingStockId(ingrediente.id);
    setEditingStockValue(String(ingrediente.stockActual));
  }

  function handleCancelEditStock(): void {
    setEditingStockId(null);
    setEditingStockValue('');
  }

  async function handleSaveStock(id: number): Promise<void> {
    const nuevoStock = parseFloat(editingStockValue);
    if (isNaN(nuevoStock) || nuevoStock < 0) return;
    setSavingStockId(id);
    try {
      await ajustarStock(id, nuevoStock);
      setEditingStockId(null);
      setEditingStockValue('');
      await cargarIngredientes();
      showSuccess('Stock ajustado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar el stock.');
    } finally {
      setSavingStockId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

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
              <th className="px-5 py-3 text-left font-medium">
                Stock Actual
                <span className="ml-1 normal-case text-gray-400 font-normal">(clic para editar)</span>
              </th>
              <th className="px-5 py-3 text-left font-medium">
                Costo Actual
                <span className="ml-1 normal-case text-gray-400 font-normal">(clic para editar)</span>
              </th>
              <th className="px-5 py-3 text-left font-medium">Última Actualización</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {ingredientes.map((ingrediente, index) => {
              const isEditingCosto = editingId === ingrediente.id;
              const isSavingCosto = savingId === ingrediente.id;
              const isEditingStock = editingStockId === ingrediente.id;
              const isSavingStock = savingStockId === ingrediente.id;

              const stockFormatted =
                ingrediente.stockActual % 1 === 0
                  ? ingrediente.stockActual.toFixed(0)
                  : ingrediente.stockActual.toFixed(2);

              return (
                <tr
                  key={ingrediente.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {/* Nombre */}
                  <td className="px-5 py-3 text-gray-800 font-medium">
                    {ingrediente.nombre}
                  </td>

                  {/* Unidad de medida */}
                  <td className="px-5 py-3 text-gray-600">
                    {ingrediente.unidadMedida}
                  </td>

                  {/* Stock — click-to-edit */}
                  <td
                    className={`px-5 py-3 text-gray-800 ${!isEditingStock ? 'cursor-pointer group/stock' : ''}`}
                    onClick={() => { if (!isEditingStock) handleStartEditStock(ingrediente); }}
                    title={!isEditingStock ? 'Clic para editar stock' : undefined}
                  >
                    {isEditingStock ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingStockValue}
                          onChange={(e) => setEditingStockValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleSaveStock(ingrediente.id);
                            if (e.key === 'Escape') handleCancelEditStock();
                          }}
                          className="w-20 px-1.5 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                          autoFocus
                          disabled={isSavingStock}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <SaveCancelButtons
                          onSave={() => void handleSaveStock(ingrediente.id)}
                          onCancel={handleCancelEditStock}
                          isSaving={isSavingStock}
                          accentClass="text-emerald-600 hover:text-emerald-700"
                        />
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="tabular-nums">{stockFormatted}</span>
                        <span className="text-gray-300 opacity-0 group-hover/stock:opacity-100 transition-opacity">
                          <IconPencil />
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Costo — click-to-edit */}
                  <td
                    className={`px-5 py-3 text-gray-800 ${!isEditingCosto ? 'cursor-pointer group/costo' : ''}`}
                    onClick={() => { if (!isEditingCosto) handleStartEditCosto(ingrediente); }}
                    title={!isEditingCosto ? 'Clic para editar costo' : undefined}
                  >
                    {isEditingCosto ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleSaveCosto(ingrediente.id);
                            if (e.key === 'Escape') handleCancelEditCosto();
                          }}
                          className="w-20 px-1.5 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                          autoFocus
                          disabled={isSavingCosto}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <SaveCancelButtons
                          onSave={() => void handleSaveCosto(ingrediente.id)}
                          onCancel={handleCancelEditCosto}
                          isSaving={isSavingCosto}
                          accentClass="text-blue-600 hover:text-blue-700"
                        />
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="tabular-nums">{`$${ingrediente.costoActual.toFixed(2)}`}</span>
                        <span className="text-gray-300 opacity-0 group-hover/costo:opacity-100 transition-opacity">
                          <IconPencil />
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Última actualización */}
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(ingrediente.ultimaActualizacionCosto).toLocaleDateString('es-AR')}
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
