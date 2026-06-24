import { useState } from 'react';
import { Link2, Pencil, ChevronDown, ChevronUp, Star, Trash2 } from 'lucide-react';
import { useProveedoresStore, formatCurrency } from '../../stores/useProveedoresStore';
import type { ProveedorDto } from '../../types/api.types';

export default function ProveedoresTabla() {
  const { proveedores, openEditModal, openVincularModal, desvincularInsumo } = useProveedoresStore();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (proveedores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
        <p className="text-sm font-medium text-gray-600">No hay proveedores registrados</p>
        <p className="text-xs text-gray-400 mt-1">Creá el primero con el botón de arriba.</p>
      </div>
    );
  }

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-3">
      {proveedores.map((proveedor) => (
        <ProveedorCard
          key={proveedor.id}
          proveedor={proveedor}
          expanded={expandedId === proveedor.id}
          onToggle={() => toggleExpand(proveedor.id)}
          onEdit={() => openEditModal(proveedor)}
          onVincular={() => openVincularModal(proveedor.id)}
          onDesvincular={(ingredienteId) => void desvincularInsumo(proveedor.id, ingredienteId)}
        />
      ))}
    </div>
  );
}

interface ProveedorCardProps {
  proveedor: ProveedorDto;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onVincular: () => void;
  onDesvincular: (ingredienteId: number) => void;
}

function ProveedorCard({
  proveedor,
  expanded,
  onToggle,
  onEdit,
  onVincular,
  onDesvincular,
}: ProveedorCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 text-left flex items-start gap-3 min-w-0"
        >
          <span className="mt-0.5 text-gray-400">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-800 truncate">{proveedor.nombre}</h3>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  proveedor.activo
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {proveedor.activo ? 'Activo' : 'Inactivo'}
              </span>
              <span className="text-xs text-gray-400">
                {proveedor.ingredientes.length} insumo{proveedor.ingredientes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">
              {[proveedor.contactoNombre, proveedor.telefono, proveedor.email]
                .filter(Boolean)
                .join(' · ') || 'Sin datos de contacto'}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
          <button
            type="button"
            onClick={onVincular}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
          >
            <Link2 size={14} />
            Vincular insumo
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <Pencil size={14} />
            Editar
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-3">
          {(proveedor.cuit || proveedor.notas) && (
            <div className="mb-3 text-xs text-gray-500 space-y-1">
              {proveedor.cuit && <p><span className="font-medium text-gray-600">CUIT:</span> {proveedor.cuit}</p>}
              {proveedor.notas && <p><span className="font-medium text-gray-600">Notas:</span> {proveedor.notas}</p>}
            </div>
          )}

          {proveedor.ingredientes.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Sin insumos vinculados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-2 pr-3 font-medium">Insumo</th>
                    <th className="pb-2 pr-3 font-medium">Código</th>
                    <th className="pb-2 pr-3 font-medium">Precio ref.</th>
                    <th className="pb-2 pr-3 font-medium">Entrega</th>
                    <th className="pb-2 pr-3 font-medium">Pref.</th>
                    <th className="pb-2 font-medium w-10" />
                  </tr>
                </thead>
                <tbody>
                  {proveedor.ingredientes.map((item) => (
                    <tr key={item.ingredienteId} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-3 text-gray-700">
                        {item.ingredienteNombre}
                        <span className="text-gray-400 ml-1">({item.unidadMedida})</span>
                      </td>
                      <td className="py-2 pr-3 text-gray-500">{item.codigoProveedor ?? '—'}</td>
                      <td className="py-2 pr-3 text-gray-700">{formatCurrency(item.precioReferencia)}</td>
                      <td className="py-2 pr-3 text-gray-500">
                        {item.tiempoEntregaDias != null ? `${item.tiempoEntregaDias} d` : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        {item.esPreferido && (
                          <Star size={14} className="text-amber-500 fill-amber-500" />
                        )}
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => onDesvincular(item.ingredienteId)}
                          className="text-gray-400 hover:text-red-500 transition"
                          aria-label="Desvincular"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
