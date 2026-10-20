const $ = id => document.getElementById(id);
const audio = $('audio');
const safe = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey = 'linkedbeats-playlist-v2';
let c, songs = {}, playing = false;

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.remove('hidden');
  setTimeout(() => $('toast').classList.add('hidden'), 3500);
}

function makeCircularEngine(wasmExports) {
  return {
    ...wasmExports,
    get_prev_id: (id) => {
      const count = wasmExports.get_count();
      if (count <= 0) return -1;
      if (count === 1) return id;
      const p = wasmExports.get_prev_id(id);
      if (p >= 0) return p;
      // In a doubly circular linked list, HEAD's prev pointer points to TAIL
      const headId = wasmExports.get_id_at(0);
      if (id === headId) return wasmExports.get_id_at(count - 1);
      return -1;
    },
    get_next_id: (id) => {
      const count = wasmExports.get_count();
      if (count <= 0) return -1;
      if (count === 1) return id;
      const n = wasmExports.get_next_id(id);
      if (n >= 0) return n;
      // In a doubly circular linked list, TAIL's next pointer points to HEAD
      const tailId = wasmExports.get_id_at(count - 1);
      if (id === tailId) return wasmExports.get_id_at(0);
      return -1;
    }
  };
}

function ordered() {
  return Array.from({length: c.get_count()}, (_, i) => songs[c.get_id_at(i)]).filter(Boolean);
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify({songs: ordered(), current: c.get_current()}));
}

function render() {
  const list = ordered(), current = c.get_current();
  $('count').textContent = list.length;
  $('empty').classList.toggle('hidden', list.length > 0);

  const headId = list.length > 0 ? list[0].id : -1;
  const tailId = list.length > 0 ? list[list.length - 1].id : -1;

  $('songs').innerHTML = list.map((s, i) => {
    let roleText = '↔ NODE';
    let roleClass = 'role-node';
    if (list.length === 1) {
      roleText = 'HEAD &amp; TAIL (⟲ self)';
      roleClass = 'role-head-tail';
    } else if (i === 0) {
      roleText = `HEAD (prev ⇄ TAIL #${tailId})`;
      roleClass = 'role-head';
    } else if (i === list.length - 1) {
      roleText = `TAIL (next ⇄ HEAD #${headId})`;
      roleClass = 'role-tail';
    }
    return `<tr class="${s.id === current ? 'active' : ''}" data-id="${s.id}">
      <td>${i + 1}</td>
      <td><span class="song-icon">♫</span><strong>${safe(s.title)}</strong></td>
      <td>${safe(s.artist)}</td>
      <td><span class="table-role ${roleClass}">${roleText}</span></td>
      <td><button class="delete" data-delete="${s.id}" title="Delete">✕</button></td>
    </tr>`;
  }).join('');

  if (!list.length) {
    $('nodes').innerHTML = '<span class="muted">The doubly circular linked list is empty. Add your first track above.</span>';
  } else if (list.length === 1) {
    const s = list[0];
    $('nodes').innerHTML = `
      <div class="circular-visualizer single-mode">
        <div class="circular-nodes-row">
          <div class="loop-pill left-loop" title="Head loops to itself in single-node circular list">
            <span class="loop-label">⟲ prev</span>
            <span class="loop-ref">#${s.id}</span>
          </div>
          <span class="arrow">⇄</span>
          <div class="node ${s.id === current ? 'current' : ''}" data-id="${s.id}" title="HEAD &amp; TAIL (points to itself)">
            <div class="node-badge-row">
              <span class="node-badge badge-head-tail">HEAD &amp; TAIL</span>
              <span class="node-id-tag">#${s.id}</span>
            </div>
            <div class="node-title">${safe(s.title)}</div>
            <div class="node-artist">${safe(s.artist)}</div>
            <div class="node-ptrs">
              <span class="ptr ptr-prev">◂ prev: #${s.id} (self)</span>
              <span class="ptr ptr-next">next: #${s.id} (self) ▸</span>
            </div>
          </div>
          <span class="arrow">⇄</span>
          <div class="loop-pill right-loop" title="Tail loops to itself in single-node circular list">
            <span class="loop-ref">#${s.id}</span>
            <span class="loop-label">next ⟳</span>
          </div>
        </div>
        <div class="circular-summary">
          <span class="cycle-icon">↻</span>
          <span><strong>Single-Node Closed Loop:</strong> The node's <code>prev</code> and <code>next</code> pointers both reference itself. There is no NULL.</span>
        </div>
      </div>
    `;
  } else {
    const headSong = list[0];
    const tailSong = list[list.length - 1];

    const nodesHtml = list.map((s, i) => {
      const prevId = c.get_prev_id(s.id);
      const nextId = c.get_next_id(s.id);
      const prevSong = songs[prevId];
      const nextSong = songs[nextId];
      const prevName = prevSong ? prevSong.title : `#${prevId}`;
      const nextName = nextSong ? nextSong.title : `#${nextId}`;

      let roleBadge = '<span class="node-badge badge-node">NODE</span>';
      if (i === 0) roleBadge = '<span class="node-badge badge-head">HEAD</span>';
      else if (i === list.length - 1) roleBadge = '<span class="node-badge badge-tail">TAIL</span>';

      return `<div class="node ${s.id === current ? 'current' : ''}" data-id="${s.id}" title="prev: ${prevName} (#${prevId}) | next: ${nextName} (#${nextId})">
        <div class="node-badge-row">
          ${roleBadge}
          <span class="node-id-tag">#${s.id}</span>
        </div>
        <div class="node-title">${safe(s.title)}</div>
        <div class="node-artist">${safe(s.artist)}</div>
        <div class="node-ptrs">
          <span class="ptr ptr-prev" title="Previous node">◂ prev: #${prevId}</span>
          <span class="ptr ptr-next" title="Next node">next: #${nextId} ▸</span>
        </div>
      </div>`;
    }).join('<span class="arrow">⇄</span>');

    $('nodes').innerHTML = `
      <div class="circular-visualizer">
        <div class="loop-track-container top-track">
          <div class="loop-track-content">
            <span class="loop-endpoint tail-chip">TAIL #${tailId} (${safe(tailSong.title)})</span>
            <span class="loop-line-graphic">────────── next pointer loops to first node ──────────►</span>
            <span class="loop-endpoint head-chip">HEAD #${headId} (${safe(headSong.title)})</span>
          </div>
        </div>
        <div class="circular-nodes-row">
          <div class="loop-pill left-loop" title="HEAD's prev pointer connects back to TAIL #${tailId}">
            <span class="loop-label">⮐ prev: TAIL</span>
            <span class="loop-ref">#${tailId}</span>
          </div>
          <span class="arrow loop-arrow">⇄</span>
          ${nodesHtml}
          <span class="arrow loop-arrow">⇄</span>
          <div class="loop-pill right-loop" title="TAIL's next pointer connects forward to HEAD #${headId}">
            <span class="loop-ref">#${headId}</span>
            <span class="loop-label">next: HEAD ⮑</span>
          </div>
        </div>
        <div class="loop-track-container bottom-track">
          <div class="loop-track-content">
            <span class="loop-endpoint head-chip">HEAD #${headId} (${safe(headSong.title)})</span>
            <span class="loop-line-graphic">◄────────── prev pointer loops to last node ──────────</span>
            <span class="loop-endpoint tail-chip">TAIL #${tailId} (${safe(tailSong.title)})</span>
          </div>
        </div>
        <div class="circular-summary">
          <span class="cycle-icon">↻</span>
          <span><strong>Doubly Circular Linked List:</strong> Last node (TAIL #${tailId}) links forward to first node (HEAD #${headId}), and HEAD links backward to TAIL. Click any node to play it.</span>
        </div>
      </div>
    `;
  }

  const s = songs[current];
  $('nowTitle').textContent = s?.title || 'Nothing playing';
  $('nowArtist').textContent = s?.artist || 'Choose a track';
  if (s && audio.dataset.id !== String(s.id)) {
    audio.src = s.url;
    audio.dataset.id = String(s.id);
    if (playing) audio.play().catch(() => toast('Audio cannot be played. Check the URL.'));
  }
  if (!s) {
    audio.removeAttribute('src');
    audio.dataset.id = '';
    audio.load();
    playing = false;
  }
  $('toggleBtn').textContent = playing ? 'Ⅱ' : '▶';
}

