/* ---------------------------------------------------------------------------
 * Checker programs. Each exercise lists its checks as [label, C expression];
 * the harness runs every check (not just up to the first failure) and prints
 * one PASS/FAIL line per check so the page can show a full checklist.
 * Names in the harness start with trainer_ / TRAINER_ to avoid clashing with
 * learner code. Labels must not contain double quotes.
 * ------------------------------------------------------------------------- */
export const CHECKS = {
  bit_ops: {
    prelude: String.raw`
#include <limits.h>
#include <stdio.h>
#define TRAINER_TOP_BIT ((unsigned int)(sizeof(unsigned int) * CHAR_BIT - 1u))
`,
    checks: [
      ['set_bit sets the bit', 'set_bit(0u, 3u) == 0x08u'],
      ['set_bit keeps other bits', 'set_bit(0xF0u, 1u) == 0xF2u'],
      ['set_bit on a set bit changes nothing', 'set_bit(0x08u, 3u) == 0x08u'],
      ['clear_bit clears the bit', 'clear_bit(0x08u, 3u) == 0u'],
      ['clear_bit keeps other bits', 'clear_bit(0xFFu, 3u) == 0xF7u'],
      ['toggle_bit turns a bit on', 'toggle_bit(0u, 3u) == 0x08u'],
      ['toggle_bit turns a bit off', 'toggle_bit(0x08u, 3u) == 0u'],
      ['toggle_bit keeps other bits', 'toggle_bit(0xA5u, 0u) == 0xA4u'],
      ['test_bit finds a set bit', 'test_bit(0x08u, 3u) != 0'],
      ['test_bit reports a clear bit as 0', 'test_bit(0xF7u, 3u) == 0'],
      ['highest bit: set and test', 'test_bit(set_bit(0u, TRAINER_TOP_BIT), TRAINER_TOP_BIT) != 0'],
      ['highest bit: clear', 'clear_bit(UINT_MAX, TRAINER_TOP_BIT) == UINT_MAX >> 1'],
    ],
  },
  ring_buffer: {
    prelude: String.raw`
#include <stdio.h>
#include <string.h>
static int trainer_empty_pop(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 2u);
    return !rb_pop(&rb, &out);
}
static int trainer_init_resets(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb;
    memset(&rb, 0xA5, sizeof rb);
    rb_init(&rb, storage, 2u);
    return !rb_pop(&rb, &out) && rb_push(&rb, 7u) && rb_pop(&rb, &out) && out == 7u;
}
static int trainer_fifo(void) {
    uint8_t storage[3] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 3u);
    if (!rb_push(&rb, 11u) || !rb_push(&rb, 22u)) return 0;
    if (!rb_pop(&rb, &out) || out != 11u) return 0;
    if (!rb_pop(&rb, &out) || out != 22u) return 0;
    return 1;
}
static int trainer_full(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 2u);
    if (!rb_push(&rb, 1u) || !rb_push(&rb, 2u) || rb_push(&rb, 3u)) return 0;
    if (!rb_pop(&rb, &out) || out != 1u) return 0;
    if (!rb_pop(&rb, &out) || out != 2u) return 0;
    return 1;
}
static int trainer_wraparound(void) {
    uint8_t storage[3] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 3u);
    if (!rb_push(&rb, 10u) || !rb_push(&rb, 20u) || !rb_push(&rb, 30u)) return 0;
    if (!rb_pop(&rb, &out) || out != 10u || !rb_push(&rb, 40u)) return 0;
    if (!rb_pop(&rb, &out) || out != 20u) return 0;
    if (!rb_pop(&rb, &out) || out != 30u) return 0;
    if (!rb_pop(&rb, &out) || out != 40u) return 0;
    return 1;
}
static int trainer_drain_refill(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 2u);
    for (int round = 0; round < 3; round++) {
        if (!rb_push(&rb, 1u) || !rb_push(&rb, 2u) || rb_push(&rb, 3u)) return 0;
        if (!rb_pop(&rb, &out) || out != 1u || !rb_pop(&rb, &out) || out != 2u) return 0;
        if (rb_pop(&rb, &out)) return 0;
    }
    return 1;
}
static int trainer_long_run(void) {
    /* Push three, pop two, many times: the indices wrap again and again. */
    uint8_t storage[4] = {0}, out = 0, next_in = 0, next_out = 0; RingBuffer rb; rb_init(&rb, storage, 4u);
    for (int step = 0; step < 200; step++) {
        if (rb_push(&rb, next_in)) next_in++;
        if (rb_push(&rb, next_in)) next_in++;
        if (rb_push(&rb, next_in)) next_in++;
        for (int i = 0; i < 2; i++) {
            if (!rb_pop(&rb, &out) || out != next_out) return 0;
            next_out++;
        }
    }
    return 1;
}
static int trainer_zero_capacity(void) {
    uint8_t storage[1] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 0u);
    return !rb_push(&rb, 1u) && !rb_pop(&rb, &out);
}
`,
    checks: [
      ['pop from an empty buffer fails', 'trainer_empty_pop()'],
      ['rb_init resets every field', 'trainer_init_resets()'],
      ['FIFO order', 'trainer_fifo()'],
      ['full buffer rejects extra item', 'trainer_full()'],
      ['wraparound preserves order', 'trainer_wraparound()'],
      ['drain and refill repeatedly', 'trainer_drain_refill()'],
      ['long run keeps order across many wraps', 'trainer_long_run()'],
      ['zero capacity is safe', 'trainer_zero_capacity()'],
    ],
  },
};

