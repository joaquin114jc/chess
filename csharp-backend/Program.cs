using ChessBackend.Data;
using ChessBackend.Models;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocal", policy =>
    {
        policy.WithOrigins("http://localhost:8000", "https://localhost:8000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddSingleton<GameStorage>();

var app = builder.Build();
app.UseHttpsRedirection();
app.UseCors("AllowLocal");
app.UseStaticFiles();

app.MapGet("/api/games", (GameStorage storage) => Results.Ok(new { games = storage.GetGameNames() }));

app.MapGet("/api/games/{name}", (string name, GameStorage storage) =>
{
    var game = storage.LoadGame(name);
    return game is not null ? Results.Ok(game) : Results.NotFound(new { error = "Partida no encontrada" });
});

app.MapPost("/api/save", async (SaveRequest request, GameStorage storage) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new { error = "Nombre de partida requerido." });
    }

    storage.SaveGame(request.Name, request.State);
    return Results.Ok(new { status = "ok", name = request.Name });
});

app.MapDelete("/api/games/{name}", (string name, GameStorage storage) =>
{
    if (storage.DeleteGame(name))
    {
        return Results.Ok(new { status = "deleted", name });
    }

    return Results.NotFound(new { error = "Partida no encontrada" });
});

app.Run();

namespace ChessBackend.Models
{
    public class SaveRequest
    {
        public string Name { get; set; } = string.Empty;
        public object? State { get; set; }
    }
}
