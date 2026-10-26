# Embedded C Trainer

A practice site for embedded and firmware software interviews that runs in the browser. Clang, compiled to WebAssembly, builds and checks your C in a background worker, so no server or native toolchain is needed and your code is not uploaded. The first visit downloads about 28 MB of compiler assets; the browser caches them after that.

A first visit opens a welcome page that asks what you are preparing for (learning C, embedded or firmware interviews, network platform roles, or just trying C) and opens the matching part of the site. The *New here?* link in the sidebar brings it back.

## Practise: coding problems

42 problems in nine topics, 13 easy, 24 medium and 5 hard:

| Topic | Problems |
|---|---|
| Bits and registers | Bit operations, count bits and powers of two, register bit fields, reverse bits and swap bytes, BCD for an RTC chip, highest set bit and next power of two, bitmap block allocator |
| Memory and pointers | Align an address, memmove with overlap, fixed-block memory pool, aligned malloc and free |
| Lists and strings | Reverse a linked list, find a loop and the middle, safe string copy, split a CLI command, integer to string, reverse the words |
| Data and protocols | Endian-safe byte access, ring buffer, CRC-16/CCITT, parse an unsigned integer |
| Math and signal processing | Saturating and Q15 arithmetic, moving average filter, lookup table interpolation |
| Networking | Subnet masks and prefixes, parse an IPv4 address, MAC addresses, Internet checksum, Ethernet and VLAN header, validate an IPv4 header, MAC learning table |
| Platform and hardware | Poll a register with a timeout, temperature sensor reading, software timers |
| State machines | Button debouncer, fan control with hysteresis |
| Find the bug | ADC peak macros, frame checksum as hex, modem counters report, tick timeouts, dual encoder fusion, UART receive FIFO |

Each problem has a difficulty, a target time and the follow-up questions interviewers commonly ask next. The **Find the bug** problems copy a common written-test format: the starter is realistic code that compiles cleanly but has two or three planted bugs (macro pitfalls, sign extension, promotion, off-by-one, wraparound), and the checks pass once every bug is fixed.

1. Pick a problem from the sidebar (or the picker on a phone), edit the C code, and choose **Run checks** (Ctrl+Enter).
2. Fix compiler errors, failing checks or undefined-behaviour crashes. Lines with errors are marked in the editor's gutter, and each `file.c:line:col` in the output jumps to that spot.
3. If you are stuck, the **Stuck?** box reveals three hints one at a time, from a nudge to nearly the code, and then a model solution with an explanation that can be loaded into the editor.
4. Read the follow-up questions and answer them out loud. **Download .c** keeps your solution.

**Start timed attempt** turns a problem into a mini interview: it counts down from the target time, hides the hints, and records your time when the checks pass. The best time shows next to the target.

## Study: guides, quizzes and the learning guide

- **Study guide and quiz** covers the spoken part of the interview in ten topics: C and the compiler, pointers and arrays, memory management, interrupts and concurrency, RTOS, embedded memory, hardware and buses, reliability and boot, read the code, and networking. Each topic opens on a study guide with notes, code examples and points worth saying in an interview, then multiple-choice questions with explanations (102 in all, plus a shuffled mixed review). **Read the code** asks "what does this print?" and "what is wrong with this code?" about short snippets; every printed answer is confirmed by compiling and running the snippet. Keys 1–4 choose an answer and Enter checks it.
- The **Learning guide** sums everything up in 12 areas, each split into *what to remember* (facts, numbers and syntax to know by heart) and *what to understand* (ideas to explain in your own words), with links to the matching guides, quizzes and plan days.
- The **14-day training plan** orders the problems for network platform software roles, such as C developers on switches, routers and access points. It adds study questions on networking, Linux, concurrency, debugging and behavioural interviews, and each day has its own study guide and 5-question quiz.

## Rehearse: mock interview test

The **Mock interview test** rehearses a whole embedded interview round: 10 concept questions dealt across topics (networking left out), then two coding problems, one easier and one harder, under one clock of 30 to 50 minutes. There are no hints and no feedback until you submit. The test problems start from the starter code in their own drafts, so your saved work is untouched, and the test submits itself when time runs out, even if the page was closed. The scorecard weighs the questions 40% and the coding 60%, lists the missed questions with explanations, links the study guides for weak topics and the problems to retry, and keeps a history of the last 10 attempts.

## Tools

- The **C sandbox** is a free editor for trying things out: write any C program, give it optional stdin, and choose **Run** to see its output and exit code. It uses the same strict flags as the problems. **Copy share link** puts the code and input into the part of a link after `#`, so nothing is uploaded; whoever opens it sees that code, and their own saved draft is only replaced once they edit it.
- The **theme** button in the header switches between the system setting, light and dark.
- **Export progress** in the progress card saves everything to one JSON file, and **Import from file** restores it here or on another computer. Drafts, results, plan ticks, quiz answers, hints, best times, mock test history and sandbox code live in this browser's local storage, so clearing site data removes them.

