const STORAGE_KEY = 'bache_reports';
const ESTADOS = ['reportado', 'en-revision', 'programado', 'reparado'];
const ESTADO_LABEL = {
  'reportado': 'Reportado',
  'en-revision': 'En Revisión',
  'programado': 'Programado',
  'reparado': 'Reparado',
};

// --- Elementos generales ---
const toastContainer = document.getElementById('toast-container');
const modalOverlay = document.getElementById('modal-confirmar');
const modalMensaje = document.getElementById('modal-mensaje');
const modalCancelar = document.getElementById('modal-cancelar');
const modalConfirmarBtn = document.getElementById('modal-confirmar-btn');

function cargarReportes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function guardarReportes(reportes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reportes));
}

function mostrarToast(mensaje, tipo = 'ok') {
  const toast = document.createElement('div');
  toast.className = 'toast' + (tipo === 'error' ? ' toast-error' : '');
  toast.textContent = mensaje;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function pedirConfirmacion(mensaje) {
  modalMensaje.textContent = mensaje;
  modalOverlay.classList.remove('hidden');
  return new Promise((resolve) => {
    const limpiar = () => {
      modalOverlay.classList.add('hidden');
      modalCancelar.removeEventListener('click', onCancelar);
      modalConfirmarBtn.removeEventListener('click', onConfirmar);
    };
    const onCancelar = () => { limpiar(); resolve(false); };
    const onConfirmar = () => { limpiar(); resolve(true); };
    modalCancelar.addEventListener('click', onCancelar);
    modalConfirmarBtn.addEventListener('click', onConfirmar);
  });
}

// --- Navegación entre pestañas ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    const viewId = btn.dataset.view;
    document.getElementById(viewId).classList.add('active');

    if (viewId === 'view-inicio') renderInicio();
    if (viewId === 'view-lista') renderLista();
    if (viewId === 'view-mapa') renderMapa();
    if (viewId === 'view-perfil') renderPerfil();
  });
});

function irAPestana(viewId) {
  document.querySelector(`.nav-btn[data-view="${viewId}"]`).click();
}

document.getElementById('btn-ver-todos').addEventListener('click', () => irAPestana('view-lista'));

// Icono de configuracion -> Perfil; icono de notificaciones -> resumen rapido
document.getElementById('btn-config').addEventListener('click', () => irAPestana('view-perfil'));
document.getElementById('btn-notif').addEventListener('click', () => {
  const pendientes = cargarReportes().filter(r => r.estado !== 'reparado').length;
  mostrarToast(pendientes > 0
    ? `Tienes ${pendientes} reporte(s) en seguimiento`
    : 'No tienes reportes pendientes de seguimiento');
});

function actualizarNotifDot() {
  const pendientes = cargarReportes().filter(r => r.estado !== 'reparado').length;
  document.getElementById('notif-dot').classList.toggle('hidden', pendientes === 0);
}

// ================== ASISTENTE: NUEVO REPORTE ==================
const wizardOverlay = document.getElementById('wizard-overlay');
const wizardStepNum = document.getElementById('wizard-step-num');
const wizardStepTitle = document.getElementById('wizard-step-title');
const wizardBack = document.getElementById('wizard-back');
const wizardClose = document.getElementById('wizard-close');

const TITULOS_PASO = ['Evidencia Visual', 'Ubicación del Bache', 'Detalles del Reporte', 'Estado y Seguimiento'];

let pasoActual = 1;
let nuevoReporte = null;
let mapPicker = null;
let markerPicker = null;

function estadoInicialReporte() {
  return {
    fotos: [],
    lat: null, lng: null, direccion: null,
    severidad: 'moderado',
    tipo: 'Agujero pequeño',
    descripcion: '',
    urgente: false,
    referencia: '',
    anonimo: false,
  };
}

