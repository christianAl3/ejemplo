# Reporta tu Bache

Aplicación web simple para reportar baches: toma una foto con la cámara del
celular, captura la ubicación GPS y guarda el reporte en una lista y en un
mapa. Todo corre localmente en el navegador, sin servidor, sin base de
datos y sin costo.

## Cómo funciona

- **Foto**: usa `<input type="file" capture="environment">`, que abre
  directamente la cámara del celular (no requiere permisos especiales de
  JavaScript).
- **Ubicación**: usa la API `navigator.geolocation` del navegador (GPS del
  celular). Además intenta convertir las coordenadas en una dirección legible
  usando Nominatim (OpenStreetMap), gratis y sin API key. Si no hay
  internet, simplemente muestra las coordenadas.
- **Guardado**: los reportes se guardan en `localStorage` del navegador, o
  sea quedan en el celular, no se suben a ningún servidor.
- **Mapa**: usa Leaflet + mosaicos de OpenStreetMap (gratis, sin cuenta ni
  API key) para mostrar todos los baches reportados.

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
