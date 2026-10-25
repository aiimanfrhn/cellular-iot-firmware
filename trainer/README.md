# Embedded C Trainer

A browser based Week 1 practice site for the 12-week embedded programming plan. It has two exercises: bit operations and a byte ring buffer. Clang compiles and runs C11 checks inside a WebAssembly worker in the browser, so no Python server or native C toolchain is needed. Your source code is not sent to the website or a compiler service. The first visit downloads about 28 MB of compiler assets; after that the browser can cache them.

## Run locally

Requirements: Node.js 22.12 or later. From this folder, run:

```sh
pnpm install
pnpm dev
```

Open the local URL shown by Vite. Use `pnpm build` to create a static production site in `dist/`.

## Workflow

1. Select an exercise, edit the C code, and choose **Run checks**.
2. Fix compiler errors or failing behavior checks. Passing both exercises updates the Week 1 progress display.
3. Choose **Download .c**, copy the downloaded file into your repository, then commit and push it over SSH. The site does not store GitHub credentials or push code for you.

Drafts and the last passing state live in this browser's local storage. Clearing browser site data removes them. The C compiler and submitted program run inside a WebAssembly worker, isolated by the browser. The compiler runtime is provided by [`@live-codes/clang-wasm`](https://www.npmjs.com/package/@live-codes/clang-wasm).

The ring-buffer exercise uses `RingBuffer` and the `rb_init`, `rb_push`, and `rb_pop` signatures shown in the starter. Its checker verifies empty/full behavior, FIFO order, wraparound, repeated drain/refill, long runs across many wraps, re-initialisation, and zero capacity.

The checks live in `checks.js`. Each exercise lists `[label, C expression]` pairs; every check runs and the page shows a pass/fail checklist. If the program crashes (for example an out-of-bounds write), the checker re-runs each check on its own to report which ones crashed. After the checks, the learner's own `main` (if their code has one) is compiled and run on its own, and its output and exit code appear in the **Program output** panel; the checker renames it so it never clashes with the checker's `main`. Bump `CHECKER_VERSION` in `app.js` whenever checks get stricter, so earlier passes have to be re-run.

## Deploy to Vercel

Import the GitHub repository into Vercel and set **Root Directory** to `trainer`. Leave the framework preset as Vite, use `pnpm build` as the build command, and `dist` as the output directory. The build copies the compiler's WebAssembly assets into the static site. Git-connected Vercel projects can create a preview deployment for each pull request and deploy production when the configured production branch changes.


## Supabase cloud progress

The trainer can back up Week 1 pass status and store code only after the learner chooses **Submit checked code**. Email OTP sign-in is provided by Supabase Auth. Each table uses row-level security so a signed-in learner can access only their own records. The browser uses a publishable key; never put a service-role key in the site.

1. Apply `supabase-schema.sql` to the selected Supabase project's SQL Editor.
2. In Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for Production, Preview, and Development, then redeploy.
3. In Supabase Auth URL configuration, allow the deployed Vercel site URL for redirects. The email provider must be enabled.

Copy `.env.example` to `.env.local` for local development. Cloud features remain unavailable without these variables; local exercises continue to work.
