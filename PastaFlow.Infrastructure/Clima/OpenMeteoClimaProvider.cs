using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using PastaFlow.Application.DTOs;
using PastaFlow.Application.Interfaces;

namespace PastaFlow.Infrastructure.Clima;

/// <summary>
/// Proveedor de clima basado en la API pública de Open-Meteo (gratis, sin API key).
/// - Histórico: modelo determinista local (coherente con el seeder).
/// - Pronóstico: consulta real al endpoint de forecast.
/// </summary>
public sealed class OpenMeteoClimaProvider(
    HttpClient httpClient,
    IOptions<ClimaOptions> options) : IClimaProvider
{
    public bool EsFrioOLluviosoHistorico(DateOnly dia) => ClimaDeterminista.EsFrioOLluvioso(dia);

    public async Task<PronosticoDiaResult> ObtenerPronosticoAsync(
        DateOnly dia,
        CancellationToken cancellationToken = default)
    {
        ClimaOptions o = options.Value;

        try
        {
            string fecha = dia.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            string lat = o.Latitude.ToString(CultureInfo.InvariantCulture);
            string lon = o.Longitude.ToString(CultureInfo.InvariantCulture);
            string tz = Uri.EscapeDataString(o.Timezone);

            string url =
                $"v1/forecast?latitude={lat}&longitude={lon}" +
                $"&daily=temperature_2m_max,precipitation_sum&timezone={tz}" +
                $"&start_date={fecha}&end_date={fecha}";

            OpenMeteoResponse? resp = await httpClient.GetFromJsonAsync<OpenMeteoResponse>(url, cancellationToken);

            double? temp = resp?.Daily?.TemperatureMax?.FirstOrDefault();
            double? precip = resp?.Daily?.PrecipitationSum?.FirstOrDefault();

            if (temp is null && precip is null)
            {
                return new PronosticoDiaResult(
                    Disponible: false,
                    TempMaxC: null,
                    PrecipMm: null,
                    EsFrioOLluvioso: false,
                    Descripcion: "Sin pronóstico disponible para esa fecha");
            }

            bool esFrio = temp is double t && t < o.TempMaxFrioC;
            bool esLluvia = precip is double p && p >= o.PrecipLluviaMm;
            bool frioOLluvia = esFrio || esLluvia;

            return new PronosticoDiaResult(
                Disponible: true,
                TempMaxC: temp,
                PrecipMm: precip,
                EsFrioOLluvioso: frioOLluvia,
                Descripcion: Describir(temp, precip, esFrio, esLluvia));
        }
        catch
        {
            return new PronosticoDiaResult(
                Disponible: false,
                TempMaxC: null,
                PrecipMm: null,
                EsFrioOLluvioso: false,
                Descripcion: "No se pudo obtener el pronóstico (sin conexión o fecha fuera de rango)");
        }
    }

    private static string Describir(double? temp, double? precip, bool esFrio, bool esLluvia)
    {
        string clima = (esFrio, esLluvia) switch
        {
            (true, true) => "Frío y lluvioso",
            (true, false) => "Frío",
            (false, true) => "Lluvioso",
            _ => "Templado y estable"
        };

        string detalle = temp is double t
            ? $" · máx {t:0}°C"
            : string.Empty;

        string lluvia = precip is double p && p > 0
            ? $" · {p:0.#} mm"
            : string.Empty;

        return $"{clima}{detalle}{lluvia}";
    }

    private sealed class OpenMeteoResponse
    {
        [JsonPropertyName("daily")]
        public OpenMeteoDaily? Daily { get; init; }
    }

    private sealed class OpenMeteoDaily
    {
        [JsonPropertyName("temperature_2m_max")]
        public double?[]? TemperatureMax { get; init; }

        [JsonPropertyName("precipitation_sum")]
        public double?[]? PrecipitationSum { get; init; }
    }
}
