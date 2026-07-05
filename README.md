# Chess Local Web

Proyecto de ajedrez para uso local en el navegador. Incluye frontend TypeScript, servidor estático simple en Python y un ejemplo de backend en C#.

## Requisitos

- Node.js + npm (para build y tests)
- Python 3 (para `server.py`)
- .NET 8 SDK (opcional: para `csharp-backend`)

## Instalación

1. Instala dependencias:

```bash
npm install
```

2. Compila el proyecto (genera `dist/`):

```bash
npm run build
```

3. Inicia el servidor local (sirve `chess.html` y la API de guardado):

```bash
npm start
```

Abre en tu navegador: http://localhost:8000

## Tests

Ejecuta los tests unitarios con Vitest:

```bash
npm test
```

## Desarrollo

- Usa `npm run watch` para recompilar TypeScript automáticamente durante el desarrollo.
- Archivos principales:
	- `src/script.ts` — código TypeScript del frontend
	- `chess.html`, `estilo.css`, `aiWorker.js` — recursos estáticos
	- `server.py` — servidor estático + API para guardar/leer partidas

## Build/Release rápido

1. Asegúrate de que los tests pasan: `npm test`
2. Ejecuta `npm run build` para generar `dist/` (ya contiene `script.js`, `chess.html` y `estilo.css`).
3. Empaqueta o sube `dist/` según tu flujo de publicación.

## Notas adicionales

- El directorio `csharp-backend/` contiene un ejemplo de backend en ASP.NET Core para integrar almacenamiento de partidas (requiere .NET 8 para ejecutar).
- El almacenamiento local de partidas se guarda en `saved_games.json` cuando usas la API de `server.py`.

Si quieres, puedo también añadir un changelog y un script de release automático.
