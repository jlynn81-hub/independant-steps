/* Independent Steps — one-step-at-a-time chore guide.
 * Plain JS, no build step. All data stays on the device (localStorage). */
'use strict';

const STORAGE_KEY = 'independent-steps:v1';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const PREVIEW_ID = '__preview__';

const uid = () => Math.random().toString(36).slice(2, 10);
const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Starter chores ---------- */
function step(emoji, text) { return { id: uid(), emoji, text, image: '', video: '' }; }

// Bundled photos for the starter chores (see CREDITS.md). Step number -> images/<set>-<n>.jpg
const STARTER_PHOTOS = { Laundry: ['laundry', [1, 2, 3, 4, 5, 6, 7, 8, 9]], 'Wash the dishes': ['dishes', [1, 2, 3, 4, 5, 6, 7, 8, 9]],
  'Make the bed': ['bed', [1, 2, 3, 4, 5]], 'Feed the pet': ['pet', [1, 3, 4, 5]] };
const STARTER_IMAGE_FILES = Object.values(STARTER_PHOTOS).flatMap(([set, nums]) => nums.map((n) => `images/${set}-${n}.jpg`));
function addStarterPhotos(chores) {
  for (const c of chores) {
    const photos = STARTER_PHOTOS[c.title];
    if (!photos) continue;
    const [set, nums] = photos;
    c.steps.forEach((s, i) => { if (nums.includes(i + 1)) s.image = `images/${set}-${i + 1}.jpg`; });
  }
  return chores;
}

function starterChores() {
  return addStarterPhotos([
    {
      id: uid(), title: 'Laundry', emoji: '🧺',
      reminders: [{ id: uid(), time: '16:00', days: [6] }],
      steps: [
        step('🧺', 'Bring your laundry basket to the washing machine.'),
        step('⚪', 'Sort the clothes. Light colors in one pile. Dark colors in another pile.'),
        step('👕', 'Put one pile in the washer. Do not fill it past the top.'),
        step('🧴', 'Add one scoop of detergent.'),
        step('▶️', 'Close the door. Press Start.'),
        step('🔔', 'When the washer beeps, move the wet clothes into the dryer.'),
        step('✨', 'Clean the lint filter. Then press Start on the dryer.'),
        step('👚', 'When the dryer is done, fold the clothes.'),
        step('🗄️', 'Put the clothes away in your drawers.'),
      ],
    },
    {
      id: uid(), title: 'Wash the dishes', emoji: '🍽️',
      reminders: [{ id: uid(), time: '19:00', days: ALL_DAYS.slice() }],
      steps: [
        step('🗑️', 'Scrape leftover food into the trash.'),
        step('🫧', 'Fill the sink with warm, soapy water.'),
        step('🥛', 'Wash the cups first.'),
        step('🍽️', 'Wash the plates and bowls next.'),
        step('🍳', 'Wash the pots and pans last.'),
        step('💧', 'Rinse each dish with clean water.'),
        step('🧺', 'Put the dishes in the drying rack.'),
        step('🗄️', 'When they are dry, put each dish in its cupboard.'),
        step('🧽', 'Wipe the counter.'),
      ],
    },
    {
      id: uid(), title: 'Make the bed', emoji: '🛏️',
      reminders: [{ id: uid(), time: '07:30', days: [1, 2, 3, 4, 5] }],
      steps: [
        step('🛌', 'Take the pillows off the bed.'),
        step('📐', 'Pull the bottom sheet tight at each corner.'),
        step('⬆️', 'Pull the top sheet and blanket up to the top of the bed.'),
        step('👐', 'Smooth out the bumps with your hands.'),
        step('🛏️', 'Put the pillows back at the top.'),
      ],
    },
    {
      id: uid(), title: 'Feed the pet', emoji: '🐶',
      reminders: [{ id: uid(), time: '08:00', days: ALL_DAYS.slice() }, { id: uid(), time: '18:00', days: ALL_DAYS.slice() }],
      steps: [
        step('🥣', "Get your pet's food bowl."),
        step('💧', 'Rinse the bowl with water.'),
        step('🥄', 'Fill one scoop of food. Pour it into the bowl.'),
        step('📍', 'Put the bowl back in its spot.'),
        step('🚰', 'Check the water bowl. If it is low, fill it with fresh water.'),
        step('📦', 'Close the food bag and put it away.'),
      ],
    },
  ]);
}

