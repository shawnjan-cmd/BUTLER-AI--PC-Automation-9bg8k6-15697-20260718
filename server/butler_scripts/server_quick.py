import http.server, socketserver, os
PORT = 8765
os.chdir(os.getcwd())
with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as h:
    print(f"Serving {os.getcwd()}  →  http://localhost:{PORT}")
    print("Ctrl+C to stop")
    try: h.serve_forever()
    except KeyboardInterrupt: print("stopped")