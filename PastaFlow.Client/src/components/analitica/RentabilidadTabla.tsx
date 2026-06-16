import type { ProductProfitabilityDto } from '../../types/api.types';
import {
  calcMargenPct,
  getMargenBadge,
  getMargenBadgeClasses,
  getMargenClasses,
} from '../../lib/margenHelpers';

interface RentabilidadTablaProps {
  productos: ProductProfitabilityDto[];
}

export default function RentabilidadTabla({ productos }: RentabilidadTablaProps) {
  return (
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
            const margenPct = calcMargenPct(producto.precioVenta, producto.margen);

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
  );
}
