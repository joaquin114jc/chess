declare const Chess: any;

import { formatoTiempo, nivelIAInfo, modoRapidoInfo, obtenerPuzzleEntrenamiento } from './utils';

const contenedorTablero = document.getElementById('tablero') as HTMLDivElement;
const infoTurno = document.getElementById('info') as HTMLElement;
const historialEl = document.getElementById('historial') as HTMLOListElement;
const contadorJugadas = document.getElementById('contador-jugadas') as HTMLElement;
const botonNuevo = document.getElementById('nuevo-juego') as HTMLButtonElement;
const botonPartidaRapida = document.getElementById('partida-rapida') as HTMLButtonElement;
const botonDeshacer = document.getElementById('deshacer') as HTMLButtonElement;
const botonGirar = document.getElementById('girar-tablero') as HTMLButtonElement;
const botonTema = document.getElementById('cambiar-tema') as HTMLButtonElement;
const selectColor = document.getElementById('color-seleccion') as HTMLSelectElement;
const selectTiempo = document.getElementById('control-tiempo') as HTMLSelectElement;
const selectTema = document.getElementById('tema-piezas') as HTMLSelectElement;
const selectSkin = document.getElementById('skin-piezas') as HTMLSelectElement;
const selectDificultad = document.getElementById('dificultad-ia') as HTMLSelectElement;
const selectModoRapido = document.getElementById('modo-rapido') as HTMLSelectElement;
const estadoIaEl = document.getElementById('estado-ia') as HTMLElement;
const checkModoDosJugadores = document.getElementById('modo-dos-jugadores') as HTMLInputElement;
const checkModoRed = document.getElementById('modo-red') as HTMLInputElement;
const checkSonido = document.getElementById('sonido-activo') as HTMLInputElement;
const botonGuardar = document.getElementById('guardar-partida') as HTMLButtonElement;
const botonCargar = document.getElementById('cargar-partida') as HTMLButtonElement;
const botonBorrar = document.getElementById('borrar-guardado') as HTMLButtonElement;
const botonExportar = document.getElementById('exportar-historial') as HTMLButtonElement;
const botonExportarPGN = document.getElementById('exportar-pgn') as HTMLButtonElement;
const botonImportarPGN = document.getElementById('importar-pgn') as HTMLButtonElement;
const botonReiniciarPuzzle = document.getElementById('reiniciar-puzzle') as HTMLButtonElement;
const puzzleTituloEl = document.getElementById('puzzle-titulo') as HTMLElement;
const puzzleDescripcionEl = document.getElementById('puzzle-descripcion') as HTMLElement;
const puzzlePistaEl = document.getElementById('puzzle-pista') as HTMLElement;
const puzzleFeedbackEl = document.getElementById('puzzle-feedback') as HTMLElement;
const puzzleAciertosEl = document.getElementById('puzzle-aciertos') as HTMLElement;
const puzzleErroresEl = document.getElementById('puzzle-errores') as HTMLElement;
const botonGuardarServidor = document.getElementById('guardar-servidor') as HTMLButtonElement;
const botonCargarServidor = document.getElementById('cargar-servidor') as HTMLButtonElement;
const botonBorrarServidor = document.getElementById('borrar-servidor') as HTMLButtonElement;
const botonRehacer = document.getElementById('rehacer') as HTMLButtonElement;
const botonCrearOferta = document.getElementById('crear-oferta') as HTMLButtonElement;
const botonProcesarOferta = document.getElementById('procesar-oferta') as HTMLButtonElement;
const botonProcesarRespuesta = document.getElementById('procesar-respuesta') as HTMLButtonElement;
const listaPartidas = document.getElementById('lista-partidas') as HTMLSelectElement;
const listaPartidasServidor = document.getElementById(
  'lista-partidas-servidor'
) as HTMLSelectElement;
const senalRemota = document.getElementById('senal-remota') as HTMLTextAreaElement;
const estadoBackendEl = document.getElementById('estado-backend') as HTMLElement;
const estadoRedEl = document.getElementById('estado-red') as HTMLElement;
const relojBlancas = document.getElementById('reloj-blancas') as HTMLElement;
const relojNegras = document.getElementById('reloj-negras') as HTMLElement;
const victoriasEl = document.getElementById('stats-victorias') as HTMLElement;
const derrotasEl = document.getElementById('stats-derrotas') as HTMLElement;
const tablasEl = document.getElementById('stats-tablas') as HTMLElement;
const estadoGuardadoEl = document.getElementById('estado-guardado') as HTMLElement;
const evaluacionEl = document.getElementById('evaluacion') as HTMLElement;
const materialDiferenciaEl = document.getElementById('material-diferencia') as HTMLElement;

const simbolosPiezas = {
  clasico: {
    p: { w: '♙', b: '♟' },
    r: { w: '♖', b: '♜' },
    n: { w: '♘', b: '♞' },
    b: { w: '♗', b: '♝' },
    q: { w: '♕', b: '♛' },
    k: { w: '♔', b: '♚' },
  },
  moderno: {
    p: { w: '♟', b: '♙' },
    r: { w: '♜', b: '♖' },
    n: { w: '♞', b: '♘' },
    b: { w: '♝', b: '♗' },
    q: { w: '♛', b: '♕' },
    k: { w: '♚', b: '♔' },
  },
};

const juego = new Chess();
let casillaSeleccionada: string | null = null;
let movimientosLegales: string[] = [];
let ultimaMovidaDesde: string | null = null;
let ultimaMovidaHasta: string | null = null;
let estaPensando = false;
let finPorTiempo: string | null = null;
let playerColor = 'w';
let aiColor = 'b';
let boardFlipped = false;
let tema = 'clasico';
let dificultadIA = 2;
let profundidadIA = 3;
let tiempoControl = 5;
let tiempoBlanco = 5 * 60;
let tiempoNegro = 5 * 60;
let timerId: number | null = null;
let skinPiezas = 'clasico';
let modoDosJugadores = false;
let modoRed = false;
let conexionActiva = false;
let peerConnection: RTCPeerConnection | null = null;
let canalDatos: RTCDataChannel | null = null;
let focusSquare = 'a1';
let redoStack: any[] = [];
let savedGames: Record<string, any> = {};
let resultadoRegistrado = false;
let sonidoActivado = true;
let estadisticas = { victorias: 0, derrotas: 0, tablas: 0 };
let puzzleActual: ReturnType<typeof obtenerPuzzleEntrenamiento> | null = null;
let aciertosPuzzle = 0;
let erroresPuzzle = 0;
let autoSaveTimer: number | null = null;
let backendUrl: string | null = null;
const backendUrls = ['https://localhost:7221', 'http://localhost:5221'];

async function obtenerBackendUrl() {
  if (backendUrl) return backendUrl;
  for (const url of backendUrls) {
    try {
      const respuesta = await fetch(`${url}/api/games`, { method: 'GET' });
      if (respuesta.ok) {
        backendUrl = url;
        return backendUrl;
      }
    } catch {
      // ignore error and try next candidate
    }
  }
  return null;
}

async function actualizarEstadoBackend() {
  const url = await obtenerBackendUrl();
  if (url) {
    estadoBackendEl.textContent = `Backend C# disponible en ${url}`;
    await cargarPartidasServidor();
  } else {
    estadoBackendEl.textContent = 'Backend C# no disponible';
    listaPartidasServidor.innerHTML = '';
    const opcion = document.createElement('option');
    opcion.textContent = 'Sin conexión al servidor';
    opcion.disabled = true;
    listaPartidasServidor.appendChild(opcion);
  }
}

