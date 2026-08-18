# BacheApp — Reporta tu Bache

Aplicación web para reportar baches: toma (o elige) una foto, captura la
ubicación GPS, define su gravedad y le da seguimiento con estado. Incluye
un mini-dashboard, filtros, mapa con marcadores por color y exportación de
datos. Todo corre localmente en el navegador, sin servidor, sin base de
datos y sin costo.

## Funciones

- **Foto**: botón de cámara (`capture="environment"`) o botón para elegir
  una imagen ya existente de la galería — útil si estás probando sin poder
  fotografiar un bache real en el momento.
- **Ubicación**: usa `navigator.geolocation` (GPS del celular) con spinner
  de carga, y convierte las coordenadas en dirección legible con Nominatim
  (OpenStreetMap, gratis, sin API key). Sin internet, muestra solo
  coordenadas.
- **Gravedad**: selector visual (leve / moderado / grave).
- **Dashboard**: tarjetas con total de reportes, cuántos son graves y
  cuántos ya están resueltos.
- **Estado del reporte**: cada reporte inicia como "Pendiente"; toca la
  etiqueta de estado para avanzarlo a "En revisión" y luego "Resuelto".
- **Filtros y orden**: filtra la lista por gravedad y ordénala por fecha o
  por gravedad.
- **Compartir**: botón para compartir un reporte (usa el share nativo del
  celular, o copia el texto si el navegador no lo soporta).
- **Exportar**: descarga todos los reportes en un archivo `.json` como
  respaldo o para anexarlo a tu entrega.
- **Guardado**: los reportes se guardan en `localStorage` del navegador,
  quedan en el celular, no se suben a ningún servidor.
- **Mapa**: Leaflet + mosaicos de OpenStreetMap (gratis, sin cuenta) con
  marcadores de color según la gravedad del bache.
- **Instalable**: incluye `manifest.json` e ícono para poder añadirla a la
  pantalla de inicio como si fuera una app nativa.

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
