/* ============================================
   KMR PORTFOLIO — ADMIN GALLERY MANAGER v3
   - Global Cloud Storage (Cloudinary)
   - Works on all devices
   - Lock icon in navbar
   ============================================ */
(function () {
  'use strict';

  // ─── CONFIG ───────────────────────────────────────
  const CLOUD_NAME      = 'dxskk2i6r';      // <--- Replace with your Cloudinary Cloud Name
  const UPLOAD_PRESET   = 'kmr_preset';   // <--- Replace with your Unsigned Preset Name
  const ADMIN_PASSWORD  = 'kmr2025admin';
  const ADMIN_SESSION_KEY = 'kmr_admin_auth';
  
  // Storage fallback (for cross-device, eventually use a small DB like JSONBin)
  const STORAGE_PREFIX  = 'kmr_remote_'; 
  const ACCEPTED        = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

  /* ── Auth ─────────────────────────────────────── */
  const isAdmin   = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  const loginAdmin  = pw => { if (pw === ADMIN_PASSWORD) { sessionStorage.setItem(ADMIN_SESSION_KEY,'true'); return true; } return false; };
  const logoutAdmin = () => { sessionStorage.removeItem(ADMIN_SESSION_KEY); location.reload(); };

  /* ── Storage Logic ────────────────────────────── */
  // Note: To sync LISTS across devices, you must export/import JSON or use a remote DB.
  // This code saves the permanent URLs to localStorage as a fallback.
  function loadData(id) {
    try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + id) || '[]'); }
    catch { return []; }
  }
  function saveData(id, imgs) {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(imgs));
  }

  /* ── Utils ────────────────────────────────────── */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const fmtBytes = b => b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';

  function toast(msg, type='info') {
    document.querySelector('.kmr-toast')?.remove();
    const t = Object.assign(document.createElement('div'),{className:'kmr-toast',textContent:msg});
    const bg = {error:'#dc2626',success:'#16a34a',info:'#1e1e32'}[type]||'#1e1e32';
    t.style.cssText = `position:fixed;bottom:5rem;left:50%;transform:translateX(-50%) translateY(16px);
      background:${bg};color:#fff;padding:.7rem 1.4rem;border-radius:6px;font-size:.8rem;
      letter-spacing:.06em;z-index:99999;opacity:0;transition:opacity .3s,transform .3s;
      pointer-events:none;border:1px solid rgba(255,255,255,.1);box-shadow:0 8px 24px rgba(0,0,0,.5);
      max-width:88vw;text-align:center;font-family:sans-serif;`;
    document.body.appendChild(t);
    requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; });
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(8px)'; setTimeout(()=>t.remove(),300); },3200);
  }

  /* ── CSS ──────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('kmr-styles')) return;
    const s = document.createElement('style');
    s.id = 'kmr-styles';
    s.textContent = `
      .kmr-nav-pill {
        display: inline-flex; align-items: center; gap: .45rem;
        padding: .28rem .75rem; border-radius: 20px; cursor: pointer;
        font-size: .65rem; font-weight: 600; letter-spacing: .12em;
        text-transform: uppercase; border: 1px solid rgba(124,58,237,.3);
        background: rgba(124,58,237,.08); color: rgba(168,85,247,.85);
        transition: all .25s; white-space: nowrap;
      }
      .kmr-nav-pill:hover { background: rgba(124,58,237,.2); border-color: #7c3aed; color: #fff; }
      .kmr-nav-pill.admin-on { background: #7c3aed; color: #fff; border-color: transparent; }
      
      .kmr-login { position:fixed;inset:0;z-index:99997;background:rgba(5,5,11,.97);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s; }
      .kmr-login.open { opacity:1; }
      .kmr-login-box { background:#0d0d1a;border:1px solid rgba(124,58,237,.3);border-radius:16px;padding:2.5rem 2rem;width:100%;max-width:360px;text-align:center; }
      .kmr-pw { width:100%;padding:.85rem;border-radius:8px;background:#05050b;border:1px solid rgba(124,58,237,.2);color:#fff;text-align:center;margin-bottom:1rem; outline:none; }
      .kmr-submit { width:100%;padding:.85rem;border-radius:8px;background:#7c3aed;color:#fff;font-weight:600;cursor:pointer;border:none; }

      .kmr-banner { background:rgba(124,58,237,.1); border-bottom:1px solid rgba(124,58,237,.2); padding:.5rem 1.5rem; display:flex; justify-content:space-between; align-items:center; position:sticky; top:64px; z-index:890; font-size:.7rem; color:#a855f7; backdrop-filter:blur(10px); }
      .kmr-logout-btn { padding:.2rem .6rem; border:1px solid rgba(124,58,237,.4); color:#fff; cursor:pointer; background:none; border-radius:4px; font-size:.6rem; }

      .kmr-zone { border:2px dashed rgba(124,58,237,.3); border-radius:10px; padding:2rem; text-align:center; margin-bottom:1.5rem; background:rgba(13,13,26,.5); position:relative; }
      .kmr-zone input { position:absolute; inset:0; opacity:0; cursor:pointer; }
      .kmr-prog-bar { height:4px; background:rgba(255,255,255,.1); border-radius:2px; margin-top:1rem; overflow:hidden; }
      .kmr-prog-fill { height:100%; background:#7c3aed; width:0; transition:width .3s; }

      .kmr-admin-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; }
      .kmr-tile { aspect-ratio:1; position:relative; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); }
      .kmr-tile img { width:100%; height:100%; object-fit:cover; }
      .kmr-tile-ov { position:absolute; inset:0; background:rgba(0,0,0,0.7); display:flex; gap:10px; align-items:center; justify-content:center; opacity:0; transition:0.2s; }
      .kmr-tile:hover .kmr-tile-ov { opacity:1; }
      .kmr-act { background:#fff; color:#000; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.8rem; }
      .kmr-act.del { background:#dc2626; color:#fff; }

      .kmr-vis-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:15px; }
      .kmr-vis-tile { border-radius:12px; overflow:hidden; cursor:pointer; border:1px solid rgba(124,58,237,0.1); transition:0.3s; }
      .kmr-vis-tile:hover { transform:translateY(-5px); border-color:#7c3aed; }
    `;
    document.head.appendChild(s);
  }

  /* ── Cloudinary Upload Logic ────────────────────── */
  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');
    return await response.json();
  }

  /* ── Main Functions ────────────────────────────── */
  function injectNavPill() {
    if (document.getElementById('kmr-nav-pill')) return;
    const pill = document.createElement('button');
    pill.id = 'kmr-nav-pill';
    pill.className = 'kmr-nav-pill' + (isAdmin() ? ' admin-on' : '');
    pill.innerHTML = isAdmin() ? '⚙️ Admin On' : '🔒 Admin';
    pill.addEventListener('click', () => isAdmin() ? (confirm('Log out?') && logoutAdmin()) : showLogin());
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.appendChild(pill);
  }

  function showLogin() {
    let m = document.getElementById('kmr-login');
    if (m) { m.style.display='flex'; requestAnimationFrame(()=>m.classList.add('open')); return; }
    m = document.createElement('div');
    m.className='kmr-login'; m.id='kmr-login';
    m.innerHTML=`<div class="kmr-login-box"><h3>Unlock Admin</h3><input class="kmr-pw" type="password" id="kmr-pw" placeholder="Password"><button class="kmr-submit" id="kmr-submit">Login</button></div>`;
    document.body.appendChild(m);
    requestAnimationFrame(()=>m.classList.add('open'));
    const inp=m.querySelector('#kmr-pw');
    m.querySelector('#kmr-submit').addEventListener('click', () => {
      if (loginAdmin(inp.value)) location.reload();
      else toast('Wrong password', 'error');
    });
  }

  async function processFiles(galleryId, grid, files) {
    const valid = [...files].filter(f => ACCEPTED.includes(f.type));
    const fill = document.getElementById(`kpf-${galleryId}`);
    const zone = document.getElementById(`kp-${galleryId}`);
    if (zone) zone.style.display = 'block';

    const newImgs = [];
    for (let i = 0; i < valid.length; i++) {
      try {
        const data = await uploadToCloudinary(valid[i]);
        newImgs.push({ id: uid(), src: data.secure_url, caption: '', date: new Date().toISOString() });
        if (fill) fill.style.width = `${((i + 1) / valid.length) * 100}%`;
      } catch (e) {
        toast('Upload Error', 'error');
      }
    }

    const current = loadData(galleryId);
    const updated = [...current, ...newImgs];
    saveData(galleryId, updated);
    renderAdmin(galleryId, grid, updated);
    toast('Synced to Cloud!', 'success');
    if (zone) zone.style.display = 'none';
  }

  function renderAdmin(id, grid, imgs) {
    grid.innerHTML = '';
    imgs.forEach(img => {
      const tile = document.createElement('div');
      tile.className = 'kmr-tile';
      tile.innerHTML = `<img src="${img.src}"><div class="kmr-tile-ov"><button class="kmr-act del">🗑️</button></div>`;
      tile.querySelector('.del').addEventListener('click', () => {
        const filtered = loadData(id).filter(x => x.id !== img.id);
        saveData(id, filtered);
        renderAdmin(id, grid, filtered);
      });
      grid.appendChild(tile);
    });
  }

  function build(el) {
    const id = el.dataset.uploadGallery;
    const imgs = loadData(id);
    el.innerHTML = '';
    if (isAdmin()) {
      const bar = document.createElement('div');
      bar.innerHTML = `<button class="kmr-btn" onclick="KMRGallery.export('${id}')">Export JSON</button>`;
      el.appendChild(bar);
      const zone = document.createElement('div');
      zone.className='kmr-zone';
      zone.innerHTML = `<span>📸 Drop to Cloud</span><input type="file" multiple><div class="kmr-prog-bar" id="kp-${id}" style="display:none"><div class="kmr-prog-fill" id="kpf-${id}"></div></div>`;
      zone.querySelector('input').addEventListener('change', e => processFiles(id, grid, e.target.files));
      el.appendChild(zone);
      const grid = document.createElement('div');
      grid.className = 'kmr-admin-grid';
      el.appendChild(grid);
      renderAdmin(id, grid, imgs);
    } else {
      const grid = document.createElement('div');
      grid.className = 'kmr-vis-grid';
      imgs.forEach(img => {
        const tile = document.createElement('div');
        tile.className = 'kmr-vis-tile';
        tile.innerHTML = `<img src="${img.src}">`;
        grid.appendChild(tile);
      });
      el.appendChild(grid);
    }
  }

  function init() {
    injectCSS();
    injectNavPill();
    if (isAdmin()) {
        const b = document.createElement('div');
        b.className='kmr-banner';
        b.innerHTML=`<span>Cloud Sync Active</span><button class="kmr-logout-btn" onclick="KMRGallery.logout()">Logout</button>`;
        document.body.prepend(b);
    }
    document.querySelectorAll('[data-upload-gallery]').forEach(build);
  }

  window.KMRGallery = { 
    logout: logoutAdmin, 
    export: (id) => {
        const data = localStorage.getItem(STORAGE_PREFIX + id);
        const blob = new Blob([data], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'gallery.json';
        a.click();
    }
  };

  init();
})();