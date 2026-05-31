namespace PastaFlow.Application.Queries.Ingredientes;

/// <summary>
/// Devuelve el historial de ajustes manuales de stock.
/// Si se indica <paramref name="InsumoId"/>, filtra por ese insumo.
/// Siempre devuelve los últimos <paramref name="Take"/> registros (default 100).
/// </summary>
public sealed record GetHistorialAjustesQuery(int? InsumoId = null, int Take = 100);
