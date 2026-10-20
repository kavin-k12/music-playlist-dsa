# LinkedBeats — Vercel-ready Music Playlist DSA

## Deploy on Vercel
1. Upload the **entire** `music-playlist-dsa` folder to a GitHub repository (including `frontend/playlist.wasm`).
2. Open https://vercel.com/new and import that repository.
3. **Root Directory:** repository root (`./`) if the repository contains `frontend`, `backend`, and `vercel.json` at top level. If the repository wraps these in `music-playlist-dsa/`, set root to `music-playlist-dsa`.
4. **Build Command:** `npm run build` (also defined in `vercel.json`). **Output Directory:** `frontend`.
5. Deploy and visit your Vercel URL.

## Architecture
- Website: `frontend/index.html`, `style.css`, `app.js`.
- **Actual doubly linked list algorithms in C:** `backend/playlist_wasm.c`.
- Compiled C WebAssembly binary: `frontend/playlist.wasm` (included; no compiler needed at Vercel build time).
- Browser JavaScript calls exported C functions for add, delete, play, next, previous, shuffle, traversal, and pointer inspection. Song metadata and audio playback are handled in JS; JS does **not** implement the linked list.
- Playlist persists **per browser** using localStorage. No login, shared database, or remote server is included; this is a Vercel-hosted web application with a C/WASM DSA engine, not a multiuser full-stack backend.

## Local development
Use any static server, for example `npx serve frontend -l 3000` then visit http://localhost:3000. Opening index.html directly from the filesystem will not load WASM.

## Recompile C WebAssembly (optional)
Requires Clang with wasm32 target and wasm-ld:
```
clang --target=wasm32 -O2 -nostdlib -Wl,--no-entry -Wl,--export-all -Wl,--initial-memory=131072 -o frontend/playlist.wasm backend/playlist_wasm.c
```

## Notes
- Enter **direct publicly accessible audio-file URLs**, not Spotify/YouTube page URLs. Audio hosts must permit browser playback.
- The old `backend/playlist.c` and `backend/server.js` are retained as reference for the original Node/C local implementation but **are not used by the Vercel version**.
- 512 song capacity; localStorage size limits apply.