// Saved data from before the photos existed: give unedited starter steps their photo.
function migratePhotos(s) {
  if (s.photosAdded) return;
  const starters = starterChores();
  for (const c of s.chores) {
    const match = starters.find((x) => x.title === c.title);
    if (!match) continue;
    for (const st of c.steps) {
      const orig = match.steps.find((x) => x.text === st.text);
      if (orig && orig.image && !st.image) st.image = orig.image;
    }
  }
  s.photosAdded = true;
}

function defaultState() {
  return {
    chores: starterChores(),
    photosAdded: true,
    settings: { readAloud: false, pin: '' },
    completions: {}, // choreId -> 'YYYY-MM-DD'
  };
}

/* ---------- Storage ---------- */
let state = load();
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.chores)) {
        s.settings = Object.assign({ readAloud: false, pin: '' }, s.settings);
        s.completions = s.completions || {};
        if (!s.photosAdded) { migratePhotos(s); localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
        return s;
      }
    }
  } catch (e) { console.warn('Could not load saved data', e); }
  return defaultState();
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    alert('Could not save. The device storage may be full — try smaller photos or remove some.');
    return false;
  }
}
const findChore = (id) => state.chores.find((c) => c.id === id);

/* ---------- Routing ---------- */
// #/            home
// #/chore/ID    player
// #/care        caregiver list
// #/edit/ID     chore editor ("new" for a new chore)
let caregiverUnlocked = false;
const app = document.getElementById('app');

function route() {
  stopSpeaking();
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const [view, id] = parts;
  if ((view === 'care' || view === 'edit') && !caregiverUnlocked) { location.hash = '#/'; return; }
  if (view === 'chore' && findChore(id)) return renderPlayer(findChore(id));
  if (view === 'care') return renderCaregiver();
  if (view === 'edit') return renderEditor(id);
  renderHome();
}
window.addEventListener('hashchange', route);
const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

/* ---------- Home ---------- */
function renderHome() {
  const today = todayKey();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  app.innerHTML = `
    <div class="topbar">
      <div>
        <h1>${greet} 👋</h1>
        <p class="muted">Pick a chore to start.</p>
      </div>
      <span class="spacer"></span>
      <button class="hold icon-btn" id="care-btn" aria-label="Grown-ups: press and hold to open settings" title="Grown-ups: press and hold">
        <span class="fill"></span>⚙️
      </button>
    </div>
    ${state.chores.length ? '' : '<p class="muted">No chores yet. A grown-up can add some in settings.</p>'}
    <ul class="chore-list">
      ${state.chores.map((c) => {
        const done = state.completions[c.id] === today;
        const next = nextReminderToday(c);
        return `<li><button class="chore-card ${done ? 'is-done' : ''}" data-id="${esc(c.id)}">
          <span class="emoji" aria-hidden="true">${esc(c.emoji || '✅')}</span>
          <span>
            <span class="title">${esc(c.title)}</span><br>
            <span class="meta">${c.steps.length} step${c.steps.length === 1 ? '' : 's'}${next ? ` · at ${formatTime(next)}` : ''}</span>
            ${done ? '<br><span class="badge-done">✓ Done today</span>' : ''}
          </span>
        </button></li>`;
      }).join('')}
    </ul>`;
  app.querySelectorAll('.chore-card').forEach((b) =>
    b.addEventListener('click', () => go(`#/chore/${b.dataset.id}`)));
  setupHold(document.getElementById('care-btn'), openCaregiver);
}

function setupHold(btn, onDone) {
  let timer = null;
  const start = (e) => {
    e.preventDefault();
    btn.classList.add('holding');
    timer = setTimeout(() => { cancel(); onDone(); }, 1000);
  };
  const cancel = () => { clearTimeout(timer); timer = null; btn.classList.remove('holding'); };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, cancel));
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  // Keyboard users: Enter/Space opens directly (PIN still applies).
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDone(); } });
}

