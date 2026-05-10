/* ============================================
   KHALED MD RAIHAN – Portfolio JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Navbar ---- */
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- Active nav link ---- */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === currentPage) a.classList.add('active');
  });

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => obs.observe(el));
  }

  /* ---- Lightbox (images) ---- */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const lightboxPrev = lightbox.querySelector('.lightbox-prev');
    const lightboxNext = lightbox.querySelector('.lightbox-next');
    let galleryItems = [];
    let currentIndex = 0;

    function openLightbox(items, index) {
      galleryItems = items;
      currentIndex = index;
      showLightboxImage();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => lightbox.classList.add('visible'));
    }

    function closeLightbox() {
      lightbox.classList.remove('visible');
      setTimeout(() => {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }, 350);
    }

    function showLightboxImage() {
      const item = galleryItems[currentIndex];
      if (lightboxImg) {
        lightboxImg.src = item.src || item;
        lightboxImg.alt = item.caption || '';
      }
      if (lightboxCaption) lightboxCaption.textContent = item.caption || `${currentIndex + 1} / ${galleryItems.length}`;
      if (lightboxPrev) lightboxPrev.style.display = galleryItems.length > 1 ? 'flex' : 'none';
      if (lightboxNext) lightboxNext.style.display = galleryItems.length > 1 ? 'flex' : 'none';
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      showLightboxImage();
    });
    if (lightboxNext) lightboxNext.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % galleryItems.length;
      showLightboxImage();
    });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft' && lightboxPrev) lightboxPrev.click();
      if (e.key === 'ArrowRight' && lightboxNext) lightboxNext.click();
    });

    window.openLightbox = openLightbox;

    /* Attach to gallery items */
    const galleryEls = document.querySelectorAll('[data-lightbox]');
    galleryEls.forEach((el, i) => {
      const group = el.dataset.lightboxGroup || 'default';
      el.addEventListener('click', () => {
        const groupItems = [...document.querySelectorAll(`[data-lightbox-group="${group}"]`)]
          .map(e => ({ src: e.dataset.lightbox, caption: e.dataset.caption || '' }));
        const idx = [...document.querySelectorAll(`[data-lightbox-group="${group}"]`)].indexOf(el);
        openLightbox(groupItems.length ? groupItems : [{ src: el.dataset.lightbox }], Math.max(0, idx));
      });
    });

    /* Swipe support */
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
    lightbox.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && lightboxNext) lightboxNext.click();
        else if (lightboxPrev) lightboxPrev.click();
      }
    });
  }

  /* ---- Video Lightbox ---- */
  const videoLightbox = document.getElementById('videoLightbox');
  if (videoLightbox) {
    const videoContainer = videoLightbox.querySelector('.video-lightbox-inner');
    const videoClose = videoLightbox.querySelector('.lightbox-close');

    function openVideoLightbox(src, type = 'youtube') {
      videoContainer.innerHTML = '';
      if (type === 'youtube') {
        const iframe = document.createElement('iframe');
        iframe.src = src + '?autoplay=1&rel=0';
        iframe.allow = 'autoplay; fullscreen';
        iframe.allowFullscreen = true;
        videoContainer.appendChild(iframe);
      } else {
        const video = document.createElement('video');
        video.src = src;
        video.controls = true;
        video.autoplay = true;
        videoContainer.appendChild(video);
      }
      videoLightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => videoLightbox.classList.add('visible'));
    }

    function closeVideoLightbox() {
      videoLightbox.classList.remove('visible');
      setTimeout(() => {
        videoLightbox.classList.remove('open');
        videoContainer.innerHTML = '';
        document.body.style.overflow = '';
      }, 350);
    }

    if (videoClose) videoClose.addEventListener('click', closeVideoLightbox);
    videoLightbox.addEventListener('click', e => { if (e.target === videoLightbox) closeVideoLightbox(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && videoLightbox.classList.contains('open')) closeVideoLightbox();
    });

    window.openVideoLightbox = openVideoLightbox;

    document.querySelectorAll('[data-video]').forEach(el => {
      el.addEventListener('click', () => {
        openVideoLightbox(el.dataset.video, el.dataset.videoType || 'youtube');
      });
    });
  }

  /* ---- Drag to scroll (horizontal galleries) ---- */
  document.querySelectorAll('.work-scroll-container').forEach(container => {
    let isDragging = false, startX, scrollLeft;
    container.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });
    document.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('mousemove', e => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      container.scrollLeft = scrollLeft - (x - startX);
    });
  });

  /* ---- Filter buttons ---- */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.filter-bar').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('[data-category]').forEach(item => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.style.display = show ? '' : 'none';
        if (show) { item.style.opacity = '0'; requestAnimationFrame(() => { item.style.transition = 'opacity 0.4s'; item.style.opacity = '1'; }); }
      });
    });
  });

  /* ---- Contact form ---- */
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Message Sent ✓';
      btn.style.background = '#22c55e';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        form.reset();
      }, 3000);
    });
  }

  /* ---- Floating particles (hero only) ---- */
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0.4;z-index:1';
    heroSection.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let particles = [];
    const resize = () => { canvas.width = heroSection.offsetWidth; canvas.height = heroSection.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3, vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.4 - 0.1,
        color: ['#7c3aed','#22d3ee','#f97316'][Math.floor(Math.random() * 3)], opacity: Math.random() * 0.7 + 0.2
      });
    }
    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

});