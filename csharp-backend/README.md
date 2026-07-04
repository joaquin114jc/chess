# Chess Backend en C#

API mínima en ASP.NET Core para guardar y cargar partidas de ajedrez.

## Requisitos

- .NET SDK 8

## Cómo ejecutar

1. Abre un terminal en `csharp-backend`.
2. Restaura paquetes:

```bash
dotnet restore
```

3. Ejecuta la API:

```bash
dotnet run
```

4. La API estará disponible en:

```text
https://localhost:7221
http://localhost:5221
```

> Si usas el frontend estático desde otro servidor local (por ejemplo `http://localhost:8000`), el backend ya permite solicitudes CORS desde esa dirección.

## Endpoints

- `GET /api/games` — lista nombres de partidas guardadas.
- `GET /api/games/{name}` — carga una partida por nombre.
- `POST /api/save` — guarda una partida.
- `DELETE /api/games/{name}` — elimina una partida.

## Almacenamiento

- Los datos se guardan en `csharp-backend/saved_games.json`.
- El backend carga el archivo al iniciar y lo actualiza con cada guardado.