function abrirWizard() {
  nuevoReporte = estadoInicialReporte();
  pasoActual = 1;
  renderFotos();
  document.getElementById('input-descripcion').value = '';
  document.getElementById('input-tipo').selectedIndex = 0;
  document.getElementById('input-referencia').value = '';
  document.getElementById('input-urgencia').checked = false;
  document.getElementById('input-anonimo').checked = false;
  document.querySelectorAll('#gravedad-selector .star-card').forEach(c => c.classList.remove('active'));
  document.querySelector('#gravedad-selector [data-valor="moderado"]').classList.add('active');
  document.getElementById('msg-error').classList.add('hidden');
  irAPaso(1);
  wizardOverlay.classList.remove('hidden');
}

function cerrarWizard() {
  wizardOverlay.classList.add('hidden');
  nuevoReporte = null;
}

document.getElementById('btn-nuevo-reporte').addEventListener('click', abrirWizard);
document.getElementById('fab-nuevo').addEventListener('click', abrirWizard);
wizardClose.addEventListener('click', async () => {
  const hayDatos = nuevoReporte && (nuevoReporte.fotos.length > 0 || nuevoReporte.lat);
  if (hayDatos) {
    const ok = await pedirConfirmacion('¿Cancelar este reporte? Se perderá lo que llevas capturado.');
    if (!ok) return;
  }
  cerrarWizard();
});
wizardBack.addEventListener('click', () => {
  if (pasoActual === 1) { wizardClose.click(); return; }
  irAPaso(pasoActual - 1);
});

function irAPaso(n) {
  pasoActual = n;
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`step-${n}`).classList.add('active');

  wizardStepNum.textContent = n;
  wizardStepTitle.textContent = TITULOS_PASO[n - 1];

  document.querySelectorAll('.step-dot').forEach(dot => {
    const num = Number(dot.dataset.step);
    dot.classList.toggle('active', num === n);
    dot.classList.toggle('done', num < n);
    dot.textContent = num < n ? '✓' : num;
  });

  if (n === 2) initMapPicker();
}

// --- Paso 1: Fotos ---
const gridFotos = document.getElementById('grid-fotos');
const contadorFotos = document.getElementById('contador-fotos');
const tileAgregar = document.getElementById('tile-agregar-foto');
const inputFotoCamara = document.getElementById('input-foto-camara');
const inputFotoGaleria = document.getElementById('input-foto-galeria');
const btnElegirGaleria = document.getElementById('btn-elegir-galeria');
const btnPaso1Siguiente = document.getElementById('btn-paso1-siguiente');

function renderFotos() {
  gridFotos.innerHTML = '';
  nuevoReporte.fotos.forEach((foto, idx) => {
    const slot = document.createElement('div');
    slot.className = 'foto-slot';
    slot.innerHTML = `<img src="${foto}" alt="Foto ${idx + 1}"><button class="foto-borrar" data-idx="${idx}">✕</button>`;
    gridFotos.appendChild(slot);
  });
  gridFotos.querySelectorAll('.foto-borrar').forEach(btn => {
    btn.addEventListener('click', () => {
      nuevoReporte.fotos.splice(Number(btn.dataset.idx), 1);
      renderFotos();
    });
  });

  const total = nuevoReporte.fotos.length;
  contadorFotos.textContent = `Toque para agregar fotos (${total}/3)`;
  tileAgregar.classList.toggle('hidden', total >= 3);
  btnElegirGaleria.classList.toggle('hidden', total >= 3);
  btnPaso1Siguiente.disabled = total === 0;
}

function leerFoto(file) {
  if (!file || nuevoReporte.fotos.length >= 3) return;
  const reader = new FileReader();
  reader.onload = () => {
    nuevoReporte.fotos.push(reader.result);
    renderFotos();
  };
  reader.readAsDataURL(file);
}
inputFotoCamara.addEventListener('change', () => { leerFoto(inputFotoCamara.files[0]); inputFotoCamara.value = ''; });
inputFotoGaleria.addEventListener('change', () => { leerFoto(inputFotoGaleria.files[0]); inputFotoGaleria.value = ''; });
btnElegirGaleria.addEventListener('click', () => inputFotoGaleria.click());
btnPaso1Siguiente.addEventListener('click', () => irAPaso(2));

