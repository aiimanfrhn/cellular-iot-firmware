import { CHECKER_VERSION, PROBLEMS, TOPICS } from './problems.js';
import { PLAN, PLAN_INTRO, PLAN_TITLE } from './plan.js';
import { QUIZ, QUIZ_TOPICS } from './quiz.js';
import { GUIDE } from './guide.js';

(() => {
  /* Problem data lives in problems.js; the sidebar list, the mobile picker
     and the progress card are all generated from it. */
  const EXERCISES = Object.fromEntries(PROBLEMS.map((p) => [p.id, p]));
  const ORDER = Object.keys(EXERCISES);
  const KEY = 'embedded-c-trainer-week1-v1';   // unchanged, so existing drafts load
  const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
  const CHECK_TIMEOUT_MS = 30000;              // compile + run budget per check
  const INDENT = '    ';

  const $ = (id) => document.getElementById(id);
  const editor = $('code-editor');

  /* ---------------------------------------------------------------- storage */
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { saved = {}; }
  if (!saved.code) saved.code = {};
  if (!saved.results) saved.results = {};
  if (!saved.plan) saved.plan = {};   // study items ticked off in the training plan
  if (!saved.quiz) saved.quiz = {};   // concept quiz answers, keyed by question id
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (_) {} }

  let active = EXERCISES[saved.active] ? saved.active : ORDER[0];
  const codeFor = (id) => saved.code[id] ?? EXERCISES[id].starter;
  const isCurrentPass = (id) => {
    const r = saved.results[id];
    return !!(r && r.passed && r.version === CHECKER_VERSION && codeFor(id) === r.code);
  };
  /* Problems passed on another device, reported by supabase-trainer.js. */
  let cloudPassed = new Set();
  const isSolved = (id) => isCurrentPass(id) || cloudPassed.has(id);

  /* ------------------------------------------------------------ checker state
   * pending remembers WHICH exercise was submitted, so a result is never filed
   * under whatever tab happens to be open when the worker answers. */
  let checker = null;
  let compilerReady = false;
  let pending = null;      // { exercise, code }
  let watchdog = null;
  const lastResult = {};   // latest result per exercise, so switching tabs keeps the checklist

  function setStatus(state, text) {
    const wrap = $('server-status').parentElement;
    wrap.classList.toggle('ready', state === 'ready');
    wrap.classList.toggle('error', state === 'error');
    $('server-status').textContent = text;
  }

  const setReadyStatus = () => setStatus('ready', 'Browser compiler ready · no setup needed');

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
    if (data.type === 'ready') { compilerReady = true; setReadyStatus(); updateRunButton(); return; }
    if (data.type === 'loading') { setStatus('loading', data.message); return; }
    if (data.type === 'result') { if (compilerReady) setReadyStatus(); finishCheck(data.result); }
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
      message: `Your program did not finish within ${CHECK_TIMEOUT_MS / 1000} seconds. Look for a loop whose exit condition is never reached. The compiler is restarting.`,
      output: ''
    });
    startChecker();
  }

  function finishCheck(result) {
    clearTimeout(watchdog); watchdog = null;
    if (!pending) return;
    const { exercise, code } = pending;
    pending = null;
    saved.results[exercise] = { exercise, passed: !!result.passed, code, version: CHECKER_VERSION, at: new Date().toISOString() };
    persist();
    window.dispatchEvent(new CustomEvent('trainer:result', { detail: { ...saved.results[exercise] } }));
    lastResult[exercise] = { ...result, code };
    if (exercise === active) showResult(result);
    renderProgress();
    updateRunButton();
  }

  function runCheck() {
    if (!checker) { startChecker(); return; }
    if (!compilerReady || pending) return;
    pending = { exercise: active, code: editor.value };
    checker.postMessage({ type: 'check', exercise: pending.exercise, filename: EXERCISES[pending.exercise].filename, code: pending.code });
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

  function problemState(id) {
    const r = saved.results[id];
    if (pending && pending.exercise === id) return { cls: 'checking', mark: '…', text: 'Checking…' };
    if (isCurrentPass(id)) return { cls: 'solved', mark: '✓', text: 'Solved' };
    if (cloudPassed.has(id)) return { cls: 'solved', mark: '✓', text: 'Solved on another device' };
    if (r && r.passed && r.version !== CHECKER_VERSION) return { cls: 'attempted', mark: '•', text: 'Re-run checks' };
    if (r && r.passed) return { cls: 'attempted', mark: '•', text: 'Draft changed' };
    if (r) return { cls: 'attempted', mark: '•', text: 'Needs work' };
    if (saved.code[id] !== undefined && saved.code[id] !== EXERCISES[id].starter) return { cls: 'attempted', mark: '•', text: 'In progress' };
    return { cls: 'new', mark: '', text: 'Not started' };
  }

  function renderProgress() {
    const count = ORDER.length;
    const solved = ORDER.filter(isSolved);
    const left = count - solved.length;
    $('progress-count').textContent = `${solved.length} / ${count}`;
    $('progress-fill').style.width = `${(solved.length / count) * 100}%`;
    $('progress-caption').textContent = left === 0
      ? 'Every problem solved. Now practise explaining each one out loud.'
      : `${left} ${left === 1 ? 'problem' : 'problems'} left.`;
    $('difficulty-stats').replaceChildren(...DIFFICULTIES.map((level) => {
      const ids = ORDER.filter((id) => EXERCISES[id].difficulty === level);
      const row = document.createElement('div');
      row.className = 'stat-row';
      const name = document.createElement('span'); name.textContent = level;
      const value = document.createElement('b'); value.textContent = `${ids.filter(isSolved).length} / ${ids.length}`;
      row.append(name, value);
      return row;
    }));
    const dates = [...Object.values(saved.results), ...Object.values(saved.quiz)].map((r) => r && r.at).filter(Boolean).sort();
    $('last-activity').textContent = dateLabel(dates[dates.length - 1] || saved.lastEdit);
    ORDER.forEach((id) => {
      const state = problemState(id);
      const item = document.querySelector(`.problem-item[data-exercise="${id}"]`);
      item.className = `problem-item ${state.cls}${id === active ? ' active' : ''}`;
      item.querySelector('.problem-mark').textContent = state.mark;
      item.querySelector('.problem-state').textContent = state.text;
      $(`option-${id}`).textContent = `${state.cls === 'solved' ? '✓ ' : ''}${EXERCISES[id].title} · ${EXERCISES[id].difficulty}`;
    });
    $('next-button').hidden = !(isSolved(active) && nextProblem());
    renderPlan();
    renderQuizProgress();
  }

  /* ---------------------------------------------------------- training plan
   * Problem tasks count as done when the problem is solved; study tasks are
   * ticked off by hand and stored in saved.plan under their day and position. */
  const studyKey = (day, index) => `d${day + 1}-${index}`;
  const PLAN_TOTAL = PLAN.reduce((n, day) => n + day.problems.length + day.study.length, 0);

  function dayDone(day, d) {
    return day.problems.filter(isSolved).length + day.study.filter((_, i) => saved.plan[studyKey(d, i)]).length;
  }

  function buildPlan() {
    $('plan-intro').textContent = PLAN_INTRO;
    const firstOpen = PLAN.findIndex((day, d) => dayDone(day, d) < day.problems.length + day.study.length);
    $('plan-days').replaceChildren(...PLAN.map((day, d) => {
      const li = document.createElement('li');
      const details = document.createElement('details');
      details.className = 'plan-day';
      details.open = d === firstOpen;
      const summary = document.createElement('summary');
      summary.innerHTML = '<span class="plan-day-num"></span><span class="plan-day-title"></span><span class="plan-day-count"></span>';
      summary.querySelector('.plan-day-num').textContent = `Day ${d + 1}`;
      summary.querySelector('.plan-day-title').textContent = day.title;
      const goal = document.createElement('p');
      goal.className = 'plan-goal';
      goal.textContent = day.goal;
      const tasks = document.createElement('ul');
      tasks.className = 'plan-tasks';
      day.problems.forEach((id) => {
        const p = EXERCISES[id];
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'plan-problem';
        button.dataset.exercise = id;
        button.innerHTML = '<span class="problem-mark" aria-hidden="true"></span><span class="problem-text"><b></b><small></small></span><span class="problem-level"></span><span class="visually-hidden problem-state"></span>';
        button.querySelector('b').textContent = p.title;
        button.querySelector('small').textContent = `${p.topic} · about ${p.minutes} min`;
        button.querySelector('.problem-level').textContent = p.difficulty;
        button.querySelector('.problem-level').dataset.level = p.difficulty;
        button.addEventListener('click', () => { selectExercise(id); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        item.append(button);
        tasks.append(item);
      });
      day.study.forEach((text, i) => {
        const item = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'plan-study';
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.dataset.key = studyKey(d, i);
        box.addEventListener('change', () => {
          if (box.checked) saved.plan[box.dataset.key] = true;
          else delete saved.plan[box.dataset.key];
          persist();
          renderPlan();
        });
        const span = document.createElement('span');
        span.textContent = text;
        label.append(box, span);
        item.append(label);
        tasks.append(item);
      });
      details.append(summary, goal, tasks);
      li.append(details);
      return li;
    }));
  }

  function renderPlan() {
    let done = 0;
    PLAN.forEach((day, d) => {
      const count = dayDone(day, d), total = day.problems.length + day.study.length;
      done += count;
      const card = $('plan-days').children[d].firstElementChild;
      card.classList.toggle('complete', count === total);
      card.querySelector('.plan-day-count').textContent = count === total ? '✓ Done' : `${count} / ${total}`;
    });
    document.querySelectorAll('.plan-problem').forEach((button) => {
      const state = problemState(button.dataset.exercise);
      button.className = `plan-problem ${state.cls}`;
      button.querySelector('.problem-mark').textContent = state.mark;
      button.querySelector('.problem-state').textContent = state.text;
    });
    document.querySelectorAll('.plan-study input').forEach((box) => { box.checked = !!saved.plan[box.dataset.key]; });
    $('plan-count').textContent = `${done} / ${PLAN_TOTAL}`;
    $('plan-fill').style.width = `${(done / PLAN_TOTAL) * 100}%`;
    $('plan-button-meta').textContent = `${done} of ${PLAN_TOTAL} tasks done`;
  }

  /* ------------------------------------------------------------ concept quiz
   * Each topic has a study guide (guide.js) and its questions. The quiz shows
   * one question at a time: pick an option, check it, read the explanation.
   * saved.quiz[id] = { correct (ever answered correctly), last, at }. */
  const QUESTIONS = Object.fromEntries(QUIZ.map((q) => [q.id, q]));
  const MIXED = { id: 'mixed', title: 'Mixed review', summary: 'All topics, shuffled' };
  const QUIZ_SETS = [MIXED, ...QUIZ_TOPICS];
  const quizCorrect = (id) => !!saved.quiz[id]?.correct;
  let quiz = null;   // { set, order, index, selected, checked, session }
  let quizPart = saved.quizPart === 'quiz' ? 'quiz' : 'guide';   // which half of a topic is showing

  const idsFor = (setId) => (setId === MIXED.id ? QUIZ : QUIZ.filter((q) => q.topic === setId)).map((q) => q.id);

  function shuffled(ids) {
    const out = [...ids];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }

  function startQuiz(setId, order = setId === MIXED.id ? shuffled(idsFor(setId)) : idsFor(setId)) {
    quiz = { set: setId, order, index: 0, selected: null, checked: false, session: {} };
    saved.quizSet = setId;
    persist();
    renderQuiz();
  }

  /* Open a topic on its study guide until any of its questions has been
     answered; after that, go straight to the questions. */
  function openTopic(setId) {
    const answered = idsFor(setId).some((id) => saved.quiz[id]);
    setPart(GUIDE[setId] && !answered ? 'guide' : 'quiz', false);
    startQuiz(setId);
  }

  function setPart(part, render = true) {
    quizPart = part;
    saved.quizPart = part;
    persist();
    if (render) renderQuiz();
  }

  function renderGuide(set) {
    const guide = GUIDE[set.id];
    $('guide-intro').innerHTML = guide.intro;
    $('guide-sections').innerHTML = guide.sections.map((s) => `<section class="guide-section"><h3>${s.title}</h3>${s.body}</section>`).join('');
    $('guide-tips').innerHTML = guide.tips.map((t) => `<li>${t}</li>`).join('');
    const count = idsFor(set.id).length;
    $('guide-hint').textContent = `${count} questions on this topic follow.`;
    const finished = quiz.index >= quiz.order.length;
    $('guide-start').textContent = finished ? 'Retake the quiz →' : quiz.index > 0 || quiz.checked ? 'Back to the quiz →' : 'Start the quiz →';
  }

  function buildQuizTopics() {
    $('quiz-topics').replaceChildren(...QUIZ_SETS.map((set) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-topic';
      button.dataset.quiz = set.id;
      button.title = set.summary;
      button.innerHTML = '<span></span><small></small>';
      button.querySelector('span').textContent = set.title;
      button.addEventListener('click', () => { openTopic(set.id); focusQuiz(); });
      return button;
    }));
  }

  function renderQuizProgress() {
    const correct = QUIZ.filter((q) => quizCorrect(q.id)).length;
    $('quiz-progress').textContent = `${correct} / ${QUIZ.length}`;
    $('quiz-button-meta').textContent = correct ? `${correct} of ${QUIZ.length} questions answered correctly` : `${QUIZ_TOPICS.length} topics · ${QUIZ.length} questions`;
    document.querySelectorAll('.quiz-topic').forEach((button) => {
      const ids = idsFor(button.dataset.quiz);
      const done = ids.filter(quizCorrect).length;
      button.classList.toggle('complete', done === ids.length);
      button.setAttribute('aria-pressed', String(!!quiz && quiz.set === button.dataset.quiz));
      button.querySelector('small').textContent = done === ids.length ? '✓' : `${done}/${ids.length}`;
    });
  }

  function renderQuiz() {
    const set = QUIZ_SETS.find((t) => t.id === quiz.set);
    const reading = quizPart === 'guide' && !!GUIDE[set.id];
    $('exercise-kicker').textContent = reading ? 'STUDY GUIDE' : `CONCEPT QUIZ · ${QUIZ.length} QUESTIONS`;
    $('exercise-title').textContent = set.title;
    $('quiz-parts').hidden = !GUIDE[set.id];
    document.querySelectorAll('.quiz-part').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === (reading ? 'guide' : 'quiz'))));
    $('quiz-guide').hidden = !reading;
    if (reading) {
      $('quiz-question').hidden = true;
      $('quiz-summary').hidden = true;
      renderQuizProgress();
      renderGuide(set);
      return;
    }
    const finished = quiz.index >= quiz.order.length;
    $('quiz-question').hidden = finished;
    $('quiz-summary').hidden = !finished;
    $('quiz-dots').replaceChildren(...quiz.order.map((id, i) => {
      const dot = document.createElement('span');
      dot.className = id in quiz.session ? (quiz.session[id] ? 'right' : 'wrong') : i === quiz.index ? 'current' : '';
      return dot;
    }));
    renderQuizProgress();
    if (finished) { renderQuizSummary(); return; }

    const q = QUESTIONS[quiz.order[quiz.index]];
    $('quiz-position').textContent = `Question ${quiz.index + 1} of ${quiz.order.length}`;
    $('quiz-prompt').innerHTML = q.prompt;
    $('quiz-options').replaceChildren(...q.options.map((text, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-option';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(quiz.selected === i));
      if (quiz.selected === i) button.classList.add('selected');
      if (quiz.checked) {
        button.disabled = true;
        if (i === q.answer) button.classList.add('correct');
        else if (i === quiz.selected) button.classList.add('wrong');
      }
      button.innerHTML = `<span class="quiz-key">${i + 1}</span><span>${text}</span>`;
      button.addEventListener('click', () => chooseOption(i));
      return button;
    }));
    const feedback = $('quiz-feedback');
    feedback.hidden = !quiz.checked;
    if (quiz.checked) {
      const right = quiz.selected === q.answer;
      feedback.className = `quiz-feedback ${right ? 'success' : 'failure'}`;
      $('quiz-verdict').textContent = right ? '✓ Correct' : `✗ Not quite. The answer is ${q.answer + 1}.`;
      $('quiz-explain').innerHTML = q.explain;
    }
    const check = $('quiz-check');
    check.disabled = !quiz.checked && quiz.selected === null;
    check.textContent = !quiz.checked ? 'Check answer' : quiz.index + 1 < quiz.order.length ? 'Next question →' : 'See results →';
  }

  function renderQuizSummary() {
    const total = quiz.order.length;
    const right = quiz.order.filter((id) => quiz.session[id]).length;
    const missed = total - right;
    $('quiz-score').textContent = `${right} / ${total}`;
    $('quiz-summary-title').textContent = right === total ? 'All correct. Nicely done.' : right >= total * 0.7 ? 'Good work.' : 'Worth another pass.';
    $('quiz-summary-text').textContent = missed
      ? `You missed ${missed}. Read the explanations again, then retry just those questions.`
      : 'Now try explaining each answer out loud, as you would in an interview.';
    $('quiz-retry').hidden = !missed;
    $('quiz-retry').textContent = `Retry the ${missed} you missed`;
    const i = QUIZ_SETS.findIndex((t) => t.id === quiz.set);
    $('quiz-next-topic').textContent = i + 1 < QUIZ_SETS.length ? `Next: ${QUIZ_SETS[i + 1].title} →` : 'Start again →';
    $('quiz-review-guide').hidden = !(missed && GUIDE[quiz.set]);
  }

  /* Move focus into the quiz so Enter checks the answer instead of
     re-pressing whichever button opened it. */
  const focusQuiz = () => $('quiz-panel').focus({ preventScroll: true });

  function chooseOption(i) {
    if (quiz.checked) return;
    quiz.selected = i;
    renderQuiz();
  }

  function checkOrAdvance() {
    if (!quiz || quiz.index >= quiz.order.length) return;
    if (!quiz.checked) {
      if (quiz.selected === null) return;
      const id = quiz.order[quiz.index];
      const right = quiz.selected === QUESTIONS[id].answer;
      quiz.checked = true;
      quiz.session[id] = right;
      saved.quiz[id] = { correct: right || quizCorrect(id), last: right, at: new Date().toISOString() };
      persist();
      renderProgress();   // updates "Last activity"
    } else {
      quiz.index++;
      quiz.selected = null;
      quiz.checked = false;
    }
    renderQuiz();
    $('quiz-check').focus();
  }

  /* The workspace shows the open problem, the training plan or the quiz. */
  function showView(next) {
    const plan = next === 'plan', inQuiz = next === 'quiz';
    saved.view = next;
    persist();
    $('plan-panel').hidden = !plan;
    $('quiz-panel').hidden = !inQuiz;
    $('exercise-panel').hidden = plan || inQuiz;
    $('plan-button').setAttribute('aria-pressed', String(plan));
    $('plan-button-label').textContent = plan ? 'Back to the problem' : 'Open the training plan';
    $('quiz-button').setAttribute('aria-pressed', String(inQuiz));
    $('quiz-button-label').textContent = inQuiz ? 'Back to the problem' : 'Study guide and quiz';
    if (plan) {
      $('exercise-kicker').textContent = `TRAINING PLAN · ${PLAN.length} DAYS`;
      $('exercise-title').textContent = PLAN_TITLE;
    }
    if (inQuiz) {
      if (quiz) renderQuiz();
      else if (!QUIZ_SETS.some((t) => t.id === saved.quizSet)) openTopic(QUIZ_TOPICS[0].id);
      else startQuiz(saved.quizSet);
    }
  }

  /* The next unsolved problem after the active one, wrapping round. */
  function nextProblem() {
    const start = ORDER.indexOf(active);
    for (let step = 1; step < ORDER.length; step++) {
      const id = ORDER[(start + step) % ORDER.length];
      if (!isSolved(id)) return id;
    }
    return null;
  }

  function buildProblemList() {
    const nav = $('problem-list'), select = $('problem-select');
    TOPICS.forEach((topic) => {
      const ids = ORDER.filter((id) => EXERCISES[id].topic === topic);
      if (!ids.length) return;
      const heading = document.createElement('h3');
      heading.textContent = topic;
      nav.append(heading);
      const group = document.createElement('optgroup');
      group.label = topic;
      ids.forEach((id) => {
        const p = EXERCISES[id];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'problem-item';
        button.dataset.exercise = id;
        button.innerHTML = '<span class="problem-mark" aria-hidden="true"></span><span class="problem-text"><b></b><small></small></span><span class="problem-level"></span><span class="visually-hidden problem-state"></span>';
        button.querySelector('b').textContent = p.title;
        button.querySelector('small').textContent = p.summary;
        button.querySelector('.problem-level').textContent = p.difficulty;
        button.querySelector('.problem-level').dataset.level = p.difficulty;
        button.addEventListener('click', () => selectExercise(id));
        nav.append(button);
        const option = document.createElement('option');
        option.value = id;
        option.id = `option-${id}`;
        group.append(option);
      });
      select.append(group);
    });
    select.addEventListener('change', () => selectExercise(select.value));
  }

  const CHECK_MARKS = { pass: '✓', fail: '✗', crash: '!', skipped: '–' };
  const CHECK_NOTES = { crash: 'crashed', skipped: 'did not run' };
  function renderChecklist(checks = []) {
    const list = $('check-list');
    list.replaceChildren(...checks.map(({ label, state }) => {
      const li = document.createElement('li');
      li.className = `check-${state}`;
      const mark = document.createElement('span');
      mark.className = 'check-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = CHECK_MARKS[state] || '–';
      const text = document.createElement('span');
      text.textContent = label;
      li.append(mark, text);
      const note = CHECK_NOTES[state];
      if (note) { const small = document.createElement('small'); small.textContent = ` · ${note}`; li.append(small); }
      const sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = state === 'pass' ? ' (passed)' : state === 'fail' ? ' (failed)' : '';
      li.append(sr);
      return li;
    }));
    list.hidden = !checks.length;
  }

  function setPanel(state, icon, title, message, output = '', compiler = '', checks = []) {
    $('result-panel').className = `result-panel ${state}`;
    $('result-icon').textContent = icon;
    $('result-title').textContent = title;
    $('result-message').textContent = message;
    $('result-output').textContent = output;
    $('result-output').hidden = !output;
    $('result-compiler').textContent = compiler;
    renderChecklist(checks);
  }

  function renderProgram(program) {
    const panel = $('program-panel'), out = $('program-output'), note = $('program-note');
    panel.hidden = !program;
    if (!program) return;
    panel.className = `program-panel ${program.state}`;
    const meta = {
      ran: `main() exited with code ${program.exitCode} · ${program.ms} ms`,
      error: 'could not build on its own',
      crash: 'crashed while running',
      none: '',
    };
    $('program-meta').textContent = meta[program.state] || '';
    if (program.state === 'none') {
      note.textContent = 'Your code has no main(), so there is nothing to run. Add one to print values while you work; the checker ignores it.';
    } else if (program.state === 'ran' && !program.output.trim()) {
      note.textContent = 'Your program printed nothing.';
    } else {
      note.textContent = '';
    }
    note.hidden = !note.textContent;
    out.textContent = program.output;
    out.hidden = !program.output.trim();
  }

  const TITLES = { compile: 'Compilation failed', crash: 'Your program crashed', setup: 'Checker needs setup', timeout: 'Check timed out' };
  function showResult(result) {
    setPanel(result.passed ? 'success' : 'failure', result.passed ? '✓' : '!',
      result.passed ? 'All checks passed' : (TITLES[result.phase] || 'Some checks failed'),
      result.message || 'Check complete.', result.output || '', result.compiler || '', result.checks || []);
    renderProgram(result.program);
  }
  function showChecking() {
    setPanel('idle', '…', 'Compiling and running tests…', 'The compiler runs in your browser. Your source is not uploaded.');
    renderProgram(null);
  }
  function showIdle() {
    setPanel('idle', '↳', 'Ready when you are', 'Run the checks to compile your code and see exactly what passes. Shortcut: Ctrl+Enter (⌘+Enter on Mac).');
    renderProgram(null);
  }

  function selectExercise(id) {
    active = id;
    saved.active = id;
    showView('problem');
    const meta = EXERCISES[id];
    document.querySelectorAll('.problem-item').forEach((item) => {
      if (item.dataset.exercise === id) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    $('problem-select').value = id;
    $('exercise-kicker').textContent = `PROBLEM ${ORDER.indexOf(id) + 1} OF ${ORDER.length} · ${meta.topic.toUpperCase()}`;
    $('exercise-title').textContent = meta.title;
    $('exercise-difficulty').textContent = meta.difficulty.toUpperCase();
    $('exercise-difficulty').dataset.level = meta.difficulty;
    $('exercise-time').textContent = `Aim for about ${meta.minutes} minutes`;
    $('exercise-description').textContent = meta.description;
    $('requirements').innerHTML = meta.requirements;
    $('followups').innerHTML = meta.followups.map((q) => `<li>${q}</li>`).join('');
    editor.value = codeFor(id);
    updateLines();
    editor.scrollTop = 0;
    if (pending && pending.exercise === id) showChecking();
    else if (lastResult[id] && lastResult[id].code === editor.value) showResult(lastResult[id]);
    else showIdle();
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
  $('next-button').addEventListener('click', () => {
    const next = nextProblem();
    if (next) { selectExercise(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  $('run-button').addEventListener('click', runCheck);

  $('plan-button').addEventListener('click', () => {
    if (saved.view === 'plan') selectExercise(active);
    else showView('plan');
  });

  $('quiz-button').addEventListener('click', () => {
    if (saved.view === 'quiz') selectExercise(active);
    else { showView('quiz'); focusQuiz(); }
  });

  $('quiz-check').addEventListener('click', checkOrAdvance);
  $('quiz-retry').addEventListener('click', () => startQuiz(quiz.set, quiz.order.filter((id) => !quiz.session[id])));
  $('quiz-next-topic').addEventListener('click', () => {
    const i = QUIZ_SETS.findIndex((t) => t.id === quiz.set);
    openTopic(QUIZ_SETS[(i + 1) % QUIZ_SETS.length].id);
    focusQuiz();
  });
  $('quiz-review-guide').addEventListener('click', () => { setPart('guide'); focusQuiz(); });
  document.querySelectorAll('.quiz-part').forEach((b) => b.addEventListener('click', () => setPart(b.dataset.part)));
  $('guide-start').addEventListener('click', () => {
    setPart('quiz', false);
    if (quiz.index >= quiz.order.length) startQuiz(quiz.set);   // finished: start afresh
    else renderQuiz();
    focusQuiz();
    $('quiz-panel').scrollIntoView({ block: 'start', behavior: 'smooth' });
  });

  /* In the quiz, keys 1-9 choose an option and Enter checks or moves on. */
  document.addEventListener('keydown', (event) => {
    if (saved.view !== 'quiz' || !quiz || !$('quiz-guide').hidden || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest('input, textarea, select')) return;
    if (/^[1-9]$/.test(event.key) && quiz.index < quiz.order.length) {
      const i = Number(event.key) - 1;
      if (i < QUESTIONS[quiz.order[quiz.index]].options.length) { event.preventDefault(); chooseOption(i); }
    } else if (event.key === 'Enter' && !event.target.closest('button')) {
      event.preventDefault();
      checkOrAdvance();
    }
  });

  $('reset-button').addEventListener('click', () => {
    const starter = EXERCISES[active].starter;
    if (editor.value !== starter && !confirm('Replace your draft with the starter code? Your current code for this exercise will be lost. Download it first if you want to keep it.')) return;
    editor.value = starter;
    saved.code[active] = starter;
    delete saved.results[active];
    delete lastResult[active];
    persist(); updateLines(); renderProgress();
    renderProgram(null);
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
  window.addEventListener('trainer:cloud-progress', (event) => {
    cloudPassed = new Set((event.detail || []).filter((id) => EXERCISES[id]));
    renderProgress();
  });

  const startView = saved.view;
  buildProblemList();
  buildPlan();
  buildQuizTopics();
  startChecker();
  selectExercise(active);
  if (startView === 'plan' || startView === 'quiz') showView(startView);
})();
