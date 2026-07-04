const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

(async () => {
  const outdir = path.resolve(__dirname, '..', 'dist');
  fs.mkdirSync(outdir, { recursive: true });

  console.log('Building with esbuild...');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '..', 'src', 'script.ts')],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: path.resolve(outdir, 'script.js'),
    platform: 'browser',
    target: ['es2017']
  });

  // copy aiWorker.js and chess.html
  const filesToCopy = ['aiWorker.js', 'aiWorker.js.map', 'chess.html', 'estilo.css'];
  filesToCopy.forEach((f) => {
    const src = path.resolve(__dirname, '..', f);
    const dest = path.resolve(outdir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log('Copied', f);
    }
  });

  console.log('Build complete. Files in', outdir);
})();
