namespace PastaFlow.Domain;

/// <summary>Roles de autorización del sistema. Única fuente de verdad para evitar strings mágicos.</summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Operario = "Operario";

    public static readonly IReadOnlyCollection<string> All = [Admin, Operario];

    public static bool IsValid(string rol) => rol is Admin or Operario;
}
