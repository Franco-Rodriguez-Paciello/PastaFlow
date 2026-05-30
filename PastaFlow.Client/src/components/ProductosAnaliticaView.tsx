import { useEffect, useState } from 'react';
import type { ProductProfitabilityDto } from '../types/api.types';
import { getProductProfitability } from '../services/productoService';

function getMargenClasses(margenPct: number): string {
  if (margenPct < 30) return 'text-red-600 font-semibold';
  if (margenPct <= 50) return 'text-yellow-600 font-semibold';
  return 'text-green-600 font-semibold';
}

function getMargenBadge(margenPct: number): string {
  if (margenPct < 30) return 'Alerta de pérdida';
  if (margenPct <= 50) return 'Rentabilidad media';
  return 'Alta rentabilidad';
}

function getMargenBadgeClasses(margenPct: number): string {
  if (margenPct < 30) return 'bg-red-100 text-red-700 border border-red-200';
  if (margenPct <= 50) return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-green-100 text-green-700 border border-green-200';
}

interface Props {
  refreshKey?: number;
}

export default function ProductosAnaliticaView({ refreshKey = 0 }: Props) {
  const [productos, setProductos] = useState<ProductProfitabilityDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProductProfitability()
      .then(setProductos)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Error desconocido')
      )
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-gray-500">
        Cargando datos de rentabilidad...
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
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Análisis de Rentabilidad</h2>
        <p className="text-sm text-gray-500 mt-1">
          Margen calculado sobre precio de venta · Solo productos compuestos
        </p>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Alerta de pérdida &lt;30%
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          Rentabilidad media 30–50%
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Alta rentabilidad &gt;50%
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Producto</th>
              <th className="px-5 py-3 text-right font-medium">Precio de Venta</th>
              <th className="px-5 py-3 text-right font-medium">Costo de Fabricación</th>
              <th className="px-5 py-3 text-right font-medium">Ganancia Bruta</th>
              <th className="px-5 py-3 text-center font-medium">Margen</th>
              <th className="px-5 py-3 text-center font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {productos.map((producto, index) => {
              const margenPct =
                producto.precioVenta > 0
                  ? (producto.margen / producto.precioVenta) * 100
                  : 0;

              return (
                <tr
                  key={producto.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-5 py-3 text-gray-800 font-medium">{producto.nombre}</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    ${producto.precioVenta.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    ${producto.costoTotal.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    ${producto.margen.toFixed(2)}
                  </td>
                  <td className={`px-5 py-3 text-right ${getMargenClasses(margenPct)}`}>
                    {margenPct.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getMargenBadgeClasses(margenPct)}`}
                    >
                      {getMargenBadge(margenPct)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-gray-400">
                  No hay productos compuestos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
