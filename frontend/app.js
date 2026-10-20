const $ = id => document.getElementById(id);
const audio = $('audio');
const safe = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey='linkedbeats-playlist-v2';
let c, songs={}, playing=false;
function toast(message){$('toast').textContent=message;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),3500);}
function ordered(){return Array.from({length:c.get_count()},(_,i)=>songs[c.get_id_at(i)]).filter(Boolean);}
function save(){localStorage.setItem(storageKey,JSON.stringify({songs:ordered(),current:c.get_current()}));}
function render(){
 const list=ordered(),current=c.get_current();
 $('count').textContent=list.length;$('empty').classList.toggle('hidden',list.length>0);
 $('songs').innerHTML=list.map((s,i)=>`<tr class="${s.id===current?'active':''}" data-id="${s.id}"><td>${i+1}</td><td><span class="song-icon">♫</span><strong>${safe(s.title)}</strong></td><td>${safe(s.artist)}</td><td>${i===0?'HEAD':i===list.length-1?'TAIL':'↔ NODE'}</td><td><button class="delete" data-delete="${s.id}" title="Delete">✕</button></td></tr>`).join('');
 $('nodes').innerHTML=list.length?'<span class="arrow">NULL ↔</span>'+list.map(s=>`<div class="node ${s.id===current?'current':''}" title="prev: ${c.get_prev_id(s.id)} | next: ${c.get_next_id(s.id)}">${safe(s.title)}</div>`).join('<span class="arrow">↔</span>')+'<span class="arrow">↔ NULL</span>':'<span class="muted">The linked list is empty.</span>';
 const s=songs[current];$('nowTitle').textContent=s?.title||'Nothing playing';$('nowArtist').textContent=s?.artist||'Choose a track';
 if(s&&audio.dataset.id!==String(s.id)){audio.src=s.url;audio.dataset.id=String(s.id);if(playing)audio.play().catch(()=>toast('Audio cannot be played. Check the URL.'));}
 if(!s){audio.removeAttribute('src');audio.dataset.id='';audio.load();playing=false;}
 $('toggleBtn').textContent=playing?'Ⅱ':'▶';
}
function change(fn){fn();save();render();}
function select(id){playing=true;change(()=>c.play(Number(id)));audio.play().catch(()=>toast('Audio cannot be played. Check the URL.'));}
$('songs').addEventListener('click',e=>{const del=e.target.closest('[data-delete]');if(del){e.stopPropagation();const id=Number(del.dataset.delete);change(()=>{c.remove_song(id);delete songs[id];});return;}const row=e.target.closest('[data-id]');if(row)select(row.dataset.id);});
$('showForm').onclick=()=>$('songForm').classList.toggle('hidden');
$('songForm').onsubmit=e=>{e.preventDefault();const title=$('title').value.trim(),artist=$('artist').value.trim(),url=$('url').value.trim();if(!title||!artist||!/^https?:\/\//i.test(url))return toast('Enter a title, artist, and valid http(s) audio URL.');const id=c.add();if(id<0)return toast('Playlist limit reached (512 tracks).');songs[id]={id,title,artist,url};save();render();$('songForm').reset();$('songForm').classList.add('hidden');};
$('nextBtn').onclick=()=>{playing=true;change(()=>c.next_song());};
$('prevBtn').onclick=()=>{playing=true;change(()=>c.previous_song());};
$('shuffleBtn').onclick=()=>change(()=>c.shuffle_songs());
function toggle(){if(!audio.getAttribute('src'))return toast('Add a song first.');if(audio.paused)audio.play().then(()=>{playing=true;render();}).catch(()=>toast('Could not play this audio URL.'));else{audio.pause();playing=false;render();}}
$('toggleBtn').onclick=toggle;$('playBtn').onclick=toggle;
audio.addEventListener('ended',()=>{playing=true;change(()=>c.next_song());});
audio.addEventListener('pause',()=>{if(!audio.ended){playing=false;$('toggleBtn').textContent='▶';}});
audio.addEventListener('play',()=>{playing=true;$('toggleBtn').textContent='Ⅱ';});
async function init(){try{const response=await fetch('/playlist.wasm');if(!response.ok)throw Error('WASM file missing');const bytes=await response.arrayBuffer();const {instance}=await WebAssembly.instantiate(bytes,{});c=instance.exports;const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(Array.isArray(saved.songs)){for(const s of saved.songs){if(!s||typeof s.title!=='string'||typeof s.artist!=='string'||typeof s.url!=='string')continue;const id=c.add();if(id<0)break;songs[id]={id,title:s.title,artist:s.artist,url:s.url};if(s.id===saved.current)saved.newCurrent=id;}if(saved.newCurrent)c.play(saved.newCurrent);}render();}catch(err){toast('Could not load the C WebAssembly engine: '+err.message);console.error(err);}}
init();
