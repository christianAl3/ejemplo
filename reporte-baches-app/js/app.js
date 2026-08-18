const STORAGE_KEY = 'bache_reports';
const ESTADOS = ['pendiente', 'en-revision', 'resuelto'];
const ESTADO_LABEL = { 'pendiente': 'Pendiente', 'en-revision': 'En revisión', 'resuelto': 'Resuelto' };

const form = document.getElementById('form-reporte');
const inputFotoCamara = document.getElementById('input-foto-camara');
const inputFotoGaleria = document.getElementById('input-foto-galeria');
const previewFoto = document.getElementById('preview-foto');
const btnUbicacion = document.getElementById('btn-ubicacion');
const spinnerUbicacion = document.getElementById('spinner-ubicacion');
const textoBtnUbicacion = document.getElementById('texto-btn-ubicacion');
const textoUbicacion = document.getElementById('texto-ubicacion');
const inputDescripcion = document.getElementById('input-descripcion');
const severidadSelector = document.getElementById('severidad-selector');
const msgError = document.getElementById('msg-error');
const statsRow = document.getElementById('stats-row');
const filtroSeveridad = document.getElementById('filtro-severidad');
const ordenReportes = document.getElementById('orden-reportes');
const btnExportar = document.getElementById('btn-exportar');
const listaReportes = document.getElementById('lista-reportes');
const listaVacia = document.getElementById('lista-vacia');
const toastContainer = document.getElementById('toast-container');
const modalOverlay = document.getElementById('modal-confirmar');
const modalMensaje = document.getElementById('modal-mensaje');
const modalCancelar = document.getElementById('modal-cancelar');
const modalConfirmarBtn = document.getElementById('modal-confirmar-btn');

let fotoActual = null; // dataURL
let ubicacionActual = null; // { lat, lng, direccion }
let severidadActual = 'moderado';
let map = null;
let markersLayer = null;

function cargarReportes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function guardarReportes(reportes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reportes));
}

// --- Toasts ---
function mostrarToast(mensaje, tipo = 'ok') {
  const toast = document.createElement('div');
  toast.className = 'toast' + (tipo === 'error' ? ' toast-error' : '');
  toast.textContent = mensaje;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// --- Modal de confirmacion (basado en Promise) ---
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

// --- Navegación entre vistas ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    const viewId = btn.dataset.view;
    document.getElementById(viewId).classList.add('active');

    if (viewId === 'view-lista') renderLista();
    if (viewId === 'view-mapa') renderMapa();
  });
});

// --- Selector de gravedad (chips) ---
severidadSelector.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    severidadSelector.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    severidadActual = chip.dataset.valor;
  });
});

// --- Captura de foto (camara o galeria) ---
function leerFoto(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    fotoActual = reader.result;
    previewFoto.src = fotoActual;
    previewFoto.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}
inputFotoCamara.addEventListener('change', () => leerFoto(inputFotoCamara.files[0]));
inputFotoGaleria.addEventListener('change', () => leerFoto(inputFotoGaleria.files[0]));

