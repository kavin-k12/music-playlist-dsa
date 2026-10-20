const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const binary = path.join(__dirname, process.platform === 'win32' ? 'playlist.exe' : 'playlist');
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
function run(args, res) {
  execFile(binary, args, { cwd: __dirname, timeout: 5000, maxBuffer: 1024 * 1024 }, (err, stdout) => {
    if (err) return res.status(500).json({ error: 'C playlist engine failed. Run npm run build:c first.', detail: err.message });
    try { res.json(JSON.parse(stdout)); } catch { res.status(500).json({ error: 'Invalid response from C engine' }); }
  });
}
app.get('/api/playlist', (req, res) => run(['list'], res));
app.post('/api/songs', (req, res) => {
  const { title, artist, url } = req.body || {};
  if (![title, artist, url].every(x => typeof x === 'string' && x.trim() && x.length <= 500) || /[\t\r\n]/.test(title + artist + url) || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Provide title, artist, and an HTTP(S) audio URL (max 500 characters each).' });
  run(['add', title.trim(), artist.trim(), url.trim()], res);
});
app.delete('/api/songs/:id', (req, res) => run(['delete', String(Number(req.params.id) || -1)], res));
app.post('/api/play/:id', (req, res) => run(['play', String(Number(req.params.id) || -1)], res));
app.post('/api/:action', (req, res) => {
  if (!['next', 'previous', 'shuffle', 'clear'].includes(req.params.action)) return res.sendStatus(404);
  run([req.params.action], res);
});
app.listen(PORT, () => console.log(`Website: http://localhost:${PORT}`));
