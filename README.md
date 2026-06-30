# PastaFlow

ERP para una fábrica de pastas frescas con venta por mostrador. Incluye producción, inventario, punto de venta y **funciones de IA** con arquitectura híbrida: los números y reglas de negocio se calculan en .NET; el LLM solo redacta recomendaciones sobre datos ya calculados.

Proyecto full-stack pensado como producto real y como **portfolio técnico** (Clean Architecture, CQRS, .NET 10, React 19).

## Funcionalidades destacadas

| Módulo | Qué hace |
|--------|----------|
| **Planificación de producción** | Predicción de demanda por calendario + clima (Open-Meteo), backtesting con % de precisión, gráficos de tendencia |
| **Asistente de recetas (IA)** | Sugiere recetas con ingredientes existentes o propuestos; permite refinar la sugerencia en conversación |
| **Insights de compras (IA)** | Informe de reposición asistido por IA con historial |
| **Producción diaria** | Órdenes de producción con costos congelados para auditoría |
| **Punto de venta** | Registro de ventas por mostrador |
| **Dashboard** | Métricas financieras y operativas |

## Stack

- **Backend:** .NET 10, C# 14, Minimal APIs, EF Core, PostgreSQL, JWT
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, Recharts
- **IA:** Google Gemini o Groq (configurable)
- **Clima:** Open-Meteo (gratis, sin API key)

## Requisitos previos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 20+
- PostgreSQL 14+ (local o Docker)

## Inicio rápido

### 1. Clonar y configurar la base de datos

```bash
git clone <tu-repo>
cd PastaFlow
```

Creá la base `PastaFlowDb` en PostgreSQL.

### 2. Configurar la API

```bash
cp PastaFlow.API/appsettings.Development.example.json PastaFlow.API/appsettings.Development.json
```

