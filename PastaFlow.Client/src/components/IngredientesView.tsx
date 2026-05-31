import { useEffect, useRef, useState } from 'react';
import type { AjusteStockDto, IngredienteDto } from '../types/api.types';
import { actualizarCosto, actualizarUmbral, ajustarStock, getHistorialAjustes, getIngredientes, registrarAjuste, type RegistrarAjusteInput } from '../services/ingredienteService';

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
function IconWrench() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877
           M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766
           M11.42 15.17L4.655 7.773a4.5 4.5 0 0 1 6.364-6.364l3.879 3.879
           m0 0a3 3 0 0 1 4.243 4.243M9.878 9.878l4.242 4.242" />
    </svg>
  );
}

// ─── AjusteModal ──────────────────────────────────────────────────────────────

interface AjusteModalProps {
  ingredientes: IngredienteDto[];
  onClose: () => void;
  onSuccess: () => void;
}

const MOTIVOS: { value: RegistrarAjusteInput['motivo']; label: string }[] = [
  { value: 'Merma',        label: 'Merma por vencimiento' },
  { value: 'Rotura',       label: 'Rotura de empaque' },
  { value: 'ConteoFisico', label: 'Diferencia de conteo físico' },
  { value: 'CompraManual', label: 'Compra / ingreso manual' },
];

