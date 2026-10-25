#!/usr/bin/env python3
"""Local C trainer. Binds to loopback and compiles/runs learner-submitted C code."""
from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000
MAX_BODY = 80_000

BIT_HARNESS = r'''#define main learner_demo_main
#include "student.c"
#undef main
#include <limits.h>
#include <stdio.h>

#define CHECK(label, expression) do { \
    if (!(expression)) { \
        fprintf(stderr, "FAIL: %s\n", label); \
        return 1; \
    } \
    printf("PASS: %s\n", label); \
} while (0)

int main(void)
{
    const unsigned int top_bit = (unsigned int)(sizeof(unsigned int) * CHAR_BIT - 1u);
    CHECK("set bit", set_bit(0u, 3u) == 8u);
    CHECK("clear bit", clear_bit(8u, 3u) == 0u);
    CHECK("toggle bit on", toggle_bit(0u, 3u) == 8u);
    CHECK("toggle bit off", toggle_bit(8u, 3u) == 0u);
    CHECK("test set and clear", test_bit(8u, 3u) != 0 && test_bit(0u, 3u) == 0);
    CHECK("highest valid bit", test_bit(set_bit(0u, top_bit), top_bit) != 0);
    return 0;
}
'''

RING_HEADER = r'''#ifndef RING_BUFFER_API_H
#define RING_BUFFER_API_H
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
typedef struct RingBuffer {
    uint8_t *data;
    size_t capacity;
    size_t head;
    size_t tail;
    size_t count;
} RingBuffer;
void rb_init(RingBuffer *rb, uint8_t *storage, size_t capacity);
bool rb_push(RingBuffer *rb, uint8_t value);
bool rb_pop(RingBuffer *rb, uint8_t *out);
#endif
'''

RING_HARNESS = r'''#include "ring_buffer_api.h"
#include <stdio.h>

#define CHECK(label, expression) do { \
    if (!(expression)) { \
        fprintf(stderr, "FAIL: %s\n", label); \
        return 1; \
    } \
    printf("PASS: %s\n", label); \
} while (0)

static int check_fifo(void)
{
    uint8_t storage[3] = {0};
    uint8_t out = 0;
    RingBuffer rb;
    rb_init(&rb, storage, 3u);
    if (!rb_push(&rb, 11u) || !rb_push(&rb, 22u)) return 0;
    if (!rb_pop(&rb, &out) || out != 11u) return 0;
    if (!rb_pop(&rb, &out) || out != 22u) return 0;
    return 1;
}

static int check_full(void)
{
    uint8_t storage[2] = {0};
    uint8_t out = 0;
    RingBuffer rb;
    rb_init(&rb, storage, 2u);
    if (!rb_push(&rb, 1u) || !rb_push(&rb, 2u)) return 0;
    if (rb_push(&rb, 3u)) return 0;
    if (!rb_pop(&rb, &out) || out != 1u) return 0;
    if (!rb_pop(&rb, &out) || out != 2u) return 0;
    return 1;
}

static int check_wraparound(void)
{
    uint8_t storage[3] = {0};
    uint8_t out = 0;
    RingBuffer rb;
    rb_init(&rb, storage, 3u);
    if (!rb_push(&rb, 10u) || !rb_push(&rb, 20u) || !rb_push(&rb, 30u)) return 0;
    if (!rb_pop(&rb, &out) || out != 10u) return 0;
    if (!rb_push(&rb, 40u)) return 0;
    if (!rb_pop(&rb, &out) || out != 20u) return 0;
    if (!rb_pop(&rb, &out) || out != 30u) return 0;
    if (!rb_pop(&rb, &out) || out != 40u) return 0;
    return 1;
}

static int check_zero_capacity(void)
{
    uint8_t storage[1] = {0};
    uint8_t out = 0;
    RingBuffer rb;
    rb_init(&rb, storage, 0u);
    if (rb_push(&rb, 1u)) return 0;
    if (rb_pop(&rb, &out)) return 0;
    return 1;
}

int main(void)
{
    uint8_t storage[2] = {0};
    uint8_t out = 0;
    RingBuffer rb;
    rb_init(&rb, storage, 2u);
    CHECK("empty pop", !rb_pop(&rb, &out));
    CHECK("FIFO order", check_fifo());
    CHECK("full buffer rejects extra item", check_full());
    CHECK("wraparound preserves order", check_wraparound());
    CHECK("zero capacity is safe", check_zero_capacity());
    return 0;
}
'''


def find_compiler() -> str | None:
    return shutil.which("cc") or shutil.which("gcc") or shutil.which("clang")


def read_limited(file_obj, limit: int = 24_000) -> str:
    file_obj.seek(0)
    return file_obj.read(limit).decode("utf-8", errors="replace")


def limit_child_process() -> None:
    """Apply modest POSIX limits to learner code. This is not a security sandbox."""
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
        resource.setrlimit(resource.RLIMIT_FSIZE, (512 * 1024, 512 * 1024))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        if hasattr(resource, "RLIMIT_AS"):
            resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
    except (ImportError, OSError, ValueError):
        pass


