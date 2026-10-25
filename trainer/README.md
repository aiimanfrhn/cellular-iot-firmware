# Embedded C Trainer

A small Week 1 practice site for the 12-week embedded programming plan. It has two exercises: bit operations and a byte ring buffer. The local checker compiles C11 with strict warnings, then runs focused behavior checks. Browser progress and drafts are saved in local storage.

## Run it locally

Requirements: Python 3 and a C compiler (`cc`, GCC, or Clang). On Ubuntu or Debian, install GCC with `sudo apt install build-essential`. On macOS, install Apple's command line tools with `xcode-select --install`.

From the repository root, run:

```sh
python3 trainer/server.py
```

Open <http://127.0.0.1:8000>. Stop the server with Ctrl+C. Keep it on your own computer; it binds to loopback and is not intended to be exposed to a network.

## Workflow

1. Select an exercise, edit the C code, and choose **Run checks**.
2. Fix compiler errors or failing behavior checks. Passing both exercises updates the Week 1 progress display.
3. Choose **Download .c**, copy the downloaded file into your repository, then commit and push it over SSH. The site does not store GitHub credentials or push code for you.

Drafts and the last passing state live in this browser's local storage. Clearing browser site data removes them. Checking code invokes the machine's local C compiler and runs the resulting program as your current user. Use it only for code you wrote and trust. Resource limits and loopback binding reduce accidental trouble, but this is **not a security sandbox** and should not be used for untrusted code.

The ring-buffer exercise uses `RingBuffer` and the `rb_init`, `rb_push`, and `rb_pop` signatures shown in the starter. Its checker verifies empty/full behavior, FIFO order, wraparound, and zero capacity.
