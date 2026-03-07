#!/usr/bin/env python3
"""Dev server for Exodus Protocol.
Serves static files, injects a tab-close beacon, shuts down when tab closes."""

import http.server
import socketserver
import os
import threading
import webbrowser
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8420
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'exodus-protocol')

_shutdown = threading.Event()

# Injected into </head> — pings every 3s, sends shutdown beacon on tab close
BEACON = (
    b'<script>'
    b'setInterval(()=>fetch("/_ping").catch(()=>{}),3000);'
    b'window.addEventListener("beforeunload",()=>navigator.sendBeacon("/_bye"));'
    b'</script>'
)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        if self.path == '/_ping':
            self._ok(); return
        if self.path in ('/_bye', '/_shutdown'):
            self._ok(); _shutdown.set(); return
        if self.path in ('/', '/index.html'):
            self._serve_injected(); return
        super().do_GET()

    def do_POST(self):
        if self.path == '/_bye':
            self._ok(); _shutdown.set(); return
        self.send_response(404); self.end_headers()

    def _ok(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def _serve_injected(self):
        path = os.path.join(ROOT, 'index.html')
        try:
            data = open(path, 'rb').read()
            data = data.replace(b'</head>', BEACON + b'</head>', 1)
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_response(500); self.end_headers()
            self.wfile.write(str(e).encode())

    def log_message(self, *args):
        pass  # silent


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), Handler) as srv:
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    url = f'http://localhost:{PORT}'
    print(f'\n  Exodus Protocol running at {url}')
    print(f'  Close the browser tab to stop the server.\n')
    webbrowser.open(url)
    _shutdown.wait()
    print('\n  Tab closed — shutting down server.')
    srv.shutdown()