function change(fn) {
  fn();
  save();
  render();
}

function select(id) {
  playing = true;
  change(() => c.play(Number(id)));
  audio.play().catch(() => toast('Audio cannot be played. Check the URL.'));
}

$('songs').addEventListener('click', e => {
  const del = e.target.closest('[data-delete]');
  if (del) {
    e.stopPropagation();
    const id = Number(del.dataset.delete);
    change(() => {
      c.remove_song(id);
      delete songs[id];
    });
    return;
  }
  const row = e.target.closest('[data-id]');
  if (row) select(row.dataset.id);
});

$('nodes').addEventListener('click', e => {
  const node = e.target.closest('.node[data-id]');
  if (node) select(node.dataset.id);
});

$('showForm').onclick = () => $('songForm').classList.toggle('hidden');

$('songForm').onsubmit = e => {
  e.preventDefault();
  const title = $('title').value.trim();
  const artist = $('artist').value.trim();
  const url = $('url').value.trim();
  if (!title || !artist || !/^https?:\/\//i.test(url)) return toast('Enter a title, artist, and valid http(s) audio URL.');
  const id = c.add();
  if (id < 0) return toast('Playlist limit reached (512 tracks).');
  songs[id] = {id, title, artist, url};
  save();
  render();
  $('songForm').reset();
  $('songForm').classList.add('hidden');
};

$('nextBtn').onclick = () => { playing = true; change(() => c.next_song()); };
$('prevBtn').onclick = () => { playing = true; change(() => c.previous_song()); };
$('shuffleBtn').onclick = () => change(() => c.shuffle_songs());

function toggle() {
  if (!audio.getAttribute('src')) return toast('Add a song first.');
  if (audio.paused) {
    audio.play().then(() => { playing = true; render(); }).catch(() => toast('Could not play this audio URL.'));
  } else {
    audio.pause();
    playing = false;
    render();
  }
}

$('toggleBtn').onclick = toggle;
$('playBtn').onclick = toggle;

audio.addEventListener('ended', () => { playing = true; change(() => c.next_song()); });
audio.addEventListener('pause', () => { if (!audio.ended) { playing = false; $('toggleBtn').textContent = '▶'; } });
audio.addEventListener('play', () => { playing = true; $('toggleBtn').textContent = 'Ⅱ'; });

async function init() {
  try {
    const response = await fetch('/playlist.wasm');
    if (!response.ok) throw Error('WASM file missing');
    const bytes = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, {});
    c = makeCircularEngine(instance.exports);
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (Array.isArray(saved.songs)) {
      for (const s of saved.songs) {
        if (!s || typeof s.title !== 'string' || typeof s.artist !== 'string' || typeof s.url !== 'string') continue;
        const id = c.add();
        if (id < 0) break;
        songs[id] = {id, title: s.title, artist: s.artist, url: s.url};
        if (s.id === saved.current) saved.newCurrent = id;
      }
      if (saved.newCurrent) c.play(saved.newCurrent);
    }
    render();
  } catch (err) {
    toast('Could not load the C WebAssembly engine: ' + err.message);
    console.error(err);
  }
}

init();