Editá `appsettings.Development.json` con tu connection string y, si querés probar IA, la API key de Gemini o Groq (ver [Configuración](#configuración)).

### 3. Levantar la API

```bash
cd PastaFlow.API
dotnet run
```

En Development la API:
- Aplica migraciones automáticamente
- Crea usuarios de demo (si la tabla está vacía)
- Siembra proveedores y **6 meses de ventas históricas** con patrones (día 29, fin de semana, clima)

La API queda en `http://localhost:5095`.

### 4. Levantar el frontend

```bash
cd PastaFlow.Client
npm install
npm run dev
```

Abrí `http://localhost:5173` (Vite proxea `/api` hacia la API).

### 5. Iniciar sesión

Usá las [credenciales de demo](#credenciales-de-demo) con rol **Admin** para ver todas las funciones.

## Credenciales de demo

Solo en **Development**, si no hay usuarios en la base:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Admin (acceso completo) |
| `operario` | `operario123` | Operario (producción y ventas) |

> Si ya tenés usuarios creados manualmente, el seeder no los sobrescribe. Para usar estas credenciales, vaciá la tabla `Usuarios` o usá una base nueva.

## Recorrido demo (~2 minutos)

Ideal para mostrar el proyecto a alguien que no lo conoce:

1. **Login** como `admin` / `admin123`
2. **Planificación** (sidebar) — la pantalla más diferenciadora:
   - Elegí **mañana** o un **sábado** / **día 29** y pulsá *Calcular demanda*
   - Revisá el pronóstico de clima (Open-Meteo) y los factores en la tabla (ñoquis, fin de semana, clima)
   - Mirá el **% de precisión** y el gráfico *predicción vs. real*
   - Opcional: *Generar recomendación* (requiere API key de IA)
3. **Creador de recetas** — pedí algo como *"ravioles de ricota y espinaca premium"* y luego *Aplicar ajuste* para refinar
4. **Insights de compras** — generá un informe (también requiere IA)

**Tip:** Para ver el efecto “día 29 ñoquis”, planificá un 29 del mes. Para clima, elegí una fecha dentro de los próximos ~16 días (rango del pronóstico gratuito).

## Configuración

### IA (Gemini o Groq)

En `appsettings.Development.json` o variables de entorno:

```json
"Llm": { "Provider": "Gemini" },
"Gemini": { "ApiKey": "...", "Model": "gemini-2.5-flash" }
```

Variables de entorno (recomendado en producción): `Gemini__ApiKey`, `Groq__ApiKey`, `Jwt__SecretKey`.

Sin API key, las pantallas determinísticas (planificación sin botón IA, dashboard, producción) siguen funcionando.

### Regenerar ventas históricas

```json
"Seeding": { "RegenerarVentasHistoricas": true }
```

Reiniciá la API **una vez**, luego volvé a `false` para no borrar datos en cada arranque.

### Ubicación para el clima

```json
"Clima": {
  "Latitude": -34.6037,
  "Longitude": -58.3816,
  "Timezone": "America/Argentina/Buenos_Aires"
}
```

## Estructura del proyecto

```
PastaFlow/
├── PastaFlow.Domain/          # Entidades y reglas de negocio
├── PastaFlow.Application/     # CQRS: commands, queries, handlers, servicios
├── PastaFlow.Infrastructure/  # EF Core, IA, clima, email, seeders
├── PastaFlow.API/             # Minimal APIs, auth, DI
├── PastaFlow.Client/          # React SPA
└── PastaFlow.Tests/
```

## Arquitectura de IA (resumen)

```
Ventas históricas → PrediccionDemandaService (.NET, determinista)
                         ↓
              Pronóstico Open-Meteo (día objetivo)
                         ↓
              Opcional: LLM narra recomendación (JSON + texto)
```

Los cálculos son auditables y testeables; el LLM no inventa cantidades.

---

## Decisiones de arquitectura e ingeniería

El desarrollo de **PastaFlow** no solo busca resolver una necesidad de negocio (ERP para una fábrica de pastas), sino servir como un laboratorio de aplicación de patrones avanzados en **.NET 10** y **React 19**. A continuación, se detallan las principales decisiones de diseño arquitectónico y el porqué de su implementación:

### 1. CQRS Puro vs. MediatR (Eliminación de Sobreingeniería)
Aunque la tendencia común en Clean Architecture es acoplar el sistema a librerías como MediatR para implementar CQRS, en PastaFlow optamos por un enfoque de **CQRS Puro con Handlers Directos**. 
* **Por qué:** Al no requerir mensajería distribuida ni bus de eventos en memoria en esta fase, MediatR actuaba como un intermediario innecesario (pasamanos). 
* **Beneficio:** Al inyectar directamente los Handlers (`ICommandHandler/IQueryHandler`) en las Minimal APIs, reducimos la asignación de memoria por reflección, logramos un código fuertemente tipado y facilitamos el debugging del flujo de control sin perder el aislamiento entre lecturas y escrituras.

### 2. Rich Domain Model vs. Anemic Domain Model (Encapsulamiento de Invariantes)
Evitamos el antipatrón de entidades "anémicas" (simples bolsas de propiedades con *getters* y *setters*). Las reglas de negocio se defienden en el corazón del sistema: la capa de **Dominio**.
* **Ejemplo Práctico:** La entidad `Ingrediente` expone un método estricto `RestarStock(decimal cantidad)`. La capa de Aplicación (`Application`) no valida manualmente si hay stock suficiente; simplemente invoca al dominio. Si el stock resultante viola la regla de negocio (menor a cero), la entidad lanza una excepción de dominio inmediatamente. Esto garantiza la consistencia del sistema independientemente del punto de entrada (API, Web, Consola).

### 3. Desnormalización Intencional para Auditoría Financiera
Para el módulo de producción diaria, nos enfrentamos al desafío de la fluctuación de costos de los insumos en Argentina (harina, huevos, etc.).
* **Decisión:** Al registrar una producción con éxito, el sistema no calcula el costo dinámicamente en las lecturas consultando los precios actuales de la base de datos. En su lugar, el Handler captura el costo calculado por el servicio de dominio en ese instante y **congela** los valores `CostoTotalReal` y `CostoUnitarioReal` directamente en la tabla `HistorialProduccion`. Esto asegura la trazabilidad y la salud de las auditorías financieras históricas del negocio.

### 4. Optimización de Lecturas en PostgreSQL (`.AsNoTracking()`)
Separamos estrictamente el comportamiento de Entity Framework Core según el tipo de operación en CQRS:
* **Commands (Escrituras):** Utilizan el Change Tracker de EF Core para gestionar de forma eficiente el ciclo de vida y las mutaciones de los agregados.
* **Queries (Lecturas):** El 100% de los Query Handlers aplican explícitamente `.AsNoTracking()`. Esto reduce a la mitad el consumo de memoria del framework al omitir la preparación para ediciones, optimizando drásticamente la velocidad de respuesta de las Minimal APIs bajo PostgreSQL.
