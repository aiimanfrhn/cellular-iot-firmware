import { CHECKER_VERSION, PROBLEMS, TOPICS } from './problems.js';
import { PLAN, PLAN_INTRO, PLAN_TITLE } from './plan.js';
import { QUIZ, QUIZ_TOPICS } from './quiz.js';
import { GUIDE } from './guide.js';
import { DAY_GUIDES } from './plan-guide.js';
import { NOTES, NOTES_INTRO } from './notes.js';
import { HINTS } from './hints.js';

(() => {
  /* Problem data lives in problems.js; the sidebar list, the mobile picker
     and the progress card are all generated from it. */
  const EXERCISES = Object.fromEntries(PROBLEMS.map((p) => [p.id, p]));
  const ORDER = Object.keys(EXERCISES);
  const KEY = 'embedded-c-trainer-week1-v1';   // unchanged, so existing drafts load
  const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
  const CHECK_TIMEOUT_MS = 30000;              // compile + run budget per check
  const INDENT = '    ';
  const SANDBOX_FILE = 'sandbox.c';
  const SANDBOX_STARTER = `#include <stdio.h>
#include <stdint.h>

/* A scratch pad: write any C here and select Run. */
int main(void)
{
    uint32_t reg = 0x12345678u;
    printf("reg = 0x%08X, low byte = 0x%02X\\n", (unsigned)reg, (unsigned)(reg & 0xFFu));
    printf("sizeof(int) = %zu, sizeof(void *) = %zu\\n", sizeof(int), sizeof(void *));
    return 0;
}
`;

  const $ = (id) => document.getElementById(id);
  const editor = $('code-editor');
  const sandbox = $('sandbox-editor');

  /* ---------------------------------------------------------------- storage */
  let saved = {};
  let firstVisit = false;
  try { firstVisit = !localStorage.getItem(KEY); } catch (_) {}
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { saved = {}; }
  if (!saved.code) saved.code = {};
  if (!saved.results) saved.results = {};
  if (!saved.plan) saved.plan = {};   // study items ticked off in the training plan
  if (!saved.quiz) saved.quiz = {};   // concept quiz answers, keyed by question id
  if (!saved.hints) saved.hints = {}; // hints revealed per problem; one more than the hint count means the solution is open
  if (!saved.best) saved.best = {};   // fastest timed solve per problem, in seconds
  if (!saved.mockHistory) saved.mockHistory = [];   // finished mock tests, newest first
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (_) {} }

  let active = EXERCISES[saved.active] ? saved.active : ORDER[0];
  /* During a mock test its problems use separate drafts in saved.mock.code,
     so the test starts from the starter and the learner's own drafts survive. */
  const inMock = (id) => !!(saved.mock && saved.mock.problems.includes(id));
  const codeFor = (id) => (inMock(id) ? saved.mock.code[id] : saved.code[id]) ?? EXERCISES[id].starter;
  const setDraft = (id, code) => { if (inMock(id)) saved.mock.code[id] = code; else saved.code[id] = code; };
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
  let pending = null;      // { kind: 'check', exercise, code } or { kind: 'run' } from the sandbox
  let watchdog = null;
  const lastResult = {};   // latest result per exercise, so switching tabs keeps the checklist

  function setStatus(state, text) {
    const wrap = $('server-status').parentElement;
    wrap.classList.toggle('ready', state === 'ready');
    wrap.classList.toggle('error', state === 'error');
    $('server-status').textContent = text;
  }

  const setReadyStatus = () => setStatus('ready', 'Browser compiler ready · no setup needed');

  /* One compiler serves the problems and the sandbox, so a job in either
     disables both run buttons. */
  function updateRunButton() {
    [[$('run-button'), 'Run checks', 'Checking'], [$('sandbox-run'), 'Run', 'Running']].forEach(([button, idle, busy]) => {
      if (pending) { button.disabled = true; button.innerHTML = `<span>…</span> ${busy}`; }
      else if (!checker) { button.disabled = false; button.innerHTML = '<span>↻</span> Reload compiler'; }
      else if (!compilerReady) { button.disabled = true; button.innerHTML = '<span>…</span> Loading compiler'; }
      else { button.disabled = false; button.innerHTML = `<span>▶</span> ${idle}`; }
    });
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
    const { kind, exercise, code } = pending;
    pending = null;
    if (kind === 'run') {
      // A setup failure or timeout has no program, only a message.
      renderProgram(result.program || { state: 'error', output: result.message }, SANDBOX_OUTPUT);
      updateRunButton();
      return;
    }
    // A failed run inside a mock test must not overwrite a pass from normal practice.
    const mockRun = inMock(exercise);
    if (mockRun && result.passed) { saved.mock.solved[exercise] = true; renderMock(); }
    if (!mockRun || result.passed) {
      saved.results[exercise] = { exercise, passed: !!result.passed, code, version: CHECKER_VERSION, at: new Date().toISOString() };
      window.dispatchEvent(new CustomEvent('trainer:result', { detail: { ...saved.results[exercise] } }));
    }
    if (result.passed && saved.timer && saved.timer.id === exercise) finishTimer(exercise);
    persist();
    lastResult[exercise] = { ...result, code };
    if (exercise === active) showResult(result);
    renderProgress();
    updateRunButton();
  }

  function runCheck() {
    if (!checker) { startChecker(); return; }
    if (!compilerReady || pending) return;
    pending = { kind: 'check', exercise: active, code: editor.value };
    checker.postMessage({ type: 'check', exercise: pending.exercise, filename: EXERCISES[pending.exercise].filename, code: pending.code });
    watchdog = setTimeout(onTimeout, CHECK_TIMEOUT_MS);
    showChecking();
    updateRunButton();
  }

  function runSandbox() {
    if (!checker) { startChecker(); return; }
    if (!compilerReady || pending) return;
    pending = { kind: 'run' };
    checker.postMessage({ type: 'run', filename: SANDBOX_FILE, code: sandbox.value, input: $('sandbox-stdin').value });
    watchdog = setTimeout(onTimeout, CHECK_TIMEOUT_MS);
    renderProgram(null, SANDBOX_OUTPUT);
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

  /* Lines with a compiler error or warning, per editor; editing clears them
     because the line numbers no longer match. */
  const errorLines = new Map();

  function updateLines(area = editor) {
    const n = Math.max(1, area.value.split('\n').length);
    const marked = errorLines.get(area) || new Set();
    area.previousElementSibling.innerHTML = Array.from({ length: n }, (_, i) =>
      marked.has(i + 1) ? `<span class="line-error">${i + 1}</span>` : `<span>${i + 1}</span>`).join('');
  }

  /* Put the caret at line:col in an editor and scroll it into view. */
  function goToLine(area, line, col = 1) {
    const lines = area.value.split('\n');
    const row = Math.min(Math.max(line, 1), lines.length);
    let offset = 0;
    for (let i = 0; i < row - 1; i++) offset += lines[i].length + 1;
    offset += Math.min(Math.max(col - 1, 0), lines[row - 1].length);
    area.focus();
    area.setSelectionRange(offset, offset);
    const lineHeight = parseFloat(getComputedStyle(area).lineHeight) || 20;
    area.scrollTop = Math.max(0, (row - 1) * lineHeight - area.clientHeight / 3);
    area.closest('.editor-wrap').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* Show compiler output in pre, turning each "file:line:col:" that points
     into the learner's file into a link to that spot, and mark those lines
     in the editor gutter. Diagnostics in checker.c are left as plain text. */
  function showDiagnostics(pre, text, area, filename) {
    const marked = new Set();
    const pattern = /^(.+?):(\d+):(\d+): (error|warning|note|fatal error)/;
    pre.replaceChildren(...text.split('\n').flatMap((line, i) => {
      const nodes = i ? [document.createTextNode('\n')] : [];
      const m = pattern.exec(line);
      if (!m || m[1] !== filename) return [...nodes, document.createTextNode(line)];
      const [where, , row, col, kind] = m;
      if (kind !== 'note') marked.add(Number(row));
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'diag-link';
      link.textContent = where.slice(0, where.length - kind.length - 2);
      link.title = `Go to line ${row}`;
      link.addEventListener('click', () => goToLine(area, Number(row), Number(col)));
      return [...nodes, link, document.createTextNode(line.slice(link.textContent.length))];
    }));
    errorLines.set(area, new Set([...(errorLines.get(area) || []), ...marked]));
    updateLines(area);
  }
  function clearDiagnostics(area) {
    if (!errorLines.has(area)) return;
    errorLines.delete(area);
    updateLines(area);
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

  /* Problem lists and plan tasks share one button layout: status mark,
     title and subtitle, a badge, and a status for screen readers. */
  function taskButton(className, title, subtitle, badge, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.innerHTML = '<span class="problem-mark" aria-hidden="true"></span><span class="problem-text"><b></b><small></small></span><span class="problem-level"></span><span class="visually-hidden problem-state"></span>';
    button.querySelector('b').textContent = title;
    button.querySelector('small').textContent = subtitle;
    const level = button.querySelector('.problem-level');
    level.textContent = badge;
    if (DIFFICULTIES.includes(badge)) level.dataset.level = badge;
    button.addEventListener('click', onClick);
    return button;
  }

  function setTaskState(button, className, { cls, mark, text }) {
    button.className = `${className} ${cls}`;
    button.querySelector('.problem-mark').textContent = mark;
    button.querySelector('.problem-state').textContent = text;
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
      setTaskState(document.querySelector(`.problem-item[data-exercise="${id}"]`), `problem-item${id === active ? ' active' : ''}`, state);
      $(`option-${id}`).textContent = `${state.cls === 'solved' ? '✓ ' : ''}${EXERCISES[id].title} · ${EXERCISES[id].difficulty}`;
    });
    $('next-button').hidden = !(isSolved(active) && nextProblem());
    renderPlan();
    renderQuizProgress();
  }

  /* ---------------------------------------------------------- training plan
   * Each day starts with its study guide and quiz (plan-guide.js), done when
   * every question of that day has been answered correctly. Problem tasks
   * count as done when the problem is solved; study tasks are ticked off by
   * hand and stored in saved.plan under their day and position. */
  const studyKey = (day, index) => `d${day + 1}-${index}`;
  const daySetId = (d) => `day${d + 1}`;
  const dayTotal = (day) => 1 + day.problems.length + day.study.length;
  const PLAN_TOTAL = PLAN.reduce((n, day) => n + dayTotal(day), 0);
  const dayQuizDone = (d) => idsFor(daySetId(d)).every(quizCorrect);

  function dayDone(day, d) {
    return (dayQuizDone(d) ? 1 : 0) + day.problems.filter(isSolved).length + day.study.filter((_, i) => saved.plan[studyKey(d, i)]).length;
  }

  function openDay(d) {
    openTopic(daySetId(d));
    showView('day');
    focusQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildPlan() {
    $('plan-intro').textContent = PLAN_INTRO;
    const firstOpen = PLAN.findIndex((day, d) => dayDone(day, d) < dayTotal(day));
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
      const addTask = (button) => { const item = document.createElement('li'); item.append(button); tasks.append(item); return button; };
      addTask(taskButton('plan-problem plan-guide', 'Study guide and quiz', `Read the notes, then ${idsFor(daySetId(d)).length} questions`, '',
        () => openDay(d))).dataset.day = d;
      day.problems.forEach((id) => {
        const p = EXERCISES[id];
        addTask(taskButton('plan-problem', p.title, `${p.topic} · about ${p.minutes} min`, p.difficulty,
          () => { selectExercise(id); window.scrollTo({ top: 0, behavior: 'smooth' }); })).dataset.exercise = id;
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
      const count = dayDone(day, d), total = dayTotal(day);
      done += count;
      const card = $('plan-days').children[d].firstElementChild;
      card.classList.toggle('complete', count === total);
      card.querySelector('.plan-day-count').textContent = count === total ? '✓ Done' : `${count} / ${total}`;
    });
    document.querySelectorAll('.plan-guide').forEach((button) => {
      const ids = idsFor(daySetId(Number(button.dataset.day)));
      const right = ids.filter(quizCorrect).length;
      const done = right === ids.length, started = ids.some((id) => saved.quiz[id]);
      setTaskState(button, 'plan-problem plan-guide', done ? { cls: 'solved', mark: '✓', text: 'Done' }
        : { cls: started ? 'attempted' : 'new', mark: started ? '•' : '', text: `${right} of ${ids.length} answered correctly` });
      button.querySelector('.problem-level').textContent = `${right}/${ids.length}`;
    });
    document.querySelectorAll('.plan-problem[data-exercise]').forEach((button) => {
      setTaskState(button, 'plan-problem', problemState(button.dataset.exercise));
    });
    document.querySelectorAll('.plan-study input').forEach((box) => { box.checked = !!saved.plan[box.dataset.key]; });
    $('plan-count').textContent = `${done} / ${PLAN_TOTAL}`;
    $('plan-fill').style.width = `${(done / PLAN_TOTAL) * 100}%`;
    $('plan-button-meta').textContent = `${done} of ${PLAN_TOTAL} tasks done`;
  }

  /* ------------------------------------------------------------ concept quiz
   * Each concept topic (guide.js, quiz.js) and each plan day (plan-guide.js)
   * is a set: a study guide plus its questions. The quiz shows one question
   * at a time: pick an option, check it, read the explanation.
   * saved.quiz[id] = { correct (ever answered correctly), last, at }. */
  const DAY_QUESTIONS = DAY_GUIDES.flatMap((guide, d) => guide.quiz.map((q) => ({ ...q, topic: daySetId(d) })));
  const QUESTIONS = Object.fromEntries([...QUIZ, ...DAY_QUESTIONS].map((q) => [q.id, q]));
  const GUIDES = { ...GUIDE, ...Object.fromEntries(DAY_GUIDES.map((guide, d) => [daySetId(d), guide])) };
  const MIXED = { id: 'mixed', title: 'Mixed review', summary: 'All topics, shuffled' };
  const QUIZ_SETS = [MIXED, ...QUIZ_TOPICS];   // the concept quiz's topic tabs
  const DAY_SETS = PLAN.map((day, d) => ({ id: daySetId(d), title: day.title, day: d }));
  const SETS = Object.fromEntries([...QUIZ_SETS, ...DAY_SETS].map((set) => [set.id, set]));
  const SET_IDS = { [MIXED.id]: QUIZ.map((q) => q.id) };   // question ids per set, in order
  [...QUIZ, ...DAY_QUESTIONS].forEach((q) => (SET_IDS[q.topic] ||= []).push(q.id));
  const setFor = (id) => SETS[id];
  const idsFor = (setId) => SET_IDS[setId] || [];
  const isDaySet = (id) => SETS[id]?.day !== undefined;
  const quizCorrect = (id) => !!saved.quiz[id]?.correct;
  let quiz = null;   // { set, order, index, selected, checked, session }
  let quizPart = saved.quizPart === 'quiz' ? 'quiz' : 'guide';   // which half of a set is showing

  function shuffled(ids) {
    const out = [...ids];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }

  function startQuiz(setId, order = setId === MIXED.id ? shuffled(idsFor(setId)) : idsFor(setId)) {
    quiz = { set: setId, order, index: 0, selected: null, checked: false, session: {} };
    if (isDaySet(setId)) saved.daySet = setId;
    else saved.quizSet = setId;
    persist();
    renderQuiz();
  }

  /* Open a topic on its study guide until any of its questions has been
     answered; after that, go straight to the questions. */
  function openTopic(setId) {
    const answered = idsFor(setId).some((id) => saved.quiz[id]);
    setPart(GUIDES[setId] && !answered ? 'guide' : 'quiz', false);
    startQuiz(setId);
  }

  function setPart(part, render = true) {
    quizPart = part;
    saved.quizPart = part;
    persist();
    if (render) renderQuiz();
  }

  function renderGuide(set) {
    const guide = GUIDES[set.id];
    $('guide-intro').innerHTML = guide.intro;
    $('guide-sections').innerHTML = guide.sections.map((s) => `<section class="guide-section"><h3>${s.title}</h3>${s.body}</section>`).join('');
    $('guide-tips').innerHTML = guide.tips.map((t) => `<li>${t}</li>`).join('');
    const count = idsFor(set.id).length;
    $('guide-hint').textContent = `${count} questions on ${set.day === undefined ? 'this topic' : 'today\'s material'} follow.`;
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
    $('quiz-topics').querySelectorAll('.quiz-topic').forEach((button) => {
      const ids = idsFor(button.dataset.quiz);
      const done = ids.filter(quizCorrect).length;
      button.classList.toggle('complete', done === ids.length);
      button.setAttribute('aria-pressed', String(!!quiz && quiz.set === button.dataset.quiz));
      button.querySelector('small').textContent = done === ids.length ? '✓' : `${done}/${ids.length}`;
    });
  }

  function renderQuiz() {
    const set = setFor(quiz.set);
    const day = set.day !== undefined;
    const reading = quizPart === 'guide' && !!GUIDES[set.id];
    $('exercise-kicker').textContent = day ? `DAY ${set.day + 1} · ${reading ? 'STUDY GUIDE' : 'QUIZ'}`
      : reading ? 'STUDY GUIDE' : `CONCEPT QUIZ · ${QUIZ.length} QUESTIONS`;
    $('exercise-title').textContent = set.title;
    $('quiz-topics').hidden = day;
    $('quiz-back').hidden = !day;
    $('quiz-parts').hidden = !GUIDES[set.id];
    $('quiz-parts').querySelectorAll('.quiz-part').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === (reading ? 'guide' : 'quiz'))));
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
    const set = setFor(quiz.set);
    if (set.day !== undefined) {
      $('quiz-next-topic').textContent = set.day + 1 < PLAN.length ? `Next: Day ${set.day + 2} →` : 'Back to the training plan →';
    } else {
      const i = QUIZ_SETS.indexOf(set);
      $('quiz-next-topic').textContent = i + 1 < QUIZ_SETS.length ? `Next: ${QUIZ_SETS[i + 1].title} →` : 'Start again →';
    }
    $('quiz-review-guide').hidden = !(missed && GUIDES[quiz.set]);
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

  /* ---------------------------------------------------------- learning guide
   * One page summarising every area as "remember" and "understand" lists
   * (notes.js), with links into the full guides and quizzes. */
  function openGuide(setId) {
    setPart('guide', false);
    startQuiz(setId);
    showView(isDaySet(setId) ? 'day' : 'quiz');
    focusQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildNotes() {
    $('notes-intro').innerHTML = NOTES_INTRO;
    $('notes-jump').replaceChildren(...NOTES.map((area) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-topic notes-jump-link';
      button.textContent = area.title;
      button.addEventListener('click', () => $(`notes-${area.id}`).scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return button;
    }));
    $('notes-areas').replaceChildren(...NOTES.map((area) => {
      const section = document.createElement('section');
      section.className = 'notes-area';
      section.id = `notes-${area.id}`;
      section.innerHTML = `<div class="notes-area-head"><h3></h3><p></p></div>
        <div class="notes-cols">
          <div class="notes-col notes-remember"><h4>What to remember</h4><ul>${area.remember.map((r) => `<li>${r}</li>`).join('')}</ul></div>
          <div class="notes-col notes-understand"><h4>What to understand</h4><ul>${area.understand.map((u) => `<li><b>${u.title}.</b> ${u.body}</li>`).join('')}</ul></div>
        </div>
        <div class="notes-links"><span>Go deeper:</span></div>`;
      section.querySelector('h3').textContent = area.title;
      section.querySelector('.notes-area-head p').textContent = area.summary;
      const links = section.querySelector('.notes-links');
      const link = (label, setId) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'text-button';
        button.textContent = label;
        button.addEventListener('click', () => openGuide(setId));
        links.append(button);
      };
      area.topics.forEach((id) => link(`${setFor(id).title} guide and quiz`, id));
      area.days.forEach((n) => link(`Day ${n}: ${PLAN[n - 1].title}`, daySetId(n - 1)));
      return section;
    }));
    document.querySelectorAll('.notes-show').forEach((button) => button.addEventListener('click', () => {
      saved.notesShow = button.dataset.show;
      persist();
      renderNotesFilter();
    }));
    renderNotesFilter();
  }

  function renderNotesFilter() {
    const show = ['remember', 'understand'].includes(saved.notesShow) ? saved.notesShow : 'all';
    $('notes-panel').dataset.show = show;
    document.querySelectorAll('.notes-show').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.show === show)));
  }

  /* The workspace shows the open problem, the training plan, the learning
     guide, the concept quiz, the C sandbox, or one plan day's guide and quiz
     ('day', shown in the quiz panel). */
  function showView(next) {
    const plan = next === 'plan', inQuiz = next === 'quiz', inDay = next === 'day', inNotes = next === 'notes', inSandbox = next === 'sandbox', inWelcome = next === 'welcome', inMockTest = next === 'mock';
    saved.view = next;
    persist();
    $('plan-panel').hidden = !plan;
    $('notes-panel').hidden = !inNotes;
    $('quiz-panel').hidden = !(inQuiz || inDay);
    $('sandbox-panel').hidden = !inSandbox;
    $('welcome-panel').hidden = !inWelcome;
    $('mock-panel').hidden = !inMockTest;
    $('exercise-panel').hidden = plan || inQuiz || inDay || inNotes || inSandbox || inWelcome || inMockTest;
    $('mock-button').setAttribute('aria-pressed', String(inMockTest));
    if (inMockTest) {
      $('exercise-kicker').textContent = 'MOCK INTERVIEW · EMBEDDED SOFTWARE';
      $('exercise-title').textContent = 'Interview prep test';
    }
    renderMock();
    if (inWelcome) {
      $('exercise-kicker').textContent = 'WELCOME';
      $('exercise-title').textContent = 'Where would you like to start?';
    }
    $('sandbox-button').setAttribute('aria-pressed', String(inSandbox));
    $('sandbox-button-label').textContent = inSandbox ? 'Back to the problem' : 'C sandbox';
    if (inSandbox) {
      $('exercise-kicker').textContent = 'SANDBOX · NOT CHECKED';
      $('exercise-title').textContent = 'Write and run any C';
    }
    $('notes-button').setAttribute('aria-pressed', String(inNotes));
    $('notes-button-label').textContent = inNotes ? 'Back to the problem' : 'Learning guide';
    if (inNotes) {
      $('exercise-kicker').textContent = `LEARNING GUIDE · ${NOTES.length} AREAS`;
      $('exercise-title').textContent = 'What to remember and understand';
    }
    $('plan-button').setAttribute('aria-pressed', String(plan || inDay));
    $('plan-button-label').textContent = plan ? 'Back to the problem' : inDay ? 'Back to the training plan' : 'Open the training plan';
    $('quiz-button').setAttribute('aria-pressed', String(inQuiz));
    $('quiz-button-label').textContent = inQuiz ? 'Back to the problem' : 'Study guide and quiz';
    if (plan) {
      $('exercise-kicker').textContent = `TRAINING PLAN · ${PLAN.length} DAYS`;
      $('exercise-title').textContent = PLAN_TITLE;
    }
    if (inQuiz) {
      if (quiz && !isDaySet(quiz.set)) renderQuiz();
      else if (!SETS[saved.quizSet] || isDaySet(saved.quizSet)) openTopic(QUIZ_TOPICS[0].id);
      else startQuiz(saved.quizSet);
    }
    if (inDay) {
      if (quiz && isDaySet(quiz.set)) renderQuiz();
      else openTopic(isDaySet(saved.daySet) ? saved.daySet : daySetId(0));
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
        const button = taskButton('problem-item', p.title, p.summary, p.difficulty, () => selectExercise(id));
        button.dataset.exercise = id;
        nav.append(button);
        const option = document.createElement('option');
        option.value = id;
        option.id = `option-${id}`;
        group.append(option);
      });
      select.append(group);
    });
    select.addEventListener('change', () => selectExercise(select.value));
    $('welcome-count').textContent = ORDER.length;
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
    clearDiagnostics(editor);
    showDiagnostics($('result-output'), output, editor, EXERCISES[active].filename);
    $('result-output').hidden = !output;
    $('result-compiler').textContent = compiler;
    renderChecklist(checks);
  }

  /* The problem and the sandbox each have an output panel; these name its
     elements and the wording that differs between them. */
  const PROBLEM_OUTPUT = {
    panel: 'program-panel', meta: 'program-meta', out: 'program-output', note: 'program-note',
    source: () => [editor, EXERCISES[active].filename],
    error: 'could not build on its own',
    none: 'Your code has no main(), so there is nothing to run. Add one to print values while you work; the checker ignores it.',
  };
  const SANDBOX_OUTPUT = {
    panel: 'sandbox-output-panel', meta: 'sandbox-meta', out: 'sandbox-output', note: 'sandbox-note',
    source: () => [sandbox, SANDBOX_FILE],
    error: 'did not compile',
    none: 'Your code has no main(), so there is nothing to run.',
  };

  function renderProgram(program, view = PROBLEM_OUTPUT) {
    const panel = $(view.panel), out = $(view.out), note = $(view.note);
    const [area, filename] = view.source();
    panel.hidden = !program;
    if (view === SANDBOX_OUTPUT) clearDiagnostics(area);   // the problem's are cleared by setPanel
    if (!program) return;
    panel.className = `program-panel ${program.state}`;
    const meta = {
      ran: `main() exited with code ${program.exitCode} · ${program.ms} ms`,
      error: view.error,
      crash: 'crashed while running',
      none: '',
    };
    $(view.meta).textContent = meta[program.state] || '';
    if (program.state === 'none') {
      note.textContent = view.none;
    } else if (program.state === 'ran' && !program.output.trim()) {
      note.textContent = 'Your program printed nothing.';
    } else {
      note.textContent = '';
    }
    note.hidden = !note.textContent;
    if (program.state === 'error') showDiagnostics(out, program.output, area, filename);
    else out.textContent = program.output;
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

  /* Hints open one at a time; after the last one the solution can be shown.
     Hint text and explanations are trusted HTML from hints.js. */
  function renderHints() {
    const entry = HINTS[active];
    $('hints').hidden = !entry || timerRunning() || inMock(active);   // no hints in a timed attempt or mock test
    if (!entry) return;
    const shown = Math.min(saved.hints[active] || 0, entry.hints.length + 1);
    const hintsShown = Math.min(shown, entry.hints.length);
    $('hint-list').innerHTML = entry.hints.slice(0, hintsShown).map((h) => `<li>${h}</li>`).join('');
    $('hint-list').hidden = !hintsShown;
    $('hint-button').hidden = hintsShown >= entry.hints.length;
    $('hint-button').textContent = `Show hint ${hintsShown + 1} of ${entry.hints.length}`;
    $('hints-note').textContent = hintsShown < entry.hints.length
      ? 'Reveal one hint at a time. Try each before the next.'
      : 'That is every hint. The solution is there if you need it.';
    const solutionOpen = shown > entry.hints.length;
    $('solution-button').hidden = hintsShown < entry.hints.length || solutionOpen;
    $('solution').hidden = !solutionOpen;
    if (solutionOpen) {
      $('solution-explain').innerHTML = entry.explain;
      $('solution-code').textContent = entry.solution;
    }
  }
  function revealHint() {
    saved.hints[active] = (saved.hints[active] || 0) + 1;
    persist();
    renderHints();
  }

  /* ----------------------------------------------------------- interview mode
   * A timed attempt counts down from the problem's target time and keeps
   * counting past it. Passing the checks stops it and records the time;
   * saved.timer survives a reload, and only one attempt runs at a time. */
  let timerTick = null;
  let lastTimed = null;   // { id, seconds } of the attempt that just finished
  const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const timerRunning = () => !!(saved.timer && saved.timer.id === active);

  function renderTimer() {
    const meta = EXERCISES[active], target = meta.minutes * 60, best = saved.best[active];
    const el = $('timer'), button = $('timer-button');
    clearInterval(timerTick); timerTick = null;
    button.hidden = inMock(active);
    $('exercise-time').textContent = `Aim for about ${meta.minutes} minutes${best ? ` · best ${clock(best)}` : ''}`;
    if (timerRunning()) {
      const { startedAt } = saved.timer;
      const update = () => {
        const left = target - Math.floor((Date.now() - startedAt) / 1000);
        el.textContent = left >= 0 ? `${clock(left)} left` : `${clock(-left)} over`;
        el.className = `timer${left < 0 ? ' over' : ''}`;
      };
      update();
      timerTick = setInterval(update, 1000);
      el.hidden = false;
      button.textContent = 'Stop timer';
    } else if (lastTimed && lastTimed.id === active) {
      const within = lastTimed.seconds <= target;
      el.textContent = `Solved in ${clock(lastTimed.seconds)}${within ? ', within the target' : ', over the target'}`;
      el.className = `timer ${within ? 'done' : 'over'}`;
      el.hidden = false;
      button.textContent = 'Try again, timed';
    } else {
      el.hidden = true;
      button.textContent = 'Start timed attempt';
    }
  }

  function finishTimer(id) {
    const seconds = Math.max(1, Math.round((Date.now() - saved.timer.startedAt) / 1000));
    delete saved.timer;
    saved.best[id] = Math.min(saved.best[id] || Infinity, seconds);
    lastTimed = { id, seconds };
    if (id === active) { renderTimer(); renderHints(); }
  }

  $('timer-button').addEventListener('click', () => {
    if (timerRunning()) {
      delete saved.timer;
    } else {
      const starter = EXERCISES[active].starter;
      if (isCurrentPass(active) && editor.value !== starter) {
        if (!confirm('This problem is already solved, so the timed attempt starts from the starter code. Your current code is replaced; download it first to keep it.')) return;
        editor.value = starter;
        editor.dispatchEvent(new Event('input'));
        showIdle();
      }
      saved.timer = { id: active, startedAt: Date.now() };
      lastTimed = null;
      editor.focus();
    }
    persist();
    renderTimer();
    renderHints();
  });

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
    renderTimer();
    $('exercise-description').textContent = meta.description;
    $('requirements').innerHTML = meta.requirements;
    $('followups').innerHTML = meta.followups.map((q) => `<li>${q}</li>`).join('');
    renderHints();
    $('mock-banner').hidden = !inMock(id);
    renderMockClock();
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
  function insertText(area, text) {
    area.focus();
    if (!document.execCommand('insertText', false, text)) {
      area.setRangeText(text, area.selectionStart, area.selectionEnd, 'end');
      area.dispatchEvent(new Event('input'));
    }
  }

  function outdentCurrentLine(area) {
    const v = area.value, pos = area.selectionStart;
    const lineStart = v.lastIndexOf('\n', pos - 1) + 1;
    const spaces = /^ {0,4}/.exec(v.slice(lineStart))[0].length;
    if (!spaces) return;
    area.setSelectionRange(lineStart, lineStart + spaces);
    if (!document.execCommand('delete')) {
      area.setRangeText('', lineStart, lineStart + spaces, 'start');
      area.dispatchEvent(new Event('input'));
    }
    const back = Math.max(lineStart, pos - spaces);
    area.setSelectionRange(back, back);
  }

  /* Code-editor keys for the problem and sandbox editors; Ctrl+Enter runs. */
  function bindEditorKeys(area, run) {
    area.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); run(); return; }
      if (event.key === 'Tab') { event.preventDefault(); if (event.shiftKey) outdentCurrentLine(area); else insertText(area, INDENT); return; }
      if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
        // Keep the current indentation; add one level after an opening brace.
        const v = area.value, pos = area.selectionStart;
        const line = v.slice(v.lastIndexOf('\n', pos - 1) + 1, pos);
        const indent = /^\s*/.exec(line)[0] + (/\{\s*$/.test(line) ? INDENT : '');
        event.preventDefault();
        insertText(area, '\n' + indent);
      }
    });
    area.addEventListener('scroll', () => { area.previousElementSibling.scrollTop = area.scrollTop; });
    area.addEventListener('input', () => clearDiagnostics(area));
  }
  bindEditorKeys(editor, runCheck);
  bindEditorKeys(sandbox, runSandbox);

  editor.addEventListener('input', () => {
    setDraft(active, editor.value);
    saved.lastEdit = new Date().toISOString();
    persist(); updateLines(); renderProgress();
    $('save-hint').textContent = 'Saved in this browser.';
  });
  sandbox.addEventListener('input', () => { saved.sandbox = sandbox.value; persist(); updateLines(sandbox); });

  /* ---------------------------------------------------------------- buttons */
  $('next-button').addEventListener('click', () => {
    const next = nextProblem();
    if (next) { selectExercise(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  $('run-button').addEventListener('click', runCheck);

  $('hint-button').addEventListener('click', revealHint);
  $('solution-button').addEventListener('click', revealHint);
  $('solution-hide').addEventListener('click', () => {
    saved.hints[active] = HINTS[active].hints.length;
    persist();
    renderHints();
  });
  $('solution-load').addEventListener('click', () => {
    const { solution } = HINTS[active];
    if (editor.value !== solution && !confirm('Replace your code with the model solution? Download your draft first if you want to keep it.')) return;
    editor.value = solution;
    editor.dispatchEvent(new Event('input'));   // saves the draft, as typing would
    renderProgram(null);
    setPanel('idle', '↳', 'Solution loaded', 'Run the checks to see it pass, then try rewriting it from memory.');
    editor.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  /* Each sidebar button opens its view, or returns to the problem when that
     view is already open. */
  const toggleView = (view, then = () => {}) => () => {
    if (saved.view === view) { selectExercise(active); return; }
    showView(view);
    then();
  };
  $('plan-button').addEventListener('click', toggleView('plan'));
  $('quiz-button').addEventListener('click', toggleView('quiz', focusQuiz));
  $('notes-button').addEventListener('click', toggleView('notes', () => window.scrollTo({ top: 0 })));
  $('sandbox-button').addEventListener('click', toggleView('sandbox', () => sandbox.focus()));
  $('mock-button').addEventListener('click', toggleView('mock', () => window.scrollTo({ top: 0 })));
  $('welcome-button').addEventListener('click', toggleView('welcome', () => window.scrollTo({ top: 0, behavior: 'smooth' })));

  /* Each path on the welcome page opens the part of the site that fits it. */
  const WELCOME_PATHS = {
    learn: () => { showView('quiz'); focusQuiz(); },
    problems: () => { selectExercise(ORDER[0]); $('code-editor').focus(); },
    plan: () => showView('plan'),
    sandbox: () => { showView('sandbox'); sandbox.focus(); },
  };
  document.querySelectorAll('.welcome-path').forEach((button) => button.addEventListener('click', () => {
    WELCOME_PATHS[button.dataset.path]();
    window.scrollTo({ top: 0 });
  }));
  $('quiz-back').addEventListener('click', () => showView('plan'));

  $('quiz-check').addEventListener('click', checkOrAdvance);
  $('quiz-retry').addEventListener('click', () => startQuiz(quiz.set, quiz.order.filter((id) => !quiz.session[id])));
  $('quiz-next-topic').addEventListener('click', () => {
    const set = setFor(quiz.set);
    if (set.day !== undefined) {
      if (set.day + 1 < PLAN.length) openDay(set.day + 1);
      else showView('plan');
      return;
    }
    const i = QUIZ_SETS.indexOf(set);
    openTopic(QUIZ_SETS[(i + 1) % QUIZ_SETS.length].id);
    focusQuiz();
  });
  $('quiz-review-guide').addEventListener('click', () => { setPart('guide'); focusQuiz(); });
  $('quiz-parts').querySelectorAll('.quiz-part').forEach((b) => b.addEventListener('click', () => setPart(b.dataset.part)));
  $('guide-start').addEventListener('click', () => {
    setPart('quiz', false);
    if (quiz.index >= quiz.order.length) startQuiz(quiz.set);   // finished: start afresh
    else renderQuiz();
    focusQuiz();
    $('quiz-panel').scrollIntoView({ block: 'start', behavior: 'smooth' });
  });

  /* In the quiz, keys 1-9 choose an option and Enter checks or moves on. */
  document.addEventListener('keydown', (event) => {
    if (!['quiz', 'day'].includes(saved.view) || !quiz || !$('quiz-guide').hidden || event.ctrlKey || event.metaKey || event.altKey) return;
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
    setDraft(active, starter);
    delete saved.results[active];
    delete lastResult[active];
    persist(); updateLines(); renderProgress();
    renderProgram(null);
    setPanel('idle', '↳', 'Starter restored', 'Your saved draft for this exercise was replaced with the starter code.');
  });

  function downloadFile(text, filename, type = 'text/x-c') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);   // revoking immediately can cancel the download in Firefox
  }
  $('download-button').addEventListener('click', () => downloadFile(editor.value, EXERCISES[active].filename));

  /* --------------------------------------------------------- mock interview
   * A timed test: concept questions from the quiz, then coding problems run
   * through the normal checker. saved.mock holds the test in progress:
   *   { startedAt, limit (s), questions: [ids], answers: {id: option},
   *     problems: [ids], solved: {id: true}, code: {id: draft} }
   * Finishing scores it, adds it to saved.mockHistory and deletes saved.mock. */
  const MOCK_QUESTIONS = 10;
  const MOCK_QUIZ_WEIGHT = 40, MOCK_CODE_WEIGHT = 60;
  const MOCK_SKIP_TOPIC = 'Networking';   // the test is for embedded roles
  let mockView = 'intro';                 // which part of the panel shows when no test is running

  const shuffle = (items) => {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  /* Questions are dealt round-robin across topics so one test covers many. */
  function pickMockQuestions() {
    const byTopic = {};
    shuffle(QUIZ.filter((q) => q.topic !== 'networking')).forEach((q) => (byTopic[q.topic] ||= []).push(q.id));
    const topics = shuffle(Object.keys(byTopic)), picked = [];
    while (picked.length < MOCK_QUESTIONS && topics.some((t) => byTopic[t].length)) {
      topics.forEach((t) => { if (picked.length < MOCK_QUESTIONS && byTopic[t].length) picked.push(byTopic[t].pop()); });
    }
    return picked;
  }

  /* One easier and one harder problem from different topics, unsolved ones first. */
  function pickMockProblems() {
    const pool = (levels) => shuffle(ORDER.filter((id) => levels.includes(EXERCISES[id].difficulty) && EXERCISES[id].topic !== MOCK_SKIP_TOPIC))
      .sort((a, b) => Number(isSolved(a)) - Number(isSolved(b)));
    const first = pool(['Easy', 'Medium'])[0];
    const second = pool(['Medium', 'Hard']).find((id) => id !== first && EXERCISES[id].topic !== EXERCISES[first].topic);
    return [first, second].filter(Boolean);
  }

  const mockLimit = (problems) => Math.ceil((10 + problems.reduce((sum, id) => sum + EXERCISES[id].minutes, 0)) / 5) * 5 * 60;
  const mockLeft = () => saved.mock.limit - Math.floor((Date.now() - saved.mock.startedAt) / 1000);

  function startMock() {
    const problems = pickMockProblems();
    saved.mock = { startedAt: Date.now(), limit: mockLimit(problems), questions: pickMockQuestions(), answers: {}, problems, solved: {}, code: {} };
    persist();
    renderMock();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function finishMock() {
    const m = saved.mock;
    if (!m) return;
    const right = m.questions.filter((id) => m.answers[id] === QUESTIONS[id].answer).length;
    const passed = m.problems.filter((id) => m.solved[id]).length;
    const score = Math.round(MOCK_QUIZ_WEIGHT * right / m.questions.length + MOCK_CODE_WEIGHT * passed / Math.max(1, m.problems.length));
    saved.mockHistory.unshift({
      at: new Date().toISOString(), score, right, questions: m.questions, answers: m.answers,
      problems: m.problems, solved: m.solved, seconds: Math.min(m.limit, Math.round((Date.now() - m.startedAt) / 1000)), limit: m.limit,
    });
    saved.mockHistory.length = Math.min(saved.mockHistory.length, 10);
    delete saved.mock;
    mockView = 'result';
    persist();
    if (EXERCISES[active] && saved.view === 'problem') selectExercise(active);   // back to the learner's own draft
    renderMock();
    renderProgress();
  }

  /* The countdown in the test bar and on a test problem's banner. */
  function renderMockClock() {
    $('mock-button-meta').textContent = saved.mock ? `In progress · ${clock(Math.max(0, mockLeft()))} left` : 'Timed questions and coding, scored';
    if (!saved.mock) return;
    const left = Math.max(0, mockLeft());
    $('mock-timer').textContent = `${clock(left)} left`;
    $('mock-timer').className = `timer${left < 120 ? ' over' : ''}`;
    $('mock-banner-timer').textContent = `${clock(left)} left`;
    const answered = saved.mock.questions.filter((id) => saved.mock.answers[id] !== undefined).length;
    const passed = saved.mock.problems.filter((id) => saved.mock.solved[id]).length;
    $('mock-status').textContent = `${answered}/${saved.mock.questions.length} answered · ${passed}/${saved.mock.problems.length} coding passed`;
  }
  setInterval(() => {
    if (!saved.mock) return;
    if (mockLeft() <= 0) finishMock();
    else renderMockClock();
  }, 1000);

  function questionOptions(q, { selected, reveal, onChoose }) {
    const options = document.createElement('div');
    options.className = 'quiz-options';
    options.setAttribute('role', 'radiogroup');
    options.append(...q.options.map((text, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-option';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(selected === i));
      if (selected === i) button.classList.add('selected');
      if (reveal) {
        button.disabled = true;
        if (i === q.answer) button.classList.add('correct');
        else if (i === selected) button.classList.add('wrong');
      }
      button.innerHTML = `<span class="quiz-key">${i + 1}</span><span>${text}</span>`;
      if (onChoose) button.addEventListener('click', () => onChoose(i));
      return button;
    }));
    return options;
  }

  function renderMock() {
    renderMockClock();
    const m = saved.mock;
    $('mock-button-label').textContent = saved.view === 'mock' ? 'Back to the problem' : 'Mock interview test';
    $('mock-intro').hidden = !!m || mockView !== 'intro';
    $('mock-run').hidden = !m;
    $('mock-result').hidden = !!m || mockView !== 'result' || !saved.mockHistory.length;
    if (!m && mockView === 'result' && !saved.mockHistory.length) $('mock-intro').hidden = false;
    if (m) renderMockRun(m);
    else if (!$('mock-result').hidden) renderMockResult(saved.mockHistory[0]);
    else renderMockIntro();
  }

  function renderMockIntro() {
    const history = saved.mockHistory;
    if (!history.length) { $('mock-history').replaceChildren(); return; }
    $('mock-history').innerHTML = `<table class="mock-history"><thead><tr><th>DATE</th><th>SCORE</th><th>QUESTIONS</th><th>CODING</th><th>TIME</th></tr></thead><tbody>${
      history.map((h) => `<tr><td>${dateLabel(h.at)}</td><td><b>${h.score}%</b></td><td>${h.right} / ${h.questions.length}</td><td>${h.problems.filter((id) => h.solved[id]).length} / ${h.problems.length}</td><td>${clock(h.seconds)}</td></tr>`).join('')
    }</tbody></table>`;
  }

  function renderMockRun(m) {
    $('mock-questions').replaceChildren(...m.questions.map((id) => {
      const q = QUESTIONS[id], li = document.createElement('li');
      const prompt = document.createElement('div');
      prompt.className = 'quiz-prompt';
      prompt.innerHTML = q.prompt;
      li.append(prompt, questionOptions(q, {
        selected: m.answers[id],
        onChoose: (i) => { m.answers[id] = i; persist(); renderMockRun(m); renderMockClock(); },
      }));
      return li;
    }));
    $('mock-problems').replaceChildren(...m.problems.map((id, i) => {
      const p = EXERCISES[id], card = document.createElement('div');
      card.className = `mock-problem${m.solved[id] ? ' passed' : ''}`;
      card.innerHTML = `<small>PROBLEM ${i + 1} · ${p.difficulty.toUpperCase()} · ABOUT ${p.minutes} MIN</small><b></b><small></small>`;
      card.querySelector('b').textContent = p.title;
      card.querySelectorAll('small')[1].textContent = m.solved[id] ? '✓ All checks passed' : p.summary;
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'next-button';
      open.textContent = m.solved[id] ? 'Review the code' : 'Open and solve →';
      open.addEventListener('click', () => { selectExercise(id); window.scrollTo({ top: 0 }); editor.focus(); });
      card.append(open);
      return card;
    }));
  }

  function renderMockResult(h) {
    const passed = h.problems.filter((id) => h.solved[id]).length;
    $('mock-score').textContent = `${h.score}%`;
    $('mock-verdict').textContent = h.score >= 80 ? 'Interview ready on this round.' : h.score >= 60 ? 'Close. Review the misses and go again.' : 'Keep practising before the real thing.';
    $('mock-summary').textContent = `${h.right} of ${h.questions.length} questions right and ${passed} of ${h.problems.length} coding problems passed, in ${clock(h.seconds)} of the ${clock(h.limit)} allowed.`;

    const missed = h.questions.filter((id) => h.answers[id] !== QUESTIONS[id].answer);
    const weakTopics = [...new Set(missed.map((id) => QUESTIONS[id].topic))];
    const topicTitle = (t) => (QUIZ_TOPICS.find((x) => x.id === t) || { title: t }).title;
    const stat = (label, value, items) => `<div class="mock-stat"><span>${label}</span><b>${value}</b>${items.length ? `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}</div>`;
    $('mock-breakdown').innerHTML =
      stat('Concept questions', `${h.right} / ${h.questions.length}`, weakTopics.map((t) => `Missed: ${topicTitle(t)}`)) +
      stat('Coding', `${passed} / ${h.problems.length}`, h.problems.map((id) => `${h.solved[id] ? '✓' : '✗'} ${EXERCISES[id] ? EXERCISES[id].title : id}`)) +
      stat('Time', clock(h.seconds), [`of ${clock(h.limit)} allowed`]);

    // What to do next: the study guide for each weak topic, and the unsolved problems.
    const next = document.createElement('div');
    next.className = 'mock-links';
    weakTopics.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'next-button';
      b.textContent = `Study: ${topicTitle(t)}`;
      b.addEventListener('click', () => { showView('quiz'); openTopic(t); focusQuiz(); window.scrollTo({ top: 0 }); });
      next.append(b);
    });
    h.problems.filter((id) => !h.solved[id] && EXERCISES[id]).forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'next-button';
      b.textContent = `Retry: ${EXERCISES[id].title}`;
      b.addEventListener('click', () => { selectExercise(id); window.scrollTo({ top: 0 }); });
      next.append(b);
    });
    $('mock-next').replaceChildren(...(next.children.length ? [Object.assign(document.createElement('h3'), { className: 'mock-part', textContent: 'What to work on next' }), next] : []));

    $('mock-review').replaceChildren(...(missed.length ? [Object.assign(document.createElement('h3'), { className: 'mock-part', textContent: `Questions to review (${missed.length})` })] : []),
      ...missed.map((id) => {
        const q = QUESTIONS[id], item = document.createElement('div');
        item.className = 'mock-review-item';
        const prompt = document.createElement('div');
        prompt.className = 'quiz-prompt';
        prompt.innerHTML = q.prompt;
        const explain = document.createElement('p');
        explain.innerHTML = `${h.answers[id] === undefined ? '<b>Not answered.</b> ' : ''}${q.explain}`;
        item.append(prompt, questionOptions(q, { selected: h.answers[id], reveal: true }), explain);
        return item;
      }));
  }

  function submitMock() {
    const m = saved.mock;
    const unanswered = m.questions.filter((id) => m.answers[id] === undefined).length;
    const unsolved = m.problems.filter((id) => !m.solved[id]).length;
    const left = [unanswered && `${unanswered} unanswered ${unanswered === 1 ? 'question' : 'questions'}`, unsolved && `${unsolved} unsolved ${unsolved === 1 ? 'problem' : 'problems'}`].filter(Boolean);
    if (left.length && !confirm(`Submit with ${left.join(' and ')}? Time is still running, so you can keep going.`)) return;
    finishMock();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('mock-start').addEventListener('click', startMock);
  $('mock-submit').addEventListener('click', submitMock);
  $('mock-submit-bottom').addEventListener('click', submitMock);
  $('mock-again').addEventListener('click', startMock);
  $('mock-overview').addEventListener('click', () => { mockView = 'intro'; renderMock(); });
  $('mock-banner-back').addEventListener('click', () => { showView('mock'); window.scrollTo({ top: 0 }); });

  /* ---------------------------------------------------------- share links
   * A link carries the sandbox code and stdin in the URL hash, deflated and
   * base64url-encoded, so nothing is uploaded: #sandbox=<data>. */
  const SHARE_PREFIX = '#sandbox=';
  async function pipeBytes(bytes, stream) {
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  }
  async function encodeShare(code, input) {
    const packed = await pipeBytes(new TextEncoder().encode(JSON.stringify({ code, input })), new CompressionStream('deflate-raw'));
    let text = '';
    packed.forEach((b) => { text += String.fromCharCode(b); });
    return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function decodeShare(data) {
    const text = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0));
    const { code, input } = JSON.parse(new TextDecoder().decode(await pipeBytes(bytes, new DecompressionStream('deflate-raw'))));
    if (typeof code !== 'string') throw new Error('no code in link');
    return { code, input: typeof input === 'string' ? input : '' };
  }
  const sandboxHint = (text) => { $('sandbox-hint').textContent = text; };

  $('sandbox-share').addEventListener('click', async () => {
    try {
      const url = `${location.href.split('#')[0]}${SHARE_PREFIX}${await encodeShare(sandbox.value, $('sandbox-stdin').value)}`;
      try { await navigator.clipboard.writeText(url); sandboxHint('Link copied. Anyone who opens it sees this code and input.'); }
      catch (_) { window.prompt('Copy this link:', url); }
    } catch (error) {
      sandboxHint(`Could not make a link: ${error.message}`);
    }
  });

  /* Opening a shared link shows its code without saving it, so the learner's
     own draft is kept until they edit the shared code. */
  async function openSharedLink() {
    if (!location.hash.startsWith(SHARE_PREFIX)) return;
    try {
      const { code, input } = await decodeShare(location.hash.slice(SHARE_PREFIX.length));
      sandbox.value = code;
      $('sandbox-stdin').value = input;
      updateLines(sandbox);
      renderProgram(null, SANDBOX_OUTPUT);
      showView('sandbox');
      sandboxHint('Opened code from a shared link. Editing it replaces your saved sandbox draft.');
    } catch (_) {
      showView('sandbox');
      sandboxHint('That share link is damaged or incomplete, so your own sandbox code is shown.');
    }
    history.replaceState(null, '', location.href.split('#')[0]);
  }
  window.addEventListener('hashchange', openSharedLink);

  /* ----------------------------------------------------------------- backup
   * One JSON file holds everything this browser stores for the trainer:
   * drafts, results, plan ticks, quiz answers, hints, sandbox code and theme. */
  const BACKUP_APP = 'embedded-c-trainer';
  const backupNote = (text, error = false) => {
    $('backup-note').textContent = text;
    $('backup-note').classList.toggle('error', error);
  };

  $('export-button').addEventListener('click', () => {
    const exportedAt = new Date().toISOString();
    const backup = { app: BACKUP_APP, format: 1, exportedAt, progress: saved, theme };
    downloadFile(JSON.stringify(backup, null, 2), `${BACKUP_APP}-progress-${exportedAt.slice(0, 10)}.json`, 'application/json');
    backupNote('Progress exported. Keep the file somewhere safe; Import from file restores it.');
  });

  $('import-button').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async () => {
    const file = $('import-file').files[0];
    $('import-file').value = '';   // so choosing the same file again still fires change
    if (!file) return;
    let backup;
    try {
      backup = JSON.parse(await file.text());
    } catch (_) {
      backupNote('That file is not a trainer backup: it is not valid JSON.', true);
      return;
    }
    const progress = backup && backup.app === BACKUP_APP ? backup.progress : null;
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
      backupNote('That file is not a trainer backup. Choose a file made with Export progress.', true);
      return;
    }
    const when = backup.exportedAt ? new Date(backup.exportedAt).toLocaleString() : 'an unknown date';
    if (!confirm(`Replace the progress in this browser with the backup from ${when}? What is here now will be lost; export it first if you want to keep it.`)) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(progress));
      if (THEMES.includes(backup.theme)) localStorage.setItem(THEME_KEY, backup.theme);
    } catch (_) {
      backupNote('This browser would not save the backup. Check that site storage is allowed.', true);
      return;
    }
    location.reload();
  });

  $('sandbox-run').addEventListener('click', runSandbox);
  $('sandbox-download').addEventListener('click', () => downloadFile(sandbox.value, SANDBOX_FILE));
  $('sandbox-reset').addEventListener('click', () => {
    if (sandbox.value !== SANDBOX_STARTER && !confirm('Replace your sandbox code with the example? Download it first if you want to keep it.')) return;
    sandbox.value = SANDBOX_STARTER;
    delete saved.sandbox;
    persist(); updateLines(sandbox);
    renderProgram(null, SANDBOX_OUTPUT);
  });

  /* ------------------------------------------------------------------ theme
   * 'system' follows the OS; 'light' and 'dark' set data-theme on <html>,
   * which the inline script in index.html also reads before first paint. */
  const THEME_KEY = 'embedded-c-trainer-theme';
  const THEMES = ['system', 'light', 'dark'];
  let theme = 'system';
  try { theme = THEMES.includes(localStorage.getItem(THEME_KEY)) ? localStorage.getItem(THEME_KEY) : 'system'; } catch (_) {}
  function applyTheme() {
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    const button = $('theme-toggle');
    button.innerHTML = `<span class="theme-word">Theme: </span>${theme}`;
    button.setAttribute('aria-label', `Colour theme: ${theme}. Select to change.`);
  }
  $('theme-toggle').addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    applyTheme();
  });
  applyTheme();

  /* ------------------------------------------------------------------ start */
  window.addEventListener('trainer:cloud-progress', (event) => {
    cloudPassed = new Set((event.detail || []).filter((id) => EXERCISES[id]));
    renderProgress();
  });

  const startView = saved.view;
  buildProblemList();
  buildPlan();
  buildQuizTopics();
  buildNotes();
  sandbox.value = saved.sandbox ?? SANDBOX_STARTER;
  updateLines(sandbox);
  startChecker();
  selectExercise(active);
  if (saved.mock && mockLeft() <= 0) finishMock();   // time ran out while the page was closed
  if (['plan', 'quiz', 'day', 'notes', 'sandbox', 'welcome', 'mock'].includes(startView)) showView(startView);
  if (firstVisit) showView('welcome');
  openSharedLink();
})();