/* With no argument the program runs every check. With a check index as
   argv[1] it runs only that one; the worker uses this to find which check
   crashed, because a crash loses all output from the run. */
function harness({ prelude, checks }) {
  const lines = checks.map(([label, expr]) => `    TRAINER_CHECK("${label}", ${expr});`);
  return `${prelude}
#define TRAINER_CHECK(label, expression) do { \\
    if (trainer_only < 0 || trainer_only == trainer_index) { \\
        if (expression) printf("PASS: %s\\n", label); \\
        else { printf("FAIL: %s\\n", label); trainer_failed++; } \\
        fflush(stdout); \\
    } \\
    trainer_index++; \\
} while (0)
int main(int argc, char **argv) {
    int trainer_failed = 0, trainer_index = 0, trainer_only = -1;
    if (argc > 1) {
        trainer_only = 0;
        for (const char *p = argv[1]; *p; p++) trainer_only = trainer_only * 10 + (*p - '0');
    }
${lines.join('\n')}
    return trainer_failed ? 1 : 0;
}
`;
}

/* #line directives make compiler diagnostics point at the learner's own file
   and line numbers, matching the editor gutter. The learner's own main (if
   any) is renamed so it does not clash with the checker's; runProgram runs
   it separately. */
export function makeSource(exercise, filename, code) {
  const spec = CHECKS[exercise];
  if (!spec) throw new Error('Unknown exercise.');
  const learner = `#define main learner_demo_main\n#line 1 "${filename}"\n${code}\n#undef main`;
  return `${learner}\n#line 1 "checker.c"\n${harness(spec)}`;
}

/* Read PASS/FAIL lines into a map of label -> 'pass' | 'fail'. */
export function readResults(output) {
  const seen = new Map();
  for (const line of output.split('\n')) {
    const m = /^(PASS|FAIL): (.*)$/.exec(line);
    if (m) seen.set(m[2], m[1] === 'PASS' ? 'pass' : 'fail');
  }
  return seen;
}

/* Strip the checker's PASS/FAIL lines; whatever is left is the learner's own
   printf output or a runtime message, which is worth showing. */
function extraOutput(output) {
  return output.split('\n').filter((line) => !/^(PASS|FAIL): /.test(line)).join('\n').trim();
}

