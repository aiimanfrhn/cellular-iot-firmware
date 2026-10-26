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

A **14-day training plan** (the button under the introduction) orders the problems for network platform software roles, such as C developers on switches, routers and access points. It adds study questions on networking, Linux, concurrency, debugging and behavioural interviews, which you tick off as you go. Each day starts with its own study guide and a 5-question quiz, which counts as done once every question has been answered correctly. The plan lives in `plan.js`, and each day's guide and quiz in `plan-guide.js` (one entry per day, in the same order).

**Study guide and quiz** (the button under the plan) covers the spoken part of the interview in nine topics: C and the compiler, pointers and arrays, memory management, interrupts and concurrency, RTOS, embedded memory, hardware and buses, reliability and boot, and networking. Each topic opens on a study guide to read first, with notes, code examples and points worth saying in an interview, then 10 multiple-choice questions with explanations (90 in all, plus a shuffled mixed review). Keys 1–4 choose an answer and Enter checks it. After a topic you can retry just the questions you missed or go back to the guide. Notes live in `guide.js` and questions in `quiz.js`; each guide should cover what its questions ask.

The **Learning guide** page sums up everything in 12 areas, each split into *what to remember* (facts, numbers and syntax to know by heart) and *what to understand* (ideas to explain in your own words), with links to the matching guides, quizzes and plan days. A filter shows just one of the two lists. It lives in `notes.js`; update it when the guides change.

The **C sandbox** is a free-form editor for trying things out: write any C program, give it optional stdin, and choose **Run** (Ctrl+Enter) to see its output and exit code. Nothing is checked. It compiles with the same strict flags and undefined-behaviour traps as the problems, and its code is saved in this browser. **Copy share link** puts the code and input into a link (compressed into the part after `#`, so nothing is uploaded); whoever opens it sees that code in their sandbox, and their own saved draft is only replaced once they edit it.

Every problem has a **Stuck?** box with three hints, revealed one at a time from a nudge to nearly the code, and then a model solution with a short explanation that can be loaded into the editor. They live in `hints.js`.

The **theme** button in the header switches between the system setting, light and dark.

A first visit opens a **welcome page** that asks what you are here for (learning C, firmware interviews, network platform roles, or just trying C) and opens the matching part of the site. The *New here?* link in the sidebar brings it back.

**Start timed attempt** turns a problem into a mock interview: it counts down from the problem's target time, hides the hints, and records your time when the checks pass. The best time shows next to the target.

Each problem has a difficulty, a target time, and the follow-up questions interviewers commonly ask next. Clang compiles and runs the checks inside a WebAssembly worker in the browser, so no server or native C toolchain is needed, and your source code is not sent anywhere. The first visit downloads about 28 MB of compiler assets; after that the browser can cache them.

## Run locally

Requirements: Node.js 22.12 or later. From this folder, run:

```sh
pnpm install
pnpm dev
```

Open the local URL shown by Vite. Use `pnpm build` to create a static production site in `dist/`.

### One-file version for offline study

`pnpm build:single` writes the whole trainer (problems, training plan, learning guide, study guides, quizzes and checker) into one file, `dist-single/embedded-c-trainer.html`. Open it straight from disk in Chrome, Edge or Firefox; no server is needed. The ~28 MB compiler runtime is too large to embed, so the file downloads it from jsDelivr the first time you run checks and the browser caches it. Supabase sync is not included; progress stays in that browser. Rebuild it after changing `problems.js`, `hints.js`, `plan.js`, `plan-guide.js`, `guide.js`, `quiz.js` or `notes.js`.

## Workflow

1. Pick a problem from the sidebar (or the picker on a phone), edit the C code, and choose **Run checks** (Ctrl+Enter).
2. Fix compiler errors, failing checks, or undefined-behaviour crashes. Lines with errors are marked in the editor's gutter, and each `file.c:line:col` in the output jumps to that spot. Solved problems are ticked and counted by difficulty.
3. Read the follow-up questions and practise answering them out loud.
4. Choose **Download .c** to keep your solution, for example in your portfolio repository.

Drafts, results, ticked plan items, quiz answers, hints, best times and sandbox code live in this browser's local storage. Clearing browser site data removes them, so use **Export progress** in the progress card to save a backup file, and **Import from file** to restore it here or on another computer. The compiler runtime is provided by [`@live-codes/clang-wasm`](https://www.npmjs.com/package/@live-codes/clang-wasm).

## How checking works

- Code is compiled as strict C11 with `-Wall -Wextra -Werror -pedantic` and clang's undefined-behaviour sanitizer in trap mode. Shifting by the full width, signed overflow, NULL or misaligned pointers, and out-of-bounds array indexes crash instead of silently "working".
- Every check runs and the page shows a pass/fail checklist. If the program crashes, the checker re-runs each check on its own to report which ones crashed.
- Some problems also have source rules, such as "does not call memcpy or memmove", which are checked on the code with comments removed.
- After the checks, the learner's own `main` (if any) is compiled and run on its own, and its output and exit code appear in the **Program output** panel.

## Adding a problem

Problems live in `problems.js`. Each entry has the text shown on the page, a starter (which must compile), a C `prelude` with test helpers, `checks` as `[label, C expression]` pairs, and optional `forbid` rules. The sidebar, picker and progress card are generated from this list. Add the new id to a day in `plan.js` so the training plan includes it. The checker runner is `checks.js`. Bump `CHECKER_VERSION` in `problems.js` whenever checks get stricter, so earlier passes have to be re-run.

Give the problem an entry in `hints.js` too: three graded hints, a model solution and a short explanation. Then run `pnpm verify`, which compiles every model solution with the real checker in Node and fails if any of them no longer passes its problem's checks. Run it after changing any problem's checks as well.

## Deploy to Vercel

Import the GitHub repository into Vercel and set **Root Directory** to `trainer`. Leave the framework preset as Vite, use `pnpm build` as the build command, and `dist` as the output directory. The build copies the compiler's WebAssembly assets into the static site. Git-connected Vercel projects can create a preview deployment for each pull request and deploy production when the configured production branch changes.


## Supabase cloud progress

The trainer can back up which problems are solved, and stores code only after the learner chooses **Submit checked code** (for the problem that is open). Problems solved on another device count toward progress. Email magic-link sign-in is provided by Supabase Auth. Each table uses row-level security so a signed-in learner can access only their own records. The browser uses a publishable key; never put a service-role key in the site.

1. Apply `supabase-schema.sql` in the Supabase project's SQL Editor. It is safe to run again, and an existing project must re-run it so the tables accept every problem id, not just `bit_ops` and `ring_buffer`.
2. In Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for Production, Preview, and Development, then redeploy.
3. In Supabase Auth URL configuration, allow the deployed Vercel site URL for redirects. The email provider must be enabled.

Copy `.env.example` to `.env.local` for local development. Cloud features remain unavailable without these variables; local exercises continue to work.
