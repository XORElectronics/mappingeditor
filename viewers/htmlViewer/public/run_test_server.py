"""Simple test server for the htmlViewer. NOT intended for production use!"""

import http.server

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map[".js"] = "text/javascript"
Handler.extensions_map[".mjs"] = "text/javascript"
http.server.test(Handler, port=8080)
