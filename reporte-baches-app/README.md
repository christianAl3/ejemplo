# BacheReport

Aplicación web para reportar baches con un asistente de 4 pasos (evidencia
fotográfica, ubicación, detalles y seguimiento), dashboard de estadísticas,
mapa con marcadores por gravedad y exportación de datos. Todo corre
localmente en el navegador, sin servidor, sin base de datos y sin costo.

## Pantallas

- **Inicio**: tarjeta de bienvenida con botón "Reportar un bache",
  estadísticas rápidas y tus reportes más recientes.
- **Nuevo Reporte** (asistente de 4 pasos):
  1. *Evidencia Visual* — hasta 3 fotos, por cámara o galería.
  2. *Ubicación del Bache* — mapa con pin arrastrable centrado en tu GPS
     (con botón para recentrar), o toca el mapa para ajustar el punto.
  3. *Detalles del Reporte* — gravedad (Leve/Moderado/Grave), tipo de
     bache y descripción.
  4. *Estado y Seguimiento* — barra de progreso del ciclo de vida del
     reporte (Reportado → En Revisión → Programado → Reparado), marcar
     alta prioridad, referencia visual y opción de reportar anónimo.
- **Mis Reportes**: lista con filtro por gravedad, orden, exportar a JSON,
  compartir y eliminar. Toca la etiqueta de estado de cada tarjeta para
  avanzarla en su ciclo de vida.
- **Mapa**: todos los baches reportados con marcadores de color según su
  gravedad (Leaflet + OpenStreetMap, gratis, sin API key).
- **Perfil**: resumen, exportar reportes, eliminar todos los datos y
  acerca de la app.

## Cómo funciona por dentro

- **Foto**: `<input type="file" capture="environment">` para cámara, y un
  input normal para elegir de galería — no requiere permisos especiales.
- **Ubicación**: `navigator.geolocation` (GPS del celular). Además intenta
  convertir las coordenadas en una dirección legible con Nominatim
  (OpenStreetMap, gratis, sin API key); sin internet se queda con las
  coordenadas.
- **Guardado**: todo se guarda en `localStorage` del navegador — queda en
  el celular, nada se sube a un servidor.
- **Resiliente sin internet/CDN**: si el mapa (Leaflet, cargado desde un
  CDN) no puede cargar —por ejemplo, si la red bloquea dominios externos—
  la app lo detecta y te deja seguir reportando solo con el GPS, sin
  trabarse.

## Cómo probarla/presentarla en tu celular (gratis, sin publicar nada)

### Opción 1 — La más simple: abrir el archivo directamente
1. Copia la carpeta `reporte-baches-app` completa a tu celular (por cable
   USB, Bluetooth, o subiéndola a tu Drive personal y descargándola — eso
   no "publica" la app, solo mueve el archivo).
2. En el celular, abre un explorador de archivos y toca `index.html`,
   elige abrir con Chrome.
3. Acepta los permisos de cámara y ubicación cuando te los pida.

Esto funciona en la mayoría de los celulares Android con Chrome. Si el
GPS no te lo pide o no funciona por el `file://`, usa la opción 2.

### Opción 2 — Servidor local en tu computadora (más confiable)
1. En tu computadora, abre una terminal dentro de la carpeta
   `reporte-baches-app` y ejecuta:
   ```
   python3 -m http.server 8000
   ```
   (Si no tienes Python, con Node puedes usar `npx serve .`)
2. Conecta tu celular a la **misma red WiFi** que tu computadora.
3. En tu computadora, busca tu IP local (Windows: `ipconfig`, Mac/Linux:
   `ifconfig` o `ip addr`) — algo como `192.168.1.23`.
4. En el celular abre en Chrome: `http://192.168.1.23:8000`.

> Nota: algunos navegadores solo permiten geolocalización en conexiones
> "seguras" (https o localhost). Si en la opción 2 el GPS no funciona por
> estar en `http://` sobre la red local, usa la Opción 1 (abrir el archivo
> directamente), que en Chrome Android sí suele permitirlo.

### Opción 2b — Igual que la Opción 2, pero con código QR
Para no tener que escribir la IP a mano en el celular, usa el script
`serve_qr.py` incluido: levanta el mismo servidor y además imprime un
código QR en la terminal que apunta directo a la app.

```
pip install qrcode
python serve_qr.py
```

Escanea el QR con la cámara del celular (conectado a la misma WiFi que la
computadora) y se abre la app directamente. Se cierra igual que el
servidor normal, con `Ctrl+C`.

> Esta opción tiene la misma limitación de red que la Opción 2: si la
> WiFi (por ejemplo, la de una escuela) bloquea que los dispositivos se
> vean entre sí, ni el QR ni la IP van a conectar. En ese caso usa la
> Opción 1, o conecta ambos dispositivos a un hotspot personal del
> celular en vez de la WiFi de la red.

### Opción 3 — Instalarla como app de verdad en la pantalla de inicio
La app ya incluye `manifest.json` + `service-worker.js`, así que Chrome la
reconoce como una app instalable (con su propio ícono, sin barra de
navegador, y que abre incluso sin internet después de la primera vez).

**En Android (Chrome):**
1. Abre la app por cualquiera de las opciones anteriores (recomendado: la
   Opción 1, abriendo `index.html` directamente).
2. En cuanto Chrome detecta que la app es instalable te muestra
   automáticamente un banner amarillo arriba con el botón **"Instalar"**
   — solo tócalo y confirma.
3. Si el banner no aparece de inmediato (a veces Chrome tarda un par de
   visitas en mostrarlo, o lo cerraste antes), instálala manualmente:
   menú (⋮) → **"Instalar aplicación"** (o **"Añadir a pantalla de
   inicio"** si no aparece esa opción).
4. Te queda un ícono azul con el logo de BacheReport en tu pantalla de
   inicio, y al abrirlo se ve como una app nativa, sin la barra del
   navegador.

**En iPhone (Safari):**
1. Abre la app en Safari (no funciona desde Chrome en iOS para este paso).
2. Toca el botón de compartir (el cuadro con la flecha hacia arriba).
3. Elige **"Añadir a pantalla de inicio"**.
4. Confirma. Igual te queda el ícono de BacheReport en tu pantalla.

Después de abrirla instalada una primera vez, el service worker guarda
una copia de la app en el celular, así que la puedes abrir de nuevo
aunque no tengas internet (el mapa y la geocodificación de direcciones sí
necesitan conexión, el resto no).

## Limitaciones a tener en cuenta para tu presentación

- Los reportes solo existen en el navegador donde los guardaste (si
  borras datos de navegación de Chrome, se pierden).
- El mapa necesita internet para cargar los mosaicos (las fotos y la
  lista sí funcionan sin internet).
- No hay backend ni base de datos compartida: es una demo local, ideal
  para mostrar el flujo completo (foto → ubicación → reporte → mapa) sin
  necesidad de desplegar nada.
