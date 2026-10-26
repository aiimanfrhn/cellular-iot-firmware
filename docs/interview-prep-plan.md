# Interview Prep Plan

A six-week plan for embedded and firmware software interviews in Singapore, built around the [Embedded C Trainer](../trainer/). It assumes 8–10 hours a week; stretch it if your weeks are shorter. Every problem and guide named here is in the trainer.

Each week has the same rhythm:

- **Study**: read the named study guides, then take their quizzes until every answer is right.
- **Solve**: do the problems under their target time. Use hints only after a real attempt, and if you needed the solution, redo the problem from scratch two days later.
- **Explain**: answer each problem's follow-up questions out loud, as if an interviewer had asked.
- **Log**: add a short entry to the [learning log](learning-log.md).

## Week 1: C, bits and registers

- [ ] Study: *C and the compiler*, *Pointers and arrays*
- [ ] Solve: bit operations, count bits and powers of two, register bit fields, reverse bits and swap bytes, highest set bit and next power of two, BCD for an RTC chip
- [ ] Be able to explain: `volatile`, integer promotion, why `1u << 31` is safe and `1 << 31` is not

## Week 2: Memory

- [ ] Study: *Memory management*, *Embedded memory*
- [ ] Solve: align an address, memmove with overlap, aligned malloc and free, fixed-block memory pool, bitmap block allocator
- [ ] Be able to explain: stack, heap, `.data` and `.bss`; why firmware avoids `malloc` after start-up; what alignment buys and what it costs

## Week 3: Data structures and strings

- [ ] Study: the *Data structures and strings* area of the learning guide
- [ ] Solve: reverse a linked list, find a loop and the middle, safe string copy, split a CLI command, integer to string, reverse the words, ring buffer
- [ ] Be able to explain: why a ring buffer suits UART receive, and how to make it safe between an ISR and the main loop
- [ ] Take your first mock interview test to get a baseline score

## Week 4: Interrupts, timing and state machines

- [ ] Study: *Interrupts and concurrency*, *RTOS*
- [ ] Solve: poll a register with a timeout, software timers, button debouncer, fan control with hysteresis
- [ ] Be able to explain: what may and may not happen in an ISR, critical sections, mutex versus semaphore, priority inversion

## Week 5: Data, protocols and maths

- [ ] Study: *Hardware and buses*, *Reliability and boot*
- [ ] Solve: endian-safe byte access, CRC-16/CCITT, parse an unsigned integer, temperature sensor reading, saturating and Q15 arithmetic, moving average filter, lookup table interpolation
- [ ] Be able to explain: I²C versus SPI versus UART, what a watchdog protects against, fixed point versus floating point on a small MCU

## Week 6: Rehearse

- [ ] Take a mock interview test at the start and the end of the week. Aim for 80% or more.
- [ ] Study every topic the mock tests flag, and redo the problems you missed, timed.
- [ ] Read the learning guide end to end: recite the *Remember* lists and explain the *Understand* items out loud.
- [ ] Optional, for networking roles: the networking problems and the 14-day plan in the trainer.

After week 6, keep a weekly mock test going until your interviews, and redo any problem whose best time is over target.

## Job search, alongside the weeks above

- [ ] **Week 1:** collect 10–15 postings for embedded software, firmware and IoT roles in Singapore from job portals, LinkedIn and company career pages. Note the skills each one asks for.
- [ ] **Week 2:** map each common requirement to your experience or to work in this repository, and list the gaps.
- [ ] **Week 3:** update your CV with specific, measurable bullets for embedded C, modem and connectivity work, and certification projects.
- [ ] **Week 4:** prepare short stories for behavioural questions: a hard bug you found, a failure you recovered from, a disagreement you resolved, a team you led.
- [ ] **Week 5:** start applying. If you need a work pass to work in Singapore, check the Ministry of Manpower's current Employment Pass criteria early.
- [ ] **Week 6:** practise a five-minute walkthrough of a project you know well, covering the design, the trade-offs and what you would change.

The [firmware project plan](firmware-project-plan.md) is the natural next step: a working device gives you a concrete project to walk an interviewer through.
