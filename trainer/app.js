(() => {
  const checker = new Worker(new URL('./compiler-worker.js', import.meta.url), {type:'module'});
  let checkQueue = [];
  const starters = {
    bit_ops: `#include <limits.h>\n#include <stdio.h>\n\n/* Return value with bit position set to 1. */\nunsigned int set_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: set the selected bit */\n    return value;\n}\n\n/* Return value with bit position cleared to 0. */\nunsigned int clear_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: clear the selected bit */\n    return value;\n}\n\n/* Return value with bit position inverted. */\nunsigned int toggle_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: toggle the selected bit */\n    return value;\n}\n\n/* Return nonzero when the selected bit is set, otherwise return 0. */\nint test_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: test the selected bit */\n    return 0;\n}\n\nint main(void)\n{\n    unsigned int value = 0u;\n    value = set_bit(value, 3u);\n    printf("bit 3 set: %s\\n", test_bit(value, 3u) ? "yes" : "no");\n    return 0;\n}\n`,
    ring_buffer: `#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n\n/* The checker provides this API declaration. Implement all three functions. */\ntypedef struct RingBuffer {\n    uint8_t *data;\n    size_t capacity;\n    size_t head;\n    size_t tail;\n    size_t count;\n} RingBuffer;\n\nvoid rb_init(RingBuffer *rb, uint8_t *storage, size_t capacity)\n{\n    /* TODO: initialize an empty buffer; capacity may be zero */\n    (void)rb;\n    (void)storage;\n    (void)capacity;\n}\n\nbool rb_push(RingBuffer *rb, uint8_t value)\n{\n    /* TODO: append one byte; return false when full or capacity is zero */\n    (void)rb;\n    (void)value;\n    return false;\n}\n\nbool rb_pop(RingBuffer *rb, uint8_t *out)\n{\n    /* TODO: remove oldest byte; return false when empty */\n    (void)rb;\n    (void)out;\n    return false;\n}\n`
  };
  const descriptions = {
    bit_ops: {
      kicker: 'EXERCISE 1 · C BASICS', title: 'Bit operations',
      description: 'Bit masks show up everywhere in firmware: registers, protocol flags, and compact state. Implement these four helpers safely using unsigned values.',
      requirements: '<ul><li>Implement <code>set_bit</code>, <code>clear_bit</code>, <code>toggle_bit</code>, and <code>test_bit</code>.</li><li>Assume <code>position</code> is within the width of <code>unsigned int</code>; do not use signed shifts.</li><li>Keep the demo <code>main</code> or remove it. The checker tests your functions directly.</li></ul>',
      filename: 'bit_ops.c'
    },
    ring_buffer: {
      kicker: 'EXERCISE 2 · DATA STRUCTURES', title: 'Ring buffer',
      description: 'Implement a fixed-size byte FIFO like the kind used between a UART interrupt and a parser. Use the supplied structure and function signatures.',
      requirements: '<ul><li><code>rb_init</code> creates an empty buffer and stores the caller-provided storage.</li><li><code>rb_push</code> returns false if full; <code>rb_pop</code> returns false if empty.</li><li>Support wraparound, preserve FIFO order, and safely reject zero capacity.</li></ul>',
      filename: 'ring_buffer.c'
    }
  };
  const KEY = 'embedded-c-trainer-week1-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { saved = {}; }
  if (!saved.code) saved.code = {};
  if (!saved.results) saved.results = {};
  let active = 'bit_ops';
  const $ = (id) => document.getElementById(id);
  const editor = $('code-editor');

  function dateLabel(value) {
    if (!value) return 'Not started';
    const then = new Date(value), now = new Date();
    const sameDay = then.toDateString() === now.toDateString();
    return sameDay ? `Today, ${then.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}` : then.toLocaleDateString([], {month:'short',day:'numeric'});
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (_) {} }
  function updateLines() { const n = Math.max(1, editor.value.split('\n').length); $('line-numbers').textContent = Array.from({length:n}, (_,i)=>i+1).join('\n'); }
  function renderProgress() {
    const passed = Object.values(saved.results).filter((r) => r && r.passed && saved.code[r.exercise] === r.code).length;
    const count = 2;
    $('progress-count').textContent = `${passed} / ${count}`;
    $('passed-count').textContent = passed;
    $('progress-fill').style.width = `${passed / count * 100}%`;
    $('progress-caption').textContent = passed === count ? 'Week 1 complete. Nice work!' : `Pass ${count - passed} more ${count - passed === 1 ? 'check' : 'checks'} to complete this week.`;
    const week = $('week-state');
    week.textContent = passed === count ? 'COMPLETE' : 'IN PROGRESS';
    week.closest('.week-item').classList.toggle('complete', passed === count);
    const dates = Object.values(saved.results).map(r => r && r.at).filter(Boolean).sort();
    $('last-activity').textContent = dateLabel(dates[dates.length - 1] || saved.lastEdit);
    for (const id of ['bit_ops', 'ring_buffer']) {
      const r = saved.results[id], currentPass = !!(r && r.passed && saved.code[id] === r.code);
      $(`tab-check-${id}`).textContent = currentPass ? '✓' : (id === 'bit_ops' ? '1' : '2');
      $(`tab-result-${id}`).textContent = currentPass ? 'Passed' : (r && r.passed ? 'Draft changed' : (r ? 'Needs work' : 'Not checked'));
      $(`tab-result-${id}`).classList.toggle('passed-text', currentPass);
      document.querySelector(`[data-exercise="${id}"]`).classList.toggle('passed', currentPass);
    }
  }
  function showResult(result, code) {
    const panel = $('result-panel');
    panel.classList.remove('idle','success','failure'); panel.classList.add(result.passed ? 'success' : 'failure');
    $('result-icon').textContent = result.passed ? '✓' : '!';
    $('result-title').textContent = result.passed ? 'All checks passed' : (result.phase === 'compile' ? 'Compilation failed' : result.phase === 'setup' ? 'Checker needs setup' : 'Some checks failed');
    $('result-message').textContent = result.message || 'Check complete.';
    const output = $('result-output');
    output.textContent = result.output || '';
    output.hidden = !result.output;
    $('result-compiler').textContent = result.compiler ? result.compiler : '';
    if (result.passed) saved.results[active] = {exercise:active, passed:true, code, at:new Date().toISOString()};
    else saved.results[active] = {exercise:active, passed:false, code, at:new Date().toISOString()};
    persist(); renderProgress();
  }
  function selectExercise(id) {
    if (active && editor.value !== (saved.code[active] ?? starters[active])) saved.code[active] = editor.value;
    active = id;
    document.querySelectorAll('.exercise-tab').forEach(btn => { const selected = btn.dataset.exercise === active; btn.classList.toggle('active',selected); btn.setAttribute('aria-selected',String(selected)); });
    const meta = descriptions[id];
    $('exercise-kicker').textContent = meta.kicker; $('exercise-title').textContent = meta.title;
    $('exercise-description').textContent = meta.description; $('requirements').innerHTML = meta.requirements;
    editor.value = saved.code[id] ?? starters[id]; updateLines();
    $('result-panel').className = 'result-panel idle'; $('result-icon').textContent='↳'; $('result-title').textContent='Ready when you are';
    $('result-message').textContent='Run the checks to compile your code and see exactly what passes.'; $('result-output').hidden=true; $('result-compiler').textContent='';
    $('save-hint').textContent = saved.code[id] ? 'Draft restored from this browser.' : 'Edits stay in this browser until you download them.';
    renderProgress();
  }
  document.querySelectorAll('.exercise-tab').forEach(btn => btn.addEventListener('click', () => selectExercise(btn.dataset.exercise)));
  editor.addEventListener('input', () => {
    saved.code[active] = editor.value; saved.lastEdit = new Date().toISOString(); persist(); updateLines(); renderProgress();
    $('save-hint').textContent = 'Saved in this browser.';
  });
  editor.addEventListener('scroll', () => { $('line-numbers').scrollTop = editor.scrollTop; });
  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') { event.preventDefault(); const start=editor.selectionStart,end=editor.selectionEnd; editor.setRangeText('    ',start,end,'end'); editor.dispatchEvent(new Event('input')); }
  });
  $('reset-button').addEventListener('click', () => {
    editor.value = starters[active]; saved.code[active] = editor.value; delete saved.results[active]; persist(); updateLines(); renderProgress();
    $('result-panel').className='result-panel idle'; $('result-title').textContent='Starter restored'; $('result-message').textContent='Your saved draft for this exercise was replaced with the starter code.'; $('result-output').hidden=true;
  });
  $('download-button').addEventListener('click', () => {
    const blob = new Blob([editor.value], {type:'text/x-c'}), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href=url; a.download=descriptions[active].filename; a.click(); URL.revokeObjectURL(url);
  });
  checker.addEventListener('message', (event) => {
    const data = event.data;
    if (data.type === 'ready') {
      const wrap=$('server-status').parentElement; wrap.classList.add('ready'); $('server-status').textContent='Browser compiler ready · no setup needed';
      return;
    }
    if (data.type === 'loading') { $('server-status').textContent=data.message; return; }
    if (data.type === 'result') {
      const pending=checkQueue.shift(); if (!pending) return;
      showResult(data.result, pending.code);
      const button=$('run-button'); button.disabled=false; button.innerHTML='<span>▶</span> Run checks';
    }
  });
  checker.addEventListener('error', () => {
    const wrap=$('server-status').parentElement; wrap.classList.add('error'); $('server-status').textContent='Could not load browser compiler';
    const pending=checkQueue.shift(); if (pending) showResult({passed:false,phase:'setup',message:'The browser compiler could not load. Refresh the page and try again.',output:''},pending.code);
    const button=$('run-button'); button.disabled=false; button.innerHTML='<span>▶</span> Run checks';
  });
  $('run-button').addEventListener('click', () => {
    const button = $('run-button'), code = editor.value;
    button.disabled=true; button.innerHTML='<span>…</span> Checking'; $('result-panel').className='result-panel idle'; $('result-title').textContent='Compiling and running tests…'; $('result-message').textContent='The compiler runs in your browser. Your source is not uploaded.'; $('result-output').hidden=true;
    checkQueue.push({code}); checker.postMessage({type:'check',exercise:active,code});
  });
  $('server-status').textContent='Loading browser compiler · first load downloads about 28 MB';
  selectExercise('bit_ops');
})();
