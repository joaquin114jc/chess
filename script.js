const contenedorTablero = document.getElementById('tablero');
const infoTurno = document.getElementById('info');
const historialEl = document.getElementById('historial');
const contadorJugadas = document.getElementById('contador-jugadas');
const botonNuevo = document.getElementById('nuevo-juego');
const botonDeshacer = document.getElementById('deshacer');
const botonGirar = document.getElementById('girar-tablero');
const selectColor = document.getElementById('color-seleccion');
const selectTiempo = document.getElementById('control-tiempo');
const selectTema = document.getElementById('tema-piezas');
const selectSkin = document.getElementById('skin-piezas');
const selectDificultad = document.getElementById('dificultad-ia');
const checkModoDosJugadores = document.getElementById('modo-dos-jugadores');
const checkModoRed = document.getElementById('modo-red');
const checkSonido = document.getElementById('sonido-activo');
const selectProfundidadIA = document.getElementById('profundidad-ia');
const botonGuardar = document.getElementById('guardar-partida');
const botonCargar = document.getElementById('cargar-partida');
const botonBorrar = document.getElementById('borrar-guardado');
const botonExportar = document.getElementById('exportar-historial');
const botonExportarPGN = document.getElementById('exportar-pgn');
const botonImportarPGN = document.getElementById('importar-pgn');
const botonRehacer = document.getElementById('rehacer');
const botonCrearOferta = document.getElementById('crear-oferta');
const botonProcesarOferta = document.getElementById('procesar-oferta');
const botonProcesarRespuesta = document.getElementById('procesar-respuesta');
const listaPartidas = document.getElementById('lista-partidas');
const senalRemota = document.getElementById('senal-remota');
const estadoRedEl = document.getElementById('estado-red');
const relojBlancas = document.getElementById('reloj-blancas');
const relojNegras = document.getElementById('reloj-negras');
const victoriasEl = document.getElementById('stats-victorias');
const derrotasEl = document.getElementById('stats-derrotas');
const tablasEl = document.getElementById('stats-tablas');
const estadoGuardadoEl = document.getElementById('estado-guardado');
const evaluacionEl = document.getElementById('evaluacion');
const materialDiferenciaEl = document.getElementById('material-diferencia');

const simbolosPiezas = {
  clasico: {
    p: { w: '♙', b: '♟' },
    r: { w: '♖', b: '♜' },
    n: { w: '♘', b: '♞' },
    b: { w: '♗', b: '♝' },
    q: { w: '♕', b: '♛' },
    k: { w: '♔', b: '♚' }
  },
  moderno: {
    p: { w: '♟', b: '♙' },
    r: { w: '♜', b: '♖' },
    n: { w: '♞', b: '♘' },
    b: { w: '♝', b: '♗' },
    q: { w: '♛', b: '♕' },
    k: { w: '♚', b: '♔' }
  }
};

const juego = new Chess();
let casillaSeleccionada = null;
let movimientosLegales = [];
let ultimaMovidaDesde = null;
let ultimaMovidaHasta = null;
let estaPensando = false;
let finPorTiempo = null;
let playerColor = 'w';
let aiColor = 'b';
let boardFlipped = false;
let tema = 'clasico';
let dificultadIA = 2;
let profundidadIA = 2; // reduced default to make AI faster and avoid UI blocking
let tiempoControl = 5;
let tiempoBlanco = 5 * 60;
let tiempoNegro = 5 * 60;
let timerId = null;
let skinPiezas = 'clasico';
let modoDosJugadores = false;
let modoRed = false;
let conexionActiva = false;
let peerConnection = null;
let canalDatos = null;
let focusSquare = 'a1';
let redoStack = [];
let savedGames = {};
let resultadoRegistrado = false;
let sonidoActivado = true;
let estadisticas = { victorias: 0, derrotas: 0, tablas: 0 };

function nombreCasilla(fila, columna) {
  return String.fromCharCode(97 + columna) + (8 - fila);
}

function colorCasilla(fila, columna) {
  return (fila + columna) % 2 === 0 ? 'clara' : 'oscura';
}

function formatoTiempo(segundos) {
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
  clearInterval(timerId);

  timerId = setInterval(() => {
    if (juego.game_over() || finPorTiempo) {
      clearInterval(timerId);
      return;
    }

    if (juego.turn() === 'w') {
      tiempoBlanco -= 1;
    } else {
      tiempoNegro -= 1;
    }

    if (tiempoBlanco <= 0 || tiempoNegro <= 0) {
      clearInterval(timerId);
      finPorTiempo = tiempoBlanco <= 0 ? 'w' : 'b';
    }

    actualizarTemporizadores();
    actualizarEstado();
  }, 1000);
}

