import { useEffect, useMemo } from 'react';
import {
  selectCostoTotal,
  selectGuardarDisabled,
  selectIdsSeleccionados,
  selectIngredientesFiltrados,
  useRecetasStore,
} from '../stores/useRecetasStore';
import RecetaFormCabecera from './recetas/RecetaFormCabecera';
import RecetaAsistentePanel from './recetas/RecetaAsistentePanel';
import InsumosDisponiblesPanel from './recetas/InsumosDisponiblesPanel';
import RecetaBorradorPanel from './recetas/RecetaBorradorPanel';
import RecetaSaveBar from './recetas/RecetaSaveBar';
import PageHeader from './common/PageHeader';
import LoadingState from './common/LoadingState';
import ErrorState from './common/ErrorState';

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

  const header = (
    <PageHeader
      title="Creador de recetas"
      subtitle="Definí la receta de un producto y calculá su costo en base a los insumos."
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingState label="Cargando insumos y recetas…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState
          title="No pudimos cargar el creador de recetas"
          message={error}
          onRetry={() => void init()}
          retrying={loading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      <RecetaAsistentePanel />
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