function openCaregiver() {
  if (state.settings.pin) {
    const entered = prompt('Enter the grown-up PIN');
    if (entered === null) return;
    if (entered !== state.settings.pin) { alert('That PIN is not right.'); return; }
  }
  caregiverUnlocked = true;
  go('#/care');
}

/* ---------- Player (one step at a time) ---------- */
function renderPlayer(chore, index = 0) {
  if (!chore.steps.length) {
    app.innerHTML = `<p>This chore has no steps yet.</p><button class="btn-primary" id="home">Back</button>`;
    document.getElementById('home').onclick = () => go('#/');
    return;
  }
  if (index >= chore.steps.length) return renderFinish(chore);
  const s = chore.steps[index];
  const total = chore.steps.length;
  const visual = s.video
    ? videoHtml(s.video)
    : s.image
      ? `<img src="${esc(s.image)}" alt="">`
      : `<span class="big-emoji" aria-hidden="true">${esc(s.emoji || chore.emoji || '✅')}</span>`;

  app.innerHTML = `
    <div class="player">
      <div class="topbar">
        <button class="btn-small" id="exit" aria-label="Stop and go back to chores">✕ Stop</button>
        <span class="spacer"></span>
        <strong>${esc(chore.emoji)} ${esc(chore.title)}</strong>
      </div>
      <div class="progress" aria-hidden="true">
        ${chore.steps.map((_, i) => `<span class="${i < index ? 'past' : i === index ? 'now' : ''}"></span>`).join('')}
      </div>
      <div class="step-count">Step ${index + 1} of ${total}</div>
      <div class="step-visual">${visual}</div>
      <p class="step-text" id="step-text">${esc(s.text)}</p>
      <div class="player-actions">
        <button class="btn-primary btn-huge" id="next">${index === total - 1 ? '✓ Finished!' : '✓ Done — next step'}</button>
        <div class="row">
          <button id="back" ${index === 0 ? 'disabled' : ''}>← Back</button>
          <button id="speak">🔊 Read to me</button>
        </div>
      </div>
    </div>`;
  document.getElementById('exit').onclick = () => (chore.id === PREVIEW_ID ? renderEditor(draft._for) : go('#/'));
  document.getElementById('next').onclick = () => renderPlayer(chore, index + 1);
  document.getElementById('back').onclick = () => renderPlayer(chore, index - 1);
  document.getElementById('speak').onclick = () => speak(s.text);
  if (state.settings.readAloud) speak(s.text);
  document.getElementById('next').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function videoHtml(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${esc(yt[1])}?rel=0" title="Step video"
      style="width:100%;aspect-ratio:16/9;border:0" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }
  if (/^https?:\/\//i.test(url)) return `<video src="${esc(url)}" controls playsinline preload="metadata"></video>`;
  return '';
}

function renderFinish(chore) {
  // A caregiver preview returns to the editor and doesn't count as done.
  if (chore.id === PREVIEW_ID) { renderEditor(draft._for); return; }
  state.completions[chore.id] = todayKey();
  save();
  app.innerHTML = `
    <div class="finish">
      <div class="star" aria-hidden="true">🌟</div>
      <h1>You did it!</h1>
      <p class="muted">You finished “${esc(chore.title)}” all by yourself.</p>
      <button class="btn-primary btn-huge" id="home">Back to chores</button>
    </div>`;
  document.getElementById('home').onclick = () => go('#/');
  speak(`You did it! You finished ${chore.title}.`, true);
}

/* ---------- Read aloud ---------- */
function speak(text, onlyIfEnabled = false) {
  if (!('speechSynthesis' in window)) return;
  if (onlyIfEnabled && !state.settings.readAloud) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
function stopSpeaking() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }

/* ---------- Caregiver: chore list + settings ---------- */
function renderCaregiver() {
  app.innerHTML = `
    <div class="topbar">
      <button class="btn-small" id="done">← Done</button>
      <h1 style="margin:0">Grown-up settings</h1>
    </div>
    <p class="muted">Add or change chores, steps, photos and reminder times.</p>

    <h2>Chores</h2>
    <div id="care-list">
      ${state.chores.map((c, i) => `
        <div class="panel row">
          <span style="font-size:2rem" aria-hidden="true">${esc(c.emoji)}</span>
          <span><strong>${esc(c.title)}</strong><br><span class="muted">${c.steps.length} steps · ${c.reminders.length} reminder${c.reminders.length === 1 ? '' : 's'}</span></span>
          <span class="spacer"></span>
          <button class="btn-small" data-act="up" data-i="${i}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn-small" data-act="down" data-i="${i}" aria-label="Move down" ${i === state.chores.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn-small btn-primary" data-act="edit" data-i="${i}">Edit</button>
        </div>`).join('')}
    </div>
    <button class="btn-primary" id="add" style="width:100%">＋ Add a chore</button>

    <h2>Reminders</h2>
    <div class="panel">
      <p id="notif-status" class="muted"></p>
      <button id="notif-btn">Allow notifications</button>
      <p class="muted" style="margin-top:12px;font-size:0.95rem">
        Reminders show while the app is open. To get reminders when it's closed,
        add them to the device calendar: open a chore and use “Add reminders to calendar”.
      </p>
    </div>

    <h2>Options</h2>
    <div class="panel">
      <label class="check"><input type="checkbox" id="read-aloud" ${state.settings.readAloud ? 'checked' : ''}> Read each step out loud automatically</label>
      <label for="pin">Grown-up PIN (optional)</label>
      <input type="password" id="pin" inputmode="numeric" placeholder="Leave empty for no PIN" value="${esc(state.settings.pin)}">
      <p class="muted" style="font-size:0.95rem;margin-top:6px">Settings always need a 1-second press and hold. A PIN adds a second lock.</p>
    </div>

    <h2>Backup</h2>
    <div class="panel tools">
      <button id="export">⬇ Save backup file</button>
      <button id="import">⬆ Load backup file</button>
      <button class="btn-danger" id="reset">Reset to starter chores</button>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </div>

    <h2>Photo credits</h2>
    <details class="panel">
      <summary>Starter photos from Pixabay and Wikimedia Commons</summary>
      <ul class="credits">
        ${(window.PHOTO_CREDITS || []).map((c) => `<li><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.file)}</a>: ${esc(c.author)}, ${esc(c.source)} (${esc(c.license)})</li>`).join('')}
      </ul>
    </details>`;

  document.getElementById('done').onclick = () => { caregiverUnlocked = false; go('#/'); };
  document.getElementById('add').onclick = () => go('#/edit/new');
  document.getElementById('care-list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const i = Number(b.dataset.i);
    if (b.dataset.act === 'edit') return go(`#/edit/${state.chores[i].id}`);
    const j = b.dataset.act === 'up' ? i - 1 : i + 1;
    [state.chores[i], state.chores[j]] = [state.chores[j], state.chores[i]];
    save(); renderCaregiver();
  });

  const status = document.getElementById('notif-status');
  const nbtn = document.getElementById('notif-btn');
  const refreshNotif = () => {
    if (!('Notification' in window)) { status.textContent = 'This browser does not support notifications. Reminders will show as a banner in the app.'; nbtn.hidden = true; return; }
    const p = Notification.permission;
    status.textContent = p === 'granted' ? '✓ Notifications are on.' : p === 'denied' ? 'Notifications are blocked in the browser settings. Reminders will show as a banner instead.' : 'Notifications are off.';
    nbtn.hidden = p !== 'default';
  };
  nbtn.onclick = () => Notification.requestPermission().then(refreshNotif);
  refreshNotif();

  document.getElementById('read-aloud').onchange = (e) => { state.settings.readAloud = e.target.checked; save(); };
  document.getElementById('pin').onchange = (e) => { state.settings.pin = e.target.value.trim(); save(); };

  document.getElementById('export').onclick = () => {
    download(`independent-steps-backup-${todayKey()}.json`, JSON.stringify(state, null, 2), 'application/json');
  };
  const fileInput = document.getElementById('import-file');
  document.getElementById('import').onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    const f = fileInput.files[0];
    if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!s || !Array.isArray(s.chores)) throw new Error('bad file');
      if (!confirm('Replace all chores with the ones in this backup?')) return;
      state = Object.assign(defaultState(), s);
      save(); renderCaregiver();
    } catch { alert('That file is not an Independent Steps backup.'); }
  };
  document.getElementById('reset').onclick = () => {
    if (!confirm('Delete all your changes and go back to the starter chores?')) return;
    const keep = state.settings;
    state = defaultState(); state.settings = keep;
    save(); renderCaregiver();
  };
}

