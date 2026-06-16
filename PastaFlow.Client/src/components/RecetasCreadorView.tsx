import { useEffect, useMemo } from 'react';
import {
  selectCostoTotal,
  selectGuardarDisabled,
  selectIdsSeleccionados,
  selectIngredientesFiltrados,
  useRecetasStore,
} from '../stores/useRecetasStore';
import RecetaFormCabecera from './recetas/RecetaFormCabecera';
import InsumosDisponiblesPanel from './recetas/InsumosDisponiblesPanel';
import RecetaBorradorPanel from './recetas/RecetaBorradorPanel';
import RecetaSaveBar from './recetas/RecetaSaveBar';

export default function RecetasCreadorView() {
  const store = useRecetasStore();
  const {
    loading,
    error,
    ingredientesDisponibles,
    busqueda,
    ingredientesSeleccionados,
    saving,
    saveError,
    saveSuccess,
    loadingReceta,
    modo,
    productoId,
    nuevoForm,
    init,
    setBusqueda,
    agregarIngrediente,
    guardarReceta,
  } = store;

  useEffect(() => {
    void init();
  }, [init]);

  const ingredientesFiltrados = useMemo(
    () => selectIngredientesFiltrados(ingredientesDisponibles, busqueda),
    [ingredientesDisponibles, busqueda],
  );
  const idsSeleccionados = useMemo(
    () => selectIdsSeleccionados(ingredientesSeleccionados),
    [ingredientesSeleccionados],
  );
  const costoTotal = useMemo(
    () => selectCostoTotal(ingredientesSeleccionados),
    [ingredientesSeleccionados],
  );
  const guardarDisabled = useMemo(
    () => selectGuardarDisabled({
      saving,
      loadingReceta,
      ingredientesSeleccionados,
      modo,
      productoId,
      nuevoForm,
    }),
    [saving, loadingReceta, ingredientesSeleccionados, modo, productoId, nuevoForm],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RecetaFormCabecera />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsumosDisponiblesPanel
          total={ingredientesDisponibles.length}
          busqueda={busqueda}
          ingredientes={ingredientesFiltrados}
          idsSeleccionados={idsSeleccionados}
          onBusquedaChange={setBusqueda}
          onAgregar={agregarIngrediente}
        />
        <RecetaBorradorPanel costoTotal={costoTotal} />
      </div>

      <RecetaSaveBar
        saveError={saveError}
        saveSuccess={saveSuccess}
        saving={saving}
        disabled={guardarDisabled}
        onGuardar={() => void guardarReceta()}
      />
    </div>
  );
}