async function cargarPartidasServidor() {
  const url = await obtenerBackendUrl();
  if (!url) {
    estadoBackendEl.textContent = 'Backend C# no disponible';
    return;
  }

  try {
    const respuesta = await fetch(`${url}/api/games`);
    if (!respuesta.ok) {
      throw new Error('Error en la respuesta del servidor');
    }

    const data = await respuesta.json();
    const nombres = Array.isArray(data.games) ? data.games : [];
    listaPartidasServidor.innerHTML = '';

    if (nombres.length === 0) {
      const opcion = document.createElement('option');
      opcion.textContent = 'Sin guardados en servidor';
      opcion.disabled = true;
      listaPartidasServidor.appendChild(opcion);
      return;
    }

    nombres.sort().forEach((nombre: string) => {
      const opcion = document.createElement('option');
      opcion.value = nombre;
      opcion.textContent = nombre;
      listaPartidasServidor.appendChild(opcion);
    });
  } catch (error) {
    console.warn('No se pudieron cargar partidas del servidor', error);
    estadoBackendEl.textContent = 'No se pudo conectar al backend C#';
  }
}

async function guardarPartidaServidor() {
  const nombreExistente = listaPartidasServidor.value || `Partida ${new Date().toLocaleString()}`;
  const nombre = prompt('Nombre para guardar esta partida en el servidor:', nombreExistente);
  if (!nombre) return;

  const estado = {
    fen: juego.fen(),
    playerColor,
    aiColor,
    boardFlipped,
    tema,
    skinPiezas,
    dificultadIA,
    tiempoControl,
    tiempoBlanco,
    tiempoNegro,
    finPorTiempo,
    modoDosJugadores,
    modoRed,
    ultimaMovidaDesde,
    ultimaMovidaHasta,
    turn: juego.turn(),
  };

  const url = await obtenerBackendUrl();
  if (!url) {
    estadoBackendEl.textContent = 'Backend C# no disponible';
    return;
  }

  try {
    const respuesta = await fetch(`${url}/api/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nombre, state: estado }),
    });

    if (!respuesta.ok) {
      throw new Error('No se pudo guardar en el servidor');
    }

    estadoGuardadoEl.textContent = `Partida guardada en servidor como ${nombre}`;
    await cargarPartidasServidor();
    listaPartidasServidor.value = nombre;
  } catch (error) {
    console.warn('Error guardando en servidor', error);
    estadoGuardadoEl.textContent = 'Error al guardar en el servidor';
  }
}

async function cargarPartidaServidor() {
  const nombre = listaPartidasServidor.value;
  if (!nombre) {
    estadoGuardadoEl.textContent = 'Selecciona una partida del servidor';
    return;
  }

  const url = await obtenerBackendUrl();
  if (!url) {
    estadoBackendEl.textContent = 'Backend C# no disponible';
    return;
  }

  try {
    const respuesta = await fetch(`${url}/api/games/${encodeURIComponent(nombre)}`);
    if (!respuesta.ok) {
      throw new Error('No se pudo cargar desde el servidor');
    }

    const data = await respuesta.json();
    const estado = data.state;
    if (!estado) {
      throw new Error('Estado inválido del servidor');
    }

    juego.load(estado.fen);
    playerColor = estado.playerColor || 'w';
    aiColor = estado.aiColor || (playerColor === 'w' ? 'b' : 'w');
    boardFlipped = Boolean(estado.boardFlipped);
    tema = estado.tema || 'clasico';
    skinPiezas = estado.skinPiezas || 'clasico';
    dificultadIA = Number(estado.dificultadIA) || 2;
    tiempoControl = Number(estado.tiempoControl) || 0;
    tiempoBlanco = Number(estado.tiempoBlanco) || 0;
    tiempoNegro = Number(estado.tiempoNegro) || 0;
    finPorTiempo = estado.finPorTiempo || null;
    modoDosJugadores = Boolean(estado.modoDosJugadores);
    modoRed = Boolean(estado.modoRed);
    ultimaMovidaDesde = estado.ultimaMovidaDesde || null;
    ultimaMovidaHasta = estado.ultimaMovidaHasta || null;

    selectColor.value = playerColor;
    selectTema.value = tema;
    selectSkin.value = skinPiezas;
    selectDificultad.value = String(dificultadIA);
    selectTiempo.value = String(tiempoControl);
    checkModoDosJugadores.checked = modoDosJugadores;
    checkModoRed.checked = modoRed;
    setTema(tema);
    setSkin(skinPiezas);
    setDificultad(String(dificultadIA));
    setTiempoControl(String(tiempoControl));
    actualizarTemporizadores();

    estadoGuardadoEl.textContent = `Partida cargada desde servidor: ${nombre}`;
    renderizarTablero();
    actualizarEstado();
  } catch (error) {
    console.warn('Error cargando partida del servidor', error);
    estadoGuardadoEl.textContent = 'Error al cargar partida del servidor';
  }
}

async function borrarPartidaServidor() {
  const nombre = listaPartidasServidor.value;
  if (!nombre) {
    estadoGuardadoEl.textContent = 'Selecciona una partida del servidor para borrar';
    return;
  }

  const url = await obtenerBackendUrl();
  if (!url) {
    estadoBackendEl.textContent = 'Backend C# no disponible';
    return;
  }

  try {
    const respuesta = await fetch(`${url}/api/games/${encodeURIComponent(nombre)}`, {
      method: 'DELETE',
    });
    if (!respuesta.ok) {
      throw new Error('No se pudo borrar la partida del servidor');
    }

    estadoGuardadoEl.textContent = `Guardado del servidor ${nombre} eliminado`;
    await cargarPartidasServidor();
  } catch (error) {
    console.warn('Error borrando partida del servidor', error);
    estadoGuardadoEl.textContent = 'Error al borrar partida del servidor';
  }
}

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

function actualizarTemporizadores() {
  relojBlancas.textContent = tiempoControl > 0 ? formatoTiempo(tiempoBlanco) : '—:—';
  relojNegras.textContent = tiempoControl > 0 ? formatoTiempo(tiempoNegro) : '—:—';
}

function iniciarTemporizador() {
  if (tiempoControl <= 0 || juego.game_over() || finPorTiempo) return;
  if (timerId !== null) window.clearInterval(timerId);

  timerId = window.setInterval(() => {
    if (juego.game_over() || finPorTiempo) {
      if (timerId !== null) window.clearInterval(timerId);
      return;
    }

    if (juego.turn() === 'w') {
      tiempoBlanco -= 1;
    } else {
      tiempoNegro -= 1;
    }

    if (tiempoBlanco <= 0 || tiempoNegro <= 0) {
      if (timerId !== null) window.clearInterval(timerId);
      finPorTiempo = tiempoBlanco <= 0 ? 'w' : 'b';
    }

    actualizarTemporizadores();
    actualizarEstado();
  }, 1000);
}

function detenerTemporizador() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function setTema(nuevoTema: string) {
  tema = nuevoTema;
  document.body.classList.remove('theme-moderno', 'theme-madera', 'theme-azul');
  if (tema === 'moderno') {
    document.body.classList.add('theme-moderno');
  } else if (tema === 'madera') {
    document.body.classList.add('theme-madera');
  } else if (tema === 'azul') {
    document.body.classList.add('theme-azul');
  }
}

function setSkin(nuevoSkin: string) {
  skinPiezas = nuevoSkin || 'clasico';
}

function aplicarTemaOscuro(activo: boolean) {
  document.body.classList.toggle('dark-theme', activo);
  botonTema.textContent = activo ? 'Modo claro' : 'Modo oscuro';
  botonTema.setAttribute('aria-pressed', String(activo));
  localStorage.setItem('ajedrez-tema-oscuro', String(activo));
}

function setDificultad(valor: string) {
  dificultadIA = Number(valor);
  profundidadIA = Math.min(6, Math.max(2, dificultadIA + 2));
  const info = nivelIAInfo(dificultadIA);
  estadoIaEl.textContent = `${info.label}: ${info.descripcion}`;
}

function setTiempoControl(valor: string) {
  tiempoControl = Number(valor);
  if (tiempoControl > 0) {
    tiempoBlanco = tiempoNegro = tiempoControl * 60;
  } else {
    tiempoBlanco = tiempoNegro = 0;
  }
  actualizarTemporizadores();
}

function reproducirSonido(tipo: string) {
  if (!sonidoActivado) return;
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    const contexto = new AudioContextCtor();
    const oscilador = contexto.createOscillator();
    const oscilador2 = contexto.createOscillator();
    const ganancia = contexto.createGain();
    const config: Record<string, any> = {
      movimiento: { tipo: 'sine', frecuencia: 300, frecuencia2: 420, duracion: 0.12 },
      captura: { tipo: 'square', frecuencia: 440, frecuencia2: 560, duracion: 0.16 },
      check: { tipo: 'triangle', frecuencia: 520, frecuencia2: 640, duracion: 0.14 },
      checkmate: { tipo: 'sawtooth', frecuencia: 260, frecuencia2: 340, duracion: 0.22 },
    };
    const opcion = config[tipo] || config.movimiento;
    oscilador.type = opcion.tipo;
    oscilador2.type = tipo === 'checkmate' ? 'square' : 'sine';
    oscilador.frequency.setValueAtTime(opcion.frecuencia, contexto.currentTime);
    oscilador2.frequency.setValueAtTime(opcion.frecuencia2, contexto.currentTime);
    ganancia.gain.setValueAtTime(0.035, contexto.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + opcion.duracion);
    oscilador.connect(ganancia);
    oscilador2.connect(ganancia);
    ganancia.connect(contexto.destination);
    oscilador.start();
    oscilador2.start();
    oscilador.stop(contexto.currentTime + opcion.duracion);
    oscilador2.stop(contexto.currentTime + opcion.duracion);
  } catch (error) {
    console.warn('No se pudo reproducir sonido', error);
  }
}

function cargarEstadisticas() {
  try {
    const raw = localStorage.getItem('ajedrez-estadisticas');
    if (raw) {
      estadisticas = JSON.parse(raw);
    }
  } catch (error) {
    console.warn('No se pudieron cargar las estadísticas', error);
  }
  actualizarEstadisticasUI();
}

function actualizarEstadisticasUI() {
  victoriasEl.textContent = String(estadisticas.victorias);
  derrotasEl.textContent = String(estadisticas.derrotas);
  tablasEl.textContent = String(estadisticas.tablas);
}

function guardarEstadisticas() {
  localStorage.setItem('ajedrez-estadisticas', JSON.stringify(estadisticas));
  actualizarEstadisticasUI();
}

function registrarResultado() {
  if (resultadoRegistrado) return;
  resultadoRegistrado = true;

  if (modoDosJugadores) {
    estadisticas.tablas += 1;
    guardarEstadisticas();
    return;
  }

  if (juego.in_checkmate()) {
    const ganador = juego.turn() === 'w' ? 'b' : 'w';
    if (ganador === playerColor) {
      estadisticas.victorias += 1;
    } else {
      estadisticas.derrotas += 1;
    }
  } else {
    estadisticas.tablas += 1;
  }

  guardarEstadisticas();
}

function exportarHistorial() {
  const historialMovidas = juego.history();
  const texto =
    historialMovidas.length > 0
      ? `Partida de ajedrez\n\n${historialMovidas.join(' ')}`
      : 'Partida de ajedrez\n\nSin movimientos todavía.';
  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'historial-ajedrez.txt';
  enlace.click();
  URL.revokeObjectURL(url);
  estadoGuardadoEl.textContent = 'Historial exportado';
}

function guardarEstadoLocal() {
  try {
    const estado = {
      fen: juego.fen(),
      playerColor,
      aiColor,
      boardFlipped,
      tema,
      skinPiezas,
      dificultadIA,
      tiempoControl,
      tiempoBlanco,
      tiempoNegro,
      finPorTiempo,
      modoDosJugadores,
      modoRed,
      ultimaMovidaDesde,
      ultimaMovidaHasta,
      turn: juego.turn(),
    };
    localStorage.setItem('ajedrez-local-guardado', JSON.stringify(estado));
    estadoGuardadoEl.textContent = 'Partida guardada automáticamente';
  } catch (error) {
    console.warn('No se pudo guardar la partida', error);
  }
}

function guardarEstadoLocalConRetraso() {
  if (autoSaveTimer !== null) {
    window.clearTimeout(autoSaveTimer);
  }
  autoSaveTimer = window.setTimeout(() => {
    guardarEstadoLocal();
  }, 500);
}

function cargarPartidasGuardadas() {
  try {
    const raw = localStorage.getItem('ajedrez-partidas-historiales');
    if (raw) {
      savedGames = JSON.parse(raw);
    }
  } catch (error) {
    console.warn('No se pudieron cargar las partidas guardadas', error);
    savedGames = {};
  }
  actualizarListaPartidas();
}

function actualizarListaPartidas() {
  listaPartidas.innerHTML = '';
  const nombres = Object.keys(savedGames).sort();
  if (nombres.length === 0) {
    const opcion = document.createElement('option');
    opcion.textContent = 'Sin guardados';
    opcion.disabled = true;
    listaPartidas.appendChild(opcion);
    return;
  }

  nombres.forEach((nombre) => {
    const opcion = document.createElement('option');
    opcion.value = nombre;
    opcion.textContent = nombre;
    listaPartidas.appendChild(opcion);
  });
}

function guardarPartidaHistorial() {
  const nombreExistente =
    listaPartidas.value && savedGames[listaPartidas.value] ? listaPartidas.value : null;
  const nombre = prompt(
    'Nombre para guardar esta partida:',
    nombreExistente || `Partida ${new Date().toLocaleString()}`
  );
  if (!nombre) return;

  const estado = {
    fen: juego.fen(),
    playerColor,
    aiColor,
    boardFlipped,
    tema,
    skinPiezas,
    dificultadIA,
    tiempoControl,
    tiempoBlanco,
    tiempoNegro,
    finPorTiempo,
    modoDosJugadores,
    modoRed,
    ultimaMovidaDesde,
    ultimaMovidaHasta,
    turn: juego.turn(),
  };

  savedGames[nombre] = estado;
  localStorage.setItem('ajedrez-partidas-historiales', JSON.stringify(savedGames));
  cargarPartidasGuardadas();
  listaPartidas.value = nombre;
  estadoGuardadoEl.textContent = `Partida guardada como ${nombre}`;
}

function cargarPartidaHistorial() {
  const nombre = listaPartidas.value;
  if (!nombre || !savedGames[nombre]) {
    estadoGuardadoEl.textContent = 'Selecciona una partida guardada';
    return;
  }

  const estado = savedGames[nombre];
  juego.load(estado.fen);
  playerColor = estado.playerColor || 'w';
  aiColor = estado.aiColor || (playerColor === 'w' ? 'b' : 'w');
  boardFlipped = Boolean(estado.boardFlipped);
  tema = estado.tema || 'clasico';
  skinPiezas = estado.skinPiezas || 'clasico';
  dificultadIA = Number(estado.dificultadIA) || 2;
  tiempoControl = Number(estado.tiempoControl) || 0;
  tiempoBlanco = Number(estado.tiempoBlanco) || 0;
  tiempoNegro = Number(estado.tiempoNegro) || 0;
  finPorTiempo = estado.finPorTiempo || null;
  modoDosJugadores = Boolean(estado.modoDosJugadores);
  modoRed = Boolean(estado.modoRed);
  ultimaMovidaDesde = estado.ultimaMovidaDesde || null;
  ultimaMovidaHasta = estado.ultimaMovidaHasta || null;

  selectColor.value = playerColor;
  selectTema.value = tema;
  selectSkin.value = skinPiezas;
  selectDificultad.value = String(dificultadIA);
  selectTiempo.value = String(tiempoControl);
  checkModoDosJugadores.checked = modoDosJugadores;
  checkModoRed.checked = modoRed;
  setTema(tema);
  setSkin(skinPiezas);
  setDificultad(String(dificultadIA));
  setTiempoControl(String(tiempoControl));
  actualizarTemporizadores();

  estadoGuardadoEl.textContent = `Partida cargada: ${nombre}`;
  renderizarTablero();
  actualizarEstado();
}

function borrarPartidaHistorial() {
  const nombre = listaPartidas.value;
  if (!nombre || !savedGames[nombre]) {
    estadoGuardadoEl.textContent = 'Selecciona una partida guardada para borrar';
    return;
  }
  delete savedGames[nombre];
  localStorage.setItem('ajedrez-partidas-historiales', JSON.stringify(savedGames));
  cargarPartidasGuardadas();
  estadoGuardadoEl.textContent = `Guardado ${nombre} eliminado`;
}

function exportarPGN() {
  try {
    const pgn = juego.pgn();
    const blob = new Blob([pgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'partida-ajedrez.pgn';
    enlace.click();
    URL.revokeObjectURL(url);
    estadoGuardadoEl.textContent = 'PGN exportado';
  } catch (error) {
    console.warn('No se pudo exportar PGN', error);
    estadoGuardadoEl.textContent = 'Error al exportar PGN';
  }
}

function importarPGN() {
  const pgn = prompt('Pega el PGN de la partida:');
  if (!pgn) return;
  try {
    juego.load_pgn(pgn);
    casillaSeleccionada = null;
    movimientosLegales = [];
    ultimaMovidaDesde = null;
    ultimaMovidaHasta = null;
    renderizarTablero();
    actualizarEstado();
    estadoGuardadoEl.textContent = 'PGN importado correctamente';
  } catch (error) {
    console.warn('No se pudo importar PGN', error);
    estadoGuardadoEl.textContent = 'PGN inválido';
  }
}

function crearPeerConnection() {
  peerConnection = new RTCPeerConnection();
  peerConnection.ondatachannel = (evento) => {
    canalDatos = evento.channel;
    configurarCanalDatos();
  };
  peerConnection.onconnectionstatechange = () => {
    conexionActiva = peerConnection?.connectionState === 'connected';
    actualizarEstadoRed();
  };
}

function configurarCanalDatos() {
  if (!canalDatos) return;
  canalDatos.onopen = () => {
    conexionActiva = true;
    actualizarEstadoRed();
  };
  canalDatos.onclose = () => {
    conexionActiva = false;
    actualizarEstadoRed();
  };
  canalDatos.onmessage = (evento) => {
    try {
      const mensaje = JSON.parse(evento.data);
      if (mensaje.type === 'move') {
        juego.move({ from: mensaje.from, to: mensaje.to, promotion: mensaje.promotion || 'q' });
        ultimaMovidaDesde = mensaje.from;
        ultimaMovidaHasta = mensaje.to;
        casillaSeleccionada = null;
        movimientosLegales = [];
        renderizarTablero();
        actualizarEstado();
      }
    } catch (error) {
      console.warn('Mensaje remoto inválido', error);
    }
  };
}

async function crearOferta() {
  try {
    crearPeerConnection();
    canalDatos = peerConnection?.createDataChannel('ajedrez') || null;
    configurarCanalDatos();
    const oferta = await peerConnection!.createOffer();
    await peerConnection!.setLocalDescription(oferta);
    senalRemota.value = JSON.stringify(peerConnection!.localDescription);
    estadoRedEl.textContent = 'Oferta creada. Copia el texto y envíalo al otro jugador.';
  } catch (error) {
    console.warn('No se pudo crear la oferta', error);
    estadoRedEl.textContent = 'Error al crear la oferta.';
  }
}

async function procesarOferta() {
  try {
    crearPeerConnection();
    const oferta = JSON.parse(senalRemota.value);
    await peerConnection!.setRemoteDescription(oferta);
    const respuesta = await peerConnection!.createAnswer();
    await peerConnection!.setLocalDescription(respuesta);
    senalRemota.value = JSON.stringify(peerConnection!.localDescription);
    estadoRedEl.textContent = 'Respuesta creada. Copia el texto y envíalo al otro jugador.';
  } catch (error) {
    console.warn('No se pudo procesar la oferta', error);
    estadoRedEl.textContent = 'Error al procesar la oferta.';
  }
}

async function procesarRespuesta() {
  try {
    const respuesta = JSON.parse(senalRemota.value);
    await peerConnection!.setRemoteDescription(respuesta);
    estadoRedEl.textContent =
      'Respuesta procesada. Conexión activada cuando el canal esté abierto.';
  } catch (error) {
    console.warn('No se pudo procesar la respuesta', error);
    estadoRedEl.textContent = 'Error al procesar la respuesta.';
  }
}

function actualizarEstadoRed() {
  if (conexionActiva) {
    estadoRedEl.textContent = 'Red conectada';
  } else if (modoRed) {
    estadoRedEl.textContent = 'Modo red activo. Usa oferta/respuesta.';
  } else {
    estadoRedEl.textContent = 'No conectado';
  }
}

function programarGuardadoAutomatico() {
  if (autoSaveTimer !== null) {
    window.clearTimeout(autoSaveTimer);
  }

  autoSaveTimer = window.setTimeout(() => {
    guardarEstadoLocal();
  }, 400);
}

function cargarEstadoLocal() {
  try {
    const raw = localStorage.getItem('ajedrez-local-guardado');
    if (!raw) {
      estadoGuardadoEl.textContent = 'Sin partida guardada';
      return false;
    }

    const estado = JSON.parse(raw);
    juego.load(estado.fen);
    playerColor = estado.playerColor || 'w';
    aiColor = estado.aiColor || 'b';
    boardFlipped = Boolean(estado.boardFlipped);
    tema = estado.tema || 'clasico';
    skinPiezas = estado.skinPiezas || 'clasico';
    dificultadIA = Number(estado.dificultadIA) || 2;
    tiempoControl = Number(estado.tiempoControl) || 0;
    tiempoBlanco = Number(estado.tiempoBlanco) || 0;
    tiempoNegro = Number(estado.tiempoNegro) || 0;
    finPorTiempo = estado.finPorTiempo || null;
    modoDosJugadores = Boolean(estado.modoDosJugadores);
    modoRed = Boolean(estado.modoRed);
    ultimaMovidaDesde = estado.ultimaMovidaDesde || null;
    ultimaMovidaHasta = estado.ultimaMovidaHasta || null;
    selectColor.value = playerColor;
    selectTema.value = tema;
    selectSkin.value = skinPiezas;
    selectDificultad.value = String(dificultadIA);
    selectTiempo.value = String(tiempoControl);
    checkModoDosJugadores.checked = modoDosJugadores;
    checkModoRed.checked = modoRed;
    setTema(tema);
    setSkin(skinPiezas);
    setDificultad(String(dificultadIA));
    setTiempoControl(String(tiempoControl));
    actualizarTemporizadores();
    estadoGuardadoEl.textContent = 'Partida cargada desde el navegador';
    return true;
  } catch (error) {
    console.warn('No se pudo cargar la partida', error);
    estadoGuardadoEl.textContent = 'Sin partida guardada';
    return false;
  }
}

function actualizarHistorial() {
  const historial = juego.history();
  historialEl.innerHTML = '';
  const pares: Array<{ blanco: string; negro: string }> = [];

  for (let i = 0; i < historial.length; i += 2) {
    pares.push({ blanco: historial[i] || '', negro: historial[i + 1] || '' });
  }

  pares.forEach((fila, index) => {
    const item = document.createElement('li');
    item.innerHTML = `<span class="jugada-num">${index + 1}.</span> <span class="jugada-blanca">${fila.blanco}</span> <span class="jugada-negra">${fila.negro}</span>`;
    historialEl.appendChild(item);
  });

  contadorJugadas.textContent = `${juego.history().length} jugadas`;
}

function obtenerMaterialDiferencia() {
  const tablero = juego.board();
  const valores: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let blanco = 0;
  let negro = 0;

  tablero.forEach((fila: any) => {
    fila.forEach((pieza: any) => {
      if (!pieza) return;
      const valor = valores[pieza.type] || 0;
      if (pieza.color === 'w') blanco += valor;
      else negro += valor;
    });
  });

  return blanco - negro;
}

function actualizarEvaluacion() {
  const puntuacion = evaluarTablero(juego.board(), playerColor);
  evaluacionEl.textContent = `Evaluación: ${puntuacion.toFixed(0)}`;
  const material = obtenerMaterialDiferencia();
  materialDiferenciaEl.textContent = `Material: ${material >= 0 ? '+' + material : material}`;
}

function actualizarEstado() {
  const info = nivelIAInfo(dificultadIA);
  estadoIaEl.textContent = `${info.label}: ${info.descripcion}`;

  if (puzzleActual) {
    puzzleTituloEl.textContent = puzzleActual.titulo;
    puzzleDescripcionEl.textContent = puzzleActual.descripcion;
    puzzlePistaEl.textContent = `Pista: ${puzzleActual.pista}`;
    puzzleAciertosEl.textContent = `${aciertosPuzzle} aciertos`;
    puzzleErroresEl.textContent = `${erroresPuzzle} errores`;
  }

  if (estaPensando) {
    infoTurno.textContent = 'IA está pensando...';
    actualizarHistorial();
    return;
  }

  if (finPorTiempo) {
    const ganador = finPorTiempo === 'w' ? 'Negras' : 'Blancas';
    infoTurno.textContent = `Tiempo agotado. Gana ${ganador}`;
    actualizarHistorial();
    registrarResultado();
    return;
  }

  if (juego.game_over()) {
    if (juego.in_checkmate()) {
      infoTurno.textContent = `Jaque mate. Ganan las ${juego.turn() === 'w' ? 'Negras' : 'Blancas'}`;
    } else {
      infoTurno.textContent = 'Tablas. La partida ha terminado.';
    }
    actualizarHistorial();
    registrarResultado();
    actualizarEvaluacion();
    return;
  }

  if (juego.in_check()) {
    infoTurno.textContent = `Jaque. Turno de las ${juego.turn() === 'w' ? 'Blancas' : 'Negras'}`;
    actualizarHistorial();
    actualizarEvaluacion();
    return;
  }

  infoTurno.textContent = `Turno de las ${juego.turn() === 'w' ? 'Blancas' : 'Negras'}`;
  actualizarHistorial();
  actualizarEvaluacion();
}

function cargarPuzzleEntrenamiento() {
  puzzleActual = obtenerPuzzleEntrenamiento();
  juego.load(puzzleActual.fen);
  playerColor = 'w';
  aiColor = 'b';
  boardFlipped = false;
  modoDosJugadores = false;
  modoRed = false;
  finPorTiempo = null;
  estaPensando = false;
  resultadoRegistrado = false;
  casillaSeleccionada = null;
  movimientosLegales = [];
  ultimaMovidaDesde = null;
  ultimaMovidaHasta = null;
  selectColor.value = playerColor;
  selectDificultad.value = '1';
  setDificultad('1');
  setTiempoControl('0');
  puzzleFeedbackEl.textContent = 'Prueba a resolverlo.';
  puzzlePistaEl.textContent = `Pista: ${puzzleActual.pista}`;
  puzzleAciertosEl.textContent = `${aciertosPuzzle} aciertos`;
  puzzleErroresEl.textContent = `${erroresPuzzle} errores`;
  guardarEstadoLocalConRetraso();
  renderizarTablero();
  actualizarTemporizadores();
  actualizarEstado();
}

function renderizarTablero() {
  contenedorTablero.innerHTML = '';
  contenedorTablero.setAttribute('role', 'grid');
  contenedorTablero.setAttribute('aria-describedby', 'tablero-instrucciones');
  contenedorTablero.setAttribute('aria-activedescendant', `square-${focusSquare}`);
  contenedorTablero.tabIndex = 0;
  const tablero = juego.board();

  for (let fila = 0; fila < 8; fila++) {
    for (let columna = 0; columna < 8; columna++) {
      const actualFila = boardFlipped ? 7 - fila : fila;
      const actualColumna = boardFlipped ? 7 - columna : columna;
      const pieza = tablero[actualFila][actualColumna];
      const casilla = nombreCasilla(actualFila, actualColumna);
      const casillaDiv = document.createElement('div');
      casillaDiv.className = `casilla ${colorCasilla(actualFila, actualColumna)}`;
      casillaDiv.dataset.casilla = casilla;
      casillaDiv.id = `square-${casilla}`;
      casillaDiv.setAttribute('role', 'gridcell');
      casillaDiv.setAttribute('aria-rowindex', String(fila + 1));
      casillaDiv.setAttribute('aria-colindex', String(columna + 1));
      let ariaLabel = `${casilla} ${pieza ? simbolosPiezas[tema][pieza.type][pieza.color] : 'vacía'}`;
      if (casillaSeleccionada === casilla) {
        ariaLabel += ', seleccionado';
      } else if (movimientosLegales.includes(casilla)) {
        ariaLabel += ', movimiento posible';
      }
      casillaDiv.setAttribute('aria-label', ariaLabel);
      casillaDiv.setAttribute('aria-selected', String(casillaSeleccionada === casilla));

      if (casilla === focusSquare) {
        casillaDiv.classList.add('foco-teclado');
      }

      if (casillaSeleccionada === casilla) {
        casillaDiv.classList.add('seleccionada');
      }
      if (movimientosLegales.includes(casilla)) {
        casillaDiv.classList.add('movimiento-posible');
      }
      if (casilla === ultimaMovidaDesde || casilla === ultimaMovidaHasta) {
        casillaDiv.classList.add('ultima-movida');
        casillaDiv.classList.add('moviendo');
      }

      if (fila === 7) {
        const etiquetaColumna = document.createElement('span');
        etiquetaColumna.className = 'etiqueta-columna';
        etiquetaColumna.textContent = boardFlipped
          ? String.fromCharCode(97 + (7 - columna))
          : String.fromCharCode(97 + columna);
        casillaDiv.appendChild(etiquetaColumna);
      }

      if (columna === 0) {
        const etiquetaFila = document.createElement('span');
        etiquetaFila.className = 'etiqueta-fila';
        etiquetaFila.textContent = boardFlipped ? String(fila + 1) : String(8 - fila);
        casillaDiv.appendChild(etiquetaFila);
      }

      if (pieza) {
        const piezaDiv = document.createElement('div');
        piezaDiv.className = `pieza ${tema === 'moderno' ? 'pieza-moderna' : ''} skin-${skinPiezas}`;
        piezaDiv.textContent = simbolosPiezas[tema][pieza.type][pieza.color];
        piezaDiv.draggable =
          pieza.color === playerColor &&
          juego.turn() === playerColor &&
          !juego.game_over() &&
          !finPorTiempo;

        piezaDiv.addEventListener('dragstart', (evento) => {
          if (
            juego.game_over() ||
            finPorTiempo ||
            pieza.color !== playerColor ||
            juego.turn() !== playerColor
          )
            return;
          casillaSeleccionada = casilla;
          movimientosLegales = juego
            .moves({ square: casilla, verbose: true })
            .map((mov: any) => mov.to);
          renderizarTablero();
          evento.dataTransfer?.setData('text/plain', casilla);
          if (evento.dataTransfer) evento.dataTransfer.effectAllowed = 'move';
        });

        piezaDiv.addEventListener('dragend', () => {
          casillaSeleccionada = null;
          movimientosLegales = [];
          renderizarTablero();
        });

        casillaDiv.appendChild(piezaDiv);
      }

      casillaDiv.addEventListener('click', () => manejarClick(casilla));
      casillaDiv.addEventListener('dragover', (evento) => evento.preventDefault());
      casillaDiv.addEventListener('drop', (evento) => {
        evento.preventDefault();
        const desde = evento.dataTransfer?.getData('text/plain') || casillaSeleccionada;
        intentarMovimiento(desde, casilla);
      });

      contenedorTablero.appendChild(casillaDiv);
    }
  }
}

function puedeMoverPieza(pieza: any) {
  if (!pieza) return false;
  if (juego.game_over() || finPorTiempo || estaPensando) return false;
  if (modoRed) {
    return conexionActiva && pieza.color === juego.turn() && pieza.color === playerColor;
  }
  if (modoDosJugadores) return pieza.color === juego.turn();
  return pieza.color === playerColor && juego.turn() === playerColor;
}

function turnoHumano() {
  if (modoRed) return conexionActiva && juego.turn() === playerColor;
  return modoDosJugadores || juego.turn() === playerColor;
}

function seleccionarPromocion(origen: string, destino: string) {
  const movimientos = juego
    .moves({ square: origen, verbose: true })
    .filter((mov: any) => mov.to === destino && mov.flags.includes('p'));
  if (movimientos.length === 0) return 'q';
  const opcion = prompt('Promoción: q = dama, r = torre, b = alfil, n = caballo', 'q');
  if (!opcion) return 'q';
  const seleccion = opcion.toLowerCase();
  return ['q', 'r', 'b', 'n'].includes(seleccion) ? seleccion : 'q';
}

function manejarClick(casilla: string) {
  if (juego.game_over() || estaPensando || finPorTiempo || (modoRed && !conexionActiva)) return;
  contenedorTablero.focus();

  const pieza = juego.get(casilla);
  const esPiezaPropia = puedeMoverPieza(pieza);

  if (casillaSeleccionada === casilla) {
    casillaSeleccionada = null;
    movimientosLegales = [];
    renderizarTablero();
    return;
  }

  if (esPiezaPropia) {
    casillaSeleccionada = casilla;
    movimientosLegales = juego.moves({ square: casilla, verbose: true }).map((mov: any) => mov.to);
    renderizarTablero();
    return;
  }

  if (casillaSeleccionada) {
    intentarMovimiento(casillaSeleccionada, casilla);
  }
}

function handleKeyboard(evento: KeyboardEvent) {
  const tecla = evento.key;
  const letras = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const file = focusSquare[0];
  const rank = Number(focusSquare[1]);
  let nuevaCasilla = focusSquare;

  if (tecla.startsWith('Arrow')) {
    evento.preventDefault();
    const columna = letras.indexOf(file);

    if (tecla === 'ArrowLeft' && columna > 0) nuevaCasilla = letras[columna - 1] + rank;
    if (tecla === 'ArrowRight' && columna < 7) nuevaCasilla = letras[columna + 1] + rank;
    if (tecla === 'ArrowUp' && rank < 8) nuevaCasilla = file + Math.min(8, rank + 1);
    if (tecla === 'ArrowDown' && rank > 1) nuevaCasilla = file + Math.max(1, rank - 1);

    focusSquare = nuevaCasilla;
    renderizarTablero();
    return;
  }

  if (tecla === 'Enter' || tecla === ' ') {
    evento.preventDefault();
    const pieza = juego.get(focusSquare);
    if (casillaSeleccionada === focusSquare) {
      casillaSeleccionada = null;
      movimientosLegales = [];
      renderizarTablero();
      return;
    }

    if (puedeMoverPieza(pieza)) {
      casillaSeleccionada = focusSquare;
      movimientosLegales = juego
        .moves({ square: focusSquare, verbose: true })
        .map((mov: any) => mov.to);
      renderizarTablero();
      return;
    }

    if (casillaSeleccionada) {
      intentarMovimiento(casillaSeleccionada, focusSquare);
    }
  }

  if (tecla === 'Escape') {
    casillaSeleccionada = null;
    movimientosLegales = [];
    renderizarTablero();
  }
}

function intentarMovimiento(origen: string | null, destino: string) {
  if (!origen || !destino || !turnoHumano() || estaPensando || finPorTiempo) return;

  const promocion = seleccionarPromocion(origen, destino);
  const movimiento = juego.move({ from: origen, to: destino, promotion: promocion });

  if (movimiento) {
    if (redoStack.length > 0) {
      redoStack = [];
    }
    ultimaMovidaDesde = origen;
    ultimaMovidaHasta = destino;
    casillaSeleccionada = null;
    movimientosLegales = [];
    const tipoSonido = movimiento.captured ? 'captura' : juego.in_check() ? 'check' : 'movimiento';
    reproducirSonido(tipoSonido);
    if (puzzleActual && `${origen}${destino}` === puzzleActual.movimientoObjetivo) {
      aciertosPuzzle += 1;
      puzzleFeedbackEl.textContent = 'Correcto. Has encontrado el mate.';
    } else if (puzzleActual) {
      erroresPuzzle += 1;
      puzzleFeedbackEl.textContent = 'Sigue intentándolo. Busca el jaque mate.';
    }
    puzzleAciertosEl.textContent = `${aciertosPuzzle} aciertos`;
    puzzleErroresEl.textContent = `${erroresPuzzle} errores`;
    if (juego.in_checkmate()) {
      reproducirSonido('checkmate');
    }
    renderizarTablero();
    guardarEstadoLocalConRetraso();
    actualizarEstado();

    if (modoRed && conexionActiva && canalDatos?.readyState === 'open') {
      canalDatos.send(
        JSON.stringify({
          type: 'move',
          from: origen,
          to: destino,
          promotion: movimiento.promotion || promocion,
        })
      );
    }

    if (!juego.game_over() && !finPorTiempo && !modoDosJugadores && !modoRed) {
      jugarIA();
    }
  } else {
    casillaSeleccionada = null;
    movimientosLegales = [];
    renderizarTablero();
  }
}

function evaluarTablero(tablero: any, jugadorActual: string) {
  const valores: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  const tablasPosicion: Record<string, number[][]> = {
    p: [
      [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      [0.1, 0.1, 0.2, 0.3, 0.3, 0.2, 0.1, 0.1],
      [0.05, 0.05, 0.1, 0.25, 0.25, 0.1, 0.05, 0.05],
      [0.0, 0.0, 0.0, 0.2, 0.2, 0.0, 0.0, 0.0],
      [0.05, -0.05, -0.1, 0.0, 0.0, -0.1, -0.05, 0.05],
      [0.05, 0.1, 0.1, -0.2, -0.2, 0.1, 0.1, 0.05],
      [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    ],
    n: [
      [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5],
      [-0.4, -0.2, 0.0, 0.0, 0.0, 0.0, -0.2, -0.4],
      [-0.3, 0.0, 0.1, 0.15, 0.15, 0.1, 0.0, -0.3],
      [-0.3, 0.05, 0.15, 0.2, 0.2, 0.15, 0.05, -0.3],
      [-0.3, 0.0, 0.15, 0.2, 0.2, 0.15, 0.0, -0.3],
      [-0.3, 0.05, 0.1, 0.15, 0.15, 0.1, 0.05, -0.3],
      [-0.4, -0.2, 0.0, 0.05, 0.05, 0.0, -0.2, -0.4],
      [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5],
    ],
    b: [
      [-0.2, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.2],
      [-0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1],
      [-0.1, 0.0, 0.1, 0.1, 0.1, 0.1, 0.0, -0.1],
      [-0.1, 0.0, 0.1, 0.2, 0.2, 0.1, 0.0, -0.1],
      [-0.1, 0.0, 0.1, 0.2, 0.2, 0.1, 0.0, -0.1],
      [-0.1, 0.0, 0.1, 0.1, 0.1, 0.1, 0.0, -0.1],
      [-0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1],
      [-0.2, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.2],
    ],
    r: [
      [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      [0.05, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [0.0, 0.0, 0.0, 0.05, 0.05, 0.0, 0.0, 0.0],
    ],
    q: [
      [-0.2, -0.1, -0.1, -0.05, -0.05, -0.1, -0.1, -0.2],
      [-0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1],
      [-0.1, 0.0, 0.05, 0.05, 0.05, 0.05, 0.0, -0.1],
      [-0.05, 0.0, 0.05, 0.05, 0.05, 0.05, 0.0, -0.05],
      [0.0, 0.0, 0.05, 0.05, 0.05, 0.05, 0.0, -0.05],
      [-0.1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.0, -0.1],
      [-0.1, 0.0, 0.05, 0.0, 0.0, 0.0, 0.0, -0.1],
      [-0.2, -0.1, -0.1, -0.05, -0.05, -0.1, -0.1, -0.2],
    ],
    k: [
      [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
      [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
      [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
      [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
      [-0.2, -0.3, -0.3, -0.4, -0.4, -0.3, -0.3, -0.2],
      [-0.1, -0.2, -0.2, -0.2, -0.2, -0.2, -0.2, -0.1],
      [0.2, 0.2, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2],
      [0.2, 0.3, 0.1, 0.0, 0.0, 0.1, 0.3, 0.2],
    ],
  };

  let puntuacion = 0;

  for (let fila = 0; fila < 8; fila++) {
    for (let columna = 0; columna < 8; columna++) {
      const pieza = tablero[fila][columna];
      if (!pieza) continue;

      const valor = valores[pieza.type] || 0;
      const filaEval = pieza.color === 'w' ? fila : 7 - fila;
      const columnaEval = pieza.color === 'w' ? columna : 7 - columna;
      const bonusPosicion = tablasPosicion[pieza.type]?.[filaEval]?.[columnaEval] || 0;
      const factor = pieza.color === jugadorActual ? 1 : -1;
      puntuacion += factor * (valor + bonusPosicion * 20);
    }
  }

  const movilidad = juego.moves({ verbose: true }).length;
  puntuacion += jugadorActual === 'w' ? movilidad * 0.35 : -movilidad * 0.35;

  if (juego.in_check()) {
    puntuacion += jugadorActual === 'w' ? -35 : 35;
  }

  if (juego.game_over()) {
    if (juego.in_checkmate()) {
      return juego.turn() === jugadorActual ? -20000 : 20000;
    }
    return 0;
  }

  return puntuacion;
}

function ordenarMovimientos(movimientos: any[]) {
  const valores: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  return movimientos.sort((a, b) => {
    const capturaA = a.flags.includes('c') || a.flags.includes('e');
    const capturaB = b.flags.includes('c') || b.flags.includes('e');
    if (capturaA !== capturaB) return capturaA ? -1 : 1;

    if (a.promotion && !b.promotion) return -1;
    if (!a.promotion && b.promotion) return 1;

    return (valores[b.piece] || 0) - (valores[a.piece] || 0);
  });
}

function minimax(profundidad: number, alpha: number, beta: number): number {
  if (profundidad === 0 || juego.game_over()) {
    return evaluarTablero(juego.board(), juego.turn());
  }

  const moves = ordenarMovimientos(juego.moves({ verbose: true }));
  if (juego.turn() === 'w') {
    let mejor = -Infinity;
    for (const mov of moves) {
      juego.move(mov);
      const puntuacion = minimax(profundidad - 1, alpha, beta);
      juego.undo();
      mejor = Math.max(mejor, puntuacion);
      alpha = Math.max(alpha, puntuacion);
      if (beta <= alpha) break;
    }
    return mejor;
  }

  let mejor = Infinity;
  for (const mov of moves) {
    juego.move(mov);
    const puntuacion = minimax(profundidad - 1, alpha, beta);
    juego.undo();
    mejor = Math.min(mejor, puntuacion);
    beta = Math.min(beta, puntuacion);
    if (beta <= alpha) break;
  }
  return mejor;
}

function elegirMejorMovimiento() {
  const movimientos = ordenarMovimientos(juego.moves({ verbose: true }));
  let mejorMovimiento: any = null;
  let mejorPuntuacion = aiColor === 'w' ? -Infinity : Infinity;

  for (const mov of movimientos) {
    juego.move(mov);
    const puntuacion = minimax(profundidadIA - 1, -Infinity, Infinity);
    juego.undo();

    if (
      (aiColor === 'w' && puntuacion > mejorPuntuacion) ||
      (aiColor === 'b' && puntuacion < mejorPuntuacion)
    ) {
      mejorPuntuacion = puntuacion;
      mejorMovimiento = mov;
    }
  }

  return mejorMovimiento;
}

async function jugarIA() {
  if (modoDosJugadores || juego.game_over() || finPorTiempo) return;

  estaPensando = true;
  actualizarEstado();

  await new Promise((resolve) => setTimeout(resolve, 180));

  const movimiento = elegirMejorMovimiento();
  if (movimiento) {
    juego.move(movimiento);
    ultimaMovidaDesde = movimiento.from;
    ultimaMovidaHasta = movimiento.to;
    reproducirSonido(movimiento.captured ? 'captura' : 'movimiento');
  }

  estaPensando = false;
  casillaSeleccionada = null;
  movimientosLegales = [];
  guardarEstadoLocalConRetraso();
  renderizarTablero();
  actualizarEstado();
}

function deshacerMovimiento() {
  if (estaPensando || finPorTiempo) return;

  const historial = juego.history();
  if (historial.length === 0) return;

  let movimientoUndo = juego.undo();
  if (movimientoUndo) {
    redoStack.push(movimientoUndo);
  }

  if (juego.turn() === playerColor && historial.length >= 2 && !modoDosJugadores && !modoRed) {
    movimientoUndo = juego.undo();
    if (movimientoUndo) {
      redoStack.push(movimientoUndo);
    }
  }

  ultimaMovidaDesde = null;
  ultimaMovidaHasta = null;
  casillaSeleccionada = null;
  movimientosLegales = [];
  guardarEstadoLocalConRetraso();
  renderizarTablero();
  actualizarEstado();
}

function rehacerMovimiento() {
  if (estaPensando || finPorTiempo || redoStack.length === 0) return;

  const movimiento = redoStack.pop();
  if (!movimiento) return;

  const movimientoRehecho = juego.move({
    from: movimiento.from,
    to: movimiento.to,
    promotion: movimiento.promotion || 'q',
  });
  if (movimientoRehecho) {
    ultimaMovidaDesde = movimiento.from;
    ultimaMovidaHasta = movimiento.to;
    casillaSeleccionada = null;
    movimientosLegales = [];
    renderizarTablero();
    guardarEstadoLocalConRetraso();
    actualizarEstado();
  }
}

function iniciarPartidaRapida() {
  const preset = modoRapidoInfo(selectModoRapido.value);
  selectTiempo.value = String(preset.tiempo);
  selectDificultad.value = String(preset.dificultad);
  setTiempoControl(String(preset.tiempo));
  setDificultad(String(preset.dificultad));
  reiniciarJuego();
}

function reiniciarJuego() {
  playerColor = selectColor.value;
  aiColor = playerColor === 'w' ? 'b' : 'w';
  boardFlipped = playerColor === 'b';
  setTema(selectTema.value);
  setDificultad(selectDificultad.value);
  setTiempoControl(selectTiempo.value);
  finPorTiempo = null;
  estaPensando = false;
  resultadoRegistrado = false;
  juego.reset();
  casillaSeleccionada = null;
  movimientosLegales = [];
  ultimaMovidaDesde = null;
  ultimaMovidaHasta = null;
  detenerTemporizador();
  guardarEstadoLocalConRetraso();
  renderizarTablero();
  actualizarTemporizadores();
  actualizarEstado();

  if (tiempoControl > 0) {
    iniciarTemporizador();
  }

  if (!modoDosJugadores && juego.turn() === aiColor && !juego.game_over()) {
    jugarIA();
  }
}

botonNuevo.addEventListener('click', reiniciarJuego);
botonPartidaRapida.addEventListener('click', iniciarPartidaRapida);
botonDeshacer.addEventListener('click', deshacerMovimiento);
botonRehacer.addEventListener('click', rehacerMovimiento);
botonGirar.addEventListener('click', () => {
  boardFlipped = !boardFlipped;
  renderizarTablero();
});
botonTema.addEventListener('click', () => {
  aplicarTemaOscuro(!document.body.classList.contains('dark-theme'));
});
selectColor.addEventListener('change', () => {
  playerColor = selectColor.value;
  aiColor = playerColor === 'w' ? 'b' : 'w';
  boardFlipped = playerColor === 'b';
  guardarEstadoLocalConRetraso();
  renderizarTablero();
});
selectTema.addEventListener('change', (evento) => {
  setTema((evento.target as HTMLSelectElement).value);
  renderizarTablero();
});
selectSkin.addEventListener('change', (evento) => {
  setSkin((evento.target as HTMLSelectElement).value);
  renderizarTablero();
});
selectDificultad.addEventListener('change', (evento) => {
  setDificultad((evento.target as HTMLSelectElement).value);
});
selectModoRapido.addEventListener('change', () => {
  const preset = modoRapidoInfo(selectModoRapido.value);
  selectTiempo.value = String(preset.tiempo);
  selectDificultad.value = String(preset.dificultad);
  setTiempoControl(String(preset.tiempo));
  setDificultad(String(preset.dificultad));
});
selectTiempo.addEventListener('change', (evento) => {
  setTiempoControl((evento.target as HTMLSelectElement).value);
  detenerTemporizador();
  guardarEstadoLocalConRetraso();
  if (tiempoControl > 0) {
    iniciarTemporizador();
  }
});
checkModoDosJugadores.addEventListener('change', (evento) => {
  modoDosJugadores = (evento.target as HTMLInputElement).checked;
  if (modoDosJugadores) {
    modoRed = false;
    checkModoRed.checked = false;
  }
  guardarEstadoLocalConRetraso();
  renderizarTablero();
  actualizarEstado();
  if (!modoDosJugadores && juego.turn() === aiColor && !juego.game_over()) {
    jugarIA();
  }
});
checkModoRed.addEventListener('change', (evento) => {
  modoRed = (evento.target as HTMLInputElement).checked;
  if (modoRed) {
    modoDosJugadores = false;
    checkModoDosJugadores.checked = false;
  }
  guardarEstadoLocalConRetraso();
  renderizarTablero();
  actualizarEstado();
  actualizarEstadoRed();
});
checkSonido.addEventListener('change', (evento) => {
  sonidoActivado = (evento.target as HTMLInputElement).checked;
});
botonGuardar.addEventListener('click', guardarPartidaHistorial);
botonCargar.addEventListener('click', cargarPartidaHistorial);
botonBorrar.addEventListener('click', borrarPartidaHistorial);
botonReiniciarPuzzle.addEventListener('click', cargarPuzzleEntrenamiento);
botonGuardarServidor.addEventListener('click', guardarPartidaServidor);
botonCargarServidor.addEventListener('click', cargarPartidaServidor);
botonBorrarServidor.addEventListener('click', borrarPartidaServidor);
botonExportar.addEventListener('click', exportarHistorial);
botonExportarPGN.addEventListener('click', exportarPGN);
botonImportarPGN.addEventListener('click', importarPGN);
botonCrearOferta.addEventListener('click', crearOferta);
botonProcesarOferta.addEventListener('click', procesarOferta);
botonProcesarRespuesta.addEventListener('click', procesarRespuesta);
contenedorTablero.addEventListener('keydown', handleKeyboard);

async function inicializar() {
  cargarEstadisticas();
  cargarPartidasGuardadas();
  const temaOscuroGuardado = localStorage.getItem('ajedrez-tema-oscuro') === 'true';
  aplicarTemaOscuro(temaOscuroGuardado);
  cargarPuzzleEntrenamiento();
  setTema(selectTema.value);
  setSkin(selectSkin.value);
  setDificultad(selectDificultad.value);
  setTiempoControl(selectTiempo.value);
  const partidaCargada = cargarEstadoLocal();
  if (!partidaCargada) {
    guardarEstadoLocalConRetraso();
  }
  renderizarTablero();
  actualizarTemporizadores();
  actualizarEstado();
  actualizarEstadoRed();
  await actualizarEstadoBackend();
  if (!modoDosJugadores && !modoRed && juego.turn() === aiColor && !juego.game_over()) {
    jugarIA();
  }
}

inicializar();
