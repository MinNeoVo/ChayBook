"""Loopback-only static dashboard and read-only artifact API. Never launches tests or SQL."""
import argparse,json,threading,os,secrets
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse,parse_qs,unquote
from dashboard_data import Pipeline,evidence_response,ROOT

def create_server(port=5190):
    lock=threading.Lock();state={'pipeline':None,'data':None}
    def refresh():
        with lock:
            p=Pipeline();data=p.build();state.update(pipeline=p,data=data)
            return data
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def send(self,body,kind='application/json; charset=utf-8',status=200):
            self.send_response(status);self.send_header('Content-Type',kind);self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff')
            self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'")
            try:
                self.end_headers();self.wfile.write(body)
            except (BrokenPipeError,ConnectionAbortedError,ConnectionResetError):pass
        def do_POST(self):
            if self.path=='/__shutdown':
                token=os.environ.get('CHAYBOOK_DASHBOARD_STOP_TOKEN','')
                if not token or not secrets.compare_digest(self.headers.get('X-Owned-Stop',''),token):return self.send(b'{}',status=403)
                self.send(b'{}');threading.Thread(target=self.server.shutdown,daemon=True).start();return
            if self.path!='/api/refresh':return self.send(b'{}',status=404)
            origin=self.headers.get('Origin')
            if origin and origin!=f'http://127.0.0.1:{self.server.server_port}':return self.send(b'{}',status=403)
            self.send(json.dumps(refresh(),ensure_ascii=False).encode())
        def do_GET(self):
            path=urlparse(self.path)
            if path.path=='/api/data':return self.send(json.dumps(state['data'] or refresh(),ensure_ascii=False).encode())
            if path.path=='/evidence':
                try:
                    if not state['pipeline']:refresh()
                    value=parse_qs(path.query).get('path',[''])[0];body,kind=evidence_response(value,state['pipeline']);return self.send(body,kind)
                except (ValueError,OSError):return self.send(b'{"error":"Refused or unknown evidence path"}',status=403)
            dist=(ROOT/'testing/dashboard/dist').resolve();name=unquote(path.path).lstrip('/') or 'index.html';p=(dist/name).resolve()
            if not p.is_relative_to(dist) or not p.is_file():return self.send(b'{"error":"Not found"}',status=404)
            kind={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'}.get(p.suffix)
            if not kind:return self.send(b'{}',status=403)
            self.send(p.read_bytes(),kind)
    return ThreadingHTTPServer(('127.0.0.1',port),Handler)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=5190);args=parser.parse_args()
    server=create_server(args.port);print(f'Dashboard http://127.0.0.1:{server.server_port} — SQL/external providers disabled',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