/* ---------- Caregiver: chore editor ---------- */
let draft = null;
function renderEditor(id) {
  if (!draft || draft._for !== id) {
    const existing = findChore(id);
    draft = existing ? JSON.parse(JSON.stringify(existing))
      : { id: uid(), title: '', emoji: '✅', steps: [step('', '')], reminders: [] };
    draft._for = id;
  }
  const d = draft;
  app.innerHTML = `
    <div class="topbar">
      <button class="btn-small" id="cancel">← Cancel</button>
      <h1 style="margin:0">${findChore(id) ? 'Edit chore' : 'New chore'}</h1>
    </div>

    <div class="panel">
      <div class="row">
        <div><label for="emoji">Icon</label><input type="text" id="emoji" class="emoji-input" maxlength="4" value="${esc(d.emoji)}"></div>
        <div style="flex:1"><label for="title">Chore name</label><input type="text" id="title" placeholder="e.g. Take out the trash" value="${esc(d.title)}"></div>
      </div>
    </div>

    <h2>Steps</h2>
    <p class="muted">Keep each step short — one action per step. A photo of the real place or object helps most.</p>
    <div id="steps">
      ${d.steps.map((s, i) => `
        <div class="panel step-edit" data-i="${i}">
          <div class="row"><span class="num">Step ${i + 1}</span><span class="spacer"></span>
            <input type="text" class="emoji-input" data-field="emoji" maxlength="4" value="${esc(s.emoji)}" aria-label="Step ${i + 1} icon" style="width:64px!important;padding:6px;font-size:1.3rem">
          </div>
          <label for="text-${i}" class="muted" style="font-weight:500">What to do</label>
          <textarea id="text-${i}" data-field="text" placeholder="e.g. Put the plates in the sink.">${esc(s.text)}</textarea>
          ${s.image ? `<img class="step-thumb" src="${esc(s.image)}" alt="Step ${i + 1} photo">` : ''}
          <label for="video-${i}" class="muted" style="font-weight:500">Video link (optional)</label>
          <input type="url" id="video-${i}" data-field="video" placeholder="YouTube or video file link" value="${esc(s.video)}">
          <div class="tools">
            <button class="btn-small" data-act="photo">📷 ${s.image ? 'Change photo' : 'Add photo'}</button>
            ${s.image ? '<button class="btn-small" data-act="nophoto">Remove photo</button>' : ''}
            <button class="btn-small" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move step up">↑</button>
            <button class="btn-small" data-act="down" ${i === d.steps.length - 1 ? 'disabled' : ''} aria-label="Move step down">↓</button>
            <button class="btn-small btn-danger" data-act="del">Delete step</button>
          </div>
        </div>`).join('')}
    </div>
    <button id="add-step" style="width:100%">＋ Add a step</button>

    <h2>Reminder times</h2>
    <div id="reminders">
      ${d.reminders.map((r, i) => `
        <div class="panel" data-r="${i}">
          <div class="row">
            <input type="time" data-rfield="time" value="${esc(r.time)}" aria-label="Reminder time" style="max-width:170px">
            <span class="spacer"></span>
            <button class="btn-small btn-danger" data-ract="del">Remove</button>
          </div>
          <div class="days">
            ${DAY_NAMES.map((n, day) => `<label><input type="checkbox" data-day="${day}" ${r.days.includes(day) ? 'checked' : ''}> ${n}</label>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <div class="tools" style="margin-top:0">
      <button id="add-rem">⏰ Add a reminder time</button>
      ${d.reminders.length ? '<button id="ics">📅 Add reminders to calendar</button>' : ''}
    </div>

    ${findChore(id) ? '<h2>Delete</h2><button class="btn-danger" id="delete-chore">Delete this chore</button>' : ''}

    <div class="sticky-actions">
      <button id="preview">▶ Try it</button>
      <button class="btn-primary" id="save">Save</button>
    </div>
    <input type="file" id="photo-file" accept="image/*" hidden>`;

  // Keep the draft in sync with typing (no re-render, so focus isn't lost).
  document.getElementById('title').oninput = (e) => { d.title = e.target.value; };
  document.getElementById('emoji').oninput = (e) => { d.emoji = e.target.value; };
  const stepsEl = document.getElementById('steps');
  stepsEl.addEventListener('input', (e) => {
    const panel = e.target.closest('[data-i]');
    const field = e.target.dataset.field;
    if (panel && field) d.steps[Number(panel.dataset.i)][field] = e.target.value;
  });

  const photoInput = document.getElementById('photo-file');
  let photoFor = -1;
  photoInput.onchange = async () => {
    const f = photoInput.files[0];
    photoInput.value = '';
    if (!f || photoFor < 0) return;
    try { d.steps[photoFor].image = await resizeImage(f, 800); renderEditor(id); }
    catch { alert('Could not read that photo.'); }
  };

  stepsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const i = Number(b.closest('[data-i]').dataset.i);
    const act = b.dataset.act;
    if (act === 'photo') { photoFor = i; photoInput.click(); return; }
    if (act === 'nophoto') d.steps[i].image = '';
    if (act === 'del') { if (d.steps.length === 1) d.steps[0] = step('', ''); else d.steps.splice(i, 1); }
    if (act === 'up' || act === 'down') {
      const j = act === 'up' ? i - 1 : i + 1;
      [d.steps[i], d.steps[j]] = [d.steps[j], d.steps[i]];
    }
    renderEditor(id);
  });
  document.getElementById('add-step').onclick = () => { d.steps.push(step('', '')); renderEditor(id); };

  const remEl = document.getElementById('reminders');
  remEl.addEventListener('change', (e) => {
    const r = d.reminders[Number(e.target.closest('[data-r]').dataset.r)];
    if (e.target.dataset.rfield === 'time') r.time = e.target.value;
    if (e.target.dataset.day !== undefined) {
      const day = Number(e.target.dataset.day);
      r.days = e.target.checked ? [...new Set([...r.days, day])].sort() : r.days.filter((x) => x !== day);
    }
  });
  remEl.addEventListener('click', (e) => {
    if (!e.target.closest('[data-ract="del"]')) return;
    d.reminders.splice(Number(e.target.closest('[data-r]').dataset.r), 1);
    renderEditor(id);
  });
  document.getElementById('add-rem').onclick = () => {
    d.reminders.push({ id: uid(), time: '16:00', days: ALL_DAYS.slice() });
    renderEditor(id);
  };
  const icsBtn = document.getElementById('ics');
  if (icsBtn) icsBtn.onclick = () => download(`${slug(d.title || 'chore')}-reminders.ics`, buildIcs(d), 'text/calendar');

  const cleaned = () => {
    const c = JSON.parse(JSON.stringify(d));
    delete c._for;
    c.title = c.title.trim() || 'Untitled chore';
    c.steps = c.steps.filter((s) => s.text.trim() || s.image || s.video);
    c.reminders = c.reminders.filter((r) => r.time && r.days.length);
    return c;
  };
  document.getElementById('preview').onclick = () => renderPlayer(Object.assign(cleaned(), { id: PREVIEW_ID }));
  document.getElementById('save').onclick = () => {
    const c = cleaned();
    if (!c.steps.length) { alert('Add at least one step.'); return; }
    const i = state.chores.findIndex((x) => x.id === c.id);
    if (i >= 0) state.chores[i] = c; else state.chores.push(c);
    if (save()) { draft = null; go('#/care'); }
  };
  document.getElementById('cancel').onclick = () => { draft = null; go('#/care'); };
  const del = document.getElementById('delete-chore');
  if (del) del.onclick = () => {
    if (!confirm(`Delete “${d.title}”? This cannot be undone.`)) return;
    state.chores = state.chores.filter((c) => c.id !== d.id);
    delete state.completions[d.id];
    save(); draft = null; go('#/care');
  };
}

