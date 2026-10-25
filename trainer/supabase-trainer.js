import { createClient } from '@supabase/supabase-js';
import { CHECKER_VERSION, PROBLEMS } from './problems.js';

/* Optional cloud backup. app.js owns the page and progress display; this
   module only talks to Supabase:
   - listens for 'trainer:result' (fired by app.js after every check) and
     records passes in embedded_c_trainer_progress;
   - fires 'trainer:cloud-progress' with the ids passed in the cloud, which
     app.js counts as solved;
   - uploads source code only when the learner chooses Submit checked code. */

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const STORAGE_KEY = 'embedded-c-trainer-week1-v1';
const TITLES = Object.fromEntries(PROBLEMS.map((p) => [p.id, p.title]));

const root = document.querySelector('.progress-card');
if (root) {
  const panel = document.createElement('section');
  panel.className = 'cloud-card';
  panel.innerHTML = `
    <div class="cloud-heading"><div><span class="eyebrow">CLOUD BACKUP</span><h2>Your account</h2></div><span id="cloud-state">Loading…</span></div>
    <p class="cloud-copy">Sign in to sync solved problems across devices. Your C source stays here unless you explicitly submit it.</p>
    <form id="cloud-email-form" class="cloud-form"><label for="cloud-email">Email</label><input id="cloud-email" type="email" autocomplete="email" required placeholder="you@example.com"><button type="submit">Email sign-in link</button></form>
    <div id="cloud-user-actions" class="cloud-actions hidden"><button id="cloud-submit" type="button">Submit checked code</button><button id="cloud-signout" class="cloud-signout" type="button">Sign out</button></div>
    <p id="cloud-message" class="cloud-message" aria-live="polite"></p>
    <ul id="cloud-progress" class="cloud-progress"></ul>`;
  root.insertAdjacentElement('afterend', panel);

  const $ = (id) => document.getElementById(id);
  const message = (value, error = false) => { $('cloud-message').textContent = value; $('cloud-message').classList.toggle('error', error); };
  const readSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) { return {}; } };
  const reportCloud = (ids) => window.dispatchEvent(new CustomEvent('trainer:cloud-progress', { detail: ids }));

  /* A local pass counts only if it was made under the current checks and the
     saved code is still the code that passed. */
  function currentPass(saved, id) {
    const result = saved.results?.[id];
    return result?.passed && result.version === CHECKER_VERSION && saved.code?.[id] === result.code ? result : null;
  }

  if (!url || !key) {
    $('cloud-state').textContent = 'Not configured';
    $('cloud-email-form').classList.add('hidden');
    message('Cloud backup needs Vercel environment variables. Local coding and checks still work.');
  } else {
    const db = createClient(url, key);
    let user = null;
    let cloudIds = new Set();

    function renderCloudList() {
      const li = document.createElement('li');
      li.textContent = `Backed up: ${cloudIds.size} of ${PROBLEMS.length} problems solved`;
      $('cloud-progress').replaceChildren(li);
    }

    async function refreshProgress() {
      if (!user) return;
      const { data, error } = await db.from('embedded_c_trainer_progress').select('exercise_id,passed,checked_at').eq('user_id', user.id);
      if (error) { message('Could not load saved progress: ' + error.message, true); return; }
      cloudIds = new Set((data || []).filter((row) => row.passed && TITLES[row.exercise_id]).map((row) => row.exercise_id));
      renderCloudList();
      reportCloud([...cloudIds]);
    }

    async function syncPass(id, result) {
      if (!user || !result?.passed || !TITLES[id]) return;
      const { error } = await db.from('embedded_c_trainer_progress').upsert({
        user_id: user.id, exercise_id: id, passed: true, checked_at: result.at, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,exercise_id' });
      if (error) { message('Solved locally; cloud sync failed: ' + error.message, true); return; }
      cloudIds.add(id);
      renderCloudList();
      reportCloud([...cloudIds]);
      message(`${TITLES[id]} synced to your account. Code is not uploaded.`);
    }

    /* After signing in, back up local passes the cloud does not have yet. */
    async function syncLocalPasses() {
      const saved = readSaved();
      for (const p of PROBLEMS) {
        const result = currentPass(saved, p.id);
        if (result && !cloudIds.has(p.id)) await syncPass(p.id, result);
      }
    }

    async function setSession(session) {
      user = session?.user || null;
      $('cloud-state').textContent = user ? 'Signed in · ' + (user.email || 'account') : 'Not signed in';
      $('cloud-email-form').classList.toggle('hidden', !!user);
      $('cloud-user-actions').classList.toggle('hidden', !user);
      $('cloud-progress').replaceChildren();
      cloudIds = new Set();
      reportCloud([]);
      if (user) { await refreshProgress(); await syncLocalPasses(); }
      else message('Sign in to back up your progress across devices.');
    }

    window.addEventListener('trainer:result', (event) => {
      const result = event.detail;
      if (result?.passed) syncPass(result.exercise, result);
    });

    $('cloud-email-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('cloud-email').value.trim();
      $('cloud-state').textContent = 'Sending link…';
      const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } });
      if (error) { $('cloud-state').textContent = 'Not signed in'; message('Could not send link: ' + error.message, true); return; }
      $('cloud-state').textContent = 'Not signed in';
      message('Sign-in link sent to ' + email + '. Open the link in this browser to connect your account.');
    });

    $('cloud-signout').addEventListener('click', async () => {
      const { error } = await db.auth.signOut();
      if (error) { message('Could not sign out: ' + error.message, true); return; }
      await setSession(null);
    });

    $('cloud-submit').addEventListener('click', async () => {
      if (!user) return;
      const saved = readSaved();
      const active = saved.active && TITLES[saved.active] ? saved.active : PROBLEMS[0].id;
      const result = currentPass(saved, active);
      if (!result) { message(`Run checks successfully on the current ${TITLES[active]} code before submitting it.`, true); return; }
      $('cloud-submit').disabled = true;
      const { error } = await db.from('embedded_c_trainer_submissions').insert({
        user_id: user.id, exercise_id: active, source_code: saved.code[active], passed: true,
        check_summary: `All ${TITLES[active]} checks passed (checker version ${CHECKER_VERSION}).`,
      });
      $('cloud-submit').disabled = false;
      if (error) { message('Code was not submitted: ' + error.message, true); return; }
      message(`${TITLES[active]} code saved privately to your account.`);
    });

    db.auth.getSession().then(({ data, error }) => {
      if (error) message('Could not restore sign-in: ' + error.message, true);
      setSession(data?.session || null);
    });
    db.auth.onAuthStateChange((_event, session) => { queueMicrotask(() => setSession(session)); });
  }
}
