importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js');

function evaluarTablero(tablero, juegoInstance, jugadorActual) {
  const valores = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  const tablasPosicion = {/* simplified positional tables omitted for brevity */};

  let puntuacion = 0;
  for (let fila = 0; fila < 8; fila++) {
    for (let columna = 0; columna < 8; columna++) {
      const pieza = tablero[fila][columna];
      if (!pieza) continue;
      const valor = valores[pieza.type] || 0;
      const filaEval = pieza.color === 'w' ? fila : 7 - fila;
      const columnaEval = pieza.color === 'w' ? columna : 7 - columna;
      const bonusPosicion = 0; // keep simple to reduce worker size
      const factor = pieza.color === jugadorActual ? 1 : -1;
      puntuacion += factor * (valor + bonusPosicion * 20);
    }
  }

  const movilidad = juegoInstance.moves({ verbose: true }).length;
  puntuacion += jugadorActual === 'w' ? movilidad * 0.35 : -movilidad * 0.35;

  if (juegoInstance.in_check()) {
    puntuacion += jugadorActual === 'w' ? -35 : 35;
  }

  if (juegoInstance.game_over()) {
    if (juegoInstance.in_checkmate()) {
      return juegoInstance.turn() === jugadorActual ? -20000 : 20000;
    }
    return 0;
  }

  return puntuacion;
}

function ordenarMovimientos(movimientos) {
  const valores = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  return movimientos.sort((a, b) => {
    const capturaA = (a.flags || '').includes('c') || (a.flags || '').includes('e');
    const capturaB = (b.flags || '').includes('c') || (b.flags || '').includes('e');
    if (capturaA !== capturaB) return capturaA ? -1 : 1;
    if (a.promotion && !b.promotion) return -1;
    if (!a.promotion && b.promotion) return 1;
    return (valores[b.piece] || 0) - (valores[a.piece] || 0);
  });
}

function minimax(juegoInstance, profundidad, alpha, beta, jugadorMax) {
  if (profundidad === 0 || juegoInstance.game_over()) {
    return evaluarTablero(juegoInstance.board(), juegoInstance, jugadorMax);
  }

  const moves = ordenarMovimientos(juegoInstance.moves({ verbose: true }));
  if (juegoInstance.turn() === 'w') {
    let mejor = -Infinity;
    for (const mov of moves) {
      juegoInstance.move(mov);
      const puntuacion = minimax(juegoInstance, profundidad - 1, alpha, beta, jugadorMax);
      juegoInstance.undo();
      mejor = Math.max(mejor, puntuacion);
      alpha = Math.max(alpha, puntuacion);
      if (beta <= alpha) break;
    }
    return mejor;
  }

  let mejor = Infinity;
  for (const mov of moves) {
    juegoInstance.move(mov);
    const puntuacion = minimax(juegoInstance, profundidad - 1, alpha, beta, jugadorMax);
    juegoInstance.undo();
    mejor = Math.min(mejor, puntuacion);
    beta = Math.min(beta, puntuacion);
    if (beta <= alpha) break;
  }
  return mejor;
}

function elegirMejorMovimiento(fen, profundidad, aiColor) {
  const juegoInstance = new Chess();
  juegoInstance.load(fen);
  const movimientos = ordenarMovimientos(juegoInstance.moves({ verbose: true }));
  let mejorMovimiento = null;
  let mejorPuntuacion = aiColor === 'w' ? -Infinity : Infinity;

  for (const mov of movimientos) {
    juegoInstance.move(mov);
    const puntuacion = minimax(juegoInstance, profundidad - 1, -Infinity, Infinity, aiColor);
    juegoInstance.undo();

    if ((aiColor === 'w' && puntuacion > mejorPuntuacion) || (aiColor === 'b' && puntuacion < mejorPuntuacion)) {
      mejorPuntuacion = puntuacion;
      mejorMovimiento = mov;
    }
  }

  return mejorMovimiento;
}

self.onmessage = function (e) {
  try {
    const { fen, profundidad, aiColor } = e.data;
    const mejor = elegirMejorMovimiento(fen, profundidad, aiColor);
    postMessage({ move: mejor });
  } catch (err) {
    postMessage({ error: String(err) });
  }
};