// --- Paso 2: Ubicación ---
const spinnerUbicacion = document.getElementById('spinner-ubicacion');
const textoUbicacion = document.getElementById('texto-ubicacion');
const btnConfirmarUbicacion = document.getElementById('btn-confirmar-ubicacion');
const btnRecentrar = document.getElementById('btn-recentrar');
const btnMapaCompleto = document.getElementById('btn-mapa-completo');

function initMapPicker() {
  // Si el mapa (Leaflet, cargado desde un CDN) no pudo cargar por falta de
  // internet o por un filtro de red, seguimos funcionando solo con GPS.
  if (typeof L === 'undefined') {
    document.querySelector('.map-picker-wrap').classList.add('hidden');
    if (!nuevoReporte.lat) localizarAutomaticamente();
    return;
  }

  if (!mapPicker) {
    mapPicker = L.map('map-picker', { attributionControl: false }).setView([19.4326, -99.1332], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapPicker);
    markerPicker = L.marker([19.4326, -99.1332], { draggable: true }).addTo(mapPicker);
    markerPicker.on('dragend', () => {
      const pos = markerPicker.getLatLng();
      fijarUbicacion(pos.lat, pos.lng);
    });
    mapPicker.on('click', (e) => {
      markerPicker.setLatLng(e.latlng);
      fijarUbicacion(e.latlng.lat, e.latlng.lng);
    });
  }
  setTimeout(() => mapPicker.invalidateSize(), 100);

  if (nuevoReporte.lat) {
    mapPicker.setView([nuevoReporte.lat, nuevoReporte.lng], 16);
    markerPicker.setLatLng([nuevoReporte.lat, nuevoReporte.lng]);
  } else {
    localizarAutomaticamente();
  }
}

function localizarAutomaticamente() {
  if (!navigator.geolocation) {
    textoUbicacion.textContent = 'Tu navegador no soporta geolocalización. Toca el mapa para marcar el punto.';
    return;
  }
  spinnerUbicacion.classList.remove('hidden');
  textoUbicacion.textContent = 'Obteniendo tu ubicación...';
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    if (mapPicker) {
      mapPicker.setView([latitude, longitude], 16);
      markerPicker.setLatLng([latitude, longitude]);
    }
    fijarUbicacion(latitude, longitude);
  }, () => {
    spinnerUbicacion.classList.add('hidden');
    textoUbicacion.textContent = mapPicker
      ? 'No se pudo obtener el GPS. Arrastra el pin o toca el mapa para marcar el bache.'
      : 'No se pudo obtener el GPS. Revisa los permisos de ubicación e inténtalo de nuevo.';
  }, { enableHighAccuracy: true, timeout: 10000 });
}

