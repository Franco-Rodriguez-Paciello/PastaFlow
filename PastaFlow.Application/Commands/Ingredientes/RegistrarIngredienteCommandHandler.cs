using Microsoft.EntityFrameworkCore;
using PastaFlow.Application.Interfaces;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Ingredientes;

public sealed class RegistrarIngredienteCommandHandler
{
    private readonly IPastaFlowDbContext _context;

    public RegistrarIngredienteCommandHandler(IPastaFlowDbContext context)
    {
        _context = context;
    }

    public async Task<int> HandleAsync(
        RegistrarIngredienteCommand command,
        CancellationToken cancellationToken = default)
    {
        // 1. Validar que no exista un ingrediente con el mismo nombre
        bool nombreExiste = await _context.Ingredientes
            .AnyAsync(i => i.Nombre == command.Nombre, cancellationToken);

        if (nombreExiste)
            throw new InvalidOperationException(
                $"Ya existe un ingrediente con el nombre '{command.Nombre}'.");

        // 2. Instanciar la entidad a través de su constructor público (activa validaciones de dominio)
        var ingrediente = new Ingrediente(command.Nombre, command.UnidadMedida, command.CostoInicial);
        _context.Ingredientes.Add(ingrediente);

        // 3. Registrar la entrada inicial en el historial de precios.
        //    ingrediente.Id = 0 en este punto; el Change Tracker de EF Core detecta que ambas
        //    entidades comparten el mismo valor sentinel (0) y propaga el PK generado
        //    hacia IngredienteId antes de ejecutar el segundo INSERT, garantizando atomicidad.
        var historial = new HistorialPrecioIngrediente(
            ingredienteId: ingrediente.Id,
            precioCostoAnterior: 0m,
            precioCostoNuevo: command.CostoInicial);
        _context.HistorialPreciosIngrediente.Add(historial);

        // 4. Única operación de escritura: ambos INSERTs ocurren en la misma transacción implícita
        await _context.SaveChangesAsync(cancellationToken);

        return ingrediente.Id;
    }
}
