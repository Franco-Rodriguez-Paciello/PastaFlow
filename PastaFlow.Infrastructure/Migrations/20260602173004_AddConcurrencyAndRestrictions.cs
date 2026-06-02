using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PastaFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddConcurrencyAndRestrictions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // xmin es una columna de sistema de PostgreSQL que ya existe en todas las tablas.
            // No se necesita ningún cambio DDL: EF Core solo actualiza el snapshot del modelo
            // para incluir el token de concurrencia en sus consultas UPDATE/DELETE.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No hay DDL que revertir; xmin es una columna de sistema de PostgreSQL.
        }
    }
}
