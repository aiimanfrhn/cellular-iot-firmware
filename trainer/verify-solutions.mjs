/* ---------------------------------------------------------------------------
 * Runs every model solution in hints.js through the real checker, in Node,
 * and fails if any solution does not pass all of its problem's checks or if
 * a problem has no hints. It also checks each starter: it must compile, and
 * it must not already pass, or the checks would not be testing anything.
 * Quiz questions with a `verify` program are compiled and run too, and must
 * print exactly what their answer says.
 * Run it after editing problems.js, hints.js or quiz.js (CI runs it on every push):
 *
 *   pnpm verify                  checks hints.js
 *   node verify-solutions.mjs F  checks another module that exports HINTS
 * ------------------------------------------------------------------------- */
import { pathToFileURL } from 'node:url';
import { createCompiler } from '@live-codes/clang-wasm';
import { PROBLEMS } from './problems.js';
import { runChecks, runProgram } from './checks.js';
import { QUIZ } from './quiz.js';

const target = process.argv[2] ? pathToFileURL(process.argv[2]).href : new URL('./hints.js', import.meta.url).href;
const { HINTS } = await import(target);
const only = process.argv[2] ? PROBLEMS.filter((p) => HINTS[p.id]) : PROBLEMS;

const compiler = await createCompiler('c');
let failures = 0;
for (const problem of only) {
  const entry = HINTS[problem.id];
  const problems = [];
  const starter = await runChecks(compiler, problem.id, problem.filename, problem.starter);
  if (starter.phase === 'compile') problems.push(`the starter does not compile:\n${starter.output}`);
  else if (starter.passed) problems.push('the starter already passes every check');
  if (!entry) problems.push('no entry in HINTS');
  else {
    if (!Array.isArray(entry.hints) || entry.hints.length < 2) problems.push('needs at least two hints');
    if (typeof entry.explain !== 'string' || !entry.explain.trim()) problems.push('needs an explanation');
    const result = await runChecks(compiler, problem.id, problem.filename, entry.solution || '');
    if (!result.passed) {
      const bad = (result.checks || []).filter((c) => c.state !== 'pass').map((c) => `${c.label} (${c.state})`);
      problems.push(`${result.message}${bad.length ? ` ${bad.join('; ')}` : ''}${result.phase === 'compile' ? `\n${result.output}` : ''}`);
    }
    const program = await runProgram(compiler, problem.filename, entry.solution || '');
    if (program.state === 'error' || program.state === 'crash') problems.push(`its main() ${program.state === 'error' ? 'does not build' : 'crashes'}: ${program.output}`);
  }
  if (problems.length) { failures++; console.log(`FAIL ${problem.id}: ${problems.join(' | ')}`); }
  else console.log(`ok   ${problem.id}`);
}
const extra = Object.keys(HINTS).filter((id) => !PROBLEMS.some((p) => p.id === id));
if (extra.length) { failures++; console.log(`FAIL unknown problem ids in HINTS: ${extra.join(', ')}`); }

/* "What does this print?" quiz questions carry the program they show and its
   exact output; compile and run each one so the answer key cannot drift. */
let printed = 0;
if (!process.argv[2]) {
  for (const q of QUIZ.filter((q) => q.verify)) {
    const run = await runProgram(compiler, 'snippet.c', q.verify.program);
    if (run.state === 'ran' && run.output === q.verify.prints) { printed++; continue; }
    failures++;
    console.log(`FAIL quiz ${q.id}: ${run.state === 'ran' ? `printed ${JSON.stringify(run.output)}, expected ${JSON.stringify(q.verify.prints)}` : `${run.state}: ${run.output}`}`);
  }
  if (printed) console.log(`ok   ${printed} quiz answers confirmed by running their code`);
}
console.log(failures ? `\n${failures} problem(s) failed.` : `\nAll ${only.length} starters compile and fail, and all ${only.length} solutions pass.`);
process.exit(failures ? 1 : 0);