// --- Ubicación ---
btnUbicacion.addEventListener('click', () => {
  if (!navigator.geolocation) {
    textoUbicacion.textContent = 'Tu navegador no soporta geolocalización.';
    return;
  }
  spinnerUbicacion.classList.remove('hidden');
  textoBtnUbicacion.textContent = 'Buscando...';
  textoUbicacion.textContent = 'Obteniendo ubicación...';

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    ubicacionActual = { lat, lng, direccion: null };
    textoUbicacion.textContent = `Ubicación obtenida: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await resp.json();
      if (data && data.display_name) {
        ubicacionActual.direccion = data.display_name;
        textoUbicacion.textContent = `📍 ${data.display_name}`;
      }
    } catch (e) {
      // Sin internet: nos quedamos solo con las coordenadas
    } finally {
      spinnerUbicacion.classList.add('hidden');
      textoBtnUbicacion.textContent = '📍 Actualizar ubicación';
    }
  }, () => {
    spinnerUbicacion.classList.add('hidden');
    textoBtnUbicacion.textContent = '📍 Obtener mi ubicación';
    textoUbicacion.textContent = 'No se pudo obtener la ubicación. Revisa los permisos de GPS.';
  }, { enableHighAccuracy: true, timeout: 10000 });
});

// --- Guardar reporte ---
form.addEventListener('submit', (e) => {
  e.preventDefault();
  msgError.classList.add('hidden');

  if (!fotoActual) {
    msgError.textContent = 'Falta tomar o elegir una foto del bache.';
    msgError.classList.remove('hidden');
    return;
  }
  if (!ubicacionActual) {
    msgError.textContent = 'Falta obtener la ubicación.';
    msgError.classList.remove('hidden');
    return;
  }

  const reportes = cargarReportes();
  reportes.unshift({
    id: Date.now(),
    foto: fotoActual,
    lat: ubicacionActual.lat,
    lng: ubicacionActual.lng,
    direccion: ubicacionActual.direccion,
    descripcion: inputDescripcion.value.trim(),
    severidad: severidadActual,
    estado: 'pendiente',
    fecha: new Date().toISOString(),
  });
  guardarReportes(reportes);

  // reset del formulario
  form.reset();
  fotoActual = null;
  ubicacionActual = null;
  severidadActual = 'moderado';
  previewFoto.classList.add('hidden');
  textoUbicacion.textContent = 'Aún no se ha obtenido la ubicación';
  textoBtnUbicacion.textContent = '📍 Obtener mi ubicación';
  severidadSelector.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  severidadSelector.querySelector('[data-valor="moderado"]').classList.add('active');

  mostrarToast('✅ Reporte guardado');
  document.querySelector('.nav-btn[data-view="view-lista"]').click();
});

// --- Estadísticas ---
function renderStats(reportes) {
  const total = reportes.length;
  const graves = reportes.filter(r => r.severidad === 'grave').length;
  const resueltos = reportes.filter(r => r.estado === 'resuelto').length;

  statsRow.innerHTML = `
    <div class="stat-card stat-total"><span class="num">${total}</span><span class="lbl">Total</span></div>
    <div class="stat-card stat-graves"><span class="num">${graves}</span><span class="lbl">Graves</span></div>
    <div class="stat-card stat-resueltos"><span class="num">${resueltos}</span><span class="lbl">Resueltos</span></div>
  `;
}

// --- Lista de reportes ---
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

function renderLista() {
  renderStats(cargarReportes());
  const reportes = obtenerReportesFiltrados();
  listaReportes.innerHTML = '';

  if (reportes.length === 0) {
    listaVacia.classList.remove('hidden');
    return;
  }
  listaVacia.classList.add('hidden');

  reportes.forEach(r => {
    const card = document.createElement('div');
    card.className = 'reporte-card';
    const fecha = new Date(r.fecha).toLocaleString();
    const estado = r.estado || 'pendiente';
    card.innerHTML = `
      <img src="${r.foto}" alt="Foto del bache">
      <div class="reporte-info">
        <div class="reporte-top">
          <span class="badge badge-${r.severidad}">${r.severidad}</span>
          <button class="status-badge status-${estado}" data-id="${r.id}" title="Toca para cambiar el estado">${ESTADO_LABEL[estado]}</button>
        </div>
        <p>${r.descripcion || 'Sin descripción'}</p>
        <p class="hint">${r.direccion || `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`}</p>
        <p class="fecha">${fecha}</p>
        <div class="reporte-acciones">
          <button class="btn-compartir" data-id="${r.id}">🔗 Compartir</button>
          <button class="btn-borrar" data-id="${r.id}">🗑️ Eliminar</button>
        </div>
      </div>
    `;
    listaReportes.appendChild(card);
  });

  listaReportes.querySelectorAll('.status-badge').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const reportes = cargarReportes();
      const reporte = reportes.find(r => r.id === id);
      if (!reporte) return;
      const idxActual = ESTADOS.indexOf(reporte.estado || 'pendiente');
      reporte.estado = ESTADOS[(idxActual + 1) % ESTADOS.length];
      guardarReportes(reportes);
      renderLista();
    });
  });

  listaReportes.querySelectorAll('.btn-borrar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmado = await pedirConfirmacion('¿Eliminar este reporte? Esta acción no se puede deshacer.');
      if (!confirmado) return;
      const id = Number(btn.dataset.id);
      const restantes = cargarReportes().filter(r => r.id !== id);
      guardarReportes(restantes);
      mostrarToast('Reporte eliminado');
      renderLista();
    });
  });

  listaReportes.querySelectorAll('.btn-compartir').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const r = cargarReportes().find(x => x.id === id);
      if (!r) return;
      const enlaceMapa = `https://www.google.com/maps?q=${r.lat},${r.lng}`;
      const texto = `Bache reportado (${r.severidad}): ${r.descripcion || 'sin descripción'}\nUbicación: ${r.direccion || enlaceMapa}\n${enlaceMapa}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: 'Reporte de bache', text: texto });
        } catch (e) { /* el usuario cancelo compartir */ }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(texto);
        mostrarToast('Copiado al portapapeles');
      } else {
        mostrarToast('No se pudo compartir en este navegador', 'error');
      }
    });
  });
}

filtroSeveridad.addEventListener('change', renderLista);
ordenReportes.addEventListener('change', renderLista);

// --- Exportar reportes a JSON ---
btnExportar.addEventListener('click', () => {
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
});

// --- Mapa ---
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
    map.setView([19.4326, -99.1332], 12); // vista genérica si no hay reportes aún
  } else {
    const bounds = [];
    reportes.forEach(r => {
      const marker = L.marker([r.lat, r.lng], { icon: iconoPorSeveridad(r.severidad) }).addTo(markersLayer);
      marker.bindPopup(`
        <img class="popup-foto" src="${r.foto}" alt="Foto del bache">
        <strong>${r.severidad.toUpperCase()}</strong> · ${ESTADO_LABEL[r.estado || 'pendiente']}<br>
        ${r.descripcion || ''}<br>
        <small>${r.direccion || `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`}</small>
      `);
      bounds.push([r.lat, r.lng]);
    });
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
  }

  setTimeout(() => map.invalidateSize(), 100);
}
