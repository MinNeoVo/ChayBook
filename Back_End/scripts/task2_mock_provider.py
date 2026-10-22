"""Local Gemini protocol stub. Never forwards a request or reads a provider key."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def do_POST(self):
        if self.headers.get("Transfer-Encoding", "").lower() == "chunked":
            chunks = []
            while True:
                length = int(self.rfile.readline().split(b";", 1)[0].strip(), 16)
                if length == 0:
                    self.rfile.readline()
                    break
                chunks.append(self.rfile.read(length))
                self.rfile.read(2)
            raw = b"".join(chunks)
        else:
            raw = self.rfile.read(int(self.headers["Content-Length"]))
        payload = json.loads(raw)
        prompt = payload["contents"][0]["parts"][0]["text"]
        root = Path(__file__).resolve().parent.parent / "target/admin-verification"
        with (root / "task2-mock-prompts.jsonl").open("a", encoding="utf-8") as file:
            file.write(json.dumps({"prompt": prompt}, ensure_ascii=False) + "\n")
        failed = "FAIL_PROVIDER" in prompt
        self.send_response(503 if failed else 200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Synthetic outage"} if failed else {
            "candidates": [{"content": {"parts": [{"text": "MOCK_AI: Plant-based answer from local test provider."}]}}]
        }).encode())

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"type": "FeatureCollection", "features": [{
            "type": "Feature", "properties": {"place_id": "synthetic-place", "name": "IT Mock Vegan Cafe",
            "formatted": "Synthetic test address", "lat": 10.8001, "lon": 106.7001,
            "categories": ["catering.restaurant", "vegetarian.only", "vegan.only"]}
        }]}).encode())

if __name__ == "__main__":
    print("LOCAL_TEST_PROVIDER=127.0.0.1:8083; EXTERNAL_CALLS=0", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8083), Handler).serve_forever()
