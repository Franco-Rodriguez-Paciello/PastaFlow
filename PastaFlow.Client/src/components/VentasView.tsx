import { useEffect, useMemo } from 'react';
import {
  selectCartProductIds,
  selectCartTotal,
  selectFilteredProductos,
  useVentasStore,
} from '../stores/useVentasStore';
import CatalogoPanel from './ventas/CatalogoPanel';
import TicketPanel from './ventas/TicketPanel';
import VentaSuccessToast from './ventas/VentaSuccessToast';
import PageHeader from './common/PageHeader';

export default function VentasView() {
  const {
    productos,
    loading,
    loadError,
    search,
    cart,
    metodoPago,
    submitting,
    submitError,
    successMessage,
    fetchProductos,
    setSearch,
    setMetodoPago,
    addToCart,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    confirmarVenta,
    dismissSubmitError,
    dismissSuccessMessage,
  } = useVentasStore();

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const filteredProductos = useMemo(
    () => selectFilteredProductos(productos, search),
    [productos, search],
  );
  const total = useMemo(() => selectCartTotal(cart), [cart]);
  const cartProductIds = useMemo(() => selectCartProductIds(cart), [cart]);

  return (
    <div className="space-y-6">
      <PageHeader title="Punto de venta" subtitle="Registrá ventas de mostrador y cobrá el ticket." />

      <div className="flex gap-6 items-start">
      <CatalogoPanel
        search={search}
        loading={loading}
        loadError={loadError}
        productos={filteredProductos}
        cartProductIds={cartProductIds}
        onSearchChange={setSearch}
        onAddToCart={addToCart}
        onRetry={() => void fetchProductos()}
      />

      <TicketPanel
        cart={cart}
        productos={productos}
        total={total}
        metodoPago={metodoPago}
        submitting={submitting}
        submitError={submitError}
        onClearCart={clearCart}
        onIncrement={incrementItem}
        onDecrement={decrementItem}
        onRemove={removeItem}
        onMetodoPagoChange={setMetodoPago}
        onDismissError={dismissSubmitError}
        onConfirmar={confirmarVenta}
      />

      {successMessage && (
        <VentaSuccessToast message={successMessage} onDismiss={dismissSuccessMessage} />
      )}
      </div>
    </div>
  );
}
