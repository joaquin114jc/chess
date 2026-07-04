# Chess Local Web

Proyecto de ajedrez local con soporte de navegador, ahora con scaffolding para TypeScript y servidor Python.

## Cómo usar

1. Instala dependencias de TypeScript:

```bash
npm install
```

2. Compila el proyecto:

```bash
npm run build
```

3. Inicia el servidor local de Python:

```bash
npm start
```

4. Abre en el navegador:

```text
http://localhost:8000
```

## Qué se agregó

- `package.json` con `typescript` y scripts de build.
- `tsconfig.json` para compilar `src/script.ts` a `dist/script.js`.
- `server.py` para servir los archivos estáticos y agregar una API REST simple de guardado de partidas.
- `csharp-backend/` con un backend ASP.NET Core para guardar, cargar y listar partidas.
- `.gitignore` para ignorar `dist/`, `node_modules/` y cachés de Python.

## Notas

- El archivo de código fuente principal ahora está en `src/script.ts`.
- `chess.html` carga `dist/script.js` tras la compilación.
- Puedes usar `npm run watch` para recompilar mientras editas.
- El backend C# está disponible en `csharp-backend/` y requiere el SDK de .NET 8 para ejecutarse.
