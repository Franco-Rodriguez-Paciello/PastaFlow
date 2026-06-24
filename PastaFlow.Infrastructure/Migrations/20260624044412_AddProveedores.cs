using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PastaFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProveedores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Proveedores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ContactoNombre = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Email = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Cuit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Notas = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proveedores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProveedorIngredientes",
                columns: table => new
                {
                    ProveedorId = table.Column<int>(type: "integer", nullable: false),
                    IngredienteId = table.Column<int>(type: "integer", nullable: false),
                    CodigoProveedor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PrecioReferencia = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    EsPreferido = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    TiempoEntregaDias = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProveedorIngredientes", x => new { x.ProveedorId, x.IngredienteId });
                    table.ForeignKey(
                        name: "FK_ProveedorIngredientes_Ingredientes_IngredienteId",
                        column: x => x.IngredienteId,
                        principalTable: "Ingredientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProveedorIngredientes_Proveedores_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "Proveedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Proveedores_Nombre",
                table: "Proveedores",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProveedorIngredientes_IngredienteId",
                table: "ProveedorIngredientes",
                column: "IngredienteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProveedorIngredientes");

            migrationBuilder.DropTable(
                name: "Proveedores");
        }
    }
}
