import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useProveedoresStore } from '../../stores/useProveedoresStore';

export default function ProveedorModal() {
  const { editingProveedor, saving, closeModal, saveProveedor } = useProveedoresStore();

  const [nombre, setNombre] = useState(editingProveedor?.nombre ?? '');
  const [contactoNombre, setContactoNombre] = useState(editingProveedor?.contactoNombre ?? '');
  const [telefono, setTelefono] = useState(editingProveedor?.telefono ?? '');
  const [email, setEmail] = useState(editingProveedor?.email ?? '');
  const [cuit, setCuit] = useState(editingProveedor?.cuit ?? '');
  const [notas, setNotas] = useState(editingProveedor?.notas ?? '');
  const [activo, setActivo] = useState(editingProveedor?.activo ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      nombre: nombre.trim(),
      contactoNombre: contactoNombre.trim() || undefined,
      telefono: telefono.trim() || undefined,
      email: email.trim() || undefined,
      cuit: cuit.trim() || undefined,
      notas: notas.trim() || undefined,
    };

    if (editingProveedor) {
      void saveProveedor({ ...base, activo });
    } else {
      void saveProveedor(base);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {editingProveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h3>
          <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Nombre *" value={nombre} onChange={setNombre} required />
          <Field label="Contacto" value={contactoNombre} onChange={setContactoNombre} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Teléfono" value={telefono} onChange={setTelefono} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
          </div>
          <Field label="CUIT" value={cuit} onChange={setCuit} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>

          {editingProveedor && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              Proveedor activo
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !nombre.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
      />
    </div>
  );
}
