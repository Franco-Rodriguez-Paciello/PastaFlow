namespace PastaFlow.Application.Services;

public static class RecetaAsistentePrompts
{
    public const string SystemPrompt = """
        Sos un asistente de I+D culinario de PastaFlow, un ERP para una fábrica de pastas frescas en Argentina.
        Tu tarea es proponer recetas para productos de pasta vendidos por kilogramo (1 kg de producto terminado).

        Reglas estrictas:
        - Respondé ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto adicional.
        - Las cantidades van en "cantidadPorKg": insumos necesarios para producir 1 kg de producto terminado.
        - "ingredientesExistentes": solo podés usar ingredienteId que existan en insumosCatalogo del contexto.
        - Si un insumo no está en el catálogo, va en "ingredientesPropuestos" (nunca inventes un ingredienteId).
        - "unidadMedida" debe ser exactamente uno de: Kilogramo, Litro, Unidad, Docena.
        - "costoUnitarioEstimado" en propuestos: precio orientativo en ARS por unidad de medida indicada.
        - "insumoSimilarId" opcional: id de un insumo del catálogo parecido para referencia de costo.
        - No repitas el mismo insumo en existentes y propuestos.
        - Proporciones realistas para pastas frescas artesanales (masa, relleno, condimentos).
        - Si el brief pide un costo máximo por kg, intentá cumplirlo ajustando cantidades y elecciones.
        - "advertencias": mensajes breves sobre supuestos, sustituciones o insumos faltantes.

        Esquema JSON obligatorio:
        {
          "nombreProductoSugerido": "string",
          "descripcion": "string",
          "notasElaboracion": "string",
          "ingredientesExistentes": [
            { "ingredienteId": 0, "cantidadPorKg": 0.0 }
          ],
          "ingredientesPropuestos": [
            {
              "nombreSugerido": "string",
              "unidadMedida": "Kilogramo",
              "cantidadPorKg": 0.0,
              "costoUnitarioEstimado": 0.0,
              "motivo": "string",
              "insumoSimilarId": null
            }
          ],
          "advertencias": ["string"]
        }
        """;

    public static string BuildUserPrompt(
        string contextJson,
        string briefUsuario,
        decimal? costoMaximoPorKg,
        decimal? precioVentaObjetivo)
    {
        string restricciones = costoMaximoPorKg is > 0
            ? $"\nCosto máximo objetivo por kg de producto terminado: ${costoMaximoPorKg:N2} ARS."
            : string.Empty;

        if (precioVentaObjetivo is > 0)
        {
            restricciones += $"\nPrecio de venta objetivo por kg: ${precioVentaObjetivo:N2} ARS.";
        }

        return $"""
            Brief del usuario:
            {briefUsuario}
            {restricciones}

            Catálogo de insumos disponibles (JSON):
            {contextJson}
            """;
    }

    public static string BuildRefinementUserPrompt(
        string contextJson,
        string briefOriginal,
        string sugerenciaAnteriorJson,
        string mensajeRefinamiento,
        decimal? costoMaximoPorKg,
        decimal? precioVentaObjetivo)
    {
        string restricciones = costoMaximoPorKg is > 0
            ? $"\nCosto máximo objetivo por kg de producto terminado: ${costoMaximoPorKg:N2} ARS."
            : string.Empty;

        if (precioVentaObjetivo is > 0)
        {
            restricciones += $"\nPrecio de venta objetivo por kg: ${precioVentaObjetivo:N2} ARS.";
        }

        return $"""
            Brief original del usuario:
            {briefOriginal}
            {restricciones}

            Sugerencia actual de receta (JSON — punto de partida para ajustar):
            {sugerenciaAnteriorJson}

            Ajuste solicitado por el usuario:
            {mensajeRefinamiento}

            Devolvé una receta COMPLETA actualizada en el mismo esquema JSON.
            Aplicá solo los cambios pedidos; conservá lo que siga siendo válido del brief original.
            Si el usuario pide reemplazar un insumo, actualizá cantidades y listas en consecuencia.
            Si un insumo propuesto ya fue dado de alta en catálogo, usalo en ingredientesExistentes con su ingredienteId.

            Catálogo de insumos disponibles (JSON):
            {contextJson}
            """;
    }
}
