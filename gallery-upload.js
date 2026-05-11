/* ============================================
   KMR PORTFOLIO — ADMIN GALLERY MANAGER
   Owner-only upload. Visitors see photos only.
   Password protected via sessionStorage.
   Images stored in localStorage as base64.
   ============================================ */
(function () {
  'use strict';

  // ─── CONFIG — CHANGE THIS PASSWORD ───────────────────────
  const ADMIN_PASSWORD    = 'kmr2025admin';     // <-- change this
  const ADMIN_SESSION_KEY = 'kmr_admin_auth';
  const STORAGE_PREFIX    = 'kmr_gallery_';
  const MAX_SIZE_MB       = 30;
  const ACCEPTED          = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

  // ── Auth ──────────────────────────────────────────────────
  const isAdmin = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  const loginAdmin = pw => { if (pw === ADMIN_PASSWORD) { sessionStorage.setItem(ADMIN_SESSION_KEY,'true'); return true; } return false; };
  const logoutAdmin = () => { sessionStorage.removeItem(ADMIN_SESSION_KEY); location.reload(); };

  // ── Storage ───────────────────────────────────────────────
  const sk = id => STORAGE_PREFIX + id;
  function loadImages(id) { try { return JSON.parse(localStorage.getItem(sk(id)) || '[]'); } catch { return []; } }
  function saveImages(id, imgs) {
    try { localStorage.setItem(sk(id), JSON.stringify(imgs)); return true; }
    catch(e) { if (e.name === 'QuotaExceededError') toast('Storage full — remove some images first.','error'); return false; }
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const fmtBytes = b => b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';

  // ── Toast ─────────────────────────────────────────────────
  function toast(msg, type='info') {
    document.querySelector('.kmr-toast')?.remove();
    const t = Object.assign(document.createElement('div'),{className:'kmr-toast',textContent:msg});
    const bg = {error:'#dc2626',success:'#16a34a',info:'#1e1e32'}[type]||'#1e1e32';
    t.style.cssText=`position:fixed;bottom:5rem;left:50%;transform:translateX(-50%) translateY(16px);
      background:${bg};color:#fff;padding:.7rem 1.4rem;border-radius:6px;font-size:.8rem;
      letter-spacing:.06em;z-index:99999;opacity:0;transition:opacity .3s,transform .3s;
      pointer-events:none;border:1px solid rgba(255,255,255,.1);box-shadow:0 8px 24px rgba(0,0,0,.5);
      max-width:88vw;text-align:center;font-family:var(--font-body,'Outfit',sans-serif);`;
    document.body.appendChild(t);
    requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; });
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(8px)'; setTimeout(()=>t.remove(),300); },3000);
  }

  // ── Inject CSS ────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('kmr-styles')) return;
    const s = document.createElement('style');
    s.id = 'kmr-styles';
    s.textContent = `
      /* Admin trigger (floating lock icon) */
      /*.kmr-trigger{position:fixed;bottom:1.5rem;right:1.5rem;z-index:8000;width:40px;height:40px;
        border-radius:50%;background:rgba(13,13,26,.9);border:1px solid rgba(124,58,237,.25);
        color:rgba(255,255,255,.25);font-size:.95rem;cursor:pointer;display:flex;
        align-items:center;justify-content:center;transition:all .3s;backdrop-filter:blur(10px);}
      .kmr-trigger:hover{border-color:#7c3aed;color:#7c3aed;box-shadow:0 0 20px rgba(124,58,237,.3);}
      .kmr-trigger.active{background:#7c3aed;color:#fff;border-color:transparent;box-shadow:0 0 24px rgba(124,58,237,.5);}*/
      /* Look for this specific block inside the injectCSS function */

      /* Admin trigger (floating lock icon) */
      .kmr-trigger{
        position:fixed;
        bottom: 5.5rem;   /* Change this from 1.5rem to 5.5rem */
        right:1.5rem;
        z-index:8000;
        width:40px;
        height:40px;
        border-radius:50%;
        background:rgba(13,13,26,.9);
        border:1px solid rgba(124,58,237,.25);
        color:rgba(255,255,255,.25);
        font-size:.95rem;
        cursor:pointer;
        display:flex;
        align-items:center;
        justify-content:center;
        transition:all .3s;
        backdrop-filter:blur(10px);
      }

      /* Login modal */
      .kmr-login{position:fixed;inset:0;z-index:99997;background:rgba(5,5,11,.97);
        backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:1.5rem;
        opacity:0;transition:opacity .3s;}
      .kmr-login.open{opacity:1;}
      .kmr-login-box{background:#0d0d1a;border:1px solid rgba(124,58,237,.3);border-radius:16px;
        padding:2.5rem 2rem;width:100%;max-width:360px;text-align:center;}
      .kmr-login-box .ico{font-size:2.5rem;margin-bottom:1rem;}
      .kmr-login-box h3{font-family:var(--font-display,'Bebas Neue',sans-serif);font-size:1.8rem;
        letter-spacing:.08em;color:#e5e7eb;margin-bottom:.2rem;}
      .kmr-login-box p{font-size:.75rem;color:#6b7280;letter-spacing:.08em;margin-bottom:1.75rem;}
      .kmr-pw{width:100%;padding:.85rem 1rem;border-radius:8px;background:#05050b;
        border:1px solid rgba(124,58,237,.2);color:#e5e7eb;font-size:.95rem;
        font-family:var(--font-body,'Outfit',sans-serif);outline:none;
        transition:border-color .3s;margin-bottom:1rem;text-align:center;letter-spacing:.1em;}
      .kmr-pw:focus{border-color:#7c3aed;box-shadow:0 0 20px rgba(124,58,237,.15);}
      .kmr-pw.err{border-color:#dc2626;}
      .kmr-submit{width:100%;padding:.85rem;border-radius:8px;background:#7c3aed;color:#fff;
        font-family:var(--font-body,'Outfit',sans-serif);font-size:.82rem;font-weight:600;
        letter-spacing:.15em;text-transform:uppercase;cursor:pointer;border:none;transition:all .3s;}
      .kmr-submit:hover{background:#9d5aff;box-shadow:0 0 30px rgba(124,58,237,.5);}
      .kmr-err-msg{color:#f87171;font-size:.75rem;margin-top:.6rem;display:none;}
      .kmr-esc-hint{margin-top:1rem;font-size:.65rem;color:rgba(255,255,255,.12);letter-spacing:.06em;}

      /* Admin banner */
      .kmr-banner{background:rgba(124,58,237,.1);border-bottom:1px solid rgba(124,58,237,.2);
        padding:.55rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;
        font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(168,85,247,.9);
        position:sticky;top:70px;z-index:900;backdrop-filter:blur(10px);
        font-family:var(--font-body,'Outfit',sans-serif);}
      .kmr-dot{width:7px;height:7px;border-radius:50%;background:#a855f7;
        animation:kmrpulse 2s infinite;flex-shrink:0;}
      @keyframes kmrpulse{0%,100%{opacity:1}50%{opacity:.25}}
      .kmr-logout{padding:.28rem .75rem;border-radius:4px;border:1px solid rgba(124,58,237,.35);
        color:rgba(168,85,247,.8);cursor:pointer;font-size:.66rem;background:none;
        font-family:inherit;letter-spacing:.08em;transition:all .3s;}
      .kmr-logout:hover{background:rgba(124,58,237,.2);color:#fff;}

      /* Upload zone */
      .kmr-zone{border:2px dashed rgba(124,58,237,.28);border-radius:10px;padding:2rem 1rem;
        text-align:center;cursor:pointer;transition:border-color .3s,background .3s;
        background:rgba(13,13,26,.5);margin-bottom:1.5rem;position:relative;}
      .kmr-zone:hover,.kmr-zone.over{border-color:#7c3aed;background:rgba(124,58,237,.06);}
      .kmr-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
      .kmr-zone-ico{font-size:2rem;margin-bottom:.4rem;display:block;}
      .kmr-zone-title{font-family:var(--font-display,'Bebas Neue',sans-serif);font-size:1.2rem;
        letter-spacing:.06em;color:#e5e7eb;margin-bottom:.2rem;}
      .kmr-zone-sub{font-size:.73rem;color:#9ca3af;letter-spacing:.07em;}
      .kmr-prog{margin-top:.75rem;display:none;}
      .kmr-prog-bar{height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin-top:.5rem;}
      .kmr-prog-fill{height:100%;width:0%;background:linear-gradient(90deg,#7c3aed,#22d3ee);
        transition:width .3s;border-radius:2px;}

      /* Admin controls row */
      .kmr-abar{display:flex;align-items:center;justify-content:space-between;
        flex-wrap:wrap;gap:.75rem;margin-bottom:1.25rem;}
      .kmr-count{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#9ca3af;}
      .kmr-count b{color:#22d3ee;}
      .kmr-actions{display:flex;gap:.45rem;flex-wrap:wrap;}
      .kmr-btn{padding:.32rem .8rem;border-radius:4px;font-size:.68rem;font-weight:600;
        letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:all .2s;
        font-family:var(--font-body,'Outfit',sans-serif);border:1px solid rgba(124,58,237,.2);
        background:#0d0d1a;color:#9ca3af;}
      .kmr-btn:hover{color:#e5e7eb;border-color:#7c3aed;}
      .kmr-btn.red:hover{border-color:#dc2626;color:#dc2626;}
      .kmr-btn.pri{background:#7c3aed;color:#fff;border-color:#7c3aed;}
      .kmr-btn.pri:hover{background:#9d5aff;}

      /* Admin grid */
      .kmr-admin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.65rem;margin-bottom:1rem;}
      @media(max-width:480px){.kmr-admin-grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:.45rem;}}

      /* Admin image tile */
      .kmr-tile{position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;
        background:#13131f;border:1px solid rgba(124,58,237,.1);cursor:pointer;
        transition:border-color .2s,transform .2s;}
      .kmr-tile:hover{border-color:rgba(124,58,237,.45);transform:scale(1.02);}
      .kmr-tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s;}
      .kmr-tile:hover img{transform:scale(1.06);}
      .kmr-tile-ov{position:absolute;inset:0;background:rgba(5,5,11,.72);
        opacity:0;transition:opacity .25s;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:.35rem;}
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

      /* Visitor image tile */
      .kmr-vis-tile{position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;
        background:#13131f;border:1px solid rgba(124,58,237,.08);cursor:pointer;
        transition:border-color .3s,transform .3s;}
      .kmr-vis-tile:hover{border-color:rgba(34,211,238,.3);transform:scale(1.02);}
      .kmr-vis-tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s;}
      .kmr-vis-tile:hover img{transform:scale(1.07);}
      .kmr-vis-cap{position:absolute;bottom:0;left:0;right:0;padding:.7rem .6rem .45rem;
        background:linear-gradient(transparent,rgba(5,5,11,.9));font-size:.66rem;color:#9ca3af;
        letter-spacing:.05em;opacity:0;transition:opacity .3s;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .kmr-vis-tile:hover .kmr-vis-cap{opacity:1;}

      /* Caption modal */
      .kmr-modal-bd{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.85);
        backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;}
      .kmr-modal{background:#0d0d1a;border:1px solid rgba(124,58,237,.25);border-radius:12px;
        padding:1.75rem 1.5rem;width:100%;max-width:400px;font-family:var(--font-body,'Outfit',sans-serif);}
      .kmr-modal h4{font-family:var(--font-display,'Bebas Neue',sans-serif);font-size:1.25rem;
        letter-spacing:.06em;color:#e5e7eb;margin-bottom:1rem;}
      .kmr-modal img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;margin-bottom:1rem;}
      .kmr-modal input{width:100%;background:#05050b;border:1px solid rgba(124,58,237,.2);
        color:#e5e7eb;border-radius:6px;padding:.65rem .9rem;font-size:.9rem;
        font-family:inherit;outline:none;margin-bottom:.75rem;transition:border-color .2s;}
      .kmr-modal input:focus{border-color:#7c3aed;}
      .kmr-modal-meta{font-size:.67rem;color:#6b7280;margin-bottom:1rem;letter-spacing:.05em;}
      .kmr-modal-acts{display:flex;gap:.6rem;justify-content:flex-end;}

      /* Empty */
      .kmr-empty{text-align:center;padding:3rem 1rem;color:#6b7280;font-size:.8rem;
        letter-spacing:.08em;grid-column:1/-1;border:1px dashed rgba(124,58,237,.15);border-radius:8px;}
      .kmr-empty-ico{font-size:2.5rem;margin-bottom:.75rem;opacity:.3;display:block;}
    `;
    document.head.appendChild(s);
  }

  // ── Login modal ───────────────────────────────────────────
  function showLogin() {
    let m = document.getElementById('kmr-login');
    if (m) { m.style.display='flex'; requestAnimationFrame(()=>m.classList.add('open')); return; }

    m = document.createElement('div');
    m.className = 'kmr-login'; m.id = 'kmr-login';
    m.innerHTML = `<div class="kmr-login-box">
      <div class="ico">🔐</div>
      <h3>Admin Access</h3>
      <p>KMR Portfolio Manager</p>
      <input class="kmr-pw" type="password" id="kmr-pw" placeholder="Password" autocomplete="current-password">
      <button class="kmr-submit" id="kmr-submit">Unlock Admin Mode</button>
      <div class="kmr-err-msg" id="kmr-err">Wrong password. Try again.</div>
      <div class="kmr-esc-hint">Press ESC to cancel</div>
    </div>`;
    document.body.appendChild(m);
    requestAnimationFrame(()=>m.classList.add('open'));

    const inp = m.querySelector('#kmr-pw'), err = m.querySelector('#kmr-err');
    inp.focus();

    const close = () => { m.classList.remove('open'); setTimeout(()=>m.remove(),300); };
    const attempt = () => {
      if (loginAdmin(inp.value)) { close(); setTimeout(()=>location.reload(),200); }
      else { err.style.display='block'; inp.value=''; inp.classList.add('err'); inp.focus(); setTimeout(()=>inp.classList.remove('err'),1500); }
    };
    m.querySelector('#kmr-submit').addEventListener('click', attempt);
    inp.addEventListener('keydown', e => { if(e.key==='Enter') attempt(); if(e.key==='Escape') close(); });
    m.addEventListener('click', e => { if(e.target===m) close(); });
  }

  // ── Admin trigger button ──────────────────────────────────
  function injectTrigger() {
    const btn = document.createElement('button');
    btn.className = 'kmr-trigger' + (isAdmin() ? ' active' : '');
    btn.title = isAdmin() ? 'Admin — click to log out' : 'Admin Login';
    btn.textContent = isAdmin() ? '⚙️' : '🔒';
    btn.setAttribute('aria-label','Admin');
    btn.addEventListener('click', () => {
      if (isAdmin()) { if(confirm('Log out of admin mode?')) logoutAdmin(); }
      else showLogin();
    });
    document.body.appendChild(btn);
  }

  // ── Admin banner ──────────────────────────────────────────
  function injectBanner() {
    const b = document.createElement('div');
    b.className = 'kmr-banner';
    b.innerHTML = `<div style="display:flex;align-items:center;gap:.5rem"><div class="kmr-dot"></div><span>Admin Mode — Gallery Manager</span></div>
      <button class="kmr-logout" id="kmr-logout-btn">Log Out</button>`;
    const nav = document.querySelector('.navbar');
    if (nav?.nextSibling) nav.parentNode.insertBefore(b, nav.nextSibling);
    else document.body.prepend(b);
    document.getElementById('kmr-logout-btn').addEventListener('click', ()=>{ if(confirm('Log out?')) logoutAdmin(); });
  }

  // ── Build gallery (router) ────────────────────────────────
  function build(el) {
    const galleryId = el.dataset.uploadGallery;
    const label     = el.dataset.galleryLabel || 'Gallery';
    el.innerHTML    = '';
    if (isAdmin()) buildAdmin(el, galleryId, label);
    else           buildVisitor(el, galleryId);
  }

  // ── Visitor view ──────────────────────────────────────────
  function buildVisitor(el, galleryId) {
    const imgs = loadImages(galleryId);
    if (!imgs.length) {
      const e = document.createElement('div');
      e.className = 'kmr-empty';
      e.innerHTML = '<span class="kmr-empty-ico">📷</span>Photos coming soon.';
      el.appendChild(e);
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'kmr-vis-grid';
    imgs.forEach((img, i) => {
      const tile = document.createElement('div');
      tile.className = 'kmr-vis-tile';
      tile.innerHTML = `<img src="${img.src}" alt="${img.caption||''}" loading="lazy">
        ${img.caption ? `<div class="kmr-vis-cap">${img.caption}</div>` : ''}`;
      tile.addEventListener('click', () => openLB(imgs.map(x=>({src:x.src,caption:x.caption||''})), i));
      grid.appendChild(tile);
    });
    el.appendChild(grid);
  }

  // ── Admin view ────────────────────────────────────────────
  function buildAdmin(el, galleryId, label) {
    const imgs = loadImages(galleryId);

    // Top bar
    const bar = document.createElement('div');
    bar.className = 'kmr-abar';
    bar.innerHTML = `<div class="kmr-count"><b id="kc-${galleryId}">${imgs.length}</b> image${imgs.length!==1?'s':''} — ${label}</div>
      <div class="kmr-actions">
        <button class="kmr-btn" id="kex-${galleryId}">Export JSON</button>
        <button class="kmr-btn red" id="kclr-${galleryId}">Clear All</button>
      </div>`;
    el.appendChild(bar);

    // Upload zone
    const zone = document.createElement('div');
    zone.className = 'kmr-zone';
    zone.innerHTML = `<input type="file" id="kfi-${galleryId}" multiple accept="image/jpeg,image/jpg,image/png,image/webp,image/gif">
      <span class="kmr-zone-ico">📸</span>
      <div class="kmr-zone-title">Drop Photos Here / Tap to Browse</div>
      <div class="kmr-zone-sub">JPG · PNG · WEBP · GIF — max ${MAX_SIZE_MB}MB each</div>
      <div class="kmr-prog" id="kp-${galleryId}">
        <div style="font-size:.7rem;color:#9ca3af;" id="kpt-${galleryId}">Processing…</div>
        <div class="kmr-prog-bar"><div class="kmr-prog-fill" id="kpf-${galleryId}"></div></div>
      </div>`;
    el.appendChild(zone);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'kmr-admin-grid';
    grid.id = `kg-${galleryId}`;
    el.appendChild(grid);
    renderAdmin(galleryId, grid, imgs);

    // File input
    zone.querySelector(`#kfi-${galleryId}`).addEventListener('change', e => processFiles(galleryId, grid, e.target.files));

    // Drag & drop
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('over'); processFiles(galleryId, grid, e.dataTransfer.files); });

    // Clear all
    document.getElementById(`kclr-${galleryId}`)?.addEventListener('click', () => {
      if (!confirm(`Delete ALL images from "${label}"?`)) return;
      saveImages(galleryId,[]);
      renderAdmin(galleryId, grid, []);
      setCount(galleryId, 0);
      toast('All images cleared.','info');
    });

    // Export
    document.getElementById(`kex-${galleryId}`)?.addEventListener('click', () => {
      const data = loadImages(galleryId).map(({id,caption,date,filename,size})=>({id,caption,date,filename,size}));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      a.download = `${galleryId}-gallery.json`; a.click();
    });
  }

  function setCount(galleryId, n) {
    const el = document.getElementById(`kc-${galleryId}`);
    if (el) el.textContent = n;
  }

  function renderAdmin(galleryId, grid, imgs) {
    grid.innerHTML = '';
    if (!imgs.length) {
      grid.innerHTML = '<div class="kmr-empty" style="grid-column:1/-1"><span class="kmr-empty-ico">🖼️</span>No images yet — upload above.</div>';
      return;
    }
    imgs.forEach((img, i) => {
      const tile = document.createElement('div');
      tile.className = 'kmr-tile';
      tile.dataset.id = img.id;
      tile.innerHTML = `<img src="${img.src}" alt="${img.caption||''}" loading="lazy">
        <div class="kmr-tile-ov">
          <button class="kmr-act view" title="View">🔍</button>
          <button class="kmr-act edit" title="Edit caption">✏️</button>
          <button class="kmr-act del" title="Delete">🗑️</button>
        </div>
        <div class="kmr-cap-badge">${img.caption||`Photo ${i+1}`}</div>`;

      tile.querySelector('.view').addEventListener('click', e => {
        e.stopPropagation();
        const all = loadImages(galleryId).map(x=>({src:x.src,caption:x.caption||''}));
        openLB(all, loadImages(galleryId).findIndex(x=>x.id===img.id));
      });
      tile.querySelector('.edit').addEventListener('click', e => {
        e.stopPropagation();
        captionModal(galleryId, img.id, grid);
      });
      tile.querySelector('.del').addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm('Remove this image?')) return;
        const updated = loadImages(galleryId).filter(x=>x.id!==img.id);
        saveImages(galleryId, updated);
        renderAdmin(galleryId, grid, updated);
        setCount(galleryId, updated.length);
        toast('Image removed.','info');
      });
      tile.addEventListener('click', () => {
        const all = loadImages(galleryId).map(x=>({src:x.src,caption:x.caption||''}));
        openLB(all, loadImages(galleryId).findIndex(x=>x.id===img.id));
      });
      grid.appendChild(tile);
    });
    setCount(galleryId, imgs.length);
  }

  // ── File processing ───────────────────────────────────────
  function processFiles(galleryId, grid, files) {
    const valid = [...files].filter(f => {
      if (!ACCEPTED.includes(f.type)) { toast(`Unsupported: ${f.name}`,'error'); return false; }
      if (f.size > MAX_SIZE_MB*1048576) { toast(`Too large: ${f.name}`,'error'); return false; }
      return true;
    });
    if (!valid.length) return;

    const pw = document.getElementById(`kp-${galleryId}`);
    const pt = document.getElementById(`kpt-${galleryId}`);
    const pf = document.getElementById(`kpf-${galleryId}`);
    if (pw) pw.style.display = 'block';
    let done = 0, results = [];

    const next = i => {
      if (i >= valid.length) {
        const merged = [...loadImages(galleryId), ...results];
        if (saveImages(galleryId, merged)) {
          renderAdmin(galleryId, grid, merged);
          toast(`✅ ${valid.length} photo${valid.length>1?'s':''} uploaded!`,'success');
        }
        if (pw) { pw.style.display='none'; pf.style.width='0%'; }
        const fi = document.getElementById(`kfi-${galleryId}`); if(fi) fi.value='';
        return;
      }
      const f = valid[i];
      if (pt) pt.textContent = `Processing ${i+1}/${valid.length}: ${f.name}`;
      if (pf) pf.style.width = `${Math.round(i/valid.length*100)}%`;
      compress(f, src => {
        results.push({id:uid(), src, caption:'', filename:f.name, size:fmtBytes(f.size), date:new Date().toISOString()});
        if (pf) pf.style.width = `${Math.round(++done/valid.length*100)}%`;
        next(i+1);
      });
    };
    next(0);
  }

  function compress(file, cb) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX=1800; let w=img.width, h=img.height;
        if(w>MAX||h>MAX){const r=Math.min(MAX/w,MAX/h);w=Math.round(w*r);h=Math.round(h*r);}
        const c=document.createElement('canvas'); c.width=w; c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        cb(c.toDataURL('image/jpeg', file.size>2097152?0.78:0.88));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ── Caption modal ─────────────────────────────────────────
  function captionModal(galleryId, imgId, grid) {
    const imgs = loadImages(galleryId);
    const img  = imgs.find(x=>x.id===imgId); if(!img) return;
    const bd   = document.createElement('div'); bd.className='kmr-modal-bd';
    bd.innerHTML = `<div class="kmr-modal">
      <h4>Edit Caption</h4>
      <img src="${img.src}" alt="">
      <input type="text" id="kmr-cap-in" value="${img.caption||''}" placeholder="e.g. Artcell live – Dhaka 2024" maxlength="100">
      <div class="kmr-modal-meta">${img.filename||''} · ${img.size||''} · ${img.date?new Date(img.date).toLocaleDateString():''}</div>
      <div class="kmr-modal-acts">
        <button class="kmr-btn" id="cap-cancel">Cancel</button>
        <button class="kmr-btn pri" id="cap-save">Save</button>
      </div></div>`;
    document.body.appendChild(bd);
    const inp = bd.querySelector('#kmr-cap-in'); inp.focus(); inp.select();
    const save = () => { img.caption=inp.value.trim(); saveImages(galleryId,imgs); renderAdmin(galleryId,grid,imgs); bd.remove(); toast('Caption saved!','success'); };
    bd.querySelector('#cap-cancel').addEventListener('click',()=>bd.remove());
    bd.querySelector('#cap-save').addEventListener('click', save);
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter') save(); if(e.key==='Escape') bd.remove(); });
    bd.addEventListener('click',e=>{ if(e.target===bd) bd.remove(); });
  }

  // ── Lightbox ──────────────────────────────────────────────
  function openLB(images, start) {
    let cur = start||0;
    const lb=document.getElementById('lightbox'), li=document.getElementById('lightbox-img'), lc=document.getElementById('lightbox-caption');
    if (lb && li) {
      li.src = images[cur].src;
      if(lc) lc.textContent = images[cur].caption||'';
      lb.classList.add('open'); document.body.style.overflow='hidden';

      // Clone buttons to remove old listeners
      ['lightbox-prev','lightbox-next','lightbox-close'].forEach(id=>{
        const old=document.getElementById(id); if(!old) return;
        const clone=old.cloneNode(true); old.replaceWith(clone);
      });

      const go = dir => {
        cur=(cur+dir+images.length)%images.length;
        li.src=images[cur].src; if(lc) lc.textContent=images[cur].caption||'';
      };
      const close = () => { lb.classList.remove('open'); document.body.style.overflow=''; document.removeEventListener('keydown',kh); lb.removeEventListener('click',bk); };
      const kh = e => { if(!lb.classList.contains('open')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') go(-1); if(e.key==='ArrowRight') go(1); };
      const bk = e => { if(e.target===lb) close(); };

      document.getElementById('lightbox-close')?.addEventListener('click',close);
      document.getElementById('lightbox-prev')?.addEventListener('click',()=>go(-1));
      document.getElementById('lightbox-next')?.addEventListener('click',()=>go(1));
      document.addEventListener('keydown',kh);
      lb.addEventListener('click',bk);
    }
  }
  window.openLightbox = openLB;

  // ── Init ──────────────────────────────────────────────────
  function init() {
    injectCSS();

    // Check if the current filename is works.html
    const isWorksPage = window.location.pathname.includes('concerts.html');
    
    // Only show the 🔒 lock icon if we are on the Works page
    if (isWorksPage) {
      injectTrigger();
    }

    // Always show the admin banner if already logged in
    // This ensures you can still see management tools and LOG OUT 
    // regardless of which page you navigate to.
    if (isAdmin()) {
      injectBanner();
    }

    // Still build the galleries so visitors can see your photos on all pages
    document.querySelectorAll('[data-upload-gallery]').forEach(build);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

  window.KMRGallery = { loadImages, saveImages, isAdmin, logout: logoutAdmin };
})();