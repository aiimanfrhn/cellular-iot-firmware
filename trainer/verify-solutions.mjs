/* ---------------------------------------------------------------------------
 * Runs every model solution in hints.js through the real checker, in Node,
 * and fails if any solution does not pass all of its problem's checks or if
 * a problem has no hints. Run it after editing problems.js or hints.js:
 *
 *   pnpm verify                  checks hints.js
 *   node verify-solutions.mjs F  checks another module that exports HINTS
 * ------------------------------------------------------------------------- */
import { pathToFileURL } from 'node:url';
import { createCompiler } from '@live-codes/clang-wasm';
import { PROBLEMS } from './problems.js';
import { runChecks, runProgram } from './checks.js';

const target = process.argv[2] ? pathToFileURL(process.argv[2]).href : new URL('./hints.js', import.meta.url).href;
const { HINTS } = await import(target);
const only = process.argv[2] ? PROBLEMS.filter((p) => HINTS[p.id]) : PROBLEMS;

const compiler = await createCompiler('c');
let failures = 0;
for (const problem of only) {
  const entry = HINTS[problem.id];
  const problems = [];
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
console.log(failures ? `\n${failures} problem(s) failed.` : `\nAll ${only.length} solutions pass.`);
process.exit(failures ? 1 : 0);
