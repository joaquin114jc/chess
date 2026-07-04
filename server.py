import argparse
import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote, urlparse

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
SAVE_FILE = os.path.join(ROOT_DIR, 'saved_games.json')
PORT = 8000


def load_saved_games():
    if not os.path.exists(SAVE_FILE):
        return {}
    try:
        with open(SAVE_FILE, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception:
        return {}


def save_saved_games(data):
    with open(SAVE_FILE, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


class ChessRequestHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = urlparse(path).path
        if path.startswith('/api/'):
            return path
        return super().translate_path(path)

    def do_GET(self):
        path = urlparse(self.path).path
        if path.startswith('/api/games'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            games = load_saved_games()
            if path == '/api/games':
                self.wfile.write(json.dumps({'games': list(games.keys())}).encode('utf-8'))
                return
            name = unquote(path.replace('/api/games/', ''))
            if name in games:
                self.wfile.write(json.dumps({'name': name, 'state': games[name]}).encode('utf-8'))
                return
            self.send_error(404, 'Partida no encontrada')
            return
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == '/api/save':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                data = json.loads(body)
                games = load_saved_games()
                name = data.get('name') or f"partida-{len(games) + 1}"
                games[name] = data.get('state', {})
                save_saved_games(games)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok', 'name': name}).encode('utf-8'))
            except Exception as err:
                self.send_error(400, f'Error al guardar partida: {err}')
            return
        return self.send_error(404, 'Ruta no encontrada')

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path.startswith('/api/games/'):
            name = unquote(path.replace('/api/games/', ''))
            games = load_saved_games()
            if name in games:
                del games[name]
                save_saved_games(games)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'deleted', 'name': name}).encode('utf-8'))
                return
            self.send_error(404, 'Partida no encontrada')
            return
        return self.send_error(404, 'Ruta no encontrada')


if __name__ == '__main__':
    os.chdir(ROOT_DIR)
    parser = argparse.ArgumentParser(description='Servidor local para el tablero de ajedrez.')
    parser.add_argument('--port', type=int, default=PORT, help='Puerto donde se ejecuta el servidor')
    args = parser.parse_args()
    server_address = ('', args.port)
    httpd = HTTPServer(server_address, ChessRequestHandler)
    print(f'Servidor iniciado en http://localhost:{args.port}')
    httpd.serve_forever()
