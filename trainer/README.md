# Embedded C Trainer

A browser-based practice site for embedded, firmware and network platform software interviews. It has 26 C coding problems in seven topics:

| Topic | Problems |
|---|---|
| Bits and registers | Bit operations, count bits and powers of two, register bit fields, reverse bits and swap bytes |
| Memory and pointers | Align an address, memmove with overlap, fixed-block memory pool |
| Lists and strings | Reverse a linked list, find a loop and the middle, safe string copy, split a CLI command |
| Data and protocols | Endian-safe byte access, ring buffer, CRC-16/CCITT, parse an unsigned integer |
| Networking | Subnet masks and prefixes, parse an IPv4 address, MAC addresses, Internet checksum, Ethernet and VLAN header, validate an IPv4 header, MAC learning table |
| Platform and hardware | Poll a register with a timeout, temperature sensor reading |
| State machines | Button debouncer, fan control with hysteresis |

A **14-day training plan** (the button under the introduction) orders the problems for network platform software roles, such as C developers on switches, routers and access points. It adds study questions on networking, Linux, concurrency, debugging and behavioural interviews, which you tick off as you go. The plan lives in `plan.js`.

A **concept quiz** (the button under the plan) covers the spoken part of the interview: 42 multiple-choice questions with explanations, in seven topics (C and the compiler, interrupts and concurrency, RTOS, memory, hardware and buses, reliability and boot, networking), plus a shuffled mixed review. Keys 1–4 choose an answer and Enter checks it. After a topic you can retry just the questions you missed. Questions live in `quiz.js`.

Each problem has a difficulty, a target time, and the follow-up questions interviewers commonly ask next. Clang compiles and runs the checks inside a WebAssembly worker in the browser, so no server or native C toolchain is needed, and your source code is not sent anywhere. The first visit downloads about 28 MB of compiler assets; after that the browser can cache them.

## Run locally

Requirements: Node.js 22.12 or later. From this folder, run:

```sh
pnpm install
pnpm dev
```

Open the local URL shown by Vite. Use `pnpm build` to create a static production site in `dist/`.

## Workflow

1. Pick a problem from the sidebar (or the picker on a phone), edit the C code, and choose **Run checks** (Ctrl+Enter).
2. Fix compiler errors, failing checks, or undefined-behaviour crashes. Solved problems are ticked and counted by difficulty.
3. Read the follow-up questions and practise answering them out loud.
4. Choose **Download .c** to keep your solution, for example in your portfolio repository.

Drafts, results, ticked plan items and quiz answers live in this browser's local storage. Clearing browser site data removes them. The compiler runtime is provided by [`@live-codes/clang-wasm`](https://www.npmjs.com/package/@live-codes/clang-wasm).

## How checking works

- Code is compiled as strict C11 with `-Wall -Wextra -Werror -pedantic` and clang's undefined-behaviour sanitizer in trap mode. Shifting by the full width, signed overflow, NULL or misaligned pointers, and out-of-bounds array indexes crash instead of silently "working".
- Every check runs and the page shows a pass/fail checklist. If the program crashes, the checker re-runs each check on its own to report which ones crashed.
- Some problems also have source rules, such as "does not call memcpy or memmove", which are checked on the code with comments removed.
- After the checks, the learner's own `main` (if any) is compiled and run on its own, and its output and exit code appear in the **Program output** panel.

## Adding a problem

Problems live in `problems.js`. Each entry has the text shown on the page, a starter (which must compile), a C `prelude` with test helpers, `checks` as `[label, C expression]` pairs, and optional `forbid` rules. The sidebar, picker and progress card are generated from this list. Add the new id to a day in `plan.js` so the training plan includes it. The checker runner is `checks.js`. Bump `CHECKER_VERSION` in `app.js` whenever checks get stricter, so earlier passes have to be re-run.

## Deploy to Vercel

Import the GitHub repository into Vercel and set **Root Directory** to `trainer`. Leave the framework preset as Vite, use `pnpm build` as the build command, and `dist` as the output directory. The build copies the compiler's WebAssembly assets into the static site. Git-connected Vercel projects can create a preview deployment for each pull request and deploy production when the configured production branch changes.


## Supabase cloud progress

The trainer can back up which problems are solved, and stores code only after the learner chooses **Submit checked code** (for the problem that is open). Problems solved on another device count toward progress. Email magic-link sign-in is provided by Supabase Auth. Each table uses row-level security so a signed-in learner can access only their own records. The browser uses a publishable key; never put a service-role key in the site.

1. Apply `supabase-schema.sql` in the Supabase project's SQL Editor. It is safe to run again, and an existing project must re-run it so the tables accept every problem id, not just `bit_ops` and `ring_buffer`.
2. In Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for Production, Preview, and Development, then redeploy.
3. In Supabase Auth URL configuration, allow the deployed Vercel site URL for redirects. The email provider must be enabled.

Copy `.env.example` to `.env.local` for local development. Cloud features remain unavailable without these variables; local exercises continue to work.