function detenerTemporizador() {
  clearInterval(timerId);
}

function setTema(nuevoTema) {
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

function setSkin(nuevoSkin) {
  skinPiezas = nuevoSkin || 'clasico';
}

function setDificultad(valor) {
  dificultadIA = Number(valor);
  profundidadIA = Math.min(6, Math.max(2, dificultadIA + 2));
}

function setTiempoControl(valor) {
  tiempoControl = Number(valor);
  if (tiempoControl > 0) {
    tiempoBlanco = tiempoNegro = tiempoControl * 60;
  } else {
    tiempoBlanco = tiempoNegro = 0;
  }
  actualizarTemporizadores();
}

function reproducirSonido(tipo) {
  if (!sonidoActivado) return;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    const contexto = new AudioContextCtor();
    const oscilador = contexto.createOscillator();
    const oscilador2 = contexto.createOscillator();
    const ganancia = contexto.createGain();
    const config = {
      movimiento: { tipo: 'sine', frecuencia: 300, frecuencia2: 420, duracion: 0.12 },
      captura: { tipo: 'square', frecuencia: 440, frecuencia2: 560, duracion: 0.16 },
      check: { tipo: 'triangle', frecuencia: 520, frecuencia2: 640, duracion: 0.14 },
      checkmate: { tipo: 'sawtooth', frecuencia: 260, frecuencia2: 340, duracion: 0.22 }
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
  victoriasEl.textContent = estadisticas.victorias;
  derrotasEl.textContent = estadisticas.derrotas;
  tablasEl.textContent = estadisticas.tablas;
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
  const texto = historialMovidas.length > 0
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
      turn: juego.turn()
    };
    localStorage.setItem('ajedrez-local-guardado', JSON.stringify(estado));
    estadoGuardadoEl.textContent = 'Partida guardada en el navegador';
  } catch (error) {
    console.warn('No se pudo guardar la partida', error);
  }
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
  const nombreExistente = listaPartidas.value && savedGames[listaPartidas.value] ? listaPartidas.value : null;
  const nombre = prompt('Nombre para guardar esta partida:', nombreExistente || `Partida ${new Date().toLocaleString()}`);
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
    turn: juego.turn()
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
    conexionActiva = peerConnection.connectionState === 'connected';
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
    canalDatos = peerConnection.createDataChannel('ajedrez');
    configurarCanalDatos();
    const oferta = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(oferta);
    senalRemota.value = JSON.stringify(peerConnection.localDescription);
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
    await peerConnection.setRemoteDescription(oferta);
    const respuesta = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(respuesta);
    senalRemota.value = JSON.stringify(peerConnection.localDescription);
    estadoRedEl.textContent = 'Respuesta creada. Copia el texto y envíalo al otro jugador.';
  } catch (error) {
    console.warn('No se pudo procesar la oferta', error);
    estadoRedEl.textContent = 'Error al procesar la oferta.';
  }
}

