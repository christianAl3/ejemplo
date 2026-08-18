"""Sirve BacheReport en la red local y muestra un codigo QR en la terminal
para abrirlo facilmente desde el celular (debe estar en la misma red WiFi).

Uso:
    pip install qrcode
    python serve_qr.py
"""
import http.server
import socket
import socketserver

PUERTO = 8000


def obtener_ip_local():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except OSError:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def mostrar_qr(url):
    try:
        import qrcode
    except ImportError:
        print("\nFalta el paquete 'qrcode'. Instalalo con:\n\n    pip install qrcode\n")
        return
    qr = qrcode.QRCode(border=1)
    qr.add_data(url)
    qr.make()
    qr.print_ascii(invert=True)


def main():
    ip = obtener_ip_local()
    url = f"http://{ip}:{PUERTO}"

    print("=" * 56)
    print(f"  BacheReport corriendo en: {url}")
    print("  Escanea este codigo QR desde tu celular")
    print("  (el celular debe estar en la misma red WiFi)")
    print("=" * 56 + "\n")

    mostrar_qr(url)

    print(f"\nSi no puedes escanear, escribe a mano en el celular: {url}")
    print("Presiona Ctrl+C para detener el servidor.\n")

    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("0.0.0.0", PUERTO), handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")


if __name__ == "__main__":
    main()
