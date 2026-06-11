namespace PastaFlow.Domain.Exceptions;

/// <summary>
/// Excepción lanzada cuando una operación viola una invariante de negocio del dominio.
/// </summary>
public sealed class InvalidDomainOperationException(string message) : Exception(message);