async function procesarRespuesta() {
  try {
    const respuesta = JSON.parse(senalRemota.value);
    await peerConnection.setRemoteDescription(respuesta);
    estadoRedEl.textContent = 'Respuesta procesada. Conexión activada cuando el canal esté abierto.';
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
  const pares = [];

  for (let i = 0; i < historial.length; i += 2) {
    pares.push({ blanco: historial[i] || '', negro: historial[i + 1] || '' });
  }

  pares.forEach((fila, index) => {
    const item = document.createElement('li');
    item.innerHTML = `<span class="jugada-num">${index + 1}.</span> <span class="jugada-blanca">${fila.blanco}</span> <span class="jugada-negra">${fila.negra}</span>`;
    historialEl.appendChild(item);
  });

  contadorJugadas.textContent = `${juego.history().length} jugadas`;
}

function obtenerMaterialDiferencia() {
  const tablero = juego.board();
  const valores = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let blanco = 0;
  let negro = 0;

  tablero.forEach((fila) => {
    fila.forEach((pieza) => {
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
      casillaDiv.setAttribute('aria-rowindex', fila + 1);
      casillaDiv.setAttribute('aria-colindex', columna + 1);
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
        etiquetaColumna.textContent = boardFlipped ? String.fromCharCode(97 + (7 - columna)) : String.fromCharCode(97 + columna);
        casillaDiv.appendChild(etiquetaColumna);
      }

      if (columna === 0) {
        const etiquetaFila = document.createElement('span');
        etiquetaFila.className = 'etiqueta-fila';
        etiquetaFila.textContent = boardFlipped ? fila + 1 : 8 - fila;
        casillaDiv.appendChild(etiquetaFila);
      }

      if (pieza) {
        const piezaDiv = document.createElement('div');
        piezaDiv.className = `pieza ${tema === 'moderno' ? 'pieza-moderna' : ''} skin-${skinPiezas}`;
        piezaDiv.textContent = simbolosPiezas[tema][pieza.type][pieza.color];
        piezaDiv.draggable = pieza.color === playerColor && juego.turn() === playerColor && !juego.game_over() && !finPorTiempo;

        piezaDiv.addEventListener('dragstart', (evento) => {
          if (juego.game_over() || finPorTiempo || pieza.color !== playerColor || juego.turn() !== playerColor) return;
          casillaSeleccionada = casilla;
          movimientosLegales = juego.moves({ square: casilla, verbose: true }).map((mov) => mov.to);
          renderizarTablero();
          evento.dataTransfer.setData('text/plain', casilla);
          evento.dataTransfer.effectAllowed = 'move';
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
        const desde = evento.dataTransfer.getData('text/plain') || casillaSeleccionada;
        intentarMovimiento(desde, casilla);
      });

      contenedorTablero.appendChild(casillaDiv);
    }
  }
}

function puedeMoverPieza(pieza) {
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

function seleccionarPromocion(origen, destino) {
  const movimientos = juego.moves({ square: origen, verbose: true }).filter((mov) => mov.to === destino && mov.flags.includes('p'));
  if (movimientos.length === 0) return 'q';
  const opcion = prompt('Promoción: q = dama, r = torre, b = alfil, n = caballo', 'q');
  if (!opcion) return 'q';
  const seleccion = opcion.toLowerCase();
  return ['q', 'r', 'b', 'n'].includes(seleccion) ? seleccion : 'q';
}

function manejarClick(casilla) {
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
    movimientosLegales = juego.moves({ square: casilla, verbose: true }).map((mov) => mov.to);
    renderizarTablero();
    return;
  }

  if (casillaSeleccionada) {
    intentarMovimiento(casillaSeleccionada, casilla);
  }
}

function handleKeyboard(evento) {
  const tecla = evento.key;
  const letras = ['a','b','c','d','e','f','g','h'];
  const file = focusSquare[0];
  const rank = Number(focusSquare[1]);
  let nuevaCasilla = focusSquare;

  if (tecla.startsWith('Arrow')) {
    evento.preventDefault();
    const columna = letras.indexOf(file);
    const fila = rank;

    if (tecla === 'ArrowLeft' && columna > 0) nuevaCasilla = letras[columna - 1] + fila;
    if (tecla === 'ArrowRight' && columna < 7) nuevaCasilla = letras[columna + 1] + fila;
    if (tecla === 'ArrowUp' && fila < 8) nuevaCasilla = file + Math.min(8, fila + 1);
    if (tecla === 'ArrowDown' && fila > 1) nuevaCasilla = file + Math.max(1, fila - 1);

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
      movimientosLegales = juego.moves({ square: focusSquare, verbose: true }).map((mov) => mov.to);
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

function intentarMovimiento(origen, destino) {
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
    if (juego.in_checkmate()) {
      reproducirSonido('checkmate');
    }
    renderizarTablero();
    guardarEstadoLocal();
    actualizarEstado();

    if (modoRed && conexionActiva && canalDatos?.readyState === 'open') {
      canalDatos.send(JSON.stringify({ type: 'move', from: origen, to: destino, promotion: movimiento.promotion || promocion }));
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

function evaluarTablero(tablero, jugadorActual) {
  const valores = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  const tablasPosicion = {
    p: [
      [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      [0.1, 0.1, 0.2, 0.3, 0.3, 0.2, 0.1, 0.1],
      [0.05, 0.05, 0.1, 0.25, 0.25, 0.1, 0.05, 0.05],
      [0.0, 0.0, 0.0, 0.2, 0.2, 0.0, 0.0, 0.0],
      [0.05, -0.05, -0.1, 0.0, 0.0, -0.1, -0.05, 0.05],
      [0.05, 0.1, 0.1, -0.2, -0.2, 0.1, 0.1, 0.05],
      [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    ],
    n: [
      [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5],
      [-0.4, -0.2, 0.0, 0.0, 0.0, 0.0, -0.2, -0.4],
      [-0.3, 0.0, 0.1, 0.15, 0.15, 0.1, 0.0, -0.3],
      [-0.3, 0.05, 0.15, 0.2, 0.2, 0.15, 0.05, -0.3],
      [-0.3, 0.0, 0.15, 0.2, 0.2, 0.15, 0.0, -0.3],
      [-0.3, 0.05, 0.1, 0.15, 0.15, 0.1, 0.05, -0.3],
      [-0.4, -0.2, 0.0, 0.05, 0.05, 0.0, -0.2, -0.4],
      [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5]
    ],
    b: [
      [-0.2, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.2],
      [-0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1],
      [-0.1, 0.0, 0.1, 0.1, 0.1, 0.1, 0.0, -0.1],
      [-0.1, 0.0, 0.1, 0.2, 0.2, 0.1, 0.0, -0.1],
      [-0.1, 0.0, 0.1, 0.2, 0.2, 0.1, 0.0, -0.1],
      [-0.1, 0.0, 0.1, 0.1, 0.1, 0.1, 0.0, -0.1],
      [-0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1],
      [-0.2, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.2]
    ],
    r: [
      [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      [0.05, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
      [0.0, 0.0, 0.0, 0.05, 0.05, 0.0, 0.0, 0.0]
    ],
    q: [
      [-0.2, -0.1, -0.1, -0.05, -0.05, -0.1, -0.1, -0.2],
      [-0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1],
      [-0.1, 0.0, 0.05, 0.05, 0.05, 0.05, 0.0, -0.1],
      [-0.05, 0.0, 0.05, 0.05, 0.05, 0.05, 0.0, -0.05],
      [0.0, 0.0, 0.05, 0.05, 0.05, 0.05, 0.0, -0.05],
      [-0.1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.0, -0.1],
      [-0.1, 0.0, 0.05, 0.0, 0.0, 0.0, 0.0, -0.1],
      [-0.2, -0.1, -0.1, -0.05, -0.05, -0.1, -0.1, -0.2]
    ],
    k: [
      [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
      [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
      [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
      [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
      [-0.2, -0.3, -0.3, -0.4, -0.4, -0.3, -0.3, -0.2],
      [-0.1, -0.2, -0.2, -0.2, -0.2, -0.2, -0.2, -0.1],
      [0.2, 0.2, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2],
      [0.2, 0.3, 0.1, 0.0, 0.0, 0.1, 0.3, 0.2]
    ]
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

// Use a Web Worker to compute the AI move off the main thread to avoid freezing the UI
let aiWorker = null;
try {
  aiWorker = new Worker('aiWorker.js');
  console.log('AI worker creado correctamente');
} catch (err) {
  console.warn('No se pudo crear el worker de IA, se usará cálculo en hilo principal', err);
  aiWorker = null;
}

function solicitarMovimientoIA(fen, profundidad, colorIA) {
  if (!aiWorker) return Promise.reject('no-worker');
  return new Promise((resolve, reject) => {
    const handler = (e) => {
      aiWorker.removeEventListener('message', handler);
      if (e.data && e.data.error) return reject(e.data.error);
      console.log('Movimiento recibido desde worker:', e.data.move);
      resolve(e.data.move || null);
    };
    aiWorker.addEventListener('message', handler);
    console.log('Enviando petición al worker, profundidad:', profundidad);
    aiWorker.postMessage({ fen, profundidad, aiColor: colorIA });
    // safety timeout
    setTimeout(() => {
      aiWorker.removeEventListener('message', handler);
      reject('timeout');
    }, 20000);
  });
}

async function jugarIA() {
  if (modoDosJugadores || juego.game_over() || finPorTiempo) return;
  estaPensando = true;
  actualizarEstado();

  await new Promise((resolve) => setTimeout(resolve, 180));

  const fen = juego.fen();
  let movimiento = null;

  if (aiWorker) {
    try {
      movimiento = await solicitarMovimientoIA(fen, profundidadIA, aiColor);
    } catch (err) {
      console.warn('Worker IA falló, intentando en hilo principal:', err);
      movimiento = null;
    }
  }

  // Fallback synchronous simple choice if worker not available or failed
  if (!movimiento) {
    const movimientos = juego.moves({ verbose: true });
    movimiento = movimientos.length > 0 ? movimientos[0] : null;
  }

  if (movimiento) {
    juego.move(movimiento);
    ultimaMovidaDesde = movimiento.from;
    ultimaMovidaHasta = movimiento.to;
    reproducirSonido(movimiento.captured ? 'captura' : 'movimiento');
  }

  estaPensando = false;
  casillaSeleccionada = null;
  movimientosLegales = [];
  guardarEstadoLocal();
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
  guardarEstadoLocal();
  renderizarTablero();
  actualizarEstado();
}

function rehacerMovimiento() {
  if (estaPensando || finPorTiempo || redoStack.length === 0) return;

  const movimiento = redoStack.pop();
  if (!movimiento) return;

  const movimientoRehecho = juego.move({ from: movimiento.from, to: movimiento.to, promotion: movimiento.promotion || 'q' });
  if (movimientoRehecho) {
    ultimaMovidaDesde = movimiento.from;
    ultimaMovidaHasta = movimiento.to;
    casillaSeleccionada = null;
    movimientosLegales = [];
    renderizarTablero();
    guardarEstadoLocal();
    actualizarEstado();
  }
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
  guardarEstadoLocal();
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
botonDeshacer.addEventListener('click', deshacerMovimiento);
botonRehacer.addEventListener('click', rehacerMovimiento);
botonGirar.addEventListener('click', () => {
  boardFlipped = !boardFlipped;
  renderizarTablero();
});
selectColor.addEventListener('change', () => {
  playerColor = selectColor.value;
  aiColor = playerColor === 'w' ? 'b' : 'w';
  boardFlipped = playerColor === 'b';
  guardarEstadoLocal();
  renderizarTablero();
});
selectTema.addEventListener('change', (evento) => {
  setTema(evento.target.value);
  renderizarTablero();
});
selectSkin.addEventListener('change', (evento) => {
  setSkin(evento.target.value);
  renderizarTablero();
});
selectDificultad.addEventListener('change', (evento) => {
  setDificultad(evento.target.value);
});
if (selectProfundidadIA) {
  selectProfundidadIA.addEventListener('change', (e) => {
    profundidadIA = Number(e.target.value) || 2;
    console.log('Profundidad IA ajustada a', profundidadIA);
  });
}
selectTiempo.addEventListener('change', (evento) => {
  setTiempoControl(evento.target.value);
  detenerTemporizador();
  guardarEstadoLocal();
  if (tiempoControl > 0) {
    iniciarTemporizador();
  }
});
checkModoDosJugadores.addEventListener('change', (evento) => {
  modoDosJugadores = evento.target.checked;
  if (modoDosJugadores) {
    modoRed = false;
    checkModoRed.checked = false;
  }
  guardarEstadoLocal();
  renderizarTablero();
  actualizarEstado();
  if (!modoDosJugadores && juego.turn() === aiColor && !juego.game_over()) {
    jugarIA();
  }
});
checkModoRed.addEventListener('change', (evento) => {
  modoRed = evento.target.checked;
  if (modoRed) {
    modoDosJugadores = false;
    checkModoDosJugadores.checked = false;
  }
  guardarEstadoLocal();
  renderizarTablero();
  actualizarEstado();
  actualizarEstadoRed();
});
checkSonido.addEventListener('change', (evento) => {
  sonidoActivado = evento.target.checked;
});
botonGuardar.addEventListener('click', guardarPartidaHistorial);
botonCargar.addEventListener('click', cargarPartidaHistorial);
botonBorrar.addEventListener('click', borrarPartidaHistorial);
botonExportar.addEventListener('click', exportarHistorial);
botonExportarPGN.addEventListener('click', exportarPGN);
botonImportarPGN.addEventListener('click', importarPGN);
botonCrearOferta.addEventListener('click', crearOferta);
botonProcesarOferta.addEventListener('click', procesarOferta);
botonProcesarRespuesta.addEventListener('click', procesarRespuesta);
contenedorTablero.addEventListener('keydown', handleKeyboard);

cargarEstadisticas();
cargarPartidasGuardadas();
setTema(selectTema.value);
setSkin(selectSkin.value);
setDificultad(selectDificultad.value);
setTiempoControl(selectTiempo.value);
if (selectProfundidadIA) selectProfundidadIA.value = String(profundidadIA);
const partidaCargada = cargarEstadoLocal();
if (!partidaCargada) {
  guardarEstadoLocal();
}
renderizarTablero();
actualizarTemporizadores();
actualizarEstado();
actualizarEstadoRed();
if (!modoDosJugadores && !modoRed && juego.turn() === aiColor && !juego.game_over()) {
  jugarIA();
}
