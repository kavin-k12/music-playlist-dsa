const { execFileSync } = require('child_process');
const path = require('path');
const source = path.join(__dirname, 'backend', 'playlist.c');
const output = path.join(__dirname, 'backend', process.platform === 'win32' ? 'playlist.exe' : 'playlist');
execFileSync('gcc', ['-O2', '-std=c11', '-o', output, source], { stdio: 'inherit' });
console.log('Compiled C linked-list engine.');
