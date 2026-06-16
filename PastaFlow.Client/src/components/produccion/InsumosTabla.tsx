import type { DetalleCostoIngredienteDto, OrdenProduccionDto, ProductoDto } from '../../types/api.types';
import { fmt, formatCurrency, stockColor } from '../../lib/formatters';

interface InsumosTablaProps {
  producto: ProductoDto;
  previewVigente: boolean;
  preview: OrdenProduccionDto | null;
  insumosTrasProduccion: DetalleCostoIngredienteDto[] | null;
  isAdmin: boolean;
}

export default function InsumosTabla({
  producto,
  previewVigente,
  preview,
  insumosTrasProduccion,
  isAdmin,
}: InsumosTablaProps) {
  if (producto.receta.length === 0) return null;

  const detalleCostos = previewVigente && preview ? preview.detalleCostos : [];

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Insumos de la receta
        </p>
        {previewVigente && preview && !preview.stockSuficiente && (
          <span className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600">
            Stock insuficiente
          </span>
        )}
        {previewVigente && preview?.stockSuficiente && (
          <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-medium text-green-600">
            Stock OK
          </span>
        )}
      </div>

      {!previewVigente && !insumosTrasProduccion ? (
        <p className="text-sm text-gray-400 text-center py-4">
          Verificá la producción para ver el impacto en insumos
          {isAdmin ? ' y los costos' : ''}.
        </p>
      ) : previewVigente ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400">
                <th className="pb-2 text-left font-medium">Insumo</th>
                <th className="pb-2 text-right font-medium">Por unidad</th>
                <th className="pb-2 text-right font-medium">A descontar</th>
                <th className="pb-2 text-right font-medium">Stock actual</th>
                <th className="pb-2 text-right font-medium">Stock tras prod.</th>
                {isAdmin && (
                  <th className="pb-2 text-right font-medium">Costo parcial</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {detalleCostos.map((row) => {
                const stockDespues = row.stockDisponible - row.cantidadTotalRequerida;
                return (
                  <tr key={row.ingredienteId} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-700">
                      {row.nombreIngrediente}
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-500">
                      {fmt(row.cantidadRequeridaPorUnidad)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-700 font-medium">
                      {fmt(row.cantidadTotalRequerida)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-600">
                      {fmt(row.stockDisponible)}
                    </td>
                    <td className={`py-2.5 px-2 text-right ${stockColor(stockDespues, row.stockDisponible)}`}>
                      {fmt(stockDespues)}
                      {!row.stockSuficiente && (
                        <span className="ml-1 text-red-400" title="Stock insuficiente">⚠</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 pl-2 text-right text-gray-600">
                        {formatCurrency(row.costoParcial)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <p className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            Stock de insumos actualizado tras el último registro.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400">
                <th className="pb-2 text-left font-medium">Insumo</th>
                <th className="pb-2 text-right font-medium">Stock actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {insumosTrasProduccion!.map((row) => (
                <tr key={row.ingredienteId} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-gray-700">
                    {row.nombreIngrediente}
                  </td>
                  <td className={`py-2.5 px-2 text-right ${stockColor(row.stockDisponible, row.stockDisponible)}`}>
                    {fmt(row.stockDisponible)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
