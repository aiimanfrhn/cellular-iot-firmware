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
      $('cloud-progress').replaceChildren();
      for (const id of ['bit_ops', 'ring_buffer']) {
        const row = (data || []).find((item) => item.exercise_id === id);
        const li = document.createElement('li');
        li.textContent = (id === 'bit_ops' ? 'Bit operations' : 'Ring buffer') + ': ' + (row ? 'Passed' : 'Not passed yet');
        $('cloud-progress').append(li);
      }
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
      lastSynced = '';
      if (user) { await refreshProgress(); await syncCurrentPass(); }
      else message('Sign in to back up your progress across devices.');
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
    setInterval(syncCurrentPass, 1200);
  }
}