function resizeImage(file, maxSize) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

/* ---------- Reminders ---------- */
function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function nextReminderToday(chore) {
  const now = new Date();
  const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return chore.reminders
    .filter((r) => r.days.includes(now.getDay()) && r.time >= cur)
    .map((r) => r.time).sort()[0] || null;
}

const firedKey = 'independent-steps:fired';
function checkReminders() {
  const now = new Date();
  let fired = {};
  try { fired = JSON.parse(localStorage.getItem(firedKey) || '{}'); } catch { /* ignore */ }
  const today = todayKey(now);
  for (const c of state.chores) {
    if (state.completions[c.id] === today) continue;
    for (const r of c.reminders) {
      const key = `${today}|${c.id}|${r.id}`;
      // Fire within a 10-minute window after the time, once per day.
      if (!r.days.includes(now.getDay()) || fired[key]) continue;
      const [h, m] = r.time.split(':').map(Number);
      const diff = (now.getHours() * 60 + now.getMinutes()) - (h * 60 + m);
      if (diff < 0 || diff > 10) continue;
      fired[key] = true;
      notify(c);
    }
  }
  // Drop keys from previous days.
  for (const k of Object.keys(fired)) if (!k.startsWith(today)) delete fired[k];
  try { localStorage.setItem(firedKey, JSON.stringify(fired)); } catch { /* ignore */ }
}

