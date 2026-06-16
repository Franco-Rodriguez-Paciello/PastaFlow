## 🏗️ Decisiones de Arquitectura e Ingeniería de Software

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