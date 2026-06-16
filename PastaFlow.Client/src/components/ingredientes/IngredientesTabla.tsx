import type { IngredienteDto } from '../../types/api.types';
import { useIngredientesStore } from '../../stores/useIngredientesStore';
import { IconPencil } from './IngredientesIcons';
import SaveCancelButtons from './SaveCancelButtons';

interface IngredientesTablaProps {
  onCostoActualizado?: () => void;
}

function formatStock(value: number): string {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
}

export default function IngredientesTabla({ onCostoActualizado }: IngredientesTablaProps) {
  const {
    ingredientes,
    editingId,
    editingValue,
    savingId,
    editingStockId,
    editingStockValue,
    savingStockId,
    editingUmbralId,
    editingUmbralValue,
    savingUmbralId,
    startEditCosto,
    cancelEditCosto,
    setEditingValue,
    saveCosto,
    startEditStock,
    cancelEditStock,
    setEditingStockValue,
    saveStock,
    startEditUmbral,
    cancelEditUmbral,
    setEditingUmbralValue,
    saveUmbral,
  } = useIngredientesStore();

  return (
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
          {ingredientes.map((ingrediente: IngredienteDto, index: number) => {
            const isEditingCosto = editingId === ingrediente.id;
            const isSavingCosto = savingId === ingrediente.id;
            const isEditingStock = editingStockId === ingrediente.id;
            const isSavingStock = savingStockId === ingrediente.id;
            const isEditingUmbral = editingUmbralId === ingrediente.id;
            const isSavingUmbral = savingUmbralId === ingrediente.id;

            return (
              <tr
                key={ingrediente.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-5 py-3 text-gray-800 font-medium">{ingrediente.nombre}</td>
                <td className="px-5 py-3 text-gray-600">{ingrediente.unidadMedida}</td>

                <td
                  className={`px-5 py-3 text-gray-800 ${!isEditingStock ? 'cursor-pointer group/stock' : ''}`}
                  onClick={() => { if (!isEditingStock) startEditStock(ingrediente); }}
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
                          if (e.key === 'Enter') void saveStock(ingrediente.id);
                          if (e.key === 'Escape') cancelEditStock();
                        }}
                        className="w-20 px-1.5 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                        autoFocus
                        disabled={isSavingStock}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <SaveCancelButtons
                        onSave={() => void saveStock(ingrediente.id)}
                        onCancel={cancelEditStock}
                        isSaving={isSavingStock}
                        accentClass="text-emerald-600 hover:text-emerald-700"
                      />
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="tabular-nums">{formatStock(ingrediente.stockActual)}</span>
                      <span className="text-gray-300 opacity-0 group-hover/stock:opacity-100 transition-opacity">
                        <IconPencil />
                      </span>
                    </span>
                  )}
                </td>

                <td
                  className={`px-5 py-3 text-gray-800 ${!isEditingCosto ? 'cursor-pointer group/costo' : ''}`}
                  onClick={() => { if (!isEditingCosto) startEditCosto(ingrediente); }}
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
                          if (e.key === 'Enter') void saveCosto(ingrediente.id, onCostoActualizado);
                          if (e.key === 'Escape') cancelEditCosto();
                        }}
                        className="w-20 px-1.5 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                        autoFocus
                        disabled={isSavingCosto}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <SaveCancelButtons
                        onSave={() => void saveCosto(ingrediente.id, onCostoActualizado)}
                        onCancel={cancelEditCosto}
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

                <td className="px-5 py-3 text-gray-500">
                  {new Date(ingrediente.ultimaActualizacionCosto).toLocaleDateString('es-AR')}
                </td>

                <td
                  className={`px-5 py-3 text-gray-800 ${!isEditingUmbral ? 'cursor-pointer group/umbral' : ''}`}
                  onClick={() => { if (!isEditingUmbral) startEditUmbral(ingrediente); }}
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
                          if (e.key === 'Enter') void saveUmbral(ingrediente.id);
                          if (e.key === 'Escape') cancelEditUmbral();
                        }}
                        className="w-20 px-1.5 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                        autoFocus
                        disabled={isSavingUmbral}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <SaveCancelButtons
                        onSave={() => void saveUmbral(ingrediente.id)}
                        onCancel={cancelEditUmbral}
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
                        {formatStock(ingrediente.umbralCritico)}
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
  );
}
