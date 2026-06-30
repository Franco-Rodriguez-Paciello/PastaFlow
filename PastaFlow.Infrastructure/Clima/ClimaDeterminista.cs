namespace PastaFlow.Infrastructure.Clima;

/// <summary>
/// Modelo determinista de clima histórico para desarrollo. A diferencia de HashCode.Combine
/// (que es aleatorio por proceso), este hash es ESTABLE entre ejecuciones, por lo que el
/// seeder y el predictor obtienen exactamente los mismos días fríos/lluviosos. Esto permite
/// que el factor climático del predictor sea genuinamente aprendido de las ventas sembradas.
///
/// En producción se reemplazaría por el histórico real de un proveedor (mismo concepto booleano).
/// </summary>
public static class ClimaDeterminista
{
    public static bool EsFrioOLluvioso(DateOnly dia)
    {
        // Más probabilidad en invierno del hemisferio sur.
        double probabilidad = dia.Month switch
        {
            6 or 7 or 8 => 0.5,
            5 or 9 => 0.3,
            _ => 0.12
        };

        return PseudoAleatorioEstable(dia) < probabilidad;
    }

    /// <summary>
    /// Genera un valor en [0,1) determinístico y estable a partir de la fecha (mezcla de bits fija).
    /// </summary>
    private static double PseudoAleatorioEstable(DateOnly dia)
    {
        uint x = (uint)(dia.Year * 10000 + dia.Month * 100 + dia.Day);
        x ^= x >> 16;
        x *= 0x7feb352d;
        x ^= x >> 15;
        x *= 0x846ca68b;
        x ^= x >> 16;
        return (x % 100000u) / 100000.0;
    }
}
