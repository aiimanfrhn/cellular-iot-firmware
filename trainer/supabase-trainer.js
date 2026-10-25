import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const root = document.querySelector('.progress-card');
if (root) {
  const panel = document.createElement('section');
  panel.className = 'cloud-card';
  panel.innerHTML = `
    <div class="cloud-heading"><div><span class="eyebrow">CLOUD BACKUP</span><h2>Your account</h2></div><span id="cloud-state">Loading…</span></div>
    <p class="cloud-copy">Sign in to sync passed exercises. Your C source stays here unless you explicitly submit it.</p>
    <form id="cloud-email-form" class="cloud-form"><label for="cloud-email">Email</label><input id="cloud-email" type="email" autocomplete="email" required placeholder="you@example.com"><button type="submit">Email sign-in link</button></form>
    <div id="cloud-user-actions" class="cloud-actions hidden"><button id="cloud-submit" type="button">Submit checked code</button><button id="cloud-signout" class="cloud-signout" type="button">Sign out</button></div>
    <p id="cloud-message" class="cloud-message" aria-live="polite"></p>
    <ul id="cloud-progress" class="cloud-progress"></ul>`;
  root.insertAdjacentElement('afterend', panel);
  const $ = (id) => document.getElementById(id);
  const message = (value, error = false) => { $('cloud-message').textContent = value; $('cloud-message').classList.toggle('error', error); };
  let cloudRows = [];
  function updateProgressUI() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('embedded-c-trainer-week1-v1') || '{}'); } catch (_) {}
    const cloudPassed = new Set(cloudRows.filter((row) => row.passed).map((row) => row.exercise_id));
    const ids = ['bit_ops', 'ring_buffer'];
    const localPass = (id) => {
      const result = saved.results?.[id];
      return !!(result?.passed && result.version === 2 && saved.code?.[id] === result.code);
    };
    const passed = ids.filter((id) => cloudPassed.has(id) || localPass(id)).length;
    const count = ids.length, left = count - passed;
    $('progress-count').textContent = passed + ' / ' + count;
    $('passed-count').textContent = String(passed);
    $('progress-fill').style.width = (passed / count * 100) + '%';
    $('progress-caption').textContent = left === 0 ? 'Week 1 complete. Nice work!' : 'Pass ' + left + ' more ' + (left === 1 ? 'check' : 'checks') + ' to complete this week.';
    $('week-state').textContent = left === 0 ? 'COMPLETE' : 'IN PROGRESS';
    $('week-state').closest('.week-item').classList.toggle('complete', left === 0);
    document.querySelectorAll('.exercise-tab').forEach((tab) => {
      const id = tab.dataset.exercise, passedHere = cloudPassed.has(id) || localPass(id);
      const result = saved.results?.[id];
      tab.classList.toggle('passed', passedHere);
      const check = $('tab-check-' + id), label = $('tab-result-' + id);
      if (check) check.textContent = passedHere ? '✓' : (id === 'bit_ops' ? '1' : '2');
      if (label) {
        label.textContent = passedHere ? 'Passed' : result ? (result.passed ? 'Draft changed' : 'Needs work') : 'Not checked';
        label.classList.toggle('passed-text', passedHere);
      }
    });
    const activity = [...Object.values(saved.results || {}).map((r) => r?.at), ...cloudRows.map((r) => r.checked_at), saved.lastEdit].filter(Boolean).sort();
    const last = activity[activity.length - 1];
    $('last-activity').textContent = last ? (new Date(last).toDateString() === new Date().toDateString()
      ? 'Today, ' + new Date(last).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : new Date(last).toLocaleDateString([], { month: 'short', day: 'numeric' })) : 'Not started';
  }
  if (!url || !key) {
    $('cloud-state').textContent = 'Not configured';
    $('cloud-email-form').classList.add('hidden');
    message('Cloud backup needs Vercel environment variables. Local coding and checks still work.');
  } else {
    const db = createClient(url, key);
    let user = null, lastSynced = '';
    const storageKey = 'embedded-c-trainer-week1-v1';
    async function refreshProgress() {
      if (!user) return;
      const { data, error } = await db.from('embedded_c_trainer_progress').select('exercise_id,checked_at').eq('user_id', user.id);
      if (error) { message('Could not load saved progress: ' + error.message, true); return; }
      cloudRows = data || [];
      $('cloud-progress').replaceChildren();
      for (const id of ['bit_ops', 'ring_buffer']) {
        const row = (data || []).find((item) => item.exercise_id === id);
        const li = document.createElement('li');
        li.textContent = (id === 'bit_ops' ? 'Bit operations' : 'Ring buffer') + ': ' + (row ? 'Passed' : 'Not passed yet');
        $('cloud-progress').append(li);
      }
      updateProgressUI();
    }
    async function syncCurrentPass() {
      if (!user) return;
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}
      const active = document.querySelector('.exercise-tab.active')?.dataset.exercise;
      if (!active) return;
      const result = saved.results?.[active], code = saved.code?.[active];
      if (!result?.passed || result.version !== 2 || !code || code !== result.code) return;
      const signature = user.id + ':' + active + ':' + result.at;
      if (signature === lastSynced) return;
      const { error } = await db.from('embedded_c_trainer_progress').upsert({
        user_id: user.id, exercise_id: active, passed: true, checked_at: result.at, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,exercise_id' });
      if (error) { message('Passed locally; cloud sync failed: ' + error.message, true); return; }
      lastSynced = signature;
      await refreshProgress();
      message('Passed exercise synced to your account. Code is not uploaded.');
    }
    async function setSession(session) {
      user = session?.user || null;
      $('cloud-state').textContent = user ? 'Signed in · ' + (user.email || 'account') : 'Not signed in';
      $('cloud-email-form').classList.toggle('hidden', !!user);
      $('cloud-user-actions').classList.toggle('hidden', !user);
      $('cloud-progress').replaceChildren();
      cloudRows = [];
      lastSynced = '';
      if (user) { await refreshProgress(); await syncCurrentPass(); }
      else { updateProgressUI(); message('Sign in to back up your progress across devices.'); }
    }
    $('cloud-email-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('cloud-email').value.trim();
      $('cloud-state').textContent = 'Sending code…';
      const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } });
      if (error) { $('cloud-state').textContent = 'Not signed in'; message('Could not send code: ' + error.message, true); return; }
      message('Sign-in link sent to ' + email + '. Open the link in this browser to connect your account.');
    });
    $('cloud-signout').addEventListener('click', async () => {
      const { error } = await db.auth.signOut();
      if (error) { message('Could not sign out: ' + error.message, true); return; }
      await setSession(null);
    });
    $('cloud-submit').addEventListener('click', async () => {
      if (!user) return;
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}
      const active = document.querySelector('.exercise-tab.active')?.dataset.exercise;
      const result = saved.results?.[active], code = saved.code?.[active];
      if (!result?.passed || result.version !== 2 || !code || code !== result.code) {
        message('Run checks successfully on the current code before submitting it.', true); return;
      }
      $('cloud-submit').disabled = true;
      const { error } = await db.from('embedded_c_trainer_submissions').insert({
        user_id: user.id, exercise_id: active, source_code: code, passed: true,
        check_summary: 'All current Week 1 checks passed.'
      });
      $('cloud-submit').disabled = false;
      if (error) { message('Code was not submitted: ' + error.message, true); return; }
      message('Checked code saved privately to your account.');
    });
    db.auth.getSession().then(({ data, error }) => {
      if (error) message('Could not restore sign-in: ' + error.message, true);
      setSession(data?.session || null);
    });
    db.auth.onAuthStateChange((_event, session) => { queueMicrotask(() => setSession(session)); });
    setInterval(async () => { await syncCurrentPass(); updateProgressUI(); }, 1200);
  }
}
