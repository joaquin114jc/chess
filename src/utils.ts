export function nombreCasilla(fila: number, columna: number) {
  return String.fromCharCode(97 + columna) + (8 - fila);
}

export function colorCasilla(fila: number, columna: number) {
  return (fila + columna) % 2 === 0 ? 'clara' : 'oscura';
}

export function formatoTiempo(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

export function nivelIAInfo(nivel: number) {
  const mapa: Record<number, { label: string; profundidad: number; descripcion: string }> = {
    1: { label: 'Fácil', profundidad: 2, descripcion: 'Ideal para empezar o practicar' },
    2: { label: 'Normal', profundidad: 3, descripcion: 'Equilibrio entre rapidez y desafío' },
    3: { label: 'Difícil', profundidad: 4, descripcion: 'Reto más serio para partidas largas' }
  };

  return mapa[nivel] || mapa[2];
}

export function modoRapidoInfo(valor: string) {
  const mapa: Record<string, { label: string; tiempo: number; dificultad: number }> = {
    casual: { label: 'Partida rápida', tiempo: 3, dificultad: 1 },
    clasico: { label: 'Clásica', tiempo: 5, dificultad: 2 },
    intenso: { label: 'Intenso', tiempo: 10, dificultad: 3 }
  };

  return mapa[valor] || mapa.clasico;
}

export function obtenerPuzzlesEntrenamiento() {
  return [
    {
      titulo: 'Mate en 1',
      descripcion: 'Encuentra el jaque mate en una jugada.',
      fen: '7k/6pp/6q1/8/8/8/8/8/7K w - - 0 1',
      movimientoObjetivo: 'g7h7',
      pista: 'Jaque mate con la dama: busca la línea que fuerza la captura en h7.'
    },
    {
      titulo: 'Ataque doble',
      descripcion: 'Encuentra el movimiento que gana material.',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 1',
      movimientoObjetivo: 'f7f5',
      pista: 'El caballo y la dama pueden crear presión. Busca la amenaza que no se puede parar.'
    }
  ];
}

export function obtenerPuzzleEntrenamiento() {
  const puzzles = obtenerPuzzlesEntrenamiento();
  return puzzles[0];
}
