import { useEffect } from 'react';
import type { IngredienteDto } from '../../types/api.types';
import {
  MOTIVOS_AJUSTE,
  useIngredientesStore,
} from '../../stores/useIngredientesStore';
import { IconWrench } from './IngredientesIcons';

export default function AjusteModal() {
  const {
    ingredientes,
    ajusteForm,
    ajusteSubmitting,
    ajusteFormError,
    ajusteFieldErrors,
    ajusteConflictError,
    closeAjusteModal,
    setAjusteField,
    clearAjusteFieldError,
    submitAjuste,
  } = useIngredientesStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAjusteModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeAjusteModal]);

  const labelClass = 'block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1';
  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) closeAjusteModal(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600">
              <IconWrench />
            </span>
            <h3 className="text-base font-semibold text-gray-800">Registrar Merma / Ajuste</h3>
          </div>
          <button
            onClick={closeAjusteModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void submitAjuste(); }} className="px-6 py-5 space-y-4">
          {ajusteConflictError && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <span className="mt-0.5 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              <div>
                <p className="font-semibold">Los datos fueron modificados por otro usuario.</p>
                <p className="mt-0.5 text-xs">Por favor, cerrá este panel y recargá la pantalla antes de continuar.</p>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Insumo *</label>
            <select
              value={ajusteForm.insumoId}
              onChange={(e) => setAjusteField('insumoId', e.target.value)}
              className={inputClass}
              required
            >
              {ingredientes.map((i: IngredienteDto) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} — stock: {i.stockActual} {i.unidadMedida}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tipo de ajuste *</label>
              <select
                value={ajusteForm.tipoAjuste}
                onChange={(e) => setAjusteField('tipoAjuste', e.target.value as 'Suma' | 'Resta')}
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
                value={ajusteForm.cantidad}
                onChange={(e) => {
                  setAjusteField('cantidad', e.target.value);
                  clearAjusteFieldError('cantidad');
                }}
                placeholder="0.00"
                className={`${inputClass}${ajusteFieldErrors.cantidad ? ' border-red-400 focus:ring-red-200' : ''}`}
                required
              />
              {ajusteFieldErrors.cantidad && (
                <p className="mt-1 text-xs text-red-600">{ajusteFieldErrors.cantidad[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Motivo *</label>
            <select
              value={ajusteForm.motivo}
              onChange={(e) => setAjusteField('motivo', e.target.value as typeof ajusteForm.motivo)}
              className={inputClass}
            >
              {MOTIVOS_AJUSTE.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Observaciones <span className="normal-case text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={ajusteForm.observaciones}
              onChange={(e) => setAjusteField('observaciones', e.target.value)}
              rows={2}
              placeholder="Descripción adicional del ajuste…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {ajusteFormError && !ajusteConflictError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {ajusteFormError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={closeAjusteModal}
              disabled={ajusteSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={ajusteSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {ajusteSubmitting
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Aplicando…</>
                : 'Aplicar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
