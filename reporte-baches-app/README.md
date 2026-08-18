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

### Opción 3 — Instalarla como "app" en la pantalla de inicio
Una vez abierta en Chrome (por cualquiera de las opciones anteriores),
toca el menú (⋮) → **"Añadir a pantalla de inicio"**. Te queda un ícono
como si fuera una app normal, para presentarla más fácil el día de la
entrega.

## Limitaciones a tener en cuenta para tu presentación

- Los reportes solo existen en el navegador donde los guardaste (si
  borras datos de navegación de Chrome, se pierden).
- El mapa necesita internet para cargar los mosaicos (las fotos y la
  lista sí funcionan sin internet).
- No hay backend ni base de datos compartida: es una demo local, ideal
  para mostrar el flujo completo (foto → ubicación → reporte → mapa) sin
  necesidad de desplegar nada.
