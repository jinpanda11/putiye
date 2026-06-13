#!/usr/bin/env python3
"""Stable mirror server for putiyuan offline mirror."""
import os, json, sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class MirrorHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        try:
            # Handle RSC data requests - serve the corresponding HTML
            if '_rsc=' in self.path:
                clean = self.path.split('?')[0]
                if clean.endswith('.txt'):
                    html = clean.replace('.txt', '.html')
                    fp = os.path.join(BASE_DIR, html.lstrip('/'))
                    if os.path.isfile(fp):
                        with open(fp, 'rb') as f:
                            content = f.read()
                        self.send_response(200)
                        self.send_header('Content-Type', 'text/html; charset=utf-8')
                        self.send_header('Content-Length', str(len(content)))
                        self.end_headers()
                        self.wfile.write(content)
                        return
            # Mock all API endpoints
            if self.path.startswith('/api/'):
                body = json.dumps({"code": 0, "data": None, "message": "ok"}, ensure_ascii=False)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body.encode())
                return
            # Default: serve static files with parent class
            super().do_GET()
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)

    def do_POST(self):
        try:
            if self.path.startswith('/api/'):
                body = json.dumps({"code": 0, "data": None, "message": "ok"}, ensure_ascii=False)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(body.encode())
                return
            self.send_response(404)
            self.end_headers()
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

if __name__ == '__main__':
    port = 3000
    server = HTTPServer(('0.0.0.0', port), MirrorHandler)
    print(f'菩提苑 本地镜像服务 http://localhost:{port}/')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()