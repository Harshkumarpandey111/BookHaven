// ── Navbar scroll effect ─────────────────────────────────────────────────────
const nav = document.getElementById('mainNav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Auto-dismiss toasts ───────────────────────────────────────────────────────
document.querySelectorAll('.toast-item').forEach(t => {
  setTimeout(() => {
    t.style.transition = 'all 0.4s ease';
    t.style.opacity = '0';
    t.style.transform = 'translateX(110%)';
    setTimeout(() => t.remove(), 400);
  }, 4000);
});

// ── Dashboard sidebar navigation ──────────────────────────────────────────────
const dashNavItems = document.querySelectorAll('.dash-nav-item[data-section]');
const dashSections = document.querySelectorAll('.dash-panel');

dashNavItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.dataset.section;
    dashNavItems.forEach(i => i.classList.remove('active'));
    dashSections.forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    const panel = document.getElementById('panel-' + target);
    if (panel) panel.classList.add('active');
  });
});

// ── Reader functionality ───────────────────────────────────────────────────────
(function () {
  const readerBody = document.getElementById('readerBody');
  if (!readerBody) return;

  let fontSize = 17;
  const textEl = document.getElementById('readerText');
  const pctEl  = document.getElementById('readerPct');
  const progBar= document.getElementById('readerProgress');
  const themeBtn = document.getElementById('btnTheme');
  let theme = localStorage.getItem('reader-theme') || 'dark';

  function applyTheme(t) {
    readerBody.className = '';
    readerBody.classList.add('reader-page', 'reader-' + t);
    if (themeBtn) themeBtn.textContent = t === 'dark' ? '☀' : '☾';
    localStorage.setItem('reader-theme', t);
  }
  applyTheme(theme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      applyTheme(theme);
    });
  }

  const savedSize = parseInt(localStorage.getItem('reader-font')) || 17;
  fontSize = savedSize;
  if (textEl) textEl.style.fontSize = fontSize + 'px';

  document.getElementById('btnFontUp')?.addEventListener('click', () => {
    fontSize = Math.min(24, fontSize + 1);
    if (textEl) textEl.style.fontSize = fontSize + 'px';
    localStorage.setItem('reader-font', fontSize);
  });
  document.getElementById('btnFontDown')?.addEventListener('click', () => {
    fontSize = Math.max(13, fontSize - 1);
    if (textEl) textEl.style.fontSize = fontSize + 'px';
    localStorage.setItem('reader-font', fontSize);
  });

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0;
    if (pctEl)   pctEl.textContent = pct + '%';
    if (progBar) progBar.style.width = pct + '%';
  }, { passive: true });
})();

// ── Book detail tabs ───────────────────────────────────────────────────────────
document.querySelectorAll('.detail-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.detail-tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const content = document.getElementById('tab-' + target);
    if (content) content.classList.add('active');
  });
});

// ── Add to cart (AJAX) ────────────────────────────────────────────────────────
async function addToCart(bookId, btn) {
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
  try {
    const res  = await fetch(`/books/${bookId}/buy`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (data.success) {
      btn.innerHTML = '<i class="fas fa-check"></i> Added to Cart';
      btn.classList.add('in-cart');
      showToast('success', 'Added to cart!');
      setTimeout(() => { window.location.href = '/user/dashboard'; }, 1200);
    } else {
      btn.disabled = false;
      btn.innerHTML = orig;
      showToast('error', data.message || 'Could not add to cart.');
    }
  } catch {
    btn.disabled = false;
    btn.innerHTML = orig;
    showToast('error', 'Network error. Please try again.');
  }
}

function showToast(type, message) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = `toast-item ${type}`;
  t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'all 0.4s ease';
    t.style.opacity = '0';
    t.style.transform = 'translateX(110%)';
    setTimeout(() => t.remove(), 400);
  }, 3500);
}
