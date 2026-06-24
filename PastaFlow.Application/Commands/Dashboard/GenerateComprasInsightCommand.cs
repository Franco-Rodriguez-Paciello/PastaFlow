using PastaFlow.Application.DTOs;
using PastaFlow.Domain.Entities;

namespace PastaFlow.Application.Commands.Dashboard;

public sealed record GenerateComprasInsightCommand(
    OrigenInformeCompras Origen,
    bool EnviarPorEmail = false);