function AjusteModal({ ingredientes, onClose, onSuccess }: AjusteModalProps) {
  const [insumoId, setInsumoId]     = useState<string>(ingredientes[0]?.id.toString() ?? '');
  const [tipoAjuste, setTipoAjuste] = useState<'Suma' | 'Resta'>('Resta');
  const [cantidad, setCantidad]     = useState<string>('');
  const [motivo, setMotivo]         = useState<RegistrarAjusteInput['motivo']>('Merma');
  const [observaciones, setObs]     = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const cant = parseFloat(cantidad);
    if (!insumoId || isNaN(cant) || cant <= 0) {
      setFormError('Completá todos los campos obligatorios con valores válidos.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await registrarAjuste({
        insumoId: Number(insumoId),
        cantidad: cant,
        tipoAjuste,
        motivo,
        observaciones: observaciones.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al registrar el ajuste.');
    } finally {
      setSubmitting(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const labelClass = 'block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1';
  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600">
              <IconWrench />
            </span>
            <h3 className="text-base font-semibold text-gray-800">Registrar Merma / Ajuste</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">

          {/* Insumo */}
          <div>
            <label className={labelClass}>Insumo *</label>
            <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} className={inputClass} required>
              {ingredientes.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} — stock: {i.stockActual} {i.unidadMedida}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo + Cantidad side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tipo de ajuste *</label>
              <select
                value={tipoAjuste}
                onChange={(e) => setTipoAjuste(e.target.value as 'Suma' | 'Resta')}
                className={inputClass}
              >
                <option value="Suma">➕ Suma al stock</option>
                <option value="Resta">➖ Resta (merma/rotura)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Cantidad *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0.00"
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className={labelClass}>Motivo *</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as RegistrarAjusteInput['motivo'])}
              className={inputClass}
            >
              {MOTIVOS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className={labelClass}>Observaciones <span className="normal-case text-gray-400 font-normal">(opcional)</span></label>
            <textarea
              value={observaciones}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
              placeholder="Descripción adicional del ajuste…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Form error */}
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {submitting
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Aplicando…</>
                : 'Aplicar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
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

  // Umbral editing
  const [editingUmbralId, setEditingUmbralId] = useState<number | null>(null);
  const [editingUmbralValue, setEditingUmbralValue] = useState<string>('');
  const [savingUmbralId, setSavingUmbralId] = useState<number | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ajuste modal
  const [modalOpen, setModalOpen] = useState(false);

  // Historial de ajustes
  const [historial, setHistorial] = useState<AjusteStockDto[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [filtroInsumoId, setFiltroInsumoId] = useState<number | undefined>(undefined);

  async function cargarHistorial(insumoId?: number): Promise<void> {
    setLoadingHistorial(true);
    try {
      const data = await getHistorialAjustes(insumoId);
      setHistorial(data);
    } catch {
      // no bloquear la UI principal
    } finally {
      setLoadingHistorial(false);
    }
  }

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
    void cargarHistorial();
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
    setEditingUmbralId(null);
    setEditingUmbralValue('');
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

  // ── Umbral handlers ──────────────────────────────────────────────────────

  function handleStartEditUmbral(ingrediente: IngredienteDto): void {
    setEditingId(null);
    setEditingValue('');
    setEditingStockId(null);
    setEditingStockValue('');
    setEditingUmbralId(ingrediente.id);
    setEditingUmbralValue(String(ingrediente.umbralCritico));
  }

  function handleCancelEditUmbral(): void {
    setEditingUmbralId(null);
    setEditingUmbralValue('');
  }

  async function handleSaveUmbral(id: number): Promise<void> {
    const nuevoUmbral = parseFloat(editingUmbralValue);
    if (isNaN(nuevoUmbral) || nuevoUmbral < 0) return;
    setSavingUmbralId(id);
    try {
      await actualizarUmbral(id, nuevoUmbral);
      setEditingUmbralId(null);
      setEditingUmbralValue('');
      setIngredientes(prev =>
        prev.map(i => i.id === id ? { ...i, umbralCritico: nuevoUmbral } : i)
      );
      showSuccess('Alerta mínima actualizada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el umbral.');
    } finally {
      setSavingUmbralId(null);
    }
  }

  // ── Stock handlers ───────────────────────────────────────────────────────

  function handleStartEditStock(ingrediente: IngredienteDto): void {
    setEditingId(null);
    setEditingValue('');
    setEditingUmbralId(null);
    setEditingUmbralValue('');
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
      {/* Title row */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Insumos</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <IconWrench />
          Registrar Merma / Ajuste
        </button>
      </div>

      {/* Ajuste modal */}
      {modalOpen && (
        <AjusteModal
          ingredientes={ingredientes}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            void cargarIngredientes();
            void cargarHistorial(filtroInsumoId);
            showSuccess('Ajuste registrado correctamente.');
          }}
        />
      )}

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
              <th className="px-5 py-3 text-left font-medium">
                Alerta Mínima
                <span className="ml-1 normal-case text-gray-400 font-normal">(clic para editar)</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {ingredientes.map((ingrediente, index) => {
              const isEditingCosto = editingId === ingrediente.id;
              const isSavingCosto = savingId === ingrediente.id;
              const isEditingStock = editingStockId === ingrediente.id;
              const isSavingStock = savingStockId === ingrediente.id;
              const isEditingUmbral = editingUmbralId === ingrediente.id;
              const isSavingUmbral = savingUmbralId === ingrediente.id;

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

                  {/* Umbral crítico — click-to-edit */}
                  <td
                    className={`px-5 py-3 text-gray-800 ${!isEditingUmbral ? 'cursor-pointer group/umbral' : ''}`}
                    onClick={() => { if (!isEditingUmbral) handleStartEditUmbral(ingrediente); }}
                    title={!isEditingUmbral ? 'Clic para editar alerta mínima' : undefined}
                  >
                    {isEditingUmbral ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingUmbralValue}
                          onChange={(e) => setEditingUmbralValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleSaveUmbral(ingrediente.id);
                            if (e.key === 'Escape') handleCancelEditUmbral();
                          }}
                          className="w-20 px-1.5 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                          autoFocus
                          disabled={isSavingUmbral}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <SaveCancelButtons
                          onSave={() => void handleSaveUmbral(ingrediente.id)}
                          onCancel={handleCancelEditUmbral}
                          isSaving={isSavingUmbral}
                          accentClass="text-amber-600 hover:text-amber-700"
                        />
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`tabular-nums ${
                          ingrediente.stockActual <= ingrediente.umbralCritico
                            ? 'text-amber-600 font-semibold'
                            : ''
                        }`}>
                          {ingrediente.umbralCritico % 1 === 0
                            ? ingrediente.umbralCritico.toFixed(0)
                            : ingrediente.umbralCritico.toFixed(2)}
                        </span>
                        <span className="text-gray-300 opacity-0 group-hover/umbral:opacity-100 transition-opacity">
                          <IconPencil />
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {ingredientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-gray-400">
                  No hay insumos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Historial de Ajustes ─────────────────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Historial de Ajustes de Stock</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Filtrar por insumo</label>
            <select
              value={filtroInsumoId ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : Number(e.target.value);
                setFiltroInsumoId(val);
                void cargarHistorial(val);
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">Todos los insumos</option>
              {ingredientes.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Fecha</th>
                <th className="px-5 py-3 text-left font-medium">Insumo</th>
                <th className="px-5 py-3 text-left font-medium">Tipo</th>
                <th className="px-5 py-3 text-left font-medium">Motivo</th>
                <th className="px-5 py-3 text-right font-medium">Cantidad</th>
                <th className="px-5 py-3 text-left font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loadingHistorial ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
                      <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Cargando historial…
                    </div>
                  </td>
                </tr>
              ) : historial.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No hay ajustes registrados.
                  </td>
                </tr>
              ) : (
                historial.map((a, idx) => {
                  const fecha = new Date(a.fechaRegistro);
                  const esSuma = a.tipoAjuste === 'Suma';
                  const motivoLabel: Record<string, string> = {
                    Merma: 'Merma por vencimiento',
                    Rotura: 'Rotura de empaque',
                    ConteoFisico: 'Conteo físico',
                    CompraManual: 'Compra manual',
                  };
                  return (
                    <tr key={a.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-5 py-3 text-gray-500 tabular-nums whitespace-nowrap">
                        <span>{fecha.toLocaleDateString('es-AR')}</span>
                        <span className="ml-2 text-gray-400 text-xs">{fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-800 font-medium">{a.nombreInsumo}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          esSuma ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {esSuma ? '▲ Suma' : '▼ Resta'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{motivoLabel[a.motivo] ?? a.motivo}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-gray-800">
                        {a.cantidad % 1 === 0 ? a.cantidad.toFixed(0) : a.cantidad.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-gray-500 italic">{a.observaciones ?? '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