## Run locally

Requirements: Node.js 22.12 or later. From this folder, run:

```sh
pnpm install
pnpm dev
```

Open the local URL shown by Vite. `pnpm build` creates a static production site in `dist/`, and `pnpm verify` checks the content (see [Adding a problem](#adding-a-problem)). GitHub Actions runs both builds and `pnpm verify` on every push and pull request (`.github/workflows/trainer.yml`).

### One-file version for offline study

`pnpm build:single` writes the whole trainer into one file, `dist-single/embedded-c-trainer.html`. Open it straight from disk in Chrome, Edge or Firefox; no server is needed. The ~28 MB compiler runtime is too large to embed, so the file downloads it from jsDelivr the first time you run code, and the browser caches it. Supabase sync is not included. Rebuild the file after changing any content file.

## How checking works

- Code is compiled as strict C11 with `-Wall -Wextra -Werror -pedantic` and clang's undefined-behaviour sanitizer in trap mode. Shifting by the full width, signed overflow, NULL or misaligned pointers, and out-of-bounds array indexes crash instead of silently "working".
- Every check runs and the page shows a pass/fail checklist. If the program crashes, the checker re-runs each check on its own to report which ones crashed.
- Some problems also have source rules, such as "does not call memcpy or memmove", which are checked on the code with comments removed.
- After the checks, the learner's own `main` (if any) is compiled and run on its own, and its output and exit code appear in the **Program output** panel.

## Project files

| File | What it holds |
|---|---|
| `index.html`, `styles.css`, `app.js` | The page, its styles, and all of its behaviour |
| `problems.js` | The coding problems: text, starter code, checks and source rules |
| `hints.js` | Hints, model solutions and explanations, one entry per problem |
| `checks.js`, `compiler-worker.js` | The checker and the worker that runs the compiler |
| `guide.js`, `quiz.js` | The topic study guides and their quiz questions |
| `plan.js`, `plan-guide.js` | The 14-day plan, and each day's guide and quiz |
| `notes.js` | The learning guide |
| `verify-solutions.mjs` | `pnpm verify`: checks every starter, model solution and printed quiz answer |
| `build-single.mjs` | `pnpm build:single`: the offline one-file build |
| `supabase-trainer.js`, `supabase-schema.sql` | Optional cloud backup |

## Adding a problem

Problems live in `problems.js`. Each entry has the text shown on the page, a starter (which must compile), a C `prelude` with test helpers, `checks` as `[label, C expression]` pairs, and optional `forbid` rules. The sidebar, picker, progress card and mock test are generated from this list. To include it in the training plan, add its id to a day in `plan.js`. Bump `CHECKER_VERSION` in `problems.js` whenever checks get stricter, so earlier passes have to be re-run.

Give the problem an entry in `hints.js` too: three graded hints, a model solution and a short explanation. Then run `pnpm verify`. It uses the real checker in Node and fails if any starter does not compile or already passes, or if any model solution no longer passes its checks. Run it after changing any problem's checks as well; CI runs it on every push.

A "what does this print?" quiz question can carry `verify: { program, prints }`: the complete program it shows and its exact output. `pnpm verify` compiles and runs it, so the answer key cannot drift from what the code really does.

## Deploy to Vercel

Import the GitHub repository into Vercel and set **Root Directory** to `trainer`. Leave the framework preset as Vite, use `pnpm build` as the build command, and `dist` as the output directory. The build copies the compiler's WebAssembly assets into the static site. Git-connected Vercel projects can create a preview deployment for each pull request and deploy production when the configured production branch changes.

## Supabase cloud progress

The trainer can back up which problems are solved, and stores code only after the learner chooses **Submit checked code** (for the problem that is open). Problems solved on another device count toward progress. Email magic-link sign-in is provided by Supabase Auth. Each table uses row-level security so a signed-in learner can access only their own records. The browser uses a publishable key; never put a service-role key in the site.

1. Apply `supabase-schema.sql` in the Supabase project's SQL Editor. It is safe to run again, and an existing project must re-run it so the tables accept every problem id, not just `bit_ops` and `ring_buffer`.
2. In Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for Production, Preview, and Development, then redeploy.
3. In Supabase Auth URL configuration, allow the deployed Vercel site URL for redirects. The email provider must be enabled.

Copy `.env.example` to `.env.local` for local development. Cloud features remain unavailable without these variables; local exercises continue to work.

The compiler runtime is provided by [`@live-codes/clang-wasm`](https://www.npmjs.com/package/@live-codes/clang-wasm).
