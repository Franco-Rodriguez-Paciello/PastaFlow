import { useEffect, useState } from 'react';
import type { IngredienteDto } from '../types/api.types';
import { actualizarCosto, getIngredientes } from '../services/ingredienteService';

export default function IngredientesView() {
  const [ingredientes, setIngredientes] = useState<IngredienteDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    cargarIngredientes();
  }, []);

  async function handleActualizarCosto(id: number): Promise<void> {
    const input = window.prompt('Ingresá el nuevo costo:');
    if (input === null) return;

    const nuevoCosto = parseFloat(input);
    if (isNaN(nuevoCosto) || nuevoCosto < 0) {
      alert('El costo ingresado no es válido.');
      return;
    }

    try {
      await actualizarCosto(id, nuevoCosto);
      alert('Costo actualizado correctamente.');
      await cargarIngredientes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar el costo.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-gray-500">
        Cargando insumos...
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
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Insumos</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Nombre</th>
              <th className="px-5 py-3 text-left font-medium">Unidad de Medida</th>
              <th className="px-5 py-3 text-left font-medium">Costo Actual</th>
              <th className="px-5 py-3 text-left font-medium">Última Actualización</th>
              <th className="px-5 py-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {ingredientes.map((ingrediente, index) => (
              <tr
                key={ingrediente.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-5 py-3 text-gray-800 font-medium">{ingrediente.nombre}</td>
                <td className="px-5 py-3 text-gray-600">{ingrediente.unidadMedida}</td>
                <td className="px-5 py-3 text-gray-800">
                  ${ingrediente.costoActual.toFixed(2)}
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(ingrediente.ultimaActualizacionCosto).toLocaleDateString('es-AR')}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleActualizarCosto(ingrediente.id)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 active:bg-blue-800 transition-colors"
                  >
                    Actualizar Costo
                  </button>
                </td>
              </tr>
            ))}
            {ingredientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-gray-400">
                  No hay insumos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