async function fijarUbicacion(lat, lng) {
  nuevoReporte.lat = lat;
  nuevoReporte.lng = lng;
  nuevoReporte.direccion = null;
  spinnerUbicacion.classList.remove('hidden');
  textoUbicacion.textContent = `Ubicación: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  btnConfirmarUbicacion.disabled = false;

  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await resp.json();
    if (data && data.display_name) {
      nuevoReporte.direccion = data.display_name;
      textoUbicacion.textContent = data.display_name;
    }
  } catch (e) {
    // sin internet: nos quedamos con las coordenadas
  } finally {
    spinnerUbicacion.classList.add('hidden');
  }
}

btnRecentrar.addEventListener('click', localizarAutomaticamente);
btnConfirmarUbicacion.addEventListener('click', () => irAPaso(3));
btnMapaCompleto.addEventListener('click', () => {
  wizardOverlay.classList.add('hidden');
  irAPestana('view-mapa');
  wizardOverlay.classList.remove('hidden');
});

// --- Paso 3: Detalles ---
const gravedadSelector = document.getElementById('gravedad-selector');
gravedadSelector.querySelectorAll('.star-card').forEach(chip => {
  chip.addEventListener('click', () => {
    gravedadSelector.querySelectorAll('.star-card').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    nuevoReporte.severidad = chip.dataset.valor;
  });
});
document.getElementById('btn-paso3-siguiente').addEventListener('click', () => {
  nuevoReporte.tipo = document.getElementById('input-tipo').value;
  nuevoReporte.descripcion = document.getElementById('input-descripcion').value.trim();
  irAPaso(4);
});

// --- Paso 4: Estado y envío ---
document.getElementById('btn-enviar-reporte').addEventListener('click', () => {
  const msgError = document.getElementById('msg-error');
  msgError.classList.add('hidden');

  if (!nuevoReporte.fotos.length) {
    msgError.textContent = 'Falta al menos una foto del bache.';
    msgError.classList.remove('hidden');
    irAPaso(1);
    return;
  }
  if (!nuevoReporte.lat) {
    msgError.textContent = 'Falta confirmar la ubicación del bache.';
    msgError.classList.remove('hidden');
    irAPaso(2);
    return;
  }

  nuevoReporte.urgente = document.getElementById('input-urgencia').checked;
  nuevoReporte.referencia = document.getElementById('input-referencia').value.trim();
  nuevoReporte.anonimo = document.getElementById('input-anonimo').checked;

  const reportes = cargarReportes();
  reportes.unshift({
    id: Date.now(),
    foto: nuevoReporte.fotos[0],
    fotos: nuevoReporte.fotos,
    lat: nuevoReporte.lat,
    lng: nuevoReporte.lng,
    direccion: nuevoReporte.direccion,
    severidad: nuevoReporte.severidad,
    tipo: nuevoReporte.tipo,
    descripcion: nuevoReporte.descripcion,
    urgente: nuevoReporte.urgente,
    referencia: nuevoReporte.referencia,
    anonimo: nuevoReporte.anonimo,
    estado: 'reportado',
    fecha: new Date().toISOString(),
  });
  guardarReportes(reportes);

  mostrarToast('✅ Reporte enviado con éxito');
  cerrarWizard();
  irAPestana('view-lista');
});

// ================== INICIO ==================
function renderInicio() {
  const reportes = cargarReportes();
  renderStatsEn('stats-row-inicio', reportes);

  const lista = document.getElementById('lista-recientes');
  const vacio = document.getElementById('inicio-vacio');
  lista.innerHTML = '';

  if (reportes.length === 0) {
    vacio.classList.remove('hidden');
    return;
  }
  vacio.classList.add('hidden');
  reportes.slice(0, 3).forEach(r => lista.appendChild(crearTarjetaReporte(r, { compacta: true })));
}

// ================== MIS REPORTES ==================
const filtroSeveridad = document.getElementById('filtro-severidad');
const ordenReportes = document.getElementById('orden-reportes');
const btnExportar = document.getElementById('btn-exportar');
const listaReportes = document.getElementById('lista-reportes');
const listaVacia = document.getElementById('lista-vacia');

function renderStatsEn(contenedorId, reportes) {
  const total = reportes.length;
  const graves = reportes.filter(r => r.severidad === 'grave').length;
  const reparados = reportes.filter(r => r.estado === 'reparado').length;
  document.getElementById(contenedorId).innerHTML = `
    <div class="stat-card stat-total"><span class="num">${total}</span><span class="lbl">Total</span></div>
    <div class="stat-card stat-graves"><span class="num">${graves}</span><span class="lbl">Graves</span></div>
    <div class="stat-card stat-resueltos"><span class="num">${reparados}</span><span class="lbl">Reparados</span></div>
  `;
}

function obtenerReportesFiltrados() {
  let reportes = cargarReportes();
  if (filtroSeveridad.value !== 'todos') {
    reportes = reportes.filter(r => r.severidad === filtroSeveridad.value);
  }
  const pesoSeveridad = { grave: 3, moderado: 2, leve: 1 };
  if (ordenReportes.value === 'recientes') {
    reportes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  } else if (ordenReportes.value === 'antiguos') {
    reportes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  } else if (ordenReportes.value === 'graves') {
    reportes.sort((a, b) => pesoSeveridad[b.severidad] - pesoSeveridad[a.severidad]);
  }
  return reportes;
}

function crearTarjetaReporte(r, opciones = {}) {
  const card = document.createElement('div');
  card.className = 'reporte-card';
  const fecha = new Date(r.fecha).toLocaleString();
  const estado = r.estado || 'reportado';
  card.innerHTML = `
    <img src="${r.foto}" alt="Foto del bache">
    <div class="reporte-info">
      <div class="reporte-top">
        <span class="badge badge-${r.severidad}">${r.severidad}${r.urgente ? ' 🔥' : ''}</span>
        <button class="status-badge status-${estado}" data-id="${r.id}" title="Toca para cambiar el estado">${ESTADO_LABEL[estado]}</button>
      </div>
      <p>${r.tipo ? `<strong>${r.tipo}.</strong> ` : ''}${r.descripcion || 'Sin descripción'}</p>
      <p class="hint">${r.direccion || `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`}</p>
      <p class="fecha">${fecha}</p>
      ${opciones.compacta ? '' : `
      <div class="reporte-acciones">
        <button class="btn-compartir" data-id="${r.id}">🔗 Compartir</button>
        <button class="btn-borrar" data-id="${r.id}">🗑️ Eliminar</button>
      </div>`}
    </div>
  `;

  card.querySelector('.status-badge').addEventListener('click', () => {
    const reportes = cargarReportes();
    const reporte = reportes.find(x => x.id === r.id);
    if (!reporte) return;
    const idxActual = ESTADOS.indexOf(reporte.estado || 'reportado');
    reporte.estado = ESTADOS[(idxActual + 1) % ESTADOS.length];
    guardarReportes(reportes);
    renderLista();
    renderInicio();
    actualizarNotifDot();
  });

  const btnCompartir = card.querySelector('.btn-compartir');
  if (btnCompartir) btnCompartir.addEventListener('click', () => compartirReporte(r.id));

  const btnBorrar = card.querySelector('.btn-borrar');
  if (btnBorrar) btnBorrar.addEventListener('click', () => borrarReporte(r.id));

  return card;
}

async function compartirReporte(id) {
  const r = cargarReportes().find(x => x.id === id);
  if (!r) return;
  const enlaceMapa = `https://www.google.com/maps?q=${r.lat},${r.lng}`;
  const texto = `Bache reportado (${r.severidad}): ${r.descripcion || 'sin descripción'}\nUbicación: ${r.direccion || enlaceMapa}\n${enlaceMapa}`;

  if (navigator.share) {
    try { await navigator.share({ title: 'Reporte de bache', text: texto }); } catch (e) { /* cancelado */ }
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(texto);
    mostrarToast('Copiado al portapapeles');
  } else {
    mostrarToast('No se pudo compartir en este navegador', 'error');
  }
}

