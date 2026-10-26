# Embedded C Interview Prep

Preparation for embedded and firmware software engineering interviews, aimed at roles in Singapore's automotive, semiconductor, consumer-electronics and industrial companies. The centre of the repository is the **Embedded C Trainer**: a practice site that runs in the browser, where a real C compiler checks your answers to classic embedded interview problems.

The project started as a 12-week cellular IoT firmware portfolio plan. Interview preparation became the main goal, with a six-week [interview prep plan](docs/interview-prep-plan.md); the hands-on firmware plan is kept for later (see [Hands-on firmware project](#hands-on-firmware-project)).

## Embedded C Trainer

The trainer lives in [`trainer/`](trainer/). Everything runs in the browser: clang compiled to WebAssembly builds and runs your code, so there is nothing to install and your code is not uploaded.

- **36 coding problems** in eight topics: bits and registers, memory and pointers, lists and strings, data and protocols, math and signal processing, networking, platform and hardware, and state machines (11 easy, 21 medium, 4 hard). Each problem has a target time, the follow-up questions interviewers ask next, three graded hints and a model solution.
- **Strict checking**: C11 with warnings as errors and undefined-behaviour traps, so a shift by 32 or a signed overflow fails instead of silently working. Compiler errors are marked on the line in the editor.
- **Mock interview test**: 10 concept questions and 2 coding problems under one clock, with no hints until you submit, then a scorecard, the questions to review and what to study next.
- **Study material**: nine study guides with 90 quiz questions on C, pointers, memory, interrupts, RTOS, embedded memory, buses, reliability and networking, plus a one-page learning guide of what to remember and understand.
- **Timed attempts** on single problems, a **C sandbox** with shareable links, a **14-day plan** for network platform roles, light and dark themes, and progress export and import.

Run it locally (Node.js 22.12 or later):

```sh
cd trainer
pnpm install
pnpm dev
```

[`trainer/README.md`](trainer/README.md) covers every feature, the offline one-file build, how checking works, how to add a problem, and deployment.

### A suggested way to use it

The [interview prep plan](docs/interview-prep-plan.md) lays this out week by week, with a job-search track alongside. In short:

1. Start with the welcome page, or the study guide for any topic that feels rusty.
2. Work through the problems by topic. Solve each one under its target time, using hints only when stuck, then answer its follow-up questions out loud.
3. Take the mock interview test every week or two. Study the topics it flags and retry the problems you missed.
4. Before an interview, read the learning guide end to end and take one more mock test.

## Repository layout

| Path | What it holds |
|---|---|
| [`trainer/`](trainer/) | The Embedded C Trainer web app |
| [`docs/interview-prep-plan.md`](docs/interview-prep-plan.md) | The six-week interview prep plan |
| [`docs/learning-log.md`](docs/learning-log.md) | A weekly log of progress, scores and weak spots |
| [`docs/architecture.md`](docs/architecture.md) | How the trainer is built, and notes for the firmware project |
| [`docs/firmware-project-plan.md`](docs/firmware-project-plan.md) | The follow-on hands-on firmware project plan |
| `firmware/`, `tests/`, `tools/` | Placeholders for the firmware project |

## Hands-on firmware project

The original plan was to build device firmware that reads a sensor, controls a cellular modem over UART, recovers from failures and sends telemetry over HTTP or MQTT. It covers MCU peripherals, an AT-command driver and state machine, an RTOS, a watchdog and Python test tooling, week by week in the [firmware project plan](docs/firmware-project-plan.md). Nothing has been built yet, and `firmware/`, `tests/` and `tools/` only hold READMEs. It is a good next step after the trainer: a working project gives you something concrete to walk through in an interview.

## Safety and confidentiality

This is a personal learning project. Do not add employer source code, customer or carrier certification data, credentials, proprietary AT-command extensions or confidential module details. Use public documentation only. Never commit secrets: use local environment variables or an untracked configuration file such as `trainer/.env.local`.
