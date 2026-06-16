import { IconCheck, IconSpinner, IconX } from './IngredientesIcons';

interface SaveCancelButtonsProps {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  accentClass?: string;
}

export default function SaveCancelButtons({
  onSave,
  onCancel,
  isSaving,
  accentClass = 'text-emerald-600 hover:text-emerald-700',
}: SaveCancelButtonsProps) {
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