const COMPILE_ARGS = ['-std=c11', '-Wall', '-Wextra', '-Werror', '-pedantic'];
const CRASH_HINT = 'Look for a NULL or out-of-bounds pointer, or an index that never wraps back to 0.';

/* Compile and run the checks. Returns the result object the page renders:
   { passed, phase, message, output, checks: [{label, state}], compiler }
   where state is 'pass' | 'fail' | 'crash' | 'skipped'. */
const hasMain = (code) => /\bmain\s*\(/.test(code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''));

/* Compile and run the learner's code on its own, so they can see what their
   main() prints. Returns { state, output, exitCode?, ms? } where state is
   'none' (no main), 'ran', 'error' (did not build) or 'crash'. */
export async function runProgram(compiler, filename, code) {
  if (!hasMain(code)) return { state: 'none', output: '' };
  try {
    const run = await compiler.run(`#line 1 "${filename}"\n${code}`, '', { compileArgs: COMPILE_ARGS });
    if (run.errors.length) return { state: 'error', output: run.errors.join('\n') };
    return { state: 'ran', output: run.output, exitCode: run.exitCode, ms: Math.round(run.runMs ?? 0) };
  } catch (error) {
    // A trap discards everything the program printed, so only the error is left.
    return { state: 'crash', output: `Runtime error: ${error?.message ?? error}\nAnything printed before the crash is lost. Look for abort(), a bad pointer, or an out-of-bounds index.` };
  }
}

export async function runChecks(compiler, exercise, filename, code) {
  const spec = CHECKS[exercise];
  if (!spec) throw new Error(`Unknown exercise: ${exercise}`);
  const source = makeSource(exercise, filename, code);
  const total = spec.checks.length;

  let run, crash = null;
  try {
    run = await compiler.run(source, '', { compileArgs: COMPILE_ARGS });
  } catch (error) {
    crash = error;   // a WebAssembly trap throws, and the run's output is lost
  }
  const timing = run ? `${Math.round(run.compileMs)} ms compile${run.runMs == null ? '' : ` · ${Math.round(run.runMs)} ms run`}` : '';

  if (run && run.errors.length) {
    return {
      passed: false, phase: 'compile',
      message: 'Fix the first error below and run again; later errors are often caused by the first one.',
      output: run.errors.join('\n'), checks: [], compiler: timing,
    };
  }

  if (crash) {
    // Run each check on its own (the build is cached, so this is quick) to
    // find which ones crash and still report the rest.
    const checks = [];
    for (let i = 0; i < total; i++) {
      const label = spec.checks[i][0];
      try {
        const single = await compiler.run(source, '', { compileArgs: COMPILE_ARGS, args: [String(i)] });
        checks.push({ label, state: readResults(single.output).get(label) || 'crash' });
      } catch (_) {
        checks.push({ label, state: 'crash' });
      }
    }
    const crashed = checks.filter((c) => c.state === 'crash').length;
    return {
      passed: false, phase: 'crash',
      message: `Your program crashed in ${crashed} of ${total} checks. ${CRASH_HINT}`,
      output: String(crash?.message ?? crash), checks, compiler: '',
    };
  }

  const seen = readResults(run.output);
  const checks = spec.checks.map(([label]) => ({ label, state: seen.get(label) || 'skipped' }));
  const passedCount = checks.filter((c) => c.state === 'pass').length;
  const failedCount = checks.filter((c) => c.state === 'fail').length;
  const passed = run.exitCode === 0 && passedCount === total;
  let message;
  if (passed) message = `All ${total} checks passed.`;
  else if (passedCount + failedCount < total) message = `The program stopped after ${passedCount + failedCount} of ${total} checks (exit code ${run.exitCode}). ${CRASH_HINT}`;
  else if (!failedCount) message = `Every check passed, but the program exited with code ${run.exitCode}.`;
  else message = `${failedCount} of ${total} ${total === 1 ? 'check' : 'checks'} failed.`;
  return { passed, phase: 'run', message, output: extraOutput(run.output), checks, compiler: timing };
}
