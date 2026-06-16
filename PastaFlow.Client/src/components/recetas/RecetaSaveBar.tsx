interface RecetaSaveBarProps {
  saveError: string | null;
  saveSuccess: boolean;
  saving: boolean;
  disabled: boolean;
  onGuardar: () => void;
}

export default function RecetaSaveBar({
  saveError,
  saveSuccess,
  saving,
  disabled,
  onGuardar,
}: RecetaSaveBarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center justify-between gap-4">
      <div className="flex-1">
        {saveError && (
          <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {saveError}
          </p>
        )}
        {saveSuccess && (
          <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Receta guardada correctamente.
          </p>
        )}
      </div>
      <button
        onClick={onGuardar}
        disabled={disabled}
        className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg shadow-sm transition"
      >
        {saving ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Guardar Receta
          </>
        )}
      </button>
    </div>
  );
}
