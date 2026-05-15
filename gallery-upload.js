/* ============================================
   KMR PORTFOLIO — CLOUD SYNC MANAGER (v4)
   - Cloudinary for global image hosting
   - Supabase for global data synchronization
   ============================================ */
(function () {
  'use strict';

  // ─── CONFIGURATION — FILL THESE IN ────────────────
  const CLOUD_NAME      = 'dxskk2i6r';
  const UPLOAD_PRESET   = 'kmr_preset';
  const SUPABASE_URL    = 'https://czcfnnrpqomggjusgtir.supabase.co';
  const SUPABASE_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y2ZubnJwcW9tZ2dqdXNndGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTgyOTEsImV4cCI6MjA5NDQzNDI5MX0.V-90pGhgmjvnH6ELFMaPNyrvqYhvaaQWMbWuCEXipL0';
  const ADMIN_PASSWORD  = 'kmr2025admin';
  // ─────────────────────────────────────────────────

  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const ADMIN_SESSION_KEY = 'kmr_admin_auth';
  const ACCEPTED = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

  const isAdmin = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  const logoutAdmin = () => { sessionStorage.removeItem(ADMIN_SESSION_KEY); location.reload(); };

  function toast(msg, type='info') {
    document.querySelector('.kmr-toast')?.remove();
    const t = Object.assign(document.createElement('div'),{className:'kmr-toast',textContent:msg});
    const bg = {error:'#dc2626',success:'#16a34a',info:'#1e1e32'}[type]||'#1e1e32';
    t.style.cssText = `position:fixed;bottom:5rem;left:50%;transform:translateX(-50%) translateY(16px);
      background:${bg};color:#fff;padding:.7rem 1.4rem;border-radius:6px;font-size:.8rem;z-index:99999;
      opacity:0;transition:opacity .3s,transform .3s;pointer-events:none;text-align:center;font-family:sans-serif;`;
    document.body.appendChild(t);
    requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; });
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(8px)'; setTimeout(()=>t.remove(),300); },3200);
  }

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
  }

  /* ── Database Operations ── */
  async function loadRemoteData(galleryId) {
    const { data, error } = await supabaseClient
      .from('gallery_images')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false });
    return error ? [] : data;
  }

  async function deleteRemoteImage(id) {
    const { error } = await supabaseClient.from('gallery_images').delete().eq('id', id);
    return !error;
  }

  /* ── UI & Upload Logic ── */
  async function processFiles(galleryId, grid, files) {
    const valid = [...files].filter(f => ACCEPTED.includes(f.type));
    const prog = document.getElementById(`kp-${galleryId}`);
    const fill = document.getElementById(`kpf-${galleryId}`);
    if (prog) prog.style.display = 'block';

    for (let i = 0; i < valid.length; i++) {
      try {
        const cloudData = await uploadToCloudinary(valid[i]);
        await supabaseClient.from('gallery_images').insert([
          { gallery_id: galleryId, src: cloudData.secure_url, caption: '' }
        ]);
        if (fill) fill.style.width = `${((i + 1) / valid.length) * 100}%`;
      } catch (e) { toast('Cloud sync failed', 'error'); }
    }
    
    if (prog) prog.style.display = 'none';
    build(grid.parentElement); // Refresh view
    toast('Gallery Updated!', 'success');
  }

  function renderAdmin(id, grid, imgs) {
    grid.innerHTML = '';
    imgs.forEach(img => {
      const tile = document.createElement('div');
      tile.className = 'kmr-tile';
      tile.innerHTML = `<img src="${img.src}"><div class="kmr-tile-ov"><button class="kmr-act del">🗑️</button></div>`;
      tile.querySelector('.del').addEventListener('click', async () => {
        if(confirm('Delete permanently?') && await deleteRemoteImage(img.id)) build(grid.parentElement);
      });
      grid.appendChild(tile);
    });
  }

  async function build(el) {
    const id = el.dataset.uploadGallery;
    const imgs = await loadRemoteData(id);
    el.innerHTML = '';
    
    if (isAdmin()) {
      const zone = document.createElement('div');
      zone.className='kmr-zone';
      zone.innerHTML = `<span>📸 Cloud Upload</span><input type="file" multiple><div class="kmr-prog-bar" id="kp-${id}" style="display:none"><div class="kmr-prog-fill" id="kpf-${id}"></div></div>`;
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
    // Admin login visible on Works page or if already logged in
    const isWorks = window.location.pathname.includes('works.html');
    if (isWorks || isAdmin()) {
      const pill = document.createElement('button');
      pill.className = 'kmr-nav-pill';
      pill.innerHTML = isAdmin() ? '⚙️ Logout' : '🔒 Admin';
      pill.style.cssText = "position:fixed; bottom:5.5rem; right:1.5rem; z-index:8000; padding:12px; border-radius:50px; background:#7c3aed; color:#fff; border:none; cursor:pointer; font-size:12px; font-weight:bold;";
      pill.onclick = () => {
          if(isAdmin()) { if(confirm('Logout?')) logoutAdmin(); }
          else {
              const pw = prompt('Admin Password:');
              if(pw === ADMIN_PASSWORD) { sessionStorage.setItem(ADMIN_SESSION_KEY, 'true'); location.reload(); }
          }
      };
      document.body.appendChild(pill);
    }
    document.querySelectorAll('[data-upload-gallery]').forEach(build);
  }

  function injectCSS() {
    if (document.getElementById('kmr-styles')) return;
    const s = document.createElement('style');
    s.id = 'kmr-styles';
    s.textContent = `
      .kmr-zone { border:2px dashed rgba(124,58,237,.3); border-radius:10px; padding:2rem; text-align:center; margin-bottom:1.5rem; background:rgba(13,13,26,.5); position:relative; }
      .kmr-zone input { position:absolute; inset:0; opacity:0; cursor:pointer; }
      .kmr-prog-bar { height:4px; background:rgba(255,255,255,.1); border-radius:2px; margin-top:1rem; overflow:hidden; }
      .kmr-prog-fill { height:100%; background:#7c3aed; width:0; transition:width .3s; }
      .kmr-admin-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; }
      .kmr-tile { aspect-ratio:1; position:relative; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); }
      .kmr-tile img { width:100%; height:100%; object-fit:cover; }
      .kmr-tile-ov { position:absolute; inset:0; background:rgba(0,0,0,0.7); display:flex; gap:10px; align-items:center; justify-content:center; opacity:0; transition:0.2s; }
      .kmr-tile:hover .kmr-tile-ov { opacity:1; }
      .kmr-act { background:#dc2626; color:#fff; border-radius:50%; width:30px; height:30px; border:none; cursor:pointer; }
      .kmr-vis-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:15px; }
      .kmr-vis-tile { border-radius:12px; overflow:hidden; border:1px solid rgba(124,58,237,0.1); }
      .kmr-vis-tile img { width:100%; display:block; }
    `;
    document.head.appendChild(s);
  }

  init();
})();