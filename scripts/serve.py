from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote
from functools import partial
import argparse
import gzip
import io
root=Path(__file__).resolve().parents[1]/'dist'
class LocalServer(ThreadingHTTPServer):
    request_queue_size=64
class Handler(SimpleHTTPRequestHandler):
    protocol_version="HTTP/1.1"
    def send_head(self):
        accepts=[]
        for part in self.headers.get('Accept-Encoding','').split(','):
            fields=part.strip().split(';')
            if fields[0].lower()!='gzip': continue
            quality=1.0
            for field in fields[1:]:
                if field.strip().startswith('q='):
                    try: quality=float(field.strip()[2:])
                    except ValueError: quality=0
            accepts.append(quality>0)
        candidate=Path(self.translate_path(self.path))
        if candidate.is_dir() and urlsplit(self.path).path.endswith('/'):
            candidate=candidate/'index.html'
        text_types={'text/html','text/css','text/javascript','application/javascript','application/json','image/svg+xml'}
        if any(accepts) and not self.headers.get('Range') and not self.headers.get('If-Modified-Since') and candidate.is_file() and self.guess_type(str(candidate)) in text_types:
            content=gzip.compress(candidate.read_bytes(),compresslevel=6,mtime=0)
            self.send_response(200)
            self.send_header('Content-Type',self.guess_type(str(candidate)))
            self.send_header('Content-Encoding','gzip')
            self.send_header('Content-Length',str(len(content)))
            self.end_headers()
            return io.BytesIO(content)
        return super().send_head()
    def list_directory(self,path):
        self.send_error(404)
        return None
    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy','camera=(), microphone=(), geolocation=()')
        self.send_header('Cache-Control','no-cache')
        self.send_header('Vary','Accept-Encoding')
        super().end_headers()
    def send_error(self,code,message=None,explain=None):
        if code==404:
            content=(root/'404/index.html').read_bytes()
            self.send_response(404);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(content)));self.end_headers()
            if self.command!='HEAD': self.wfile.write(content)
        else:super().send_error(code,message,explain)
parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4173);args=parser.parse_args()
server=LocalServer(('127.0.0.1',args.port),partial(Handler,directory=str(root)))
print('Tide Tools: http://localhost:%s/'%server.server_address[1],flush=True)
server.serve_forever()
