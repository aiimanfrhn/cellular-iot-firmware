(() => {
  /* ---------------------------------------------------------------------------
   * Exercise data. Add new exercises here; tabs, progress and labels read from
   * this object, so nothing else needs to change for a new Week 1 exercise.
   * ------------------------------------------------------------------------- */
  const EXERCISES = {
    bit_ops: {
      kicker: 'EXERCISE 1 · C BASICS', title: 'Bit operations', filename: 'bit_ops.c',
      description: 'Bit masks show up everywhere in firmware: registers, protocol flags, and compact state. Implement these four helpers safely using unsigned values.',
      requirements: '<ul><li>Implement <code>set_bit</code>, <code>clear_bit</code>, <code>toggle_bit</code>, and <code>test_bit</code>.</li><li>Assume <code>position</code> is within the width of <code>unsigned int</code>; do not use signed shifts.</li><li>Keep the demo <code>main</code> or remove it. The checker tests your functions directly.</li></ul>',
      starter: `#include <limits.h>\n#include <stdio.h>\n\n/* Return value with bit position set to 1. */\nunsigned int set_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: set the selected bit */\n    return value;\n}\n\n/* Return value with bit position cleared to 0. */\nunsigned int clear_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: clear the selected bit */\n    return value;\n}\n\n/* Return value with bit position inverted. */\nunsigned int toggle_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: toggle the selected bit */\n    return value;\n}\n\n/* Return nonzero when the selected bit is set, otherwise return 0. */\nint test_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: test the selected bit */\n    return 0;\n}\n\nint main(void)\n{\n    unsigned int value = 0u;\n    value = set_bit(value, 3u);\n    printf("bit 3 set: %s\\n", test_bit(value, 3u) ? "yes" : "no");\n    return 0;\n}\n`
    },
    ring_buffer: {
      kicker: 'EXERCISE 2 · DATA STRUCTURES', title: 'Ring buffer', filename: 'ring_buffer.c',
      description: 'Implement a fixed-size byte FIFO like the kind used between a UART interrupt and a parser. Use the supplied structure and function signatures.',
      requirements: '<ul><li><code>rb_init</code> creates an empty buffer and stores the caller-provided storage.</li><li><code>rb_push</code> returns false if full; <code>rb_pop</code> returns false if empty.</li><li>Support wraparound, preserve FIFO order, and safely reject zero capacity.</li></ul>',
      starter: `#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n\n/* The checker provides this API declaration. Implement all three functions. */\ntypedef struct RingBuffer {\n    uint8_t *data;\n    size_t capacity;\n    size_t head;\n    size_t tail;\n    size_t count;\n} RingBuffer;\n\nvoid rb_init(RingBuffer *rb, uint8_t *storage, size_t capacity)\n{\n    /* TODO: initialize an empty buffer; capacity may be zero */\n    (void)rb;\n    (void)storage;\n    (void)capacity;\n}\n\nbool rb_push(RingBuffer *rb, uint8_t value)\n{\n    /* TODO: append one byte; return false when full or capacity is zero */\n    (void)rb;\n    (void)value;\n    return false;\n}\n\nbool rb_pop(RingBuffer *rb, uint8_t *out)\n{\n    /* TODO: remove oldest byte; return false when empty */\n    (void)rb;\n    (void)out;\n    return false;\n}\n`
    }
  };
  const ORDER = Object.keys(EXERCISES);
  const KEY = 'embedded-c-trainer-week1-v1';   // unchanged, so existing drafts load
  const CHECK_TIMEOUT_MS = 30000;              // compile + run budget per check
  const INDENT = '    ';

  const $ = (id) => document.getElementById(id);
  const editor = $('code-editor');

  /* ---------------------------------------------------------------- storage */
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { saved = {}; }
  if (!saved.code) saved.code = {};
  if (!saved.results) saved.results = {};
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (_) {} }

  let active = ORDER[0];
  const codeFor = (id) => saved.code[id] ?? EXERCISES[id].starter;
  const isCurrentPass = (id) => { const r = saved.results[id]; return !!(r && r.passed && codeFor(id) === r.code); };

  /* ------------------------------------------------------------ checker state
   * pending remembers WHICH exercise was submitted, so a result is never filed
   * under whatever tab happens to be open when the worker answers. */
  let checker = null;
  let compilerReady = false;
  let pending = null;      // { exercise, code }
  let watchdog = null;

  function setStatus(state, text) {
    const wrap = $('server-status').parentElement;
    wrap.classList.toggle('ready', state === 'ready');
    wrap.classList.toggle('error', state === 'error');
    $('server-status').textContent = text;
  }

  function updateRunButton() {
    const button = $('run-button');
    if (pending) { button.disabled = true; button.innerHTML = '<span>…</span> Checking'; }
    else if (!checker) { button.disabled = false; button.innerHTML = '<span>↻</span> Reload compiler'; }
    else if (!compilerReady) { button.disabled = true; button.innerHTML = '<span>…</span> Loading compiler'; }
    else { button.disabled = false; button.innerHTML = '<span>▶</span> Run checks'; }
  }

  function startChecker() {
    compilerReady = false;
    checker = new Worker(new URL('./compiler-worker.js', import.meta.url), { type: 'module' });
    checker.addEventListener('message', onWorkerMessage);
    checker.addEventListener('error', onWorkerError);
    setStatus('loading', 'Loading browser compiler · first load downloads about 28 MB');
    updateRunButton();
  }

  function onWorkerMessage(event) {
    if (event.target !== checker) return;   // ignore a terminated worker
    const data = event.data;
    if (data.type === 'ready') { compilerReady = true; setStatus('ready', 'Browser compiler ready · no setup needed'); updateRunButton(); return; }
    if (data.type === 'loading') { setStatus('loading', data.message); return; }
    if (data.type === 'result') finishCheck(data.result);
  }

  function onWorkerError(event) {
    if (event.target !== checker) return;
    event.preventDefault();
    checker = null; compilerReady = false;
    setStatus('error', 'Could not load browser compiler');
    if (pending) finishCheck({ passed: false, phase: 'setup', message: 'The browser compiler stopped. Select Reload compiler to try again.', output: '' });
    updateRunButton();
  }

  function onTimeout() {
    if (!pending) return;
    checker.terminate();   // the only way to stop a stuck worker
    checker = null;
    finishCheck({
      passed: false, phase: 'timeout',
      message: `Your program did not finish within ${CHECK_TIMEOUT_MS / 1000} seconds. Look for a loop whose exit condition is never reached, for example a ring buffer index that never wraps. The compiler is restarting.`,
      output: ''
    });
    startChecker();
  }

  function finishCheck(result) {
    clearTimeout(watchdog); watchdog = null;
    if (!pending) return;
    const { exercise, code } = pending;
    pending = null;
    saved.results[exercise] = { exercise, passed: !!result.passed, code, at: new Date().toISOString() };
    persist();
    if (exercise === active) showResult(result);
    renderProgress();
    updateRunButton();
  }

  function runCheck() {
    if (!checker) { startChecker(); return; }
    if (!compilerReady || pending) return;
    pending = { exercise: active, code: editor.value };
    checker.postMessage({ type: 'check', exercise: pending.exercise, code: pending.code });
    watchdog = setTimeout(onTimeout, CHECK_TIMEOUT_MS);
    showChecking();
    updateRunButton();
  }

  /* -------------------------------------------------------------- rendering */
  function dateLabel(value) {
    if (!value) return 'Not started';
    const then = new Date(value), now = new Date();
    return then.toDateString() === now.toDateString()
      ? `Today, ${then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : then.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function updateLines() {
    const n = Math.max(1, editor.value.split('\n').length);
    $('line-numbers').textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
  }

  function renderProgress() {
    const count = ORDER.length;
    const passed = ORDER.filter(isCurrentPass).length;
    const left = count - passed;
    $('progress-count').textContent = `${passed} / ${count}`;
    $('passed-count').textContent = passed;
    $('progress-fill').style.width = `${(passed / count) * 100}%`;
    $('progress-caption').textContent = left === 0 ? 'Week 1 complete. Nice work!' : `Pass ${left} more ${left === 1 ? 'check' : 'checks'} to complete this week.`;
    const week = $('week-state');
    week.textContent = left === 0 ? 'COMPLETE' : 'IN PROGRESS';
    week.closest('.week-item').classList.toggle('complete', left === 0);
    const dates = Object.values(saved.results).map((r) => r && r.at).filter(Boolean).sort();
    $('last-activity').textContent = dateLabel(dates[dates.length - 1] || saved.lastEdit);
    ORDER.forEach((id, i) => {
      const r = saved.results[id], ok = isCurrentPass(id);
      $(`tab-check-${id}`).textContent = ok ? '✓' : String(i + 1);
      const label = $(`tab-result-${id}`);
      label.textContent = pending && pending.exercise === id ? 'Checking…'
        : ok ? 'Passed' : r && r.passed ? 'Draft changed' : r ? 'Needs work' : 'Not checked';
      label.classList.toggle('passed-text', ok);
      document.querySelector(`[data-exercise="${id}"]`).classList.toggle('passed', ok);
    });
  }

  function setPanel(state, icon, title, message, output = '', compiler = '') {
    $('result-panel').className = `result-panel ${state}`;
    $('result-icon').textContent = icon;
    $('result-title').textContent = title;
    $('result-message').textContent = message;
    $('result-output').textContent = output;
    $('result-output').hidden = !output;
    $('result-compiler').textContent = compiler;
  }

  const TITLES = { compile: 'Compilation failed', setup: 'Checker needs setup', timeout: 'Check timed out' };
  function showResult(result) {
    setPanel(result.passed ? 'success' : 'failure', result.passed ? '✓' : '!',
      result.passed ? 'All checks passed' : (TITLES[result.phase] || 'Some checks failed'),
      result.message || 'Check complete.', result.output || '', result.compiler || '');
  }
  function showChecking() {
    setPanel('idle', '…', 'Compiling and running tests…', 'The compiler runs in your browser. Your source is not uploaded.');
  }
  function showIdle() {
    setPanel('idle', '↳', 'Ready when you are', 'Run the checks to compile your code and see exactly what passes. Shortcut: Ctrl+Enter (⌘+Enter on Mac).');
  }

  function selectExercise(id) {
    active = id;
    document.querySelectorAll('.exercise-tab').forEach((btn) => {
      const selected = btn.dataset.exercise === active;
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-selected', String(selected));
    });
    const meta = EXERCISES[id];
    $('exercise-kicker').textContent = meta.kicker;
    $('exercise-title').textContent = meta.title;
    $('exercise-description').textContent = meta.description;
    $('requirements').innerHTML = meta.requirements;
    editor.value = codeFor(id);
    updateLines();
    if (pending && pending.exercise === id) showChecking(); else showIdle();
    $('save-hint').textContent = saved.code[id] ? 'Draft restored from this browser.' : 'Edits stay in this browser until you download them.';
    renderProgress();
  }

  /* ----------------------------------------------------------------- editor
   * execCommand('insertText') keeps the browser's undo history (Ctrl+Z),
   * which setRangeText wipes. Falls back to setRangeText if unsupported. */
  function insertText(text) {
    editor.focus();
    if (!document.execCommand('insertText', false, text)) {
      editor.setRangeText(text, editor.selectionStart, editor.selectionEnd, 'end');
      editor.dispatchEvent(new Event('input'));
    }
  }

  function outdentCurrentLine() {
    const v = editor.value, pos = editor.selectionStart;
    const lineStart = v.lastIndexOf('\n', pos - 1) + 1;
    const spaces = /^ {0,4}/.exec(v.slice(lineStart))[0].length;
    if (!spaces) return;
    editor.setSelectionRange(lineStart, lineStart + spaces);
    if (!document.execCommand('delete')) {
      editor.setRangeText('', lineStart, lineStart + spaces, 'start');
      editor.dispatchEvent(new Event('input'));
    }
    const back = Math.max(lineStart, pos - spaces);
    editor.setSelectionRange(back, back);
  }

  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); runCheck(); return; }
    if (event.key === 'Tab') { event.preventDefault(); if (event.shiftKey) outdentCurrentLine(); else insertText(INDENT); return; }
    if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
      // Keep the current indentation; add one level after an opening brace.
      const v = editor.value, pos = editor.selectionStart;
      const line = v.slice(v.lastIndexOf('\n', pos - 1) + 1, pos);
      const indent = /^\s*/.exec(line)[0] + (/\{\s*$/.test(line) ? INDENT : '');
      event.preventDefault();
      insertText('\n' + indent);
    }
  });

  editor.addEventListener('input', () => {
    saved.code[active] = editor.value;
    saved.lastEdit = new Date().toISOString();
    persist(); updateLines(); renderProgress();
    $('save-hint').textContent = 'Saved in this browser.';
  });
  editor.addEventListener('scroll', () => { $('line-numbers').scrollTop = editor.scrollTop; });

  /* ---------------------------------------------------------------- buttons */
  document.querySelectorAll('.exercise-tab').forEach((btn) => btn.addEventListener('click', () => selectExercise(btn.dataset.exercise)));

  $('run-button').addEventListener('click', runCheck);

  $('reset-button').addEventListener('click', () => {
    const starter = EXERCISES[active].starter;
    if (editor.value !== starter && !confirm('Replace your draft with the starter code? Your current code for this exercise will be lost. Download it first if you want to keep it.')) return;
    editor.value = starter;
    saved.code[active] = starter;
    delete saved.results[active];
    persist(); updateLines(); renderProgress();
    setPanel('idle', '↳', 'Starter restored', 'Your saved draft for this exercise was replaced with the starter code.');
  });

  $('download-button').addEventListener('click', () => {
    const blob = new Blob([editor.value], { type: 'text/x-c' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = EXERCISES[active].filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);   // revoking immediately can cancel the download in Firefox
  });

  /* ------------------------------------------------------------------ start */
  startChecker();
  selectExercise(active);
})();
