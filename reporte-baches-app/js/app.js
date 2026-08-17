const STORAGE_KEY = 'bache_reports';

const form = document.getElementById('form-reporte');
const inputFoto = document.getElementById('input-foto');
const previewFoto = document.getElementById('preview-foto');
const btnUbicacion = document.getElementById('btn-ubicacion');
const textoUbicacion = document.getElementById('texto-ubicacion');
const inputDescripcion = document.getElementById('input-descripcion');
const inputSeveridad = document.getElementById('input-severidad');
const msgError = document.getElementById('msg-error');
const listaReportes = document.getElementById('lista-reportes');
const listaVacia = document.getElementById('lista-vacia');

let fotoActual = null; // dataURL
let ubicacionActual = null; // { lat, lng, direccion }
let map = null;
let markersLayer = null;

function cargarReportes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function guardarReportes(reportes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reportes));
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

// --- Captura de foto ---
inputFoto.addEventListener('change', () => {
  const file = inputFoto.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    fotoActual = reader.result;
    previewFoto.src = fotoActual;
    previewFoto.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

// --- Ubicación ---
btnUbicacion.addEventListener('click', () => {
  if (!navigator.geolocation) {
    textoUbicacion.textContent = 'Tu navegador no soporta geolocalización.';
    return;
  }
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
    }
  }, (err) => {
    textoUbicacion.textContent = 'No se pudo obtener la ubicación. Revisa los permisos de GPS.';
  }, { enableHighAccuracy: true, timeout: 10000 });
});

// --- Guardar reporte ---
form.addEventListener('submit', (e) => {
  e.preventDefault();
  msgError.classList.add('hidden');

  if (!fotoActual) {
    msgError.textContent = 'Falta tomar una foto del bache.';
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
    severidad: inputSeveridad.value,
    fecha: new Date().toISOString(),
  });
  guardarReportes(reportes);

  // reset del formulario
  form.reset();
  fotoActual = null;
  ubicacionActual = null;
  previewFoto.classList.add('hidden');
  textoUbicacion.textContent = 'Aún no se ha obtenido la ubicación';

  document.querySelector('.nav-btn[data-view="view-lista"]').click();
});

// --- Lista de reportes ---
function renderLista() {
  const reportes = cargarReportes();
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
    card.innerHTML = `
      <img src="${r.foto}" alt="Foto del bache">
      <div class="reporte-info">
        <span class="badge badge-${r.severidad}">${r.severidad}</span>
        <p>${r.descripcion || 'Sin descripción'}</p>
        <p class="hint">${r.direccion || `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`}</p>
        <p class="fecha">${fecha}</p>
        <button class="btn-borrar" data-id="${r.id}">Eliminar</button>
      </div>
    `;
    listaReportes.appendChild(card);
  });

  listaReportes.querySelectorAll('.btn-borrar').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const restantes = cargarReportes().filter(r => r.id !== id);
      guardarReportes(restantes);
      renderLista();
    });
  });
}

// --- Mapa ---
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
      const marker = L.marker([r.lat, r.lng]).addTo(markersLayer);
      marker.bindPopup(`
        <img class="popup-foto" src="${r.foto}" alt="Foto del bache">
        <strong>${r.severidad.toUpperCase()}</strong><br>
        ${r.descripcion || ''}<br>
        <small>${r.direccion || `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`}</small>
      `);
      bounds.push([r.lat, r.lng]);
    });
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
  }

  setTimeout(() => map.invalidateSize(), 100);
}