function notify(chore) {
  const banner = document.getElementById('reminder-banner');
  banner.innerHTML = `<span>⏰ Time for: ${esc(chore.emoji)} ${esc(chore.title)}</span>
    <button class="btn-primary" id="banner-go">Start</button><button id="banner-later">Later</button>`;
  banner.hidden = false;
  document.getElementById('banner-go').onclick = () => { banner.hidden = true; go(`#/chore/${chore.id}`); };
  document.getElementById('banner-later').onclick = () => { banner.hidden = true; };

  if ('Notification' in window && Notification.permission === 'granted') {
    const opts = { body: `Time for: ${chore.title}`, icon: 'icon.svg', tag: chore.id, data: { url: `./#/chore/${chore.id}` } };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => reg.showNotification('Independent Steps', opts));
    } else {
      try { new Notification('Independent Steps', opts); } catch { /* banner is enough */ }
    }
  }
}

function buildIcs(chore) {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Independent Steps//EN', 'CALSCALE:GREGORIAN'];
  for (const r of chore.reminders.filter((x) => x.time && x.days.length)) {
    const [h, m] = r.time.split(':').map(Number);
    // Start on the next day that matches the rule.
    const start = new Date();
    while (!r.days.includes(start.getDay())) start.setDate(start.getDate() + 1);
    const dt = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(h)}${pad(m)}00`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${chore.id}-${r.id}@independent-steps`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${dt}`,
      'DURATION:PT15M',
      `RRULE:FREQ=WEEKLY;BYDAY=${r.days.map((d) => ICS_DAYS[d]).join(',')}`,
      `SUMMARY:${icsText(`${chore.emoji} ${chore.title}`)}`,
      `DESCRIPTION:${icsText('Open Independent Steps to see each step.')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${icsText(`Time for: ${chore.title}`)}`, 'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
const icsText = (s) => String(s).replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chore';

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Start ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker not registered', e));
}
route();
checkReminders();
setInterval(checkReminders, 20000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkReminders(); if (!location.hash.startsWith('#/chore') && !location.hash.startsWith('#/edit')) route(); } });
