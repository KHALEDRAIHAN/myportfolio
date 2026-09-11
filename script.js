/* ============================================
   KHALED MD RAIHAN – Portfolio JS
   ============================================ */

/* ============================================
   COVERFLOW SLIDER
   window.KMRCoverflow(container, images, options)
   images: [{ src, caption }]
   One image sits in front; the rest line up behind it on
   both sides. Drag / swipe / wheel / arrows / buttons / dots.
   ============================================ */
window.KMRCoverflow = function (container, images, options = {}) {
  const opts = Object.assign({ dots: true, onOpen: null }, options);
  const n = images.length;
  if (!n) return null;

  container.innerHTML = '';
  const cf    = document.createElement('div');
  cf.className = 'cf';
  const stage = document.createElement('div');
  stage.className = 'cf-stage';
  stage.tabIndex = 0;
  stage.setAttribute('role', 'region');
  stage.setAttribute('aria-label', 'Image slider');

  const slides = images.map((img, i) => {
    const s  = document.createElement('div');
    s.className = 'cf-slide';
    s.dataset.index = i;
    const im = document.createElement('img');
    im.src = img.src;
    im.alt = img.caption || '';
    im.loading = i < 4 ? 'eager' : 'lazy';
    im.draggable = false;
    s.appendChild(im);
    stage.appendChild(s);
    return s;
  });
  cf.appendChild(stage);

  const bar = document.createElement('div');
  bar.className = 'cf-bar';
  bar.innerHTML = `
    <button class="cf-btn cf-prev" type="button" aria-label="Previous image">←</button>
    <div class="cf-info"><div class="cf-caption"></div><div class="cf-count"></div></div>
    <button class="cf-btn cf-next" type="button" aria-label="Next image">→</button>`;
  cf.appendChild(bar);

  let dots = [];
  if (opts.dots && n > 1 && n <= 30) {
    const d = document.createElement('div');
    d.className = 'cf-dots';
    dots = images.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cf-dot';
      b.setAttribute('aria-label', `Go to image ${i + 1}`);
      b.addEventListener('click', () => goTo(i));
      d.appendChild(b);
      return b;
    });
    cf.appendChild(d);
  }
  container.appendChild(cf);

  const captionEl = bar.querySelector('.cf-caption');
  const countEl   = bar.querySelector('.cf-count');
  const prevBtn   = bar.querySelector('.cf-prev');
  const nextBtn   = bar.querySelector('.cf-next');

  let index = 0;   // committed slide
  let pos   = 0;   // fractional position (during drag)
  const W = () => slides[0].offsetWidth || 1;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function layout(p) {
    const w = W();
    const active = Math.round(clamp(p, 0, n - 1));
    slides.forEach((s, i) => {
      const d = i - p;
      const a = Math.abs(d);
      const sign = d < 0 ? -1 : 1;
      if (a > 5) {
        s.style.opacity = '0';
        s.style.pointerEvents = 'none';
        s.style.transform = `translateX(${sign * w * 1.8}px) scale(0.3)`;
        return;
      }
      const x     = a <= 1 ? d * 0.46 * w : sign * (0.46 + 0.25 * (a - 1)) * w;
      const scale = Math.max(0.4, 1 - 0.16 * a);
      const rot   = -sign * Math.min(a, 2) * 15;
      s.style.opacity = a > 4 ? String(Math.max(0, 5 - a)) : '1';
      s.style.pointerEvents = '';
      s.style.zIndex = String(Math.round(200 - a * 10));
      s.style.transform = `translateX(${x}px) scale(${scale}) rotateY(${rot}deg)`;
      s.classList.toggle('is-active', i === active);
    });
  }

  function updateUI() {
    const img = images[index];
    captionEl.textContent = img.caption || '';
    countEl.textContent = `${String(index + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    prevBtn.style.opacity = index === 0 ? '0.3' : '';
    nextBtn.style.opacity = index === n - 1 ? '0.3' : '';
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  function goTo(i) {
    index = clamp(Math.round(i), 0, n - 1);
    pos = index;
    layout(pos);
    updateUI();
  }

  function open() {
    if (opts.onOpen) return opts.onOpen(index, images);
    if (window.openLightbox) window.openLightbox(images, index);
  }

  /* size the stage to the slide height */
  function fit() {
    stage.style.height = slides[0].offsetHeight + 'px';
    layout(pos);
  }
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);
  else window.addEventListener('resize', fit);
  slides[0].querySelector('img').addEventListener('load', fit, { once: true });

  /* buttons + keyboard */
  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'Enter')      open();
  });

  /* drag / swipe */
  let dragging = false, moved = false, startX = 0, startPos = 0, lastX = 0, lastT = 0, vel = 0, hit = null;
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; moved = false;
    startX = lastX = e.clientX; startPos = pos; lastT = performance.now(); vel = 0;
    hit = e.target.closest('.cf-slide');
    stage.setPointerCapture(e.pointerId);
    cf.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6) moved = true;
    const now = performance.now();
    vel = (e.clientX - lastX) / Math.max(1, now - lastT);
    lastX = e.clientX; lastT = now;
    pos = clamp(startPos - dx / (W() * 0.6), -0.35, n - 1 + 0.35);
    layout(pos);
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    cf.classList.remove('is-dragging');
    if (!moved) {
      if (hit) {
        const i = Number(hit.dataset.index);
        // defer so the trailing `click` event doesn't land on the freshly opened lightbox
        if (i === index) setTimeout(open, 0); else goTo(i);
      }
      pos = index; layout(pos);
      return;
    }
    const fling = clamp(-vel * 160 / (W() * 0.6), -1, 1);
    goTo(pos + fling);
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('lostpointercapture', endDrag);

  /* horizontal wheel / trackpad */
  let wheelLock = 0;
  stage.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) < 18 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    e.preventDefault();
    const now = Date.now();
    if (now - wheelLock < 450) return;
    wheelLock = now;
    goTo(index + (e.deltaX > 0 ? 1 : -1));
  }, { passive: false });

  fit();
  goTo(0);
  return { goTo, next: () => goTo(index + 1), prev: () => goTo(index - 1), get index() { return index; } };
};

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Navbar ---- */
  const navbar     = document.querySelector('.navbar');
  const hamburger  = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  const onScroll = () => navbar && navbar.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (hamburger && mobileMenu) {
    const setMenu = open => {
      hamburger.classList.toggle('open', open);
      mobileMenu.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    hamburger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---- Active nav link ---- */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === currentPage);
  });

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    revealEls.forEach(el => obs.observe(el));
  }

  /* ---- Jump nav: highlight current section ---- */
  const jumpNav   = document.querySelector('.jump-nav');
  const jumpLinks = document.querySelectorAll('.jump-nav a[href^="#"]');
  if (jumpNav) {
    // keep it out of the way of the page hero
    const hero = document.querySelector('.page-hero');
    const showJump = () => jumpNav.classList.toggle('show', window.scrollY > (hero ? hero.offsetHeight - 120 : 300));
    window.addEventListener('scroll', showJump, { passive: true });
    showJump();
  }
  if (jumpLinks.length) {
    const targets = [...jumpLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const jo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        jumpLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    targets.forEach(t => jo.observe(t));
  }

  /* ---- Static coverflows (markup: .cf-static > img[data-caption]) ---- */
  document.querySelectorAll('.cf-static').forEach(el => {
    const imgs = [...el.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src'), caption: i.dataset.caption || i.alt || '' }));
    if (imgs.length) window.KMRCoverflow(el, imgs);
  });

  /* ---- Lightbox (images) ---- */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg     = lightbox.querySelector('.lightbox-img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const lightboxClose   = lightbox.querySelector('.lightbox-close');
    const lightboxPrev    = lightbox.querySelector('.lightbox-prev');
    const lightboxNext    = lightbox.querySelector('.lightbox-next');
    let galleryItems = [];
    let currentIndex = 0;

    function openLightbox(items, index) {
      galleryItems = items;
      currentIndex = index || 0;
      showLightboxImage();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => lightbox.classList.add('visible'));
    }
    function closeLightbox() {
      lightbox.classList.remove('visible');
      setTimeout(() => { lightbox.classList.remove('open'); document.body.style.overflow = ''; }, 350);
    }
    function showLightboxImage() {
      const item = galleryItems[currentIndex];
      if (lightboxImg) { lightboxImg.src = item.src || item; lightboxImg.alt = item.caption || ''; }
      if (lightboxCaption) lightboxCaption.textContent = item.caption || `${currentIndex + 1} / ${galleryItems.length}`;
      const multi = galleryItems.length > 1;
      if (lightboxPrev) lightboxPrev.style.display = multi ? 'flex' : 'none';
      if (lightboxNext) lightboxNext.style.display = multi ? 'flex' : 'none';
    }
    const go = dir => { currentIndex = (currentIndex + dir + galleryItems.length) % galleryItems.length; showLightboxImage(); };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target.classList.contains('lightbox-content')) closeLightbox(); });
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => go(-1));
    if (lightboxNext) lightboxNext.addEventListener('click', () => go(1));
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
    }, { passive: true });

    window.openLightbox = openLightbox;

    /* Attach to [data-lightbox] items */
    document.querySelectorAll('[data-lightbox]').forEach(el => {
      el.addEventListener('click', () => {
        const group = el.dataset.lightboxGroup || 'default';
        const all = [...document.querySelectorAll(`[data-lightbox]`)].filter(e => (e.dataset.lightboxGroup || 'default') === group);
        const items = all.map(e => ({ src: e.dataset.lightbox || e.querySelector('img')?.src, caption: e.dataset.caption || '' }));
        openLightbox(items, Math.max(0, all.indexOf(el)));
      });
    });
  }

  /* ---- Video Lightbox ---- */
  const videoLightbox = document.getElementById('videoLightbox');
  if (videoLightbox) {
    const videoContainer = videoLightbox.querySelector('.video-lightbox-inner');
    const videoClose     = videoLightbox.querySelector('.lightbox-close');

    function openVideoLightbox(src, type = 'youtube', orientation) {
      videoContainer.innerHTML = '';
      videoLightbox.querySelector('.video-ext-link')?.remove();
      // Facebook reels are vertical; everything else defaults to 16:9
      videoContainer.classList.toggle('is-portrait', orientation ? orientation === 'portrait' : type === 'facebook');
      if (type === 'facebook') {
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(src) + '&show_text=false&autoplay=true&mute=0';
        iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen';
        iframe.allowFullscreen = true;
        iframe.setAttribute('scrolling', 'no');
        videoContainer.appendChild(iframe);
        const ext = document.createElement('a');
        ext.className = 'video-ext-link';
        ext.href = src; ext.target = '_blank'; ext.rel = 'noopener';
        ext.textContent = 'Open on Facebook ↗';
        videoLightbox.appendChild(ext);
      } else if (type === 'youtube') {
        const iframe = document.createElement('iframe');
        iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1&rel=0';
        iframe.allow = 'autoplay; fullscreen';
        iframe.allowFullscreen = true;
        videoContainer.appendChild(iframe);
      } else {
        const video = document.createElement('video');
        video.src = src; video.controls = true; video.autoplay = true;
        videoContainer.appendChild(video);
      }
      videoLightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => videoLightbox.classList.add('visible'));
    }
    function closeVideoLightbox() {
      videoLightbox.classList.remove('visible');
      setTimeout(() => { videoLightbox.classList.remove('open'); videoContainer.innerHTML = ''; videoLightbox.querySelector('.video-ext-link')?.remove(); document.body.style.overflow = ''; }, 350);
    }
    if (videoClose) videoClose.addEventListener('click', closeVideoLightbox);
    videoLightbox.addEventListener('click', e => { if (e.target === videoLightbox) closeVideoLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && videoLightbox.classList.contains('open')) closeVideoLightbox(); });
    window.openVideoLightbox = openVideoLightbox;
    document.querySelectorAll('[data-video]').forEach(el => {
      el.addEventListener('click', () => openVideoLightbox(el.dataset.video, el.dataset.videoType || 'youtube', el.dataset.orientation));
      // optional poster image: data-thumb="url"
      const thumb = el.querySelector('.video-thumb');
      if (thumb && el.dataset.thumb) thumb.style.backgroundImage = `url("${el.dataset.thumb}")`;
    });
  }

  /* ---- Filter buttons ---- */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.filter-bar').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('[data-category]').forEach(item => {
        item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
      });
    });
  });

  /* ---- Footer year ---- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

});