def run_program(executable: Path) -> dict:
    with tempfile.TemporaryFile() as stdout_file, tempfile.TemporaryFile() as stderr_file:
        try:
            result = subprocess.run(
                [str(executable)],
                cwd=executable.parent,
                stdout=stdout_file,
                stderr=stderr_file,
                timeout=3,
                check=False,
                preexec_fn=limit_child_process if hasattr(__import__("os"), "setuid") else None,
            )
        except subprocess.TimeoutExpired:
            return {"passed": False, "phase": "run", "message": "Program exceeded the 3 second run limit.", "output": read_limited(stdout_file) + read_limited(stderr_file)}
        output = read_limited(stdout_file) + read_limited(stderr_file)
        if result.returncode != 0:
            return {"passed": False, "phase": "run", "message": "The checker program exited with code " + str(result.returncode) + ".", "output": output}
        checks = [line[6:] for line in output.splitlines() if line.startswith("PASS: ")]
        return {"passed": True, "phase": "complete", "message": "All checks passed.", "output": output, "checks": checks}


def check_code(exercise: str, code: str) -> dict:
    if not isinstance(code, str) or not code.strip():
        return {"passed": False, "phase": "compile", "message": "Paste your C code into the editor first.", "output": ""}
    if len(code.encode("utf-8")) > MAX_BODY:
        return {"passed": False, "phase": "compile", "message": "Code is too large for this exercise (80 KB maximum).", "output": ""}
    compiler = find_compiler()
    if not compiler:
        return {"passed": False, "phase": "setup", "message": "No C compiler found. Install GCC or Clang, then restart this trainer.", "output": ""}

    with tempfile.TemporaryDirectory(prefix="c-trainer-") as tmp:
        folder = Path(tmp)
        student = folder / "student.c"
        harness = folder / "checker.c"
        executable = folder / "checker"
        student.write_text(code, encoding="utf-8")
        if exercise == "bit_ops":
            harness.write_text(BIT_HARNESS, encoding="utf-8")
            sources = [str(harness)]
        elif exercise == "ring_buffer":
            (folder / "ring_buffer_api.h").write_text(RING_HEADER, encoding="utf-8")
            harness.write_text(RING_HARNESS, encoding="utf-8")
            sources = [str(student), str(harness)]
        else:
            return {"passed": False, "phase": "setup", "message": "Unknown exercise.", "output": ""}

        command = [compiler, "-std=c11", "-Wall", "-Wextra", "-Werror", "-pedantic", "-I", str(folder), *sources, "-o", str(executable)]
        try:
            compiled = subprocess.run(command, capture_output=True, text=True, timeout=15, check=False)
        except subprocess.TimeoutExpired:
            return {"passed": False, "phase": "compile", "message": "Compilation exceeded the 15 second limit.", "output": ""}
        if compiled.returncode != 0:
            diagnostics = (compiled.stdout or "") + (compiled.stderr or "")
            return {"passed": False, "phase": "compile", "message": "Compilation failed. Read the compiler output and try again.", "output": diagnostics[-24_000:]}
        result = run_program(executable)
        result["compiler"] = Path(compiler).name
        return result


class TrainerHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print("[trainer] " + (fmt % args))

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        assets = {"/": ("index.html", "text/html; charset=utf-8"), "/index.html": ("index.html", "text/html; charset=utf-8"), "/styles.css": ("styles.css", "text/css; charset=utf-8"), "/app.js": ("app.js", "text/javascript; charset=utf-8")}
        if path == "/api/health":
            compiler = find_compiler()
            body = json.dumps({"ready": compiler is not None, "compiler": Path(compiler).name if compiler else None}).encode("utf-8")
            self._send(200, body, "application/json; charset=utf-8")
            return
        if path not in assets:
            self._send(404, b"Not found", "text/plain; charset=utf-8")
            return
        filename, content_type = assets[path]
        try:
            body = (ROOT / filename).read_bytes()
        except OSError:
            self._send(500, b"Trainer asset is missing", "text/plain; charset=utf-8")
            return
        self._send(200, body, content_type)

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/check":
            self._send(404, b"Not found", "text/plain; charset=utf-8")
            return
        host = self.headers.get("Host", "").split(":", 1)[0].strip("[]").lower()
        if host not in {"127.0.0.1", "localhost"}:
            self._send(403, b"Loopback host only", "text/plain; charset=utf-8")
            return
        origin = self.headers.get("Origin")
        if origin and (urlparse(origin).hostname or "").lower() not in {"127.0.0.1", "localhost"}:
            self._send(403, b"Local browser origin only", "text/plain; charset=utf-8")
            return
        if self.headers.get_content_type() != "application/json":
            self._send(415, b"Expected application/json", "text/plain; charset=utf-8")
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY + 256:
            self._send(413, b"Request size must be under 80 KB", "text/plain; charset=utf-8")
            return
        try:
            payload = json.loads(self.rfile.read(length))
            result = check_code(payload.get("exercise"), payload.get("code"))
            body = json.dumps(result).encode("utf-8")
            self._send(200, body, "application/json; charset=utf-8")
        except (json.JSONDecodeError, AttributeError, TypeError):
            self._send(400, b"Invalid request body", "text/plain; charset=utf-8")


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), TrainerHandler)
    print("Embedded C Trainer is ready at http://127.0.0.1:" + str(PORT))
    print("Code is compiled and run locally as your user account. Only run code you wrote; do not expose this server to a network.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping trainer.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