async function borrarReporte(id) {
  const confirmado = await pedirConfirmacion('¿Eliminar este reporte? Esta acción no se puede deshacer.');
  if (!confirmado) return;
  const restantes = cargarReportes().filter(r => r.id !== id);
  guardarReportes(restantes);
  mostrarToast('Reporte eliminado');
  renderLista();
  renderInicio();
  actualizarNotifDot();
}

function renderLista() {
  renderStatsEn('stats-row', cargarReportes());
  const reportes = obtenerReportesFiltrados();
  listaReportes.innerHTML = '';

  if (reportes.length === 0) {
    listaVacia.classList.remove('hidden');
    return;
  }
  listaVacia.classList.add('hidden');
  reportes.forEach(r => listaReportes.appendChild(crearTarjetaReporte(r)));
}
filtroSeveridad.addEventListener('change', renderLista);
ordenReportes.addEventListener('change', renderLista);

function exportarReportes() {
  const reportes = cargarReportes();
  if (reportes.length === 0) {
    mostrarToast('No hay reportes para exportar', 'error');
    return;
  }
  const blob = new Blob([JSON.stringify(reportes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reportes-baches-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  mostrarToast('Reportes exportados');
}
btnExportar.addEventListener('click', exportarReportes);

// ================== MAPA ==================
let map = null;
let markersLayer = null;

function iconoPorSeveridad(severidad) {
  return L.divIcon({
    className: '',
    html: `<div class="marker-pin marker-${severidad}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });
}

function renderMapa() {
  const reportes = cargarReportes();
  const mapEl = document.getElementById('map');

  if (typeof L === 'undefined') {
    mapEl.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🌐</div>
      <p>El mapa no pudo cargar por falta de conexión.</p>
      <p class="hint">Revisa la pestaña "Mis Reportes" para ver la ubicación de cada bache en texto.</p>
    </div>`;
    return;
  }

  if (!map) {
    map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  }
  markersLayer.clearLayers();

  if (reportes.length === 0) {
    map.setView([19.4326, -99.1332], 12);
  } else {
    const bounds = [];
    reportes.forEach(r => {
      const marker = L.marker([r.lat, r.lng], { icon: iconoPorSeveridad(r.severidad) }).addTo(markersLayer);
      marker.bindPopup(`
        <img class="popup-foto" src="${r.foto}" alt="Foto del bache">
        <strong>${r.severidad.toUpperCase()}</strong> · ${ESTADO_LABEL[r.estado || 'reportado']}<br>
        ${r.tipo ? `${r.tipo}<br>` : ''}${r.descripcion || ''}<br>
        <small>${r.direccion || `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`}</small>
      `);
      bounds.push([r.lat, r.lng]);
    });
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
  }
  setTimeout(() => map.invalidateSize(), 100);
}

// ================== PERFIL ==================
function renderPerfil() {
  renderStatsEn('stats-row-perfil', cargarReportes());
}
document.getElementById('perfil-exportar').addEventListener('click', exportarReportes);
document.getElementById('perfil-borrar-todo').addEventListener('click', async () => {
  if (cargarReportes().length === 0) {
    mostrarToast('No hay reportes que eliminar', 'error');
    return;
  }
  const ok = await pedirConfirmacion('¿Eliminar TODOS los reportes guardados en este celular? No se puede deshacer.');
  if (!ok) return;
  guardarReportes([]);
  mostrarToast('Se eliminaron todos los reportes');
  renderInicio();
  renderLista();
  actualizarNotifDot();
});

// --- Inicio ---
renderInicio();
actualizarNotifDot();

// PWA: habilita instalar la app y que funcione sin internet tras la primera carga
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // Sin soporte (p.ej. algunos navegadores en file://): la app sigue
      // funcionando normal, solo sin cache offline.
    });
  });
}

// --- Banner de instalacion automatico ---
const installBanner = document.getElementById('install-banner');
const btnInstalar = document.getElementById('btn-instalar');
const btnCerrarBanner = document.getElementById('btn-cerrar-banner');
let promptDiferido = null;

function mostrarBannerInstalacion() {
  if (localStorage.getItem('instalacion_descartada')) return;
  installBanner.classList.remove('hidden');
  document.body.classList.add('tiene-banner');
}
function ocultarBannerInstalacion() {
  installBanner.classList.add('hidden');
  document.body.classList.remove('tiene-banner');
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptDiferido = e;
  mostrarBannerInstalacion();
});

btnInstalar.addEventListener('click', async () => {
  if (!promptDiferido) return;
  ocultarBannerInstalacion();
  promptDiferido.prompt();
  const { outcome } = await promptDiferido.userChoice;
  promptDiferido = null;
  if (outcome === 'accepted') mostrarToast('✅ BacheReport instalado');
});

btnCerrarBanner.addEventListener('click', () => {
  ocultarBannerInstalacion();
  localStorage.setItem('instalacion_descartada', '1');
});

window.addEventListener('appinstalled', () => {
  ocultarBannerInstalacion();
  mostrarToast('✅ BacheReport instalado en tu celular');
});
