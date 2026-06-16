# =============================================================================
# ETAPA DE COMPILACIÓN (Build Stage)
# =============================================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar solo los .csproj para aprovechar la caché de capas de Docker
COPY PastaFlow.Domain/PastaFlow.Domain.csproj PastaFlow.Domain/
COPY PastaFlow.Application/PastaFlow.Application.csproj PastaFlow.Application/
COPY PastaFlow.Infrastructure/PastaFlow.Infrastructure.csproj PastaFlow.Infrastructure/
COPY PastaFlow.API/PastaFlow.API.csproj PastaFlow.API/

RUN dotnet restore PastaFlow.API/PastaFlow.API.csproj

# Copiar el resto del código fuente
COPY . .

WORKDIR /src/PastaFlow.API
RUN dotnet publish -c Release -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# =============================================================================
# ETAPA DE EJECUCIÓN (Runtime Stage)
# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 80

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "PastaFlow.API.dll"]
