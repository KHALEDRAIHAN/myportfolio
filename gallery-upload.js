/* ============================================
   KMR PORTFOLIO — CLOUD GALLERY MANAGER v3
   Images uploaded to Cloudinary (cloud CDN).
   Visible on ALL devices. No server needed.
   ============================================ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     CLOUDINARY CONFIG
     How to set up (free, 2 minutes):
     1. Go to https://cloudinary.com → sign up free
     2. Dashboard → copy your "Cloud Name"
     3. Settings → Upload → "Add upload preset"
        • Signing mode: UNSIGNED
        • Folder: kmr-portfolio
        • Copy the preset name
     4. Replace the two values below.
  ──────────────────────────────────────────────────────────*/
  const CLOUD_NAME    = 'dxskk2i6r';    // e.g. 'dxyz123abc'
  const UPLOAD_PRESET = 'kmr_preset'; // e.g. 'kmr_unsigned'

  /* ── Gallery metadata stored in Firebase Realtime DB ─────
     (free, stores captions/order/filenames so all devices
      see the same gallery list pointing to Cloudinary URLs)

     How to set up (free, 2 minutes):
     1. Go to https://console.firebase.google.com
     2. Create project → Realtime Database → Start in test mode
     3. Copy the database URL (looks like:
        https://YOUR-PROJECT-default-rtdb.firebaseio.com)
     4. Replace below.
  ──────────────────────────────────────────────────────────*/
  const FIREBASE_URL = 'https://realtime-database-ce5dd-default-rtdb.firebaseio.com/'; // e.g. 'https://kmr-portfolio-default-rtdb.firebaseio.com'

  /* ── Auth ─────────────────────────────────────────────── */
  const ADMIN_PASSWORD    = 'kmr2025admin';
  const ADMIN_SESSION_KEY = 'kmr_admin_auth';
  const isAdmin     = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  const loginAdmin  = pw  => { if (pw === ADMIN_PASSWORD) { sessionStorage.setItem(ADMIN_SESSION_KEY,'true'); return true; } return false; };
  const logoutAdmin = ()  => { sessionStorage.removeItem(ADMIN_SESSION_KEY); location.reload(); };

  /* ── Firebase REST helpers (no SDK needed) ───────────────*/
  async function fbGet(path) {
    if (!isConfigured()) return [];
    try {
      const r = await fetch(`${FIREBASE_URL}/${path}.json`);
      const d = await r.json();
      if (!d) return [];
      // Firebase returns an object with push-keys, convert to array
      return Object.entries(d).map(([fbKey, val]) => ({ ...val, _fbKey: fbKey }));
    } catch { return []; }
  }

  async function fbPush(path, data) {
    const r = await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    const d = await r.json();
    return d.name; // the generated push key
  }

  async function fbPatch(path, data) {
    await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async function fbDelete(path) {
    await fetch(`${FIREBASE_URL}/${path}.json`, { method: 'DELETE' });
  }

  /* ── Cloudinary upload ────────────────────────────────── */
  async function uploadToCloudinary(file, onProgress) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    fd.append('folder', 'kmr-portfolio');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round(e.loaded / e.total * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url:       data.secure_url,
            publicId:  data.public_id,
            width:     data.width,
            height:    data.height,
            format:    data.format,
            bytes:     data.bytes
          });
        } else {
          reject(new Error('Upload failed: ' + xhr.status));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(fd);
    });
  }

  /* ── Config check ─────────────────────────────────────── */
  function isConfigured() {
    return CLOUD_NAME    !== 'dxskk2i6r' &&
           UPLOAD_PRESET !== 'kmr_preset' &&
           FIREBASE_URL  !== 'https://realtime-database-ce5dd-default-rtdb.firebaseio.com/';
  }

  /* ── Utils ────────────────────────────────────────────── */
  const fmtBytes = b => b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';
  const uid      = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const ACCEPTED = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

  function toast(msg, type='info') {
    document.querySelector('.kmr-toast')?.remove();
    const t = Object.assign(document.createElement('div'),{className:'kmr-toast',textContent:msg});
    const bg = {error:'#dc2626',success:'#16a34a',info:'#1e1e32',warn:'#d97706'}[type]||'#1e1e32';
    t.style.cssText = `position:fixed;bottom:5rem;left:50%;transform:translateX(-50%) translateY(16px);
      background:${bg};color:#fff;padding:.75rem 1.5rem;border-radius:6px;font-size:.82rem;
      letter-spacing:.06em;z-index:99999;opacity:0;transition:opacity .3s,transform .3s;
      pointer-events:none;border:1px solid rgba(255,255,255,.12);box-shadow:0 8px 32px rgba(0,0,0,.5);
      max-width:90vw;text-align:center;font-family:var(--font-body,sans-serif);`;
    document.body.appendChild(t);
    requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; });
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(8px)'; setTimeout(()=>t.remove(),300); },3500);
  }

  /* ── CSS ──────────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('kmr-styles')) return;
    const s = document.createElement('style');
    s.id = 'kmr-styles';
    s.textContent = `
      /* Navbar pill */
      .kmr-nav-pill{display:inline-flex;align-items:center;gap:.45rem;padding:.28rem .75rem;
        border-radius:20px;cursor:pointer;font-size:.65rem;font-weight:600;letter-spacing:.12em;
        text-transform:uppercase;border:1px solid rgba(124,58,237,.3);background:rgba(124,58,237,.08);
        color:rgba(168,85,247,.85);transition:all .25s;font-family:var(--font-body,sans-serif);
        white-space:nowrap;flex-shrink:0;}
      .kmr-nav-pill:hover{background:rgba(124,58,237,.2);border-color:#7c3aed;color:#c4b5fd;box-shadow:0 0 16px rgba(124,58,237,.3);}
      .kmr-nav-pill.admin-on{background:rgba(124,58,237,.25);border-color:#7c3aed;color:#fff;box-shadow:0 0 20px rgba(124,58,237,.4);}
      .kmr-nav-pill .pill-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;}
      .kmr-nav-pill.admin-on .pill-dot{background:#a855f7;animation:kmrpulse 2s infinite;}
      @keyframes kmrpulse{0%,100%{opacity:1}50%{opacity:.2}}

      /* Setup notice */
      .kmr-setup-notice{padding:1.5rem;border-radius:8px;background:rgba(217,119,6,.08);
        border:1px solid rgba(217,119,6,.3);margin-bottom:1.5rem;}
      .kmr-setup-notice h4{font-size:.85rem;font-weight:700;color:#fbbf24;margin-bottom:.5rem;letter-spacing:.04em;}
      .kmr-setup-notice p{font-size:.78rem;color:#9ca3af;line-height:1.7;margin-bottom:.3rem;}
      .kmr-setup-notice code{background:rgba(255,255,255,.07);padding:.15rem .4rem;border-radius:3px;
        font-size:.75rem;color:#e5e7eb;font-family:monospace;}
      .kmr-setup-notice a{color:#7c3aed;text-decoration:underline;}

      /* Login */
      .kmr-login{position:fixed;inset:0;z-index:99997;background:rgba(5,5,11,.97);
        backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;
        padding:1.5rem;opacity:0;transition:opacity .3s;}
      .kmr-login.open{opacity:1;}
      .kmr-login-box{background:#0d0d1a;border:1px solid rgba(124,58,237,.3);border-radius:16px;
        padding:2.5rem 2rem;width:100%;max-width:360px;text-align:center;}
      .kmr-login-box .ico{font-size:2.5rem;margin-bottom:1rem;}
      .kmr-login-box h3{font-family:var(--font-display,'Bebas Neue',sans-serif);font-size:1.8rem;
        letter-spacing:.08em;color:#e5e7eb;margin-bottom:.2rem;}
      .kmr-login-box p{font-size:.75rem;color:#6b7280;letter-spacing:.08em;margin-bottom:1.75rem;}
      .kmr-pw{width:100%;padding:.85rem 1rem;border-radius:8px;background:#05050b;
        border:1px solid rgba(124,58,237,.2);color:#e5e7eb;font-size:.95rem;
        font-family:var(--font-body,sans-serif);outline:none;transition:border-color .3s;
        margin-bottom:1rem;text-align:center;letter-spacing:.1em;}
      .kmr-pw:focus{border-color:#7c3aed;box-shadow:0 0 20px rgba(124,58,237,.15);}
      .kmr-pw.err{border-color:#dc2626;animation:shake .35s;}
      @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
      .kmr-submit{width:100%;padding:.85rem;border-radius:8px;background:#7c3aed;color:#fff;
        font-family:var(--font-body,sans-serif);font-size:.82rem;font-weight:600;
        letter-spacing:.15em;text-transform:uppercase;cursor:pointer;border:none;transition:all .3s;}
      .kmr-submit:hover{background:#9d5aff;box-shadow:0 0 30px rgba(124,58,237,.5);}
      .kmr-err-msg{color:#f87171;font-size:.75rem;margin-top:.6rem;display:none;}
      .kmr-esc-hint{margin-top:1rem;font-size:.65rem;color:rgba(255,255,255,.12);letter-spacing:.06em;}

      /* Admin banner */
      .kmr-banner{background:rgba(124,58,237,.08);border-bottom:1px solid rgba(124,58,237,.18);
        padding:.5rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;
        font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(168,85,247,.85);
        position:sticky;top:64px;z-index:890;backdrop-filter:blur(10px);
        font-family:var(--font-body,sans-serif);}
      .kmr-dot-sm{width:6px;height:6px;border-radius:50%;background:#a855f7;animation:kmrpulse 2s infinite;flex-shrink:0;}
      .kmr-logout-btn{padding:.26rem .7rem;border-radius:4px;border:1px solid rgba(124,58,237,.3);
        color:rgba(168,85,247,.8);cursor:pointer;font-size:.64rem;background:none;
        font-family:inherit;letter-spacing:.08em;transition:all .25s;}
      .kmr-logout-btn:hover{background:rgba(124,58,237,.2);color:#fff;}

      /* Upload zone */
      .kmr-zone{border:2px dashed rgba(124,58,237,.28);border-radius:10px;padding:2.25rem 1rem;
        text-align:center;cursor:pointer;transition:all .3s;background:rgba(13,13,26,.5);
        margin-bottom:1.5rem;position:relative;}
      .kmr-zone:hover,.kmr-zone.over{border-color:#7c3aed;background:rgba(124,58,237,.06);}
      .kmr-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
      .kmr-zone-ico{font-size:2.2rem;margin-bottom:.4rem;display:block;}
      .kmr-zone-title{font-family:var(--font-display,'Bebas Neue',sans-serif);font-size:1.25rem;
        letter-spacing:.06em;color:#e5e7eb;margin-bottom:.25rem;}
      .kmr-zone-sub{font-size:.73rem;color:#9ca3af;letter-spacing:.07em;}
      .kmr-zone-cloud{display:inline-flex;align-items:center;gap:.35rem;margin-top:.6rem;
        font-size:.68rem;letter-spacing:.1em;color:#22d3ee;opacity:.7;}

      /* Upload progress */
      .kmr-prog{margin-top:.85rem;display:none;}
      .kmr-prog-label{font-size:.72rem;color:#9ca3af;margin-bottom:.4rem;display:flex;justify-content:space-between;}
      .kmr-prog-bar{height:4px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;}
      .kmr-prog-fill{height:100%;width:0%;background:linear-gradient(90deg,#7c3aed,#22d3ee);
        transition:width .2s;border-radius:4px;}
      .kmr-prog-file{font-size:.68rem;color:#6b7280;margin-top:.3rem;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

      /* Admin controls */
      .kmr-abar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;
        gap:.75rem;margin-bottom:1.25rem;}
      .kmr-count{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#9ca3af;}
      .kmr-count b{color:#22d3ee;}
      .kmr-actions{display:flex;gap:.45rem;flex-wrap:wrap;}
      .kmr-btn{padding:.32rem .8rem;border-radius:4px;font-size:.68rem;font-weight:600;
        letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:all .2s;
        font-family:var(--font-body,sans-serif);border:1px solid rgba(124,58,237,.2);
        background:#0d0d1a;color:#9ca3af;}
      .kmr-btn:hover{color:#e5e7eb;border-color:#7c3aed;}
      .kmr-btn.red:hover{border-color:#dc2626;color:#dc2626;}
      .kmr-btn.pri{background:#7c3aed;color:#fff;border-color:#7c3aed;}
      .kmr-btn.pri:hover{background:#9d5aff;}

      /* Admin grid */
      .kmr-admin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.65rem;margin-bottom:1rem;}
      @media(max-width:480px){.kmr-admin-grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:.45rem;}}

      /* Tile shared */
      .kmr-tile,.kmr-vis-tile{position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;
        background:#13131f;cursor:pointer;transition:border-color .2s,transform .2s;}
      .kmr-tile{border:1px solid rgba(124,58,237,.1);}
      .kmr-vis-tile{border:1px solid rgba(124,58,237,.08);}
      .kmr-tile:hover{border-color:rgba(124,58,237,.45);transform:scale(1.02);}
      .kmr-vis-tile:hover{border-color:rgba(34,211,238,.3);transform:scale(1.02);}
      .kmr-tile img,.kmr-vis-tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s;}
      .kmr-tile:hover img,.kmr-vis-tile:hover img{transform:scale(1.06);}

      /* Admin tile overlay */
      .kmr-tile-ov{position:absolute;inset:0;background:rgba(5,5,11,.72);opacity:0;
        transition:opacity .25s;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:.35rem;}
      .kmr-tile:hover .kmr-tile-ov{opacity:1;}
      .kmr-act{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;
        justify-content:center;font-size:.78rem;cursor:pointer;background:rgba(255,255,255,.1);
        border:1px solid rgba(255,255,255,.18);color:#e5e7eb;transition:background .2s;}
      .kmr-act:hover{background:rgba(255,255,255,.2);}
      .kmr-act.del:hover{background:rgba(220,38,38,.55);}
      .kmr-cap-badge{position:absolute;bottom:0;left:0;right:0;padding:.3rem .4rem;
        background:linear-gradient(transparent,rgba(5,5,11,.9));font-size:.62rem;color:#9ca3af;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.04em;
        opacity:0;transition:opacity .25s;}
      .kmr-tile:hover .kmr-cap-badge{opacity:1;}

      /* Visitor grid */
      .kmr-vis-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-bottom:1rem;}
      @media(max-width:600px){.kmr-vis-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.5rem;}}
      .kmr-vis-cap{position:absolute;bottom:0;left:0;right:0;padding:.7rem .6rem .45rem;
        background:linear-gradient(transparent,rgba(5,5,11,.9));font-size:.66rem;color:#9ca3af;
        letter-spacing:.05em;opacity:0;transition:opacity .3s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .kmr-vis-tile:hover .kmr-vis-cap{opacity:1;}

      /* Loading skeleton */
      .kmr-skeleton{aspect-ratio:1;border-radius:8px;background:linear-gradient(90deg,
        #13131f 25%,#1a1a2e 50%,#13131f 75%);background-size:200% 100%;
        animation:shimmer 1.4s infinite;}
      @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

      /* Caption modal */
      .kmr-modal-bd{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.85);
        backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;}
      .kmr-modal{background:#0d0d1a;border:1px solid rgba(124,58,237,.25);border-radius:12px;
        padding:1.75rem 1.5rem;width:100%;max-width:400px;font-family:var(--font-body,sans-serif);}
      .kmr-modal h4{font-family:var(--font-display,'Bebas Neue',sans-serif);font-size:1.25rem;
        letter-spacing:.06em;color:#e5e7eb;margin-bottom:1rem;}
      .kmr-modal img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;margin-bottom:1rem;}
      .kmr-modal input{width:100%;background:#05050b;border:1px solid rgba(124,58,237,.2);
        color:#e5e7eb;border-radius:6px;padding:.65rem .9rem;font-size:.9rem;
        font-family:inherit;outline:none;margin-bottom:.75rem;transition:border-color .2s;}
      .kmr-modal input:focus{border-color:#7c3aed;}
      .kmr-modal-meta{font-size:.67rem;color:#6b7280;margin-bottom:1rem;letter-spacing:.05em;}
      .kmr-modal-acts{display:flex;gap:.6rem;justify-content:flex-end;}

      /* Empty / upload-in-progress states */
      .kmr-empty{text-align:center;padding:3rem 1rem;color:#6b7280;font-size:.8rem;
        letter-spacing:.08em;grid-column:1/-1;border:1px dashed rgba(124,58,237,.15);border-radius:8px;}
      .kmr-empty-ico{font-size:2.5rem;margin-bottom:.75rem;opacity:.3;display:block;}
      .kmr-uploading-tile{border-radius:8px;aspect-ratio:1;background:#0d0d1a;
        border:1px dashed rgba(124,58,237,.3);display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:.5rem;}
      .kmr-uploading-tile .up-pct{font-family:var(--font-display,sans-serif);font-size:1.4rem;
        color:#7c3aed;letter-spacing:.04em;}
      .kmr-uploading-tile .up-name{font-size:.62rem;color:#6b7280;max-width:90%;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;}
      .kmr-mini-bar{width:70%;height:3px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;}
      .kmr-mini-fill{height:100%;width:0%;background:linear-gradient(90deg,#7c3aed,#22d3ee);
        border-radius:3px;transition:width .15s;}
    `;
    document.head.appendChild(s);
  }

  /* ── Navbar admin pill ────────────────────────────────── */
  function injectNavPill() {
    if (document.getElementById('kmr-nav-pill')) return;
    const pill = document.createElement('button');
    pill.id        = 'kmr-nav-pill';
    pill.className = 'kmr-nav-pill' + (isAdmin() ? ' admin-on' : '');
    pill.innerHTML = `<span class="pill-dot"></span>${isAdmin() ? 'Admin On' : 'Admin'}`;
    pill.title     = isAdmin() ? 'Admin mode — click to log out' : 'Admin login';
    pill.addEventListener('click', () => {
      if (isAdmin()) { if (confirm('Log out of admin mode?')) logoutAdmin(); }
      else showLogin();
    });
    const navbar     = document.querySelector('.navbar');
    const hamburger  = navbar?.querySelector('.hamburger');
    if (hamburger) navbar.insertBefore(pill, hamburger);
    else navbar?.appendChild(pill);
  }

  /* ── Login modal ──────────────────────────────────────── */
  function showLogin() {
    let m = document.getElementById('kmr-login');
    if (m) { m.style.display='flex'; requestAnimationFrame(()=>m.classList.add('open')); return; }
    m = document.createElement('div');
    m.className='kmr-login'; m.id='kmr-login';
    m.innerHTML=`<div class="kmr-login-box">
      <div class="ico">🔐</div><h3>Admin Access</h3><p>KMR Portfolio Manager</p>
      <input class="kmr-pw" type="password" id="kmr-pw" placeholder="Enter password" autocomplete="current-password">
      <button class="kmr-submit" id="kmr-submit">Unlock Admin Mode</button>
      <div class="kmr-err-msg" id="kmr-err">Incorrect password — try again.</div>
      <div class="kmr-esc-hint">Press ESC to close</div>
    </div>`;
    document.body.appendChild(m);
    requestAnimationFrame(()=>m.classList.add('open'));
    const inp=m.querySelector('#kmr-pw'), err=m.querySelector('#kmr-err');
    inp.focus();
    const close=()=>{ m.classList.remove('open'); setTimeout(()=>m.remove(),300); };
    const attempt=()=>{
      if (loginAdmin(inp.value)) { close(); setTimeout(()=>location.reload(),200); }
      else { err.style.display='block'; inp.value=''; inp.classList.add('err'); inp.focus(); setTimeout(()=>inp.classList.remove('err'),600); }
    };
    m.querySelector('#kmr-submit').addEventListener('click',attempt);
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter') attempt(); if(e.key==='Escape') close(); });
    m.addEventListener('click',e=>{ if(e.target===m) close(); });
  }

  /* ── Admin sticky banner ──────────────────────────────── */
  function injectBanner() {
    if (document.querySelector('.kmr-banner')) return;
    const b = document.createElement('div');
    b.className='kmr-banner';
    b.innerHTML=`<div style="display:flex;align-items:center;gap:.5rem">
        <div class="kmr-dot-sm"></div>
        <span>Admin Mode — Cloud Gallery Manager (Cloudinary + Firebase)</span>
      </div>
      <button class="kmr-logout-btn" id="kmr-logout-btn">Log Out</button>`;
    const nav=document.querySelector('.navbar');
    if (nav?.nextSibling) nav.parentNode.insertBefore(b, nav.nextSibling);
    else document.body.prepend(b);
    document.getElementById('kmr-logout-btn').addEventListener('click',()=>{ if(confirm('Log out?')) logoutAdmin(); });
  }

  /* ── Setup notice (shown when not yet configured) ─────── */
  function setupNotice(el) {
    el.innerHTML = `<div class="kmr-setup-notice">
      <h4>⚙️ One-Time Cloud Setup Required (5 minutes, both free)</h4>
      <p><strong style="color:#e5e7eb;">Step 1 — Cloudinary</strong> (stores the actual images, visible from any device)</p>
      <p>1. Go to <a href="https://cloudinary.com" target="_blank">cloudinary.com</a> → sign up free</p>
      <p>2. Dashboard → copy your <code>Cloud Name</code></p>
      <p>3. Settings → Upload → Add upload preset → set <strong>Signing mode: Unsigned</strong> → copy preset name</p>
      <p style="margin-top:.75rem;"><strong style="color:#e5e7eb;">Step 2 — Firebase</strong> (stores image list & captions, synced across all devices)</p>
      <p>1. Go to <a href="https://console.firebase.google.com" target="_blank">console.firebase.google.com</a> → New project</p>
      <p>2. Build → Realtime Database → Create database → Start in <strong>test mode</strong></p>
      <p>3. Copy the database URL (e.g. <code>https://your-project-default-rtdb.firebaseio.com</code>)</p>
      <p style="margin-top:.75rem;"><strong style="color:#e5e7eb;">Step 3 — Paste into gallery-upload.js</strong></p>
      <p>Open <code>gallery-upload.js</code> and replace the 3 values at the top:</p>
      <p><code>CLOUD_NAME</code> · <code>UPLOAD_PRESET</code> · <code>FIREBASE_URL</code></p>
    </div>`;
  }

  /* ── Gallery router ───────────────────────────────────── */
  function build(el) {
    const id    = el.dataset.uploadGallery;
    const label = el.dataset.galleryLabel || 'Gallery';

    if (!isConfigured()) {
      if (isAdmin()) setupNotice(el);
      else el.innerHTML = '<div class="kmr-empty"><span class="kmr-empty-ico">📷</span>Photos coming soon.</div>';
      return;
    }

    // Show skeletons while loading
    el.innerHTML = buildSkeletons();
    fbGet(`galleries/${id}`).then(imgs => {
      el.innerHTML = '';
      if (isAdmin()) buildAdmin(el, id, label, imgs);
      else           buildVisitor(el, id, imgs);
    });
  }

  function buildSkeletons(n=6) {
    return `<div class="kmr-vis-grid">${Array(n).fill('<div class="kmr-skeleton"></div>').join('')}</div>`;
  }

  /* ── Visitor view ─────────────────────────────────────── */
  function buildVisitor(el, galleryId, imgs) {
    if (!imgs.length) {
      el.innerHTML='<div class="kmr-empty"><span class="kmr-empty-ico">📷</span>Photos coming soon.</div>';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'kmr-vis-grid';
    imgs.forEach((img,i) => {
      const tile = document.createElement('div');
      tile.className='kmr-vis-tile';
      tile.innerHTML=`<img src="${img.url}" alt="${img.caption||''}" loading="lazy">
        ${img.caption?`<div class="kmr-vis-cap">${img.caption}</div>`:''}`;
      tile.addEventListener('click',()=>openLB(imgs.map(x=>({src:x.url,caption:x.caption||''})),i));
      grid.appendChild(tile);
    });
    el.appendChild(grid);
  }

  /* ── Admin view ───────────────────────────────────────── */
  function buildAdmin(el, galleryId, label, imgs) {
    // Top bar
    const bar = document.createElement('div');
    bar.className='kmr-abar';
    bar.innerHTML=`<div class="kmr-count"><b id="kc-${galleryId}">${imgs.length}</b> photo${imgs.length!==1?'s':''} — ${label}</div>
      <div class="kmr-actions">
        <button class="kmr-btn red" id="kclr-${galleryId}">Clear All</button>
      </div>`;
    el.appendChild(bar);

    // Upload zone
    const zone = document.createElement('div');
    zone.className='kmr-zone';
    zone.innerHTML=`<input type="file" id="kfi-${galleryId}" multiple accept="image/jpeg,image/jpg,image/png,image/webp,image/gif">
      <span class="kmr-zone-ico">📸</span>
      <div class="kmr-zone-title">Drop Photos Here — Tap to Browse</div>
      <div class="kmr-zone-sub">JPG · PNG · WEBP · GIF · Any size</div>
      <div class="kmr-zone-cloud">☁️ Uploads directly to Cloudinary — visible on all devices</div>`;
    el.appendChild(zone);

    // Grid
    const grid = document.createElement('div');
    grid.className='kmr-admin-grid';
    grid.id=`kg-${galleryId}`;
    el.appendChild(grid);
    renderAdmin(galleryId, grid, imgs);

    // Events
    zone.querySelector(`#kfi-${galleryId}`).addEventListener('change',e=>handleFiles(galleryId,grid,e.target.files));
    zone.addEventListener('dragover',e=>{ e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave',()=>zone.classList.remove('over'));
    zone.addEventListener('drop',e=>{ e.preventDefault(); zone.classList.remove('over'); handleFiles(galleryId,grid,e.dataTransfer.files); });

    document.getElementById(`kclr-${galleryId}`)?.addEventListener('click',async ()=>{
      const current = await fbGet(`galleries/${galleryId}`);
      if (!current.length) { toast('Gallery is already empty.','info'); return; }
      if (!confirm(`Delete ALL ${current.length} photos from "${label}"?\n\nNote: This removes them from the gallery list. The files remain on Cloudinary (delete manually there if needed).`)) return;
      await fbDelete(`galleries/${galleryId}`);
      renderAdmin(galleryId, grid, []);
      setCount(galleryId, 0);
      toast('Gallery cleared.','info');
    });
  }

  function setCount(id, n) {
    const el=document.getElementById(`kc-${id}`); if(el) el.textContent=n;
  }

  function renderAdmin(galleryId, grid, imgs) {
    grid.innerHTML='';
    if (!imgs.length) {
      grid.innerHTML='<div class="kmr-empty" style="grid-column:1/-1"><span class="kmr-empty-ico">🖼️</span>No photos yet — upload above.</div>';
      return;
    }
    imgs.forEach((img,i) => {
      const tile = document.createElement('div');
      tile.className='kmr-tile'; tile.dataset.fbkey=img._fbKey;
      tile.innerHTML=`<img src="${img.url}" alt="${img.caption||''}" loading="lazy">
        <div class="kmr-tile-ov">
          <button class="kmr-act view" title="View">🔍</button>
          <button class="kmr-act edit" title="Caption">✏️</button>
          <button class="kmr-act del"  title="Delete">🗑️</button>
        </div>
        <div class="kmr-cap-badge">${img.caption||`Photo ${i+1}`}</div>`;

      tile.querySelector('.view').addEventListener('click',e=>{
        e.stopPropagation();
        fbGet(`galleries/${galleryId}`).then(all=>openLB(all.map(x=>({src:x.url,caption:x.caption||''})),all.findIndex(x=>x._fbKey===img._fbKey)));
      });
      tile.querySelector('.edit').addEventListener('click',e=>{ e.stopPropagation(); captionModal(galleryId,img,grid); });
      tile.querySelector('.del').addEventListener('click',async e=>{
        e.stopPropagation();
        if (!confirm('Remove this photo from the gallery?')) return;
        await fbDelete(`galleries/${galleryId}/${img._fbKey}`);
        const updated = await fbGet(`galleries/${galleryId}`);
        renderAdmin(galleryId, grid, updated);
        toast('Photo removed.','info');
      });
      tile.addEventListener('click',()=>{
        fbGet(`galleries/${galleryId}`).then(all=>openLB(all.map(x=>({src:x.url,caption:x.caption||''})),all.findIndex(x=>x._fbKey===img._fbKey)));
      });
      grid.appendChild(tile);
    });
    setCount(galleryId, imgs.length);
  }

  /* ── File upload handler ──────────────────────────────── */
  async function handleFiles(galleryId, grid, files) {
    const valid = [...files].filter(f => {
      if (!ACCEPTED.includes(f.type)) { toast(`Not supported: ${f.name}`,'error'); return false; }
      return true;
    });
    if (!valid.length) return;

    toast(`Uploading ${valid.length} photo${valid.length>1?'s':''}… please wait ☁️`,'info');

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];

      // Add a live uploading tile
      const uploadingTile = document.createElement('div');
      uploadingTile.className='kmr-uploading-tile';
      uploadingTile.innerHTML=`
        <span style="font-size:1.5rem;">☁️</span>
        <div class="up-pct" id="upct-${i}">0%</div>
        <div class="kmr-mini-bar"><div class="kmr-mini-fill" id="upbar-${i}"></div></div>
        <div class="up-name">${file.name}</div>`;
      // Insert before empty placeholder if present, otherwise append
      const emptyEl = grid.querySelector('.kmr-empty');
      if (emptyEl) emptyEl.replaceWith(uploadingTile);
      else grid.prepend(uploadingTile);

      try {
        const result = await uploadToCloudinary(file, pct => {
          const pctEl  = document.getElementById(`upct-${i}`);
          const barEl  = document.getElementById(`upbar-${i}`);
          if (pctEl) pctEl.textContent = pct + '%';
          if (barEl) barEl.style.width = pct + '%';
        });

        // Save to Firebase
        await fbPush(`galleries/${galleryId}`, {
          url:       result.url,
          publicId:  result.publicId,
          caption:   '',
          filename:  file.name,
          size:      fmtBytes(file.size),
          width:     result.width,
          height:    result.height,
          date:      new Date().toISOString()
        });

        uploadingTile.remove();
        toast(`✅ ${file.name} uploaded!`, 'success');

      } catch (err) {
        uploadingTile.remove();
        console.error(err);
        toast(`❌ Failed: ${file.name} — check your Cloudinary config`, 'error');
      }
    }

    // Refresh grid
    const updated = await fbGet(`galleries/${galleryId}`);
    renderAdmin(galleryId, grid, updated);

    // Reset file input
    const fi = document.getElementById(`kfi-${galleryId}`); if (fi) fi.value='';
  }

  /* ── Caption modal ────────────────────────────────────── */
  function captionModal(galleryId, img, grid) {
    const bd = document.createElement('div'); bd.className='kmr-modal-bd';
    bd.innerHTML=`<div class="kmr-modal">
      <h4>Edit Caption</h4>
      <img src="${img.url}" alt="">
      <input type="text" id="kmr-cap-in" value="${img.caption||''}" placeholder="e.g. Artcell live — Dhaka 2024" maxlength="100">
      <div class="kmr-modal-meta">${img.filename||''} · ${img.size||''} · ${img.date?new Date(img.date).toLocaleDateString():''}</div>
      <div class="kmr-modal-acts">
        <button class="kmr-btn" id="cap-cancel">Cancel</button>
        <button class="kmr-btn pri" id="cap-save">Save</button>
      </div></div>`;
    document.body.appendChild(bd);
    const inp = bd.querySelector('#kmr-cap-in'); inp.focus(); inp.select();
    const save = async () => {
      await fbPatch(`galleries/${galleryId}/${img._fbKey}`, { caption: inp.value.trim() });
      const updated = await fbGet(`galleries/${galleryId}`);
      renderAdmin(galleryId, grid, updated);
      bd.remove();
      toast('Caption saved!','success');
    };
    bd.querySelector('#cap-cancel').addEventListener('click',()=>bd.remove());
    bd.querySelector('#cap-save').addEventListener('click',save);
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter') save(); if(e.key==='Escape') bd.remove(); });
    bd.addEventListener('click',e=>{ if(e.target===bd) bd.remove(); });
  }

  /* ── Lightbox ─────────────────────────────────────────── */
  function openLB(images, start) {
    let cur = start || 0;
    const lb = document.getElementById('lightbox');
    const li = document.querySelector('#lightbox .lightbox-img');
    const lc = document.querySelector('#lightbox .lightbox-caption');
    if (!lb || !li) return;

    const show = () => {
      li.src = images[cur].src;
      if (lc) lc.textContent = images[cur].caption || `${cur+1} / ${images.length}`;
    };
    show();
    lb.classList.add('open');
    document.body.style.overflow='hidden';
    requestAnimationFrame(()=>lb.classList.add('visible'));

    ['lightbox-prev','lightbox-next','lightbox-close'].forEach(id=>{
      const old=document.getElementById(id); if(!old) return;
      const clone=old.cloneNode(true); old.replaceWith(clone);
    });

    const close=()=>{ lb.classList.remove('visible'); setTimeout(()=>{ lb.classList.remove('open'); document.body.style.overflow=''; },350); document.removeEventListener('keydown',kh); };
    const go=dir=>{ cur=(cur+dir+images.length)%images.length; show(); };
    const kh=e=>{ if(!lb.classList.contains('open')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') go(-1); if(e.key==='ArrowRight') go(1); };

    document.getElementById('lightbox-close')?.addEventListener('click',close);
    document.getElementById('lightbox-prev')?.addEventListener('click',()=>go(-1));
    document.getElementById('lightbox-next')?.addEventListener('click',()=>go(1));
    lb.addEventListener('click',e=>{ if(e.target===lb) close(); },{once:true});
    document.addEventListener('keydown',kh);

    let tx=0;
    lb.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});
    lb.addEventListener('touchend',e=>{ if(Math.abs(tx-e.changedTouches[0].clientX)>45) go(tx>e.changedTouches[0].clientX?1:-1); },{passive:true});
  }
  window.openLightbox = openLB;

  /* ── Init ─────────────────────────────────────────────── */
  function init() {
    injectCSS();
    injectNavPill();
    if (isAdmin()) injectBanner();
    document.querySelectorAll('[data-upload-gallery]').forEach(build);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

  window.KMRGallery = { isAdmin, logout: logoutAdmin };
})();