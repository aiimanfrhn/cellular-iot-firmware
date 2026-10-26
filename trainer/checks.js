import { PROBLEMS } from './problems.js';

/* ---------------------------------------------------------------------------
 * Checker runner. Problem definitions (starter, prelude, checks) live in
 * problems.js. The harness runs every check (not just up to the first
 * failure) and prints one PASS/FAIL line per check so the page can show a
 * full checklist. Names in the harness start with trainer_ / TRAINER_ to
 * avoid clashing with learner code.
 * ------------------------------------------------------------------------- */
const CHECKS = Object.fromEntries(PROBLEMS.map((p) => [p.id, p]));

const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

/* Source-level rules such as "does not call memcpy". They run in JS on the
   learner's code with comments removed, so a mention in a comment is fine. */
function forbidChecks(spec, code) {
  const stripped = stripComments(code);
  return (spec.forbid || []).map(([label, pattern]) => ({ label, state: pattern.test(stripped) ? 'fail' : 'pass' }));
}

/* With no argument the program runs every check. With a check index as
   argv[1] it runs only that one; the worker uses this to find which check
   crashed, because a crash loses all output from the run. */
function harness({ prelude, checks }) {
  const lines = checks.map(([label, expr]) => `    TRAINER_CHECK("${label}", ${expr});`);
  return `#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
${prelude}
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
function makeSource(exercise, filename, code) {
  const spec = CHECKS[exercise];
  if (!spec) throw new Error('Unknown exercise.');
  const learner = `#define main learner_demo_main\n#line 1 "${filename}"\n${code}\n#undef main`;
  return `${learner}\n#line 1 "checker.c"\n${harness(spec)}`;
}

/* Read PASS/FAIL lines into a map of label -> 'pass' | 'fail'. */
function readResults(output) {
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

/* The UB sanitizer in trap mode turns undefined behaviour (a shift by 32,
   signed overflow, a NULL or misaligned pointer, an index past the end of an
   array) into a crash instead of a silently "working" result. It needs no
   runtime library, so it works in the WebAssembly build. */
const UB_CHECKS = 'shift-base,shift-exponent,signed-integer-overflow,null,alignment,array-bounds,integer-divide-by-zero,pointer-overflow,bool,return,vla-bound';
const COMPILE_ARGS = ['-std=c11', '-Wall', '-Wextra', '-Werror', '-pedantic', `-fsanitize=${UB_CHECKS}`, `-fsanitize-trap=${UB_CHECKS}`];
const CRASH_HINT = 'This usually means undefined behaviour: a shift by the full width or more, signed overflow, a NULL or misaligned pointer, or an index past the end of an array.';

const hasMain = (code) => /\bmain\s*\(/.test(stripComments(code));

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
    return { state: 'crash', output: `Runtime error: ${error?.message ?? error}\nAnything printed before the crash is lost. ${CRASH_HINT}` };
  }
}

/* Compile and run the checks. Returns the result object the page renders:
   { passed, phase, message, output, checks: [{label, state}], compiler }
   where state is 'pass' | 'fail' | 'crash' | 'skipped'. */
export async function runChecks(compiler, exercise, filename, code) {
  const spec = CHECKS[exercise];
  if (!spec) throw new Error(`Unknown exercise: ${exercise}`);
  const source = makeSource(exercise, filename, code);
  const rules = forbidChecks(spec, code);
  const total = spec.checks.length + rules.length;

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
    for (let i = 0; i < spec.checks.length; i++) {
      const label = spec.checks[i][0];
      try {
        const single = await compiler.run(source, '', { compileArgs: COMPILE_ARGS, args: [String(i)] });
        checks.push({ label, state: readResults(single.output).get(label) || 'crash' });
      } catch (_) {
        checks.push({ label, state: 'crash' });
      }
    }
    checks.push(...rules);
    const crashed = checks.filter((c) => c.state === 'crash').length;
    return {
      passed: false, phase: 'crash',
      message: `Your program crashed in ${crashed} of ${total} checks. ${CRASH_HINT}`,
      output: `Runtime error: ${crash?.message ?? crash}`, checks, compiler: '',
    };
  }

  const seen = readResults(run.output);
  const checks = [...spec.checks.map(([label]) => ({ label, state: seen.get(label) || 'skipped' })), ...rules];
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
