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

  const metaEl = document.getElementById('readerMeta');
  const bookId = metaEl?.dataset?.bookId;
  const hasFullAccess = metaEl?.dataset?.hasFullAccess === '1';
  const previewPercent = Number(metaEl?.dataset?.previewPercent || 12);
  const initialProgress = Number(metaEl?.dataset?.initialProgress || 0);
  const initialScroll = Number(metaEl?.dataset?.initialScroll || 0);

  let fontSize = 17;
  const textEl = document.getElementById('readerText');
  const pctEl  = document.getElementById('readerPct');
  const progBar= document.getElementById('readerProgress');
  const themeBtn = document.getElementById('btnTheme');
  let theme = localStorage.getItem('reader-theme') || 'dark';
  let saveTimer = null;
  let lastSavedProgress = -1;

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

  function updateProgressUI(pct) {
    const boundedPct = Math.max(0, Math.min(100, pct));
    if (pctEl) pctEl.textContent = boundedPct + '%';
    if (progBar) progBar.style.width = boundedPct + '%';
  }

  function getScrollProgress() {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const rawPct = total > 0 ? Math.round((scrolled / total) * 100) : 0;
    return hasFullAccess ? rawPct : Math.min(rawPct, previewPercent);
  }

  async function saveProgress(force = false) {
    if (!bookId) return;

    const progressPercent = getScrollProgress();
    if (!force && progressPercent === lastSavedProgress) return;

    lastSavedProgress = progressPercent;
    try {
      await fetch(`/books/${bookId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressPercent,
          scrollPosition: Math.max(0, Math.round(window.scrollY || 0))
        })
      });
    } catch (_err) {
      // Ignore transient save failures on client and retry on next scroll.
    }
  }

  function queueSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveProgress(false);
    }, 800);
  }

  updateProgressUI(initialProgress);

  if (initialScroll > 0) {
    setTimeout(() => {
      window.scrollTo({ top: initialScroll, behavior: 'auto' });
      updateProgressUI(getScrollProgress());
    }, 120);
  }

  window.addEventListener('scroll', () => {
    updateProgressUI(getScrollProgress());
    queueSave();
  }, { passive: true });

  window.addEventListener('beforeunload', () => {
    saveProgress(true);
  });
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

// ── Wishlist toggle ──────────────────────────────────────────────────────────
async function toggleWishlist(bookId, btn) {
  if (!btn) return;

  const originalHtml = btn.innerHTML;
  btn.disabled = true;

  try {
    const res = await fetch(`/wishlist/toggle/${bookId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Could not update wishlist');
    }

    const isAdded = data.action === 'added';
    const label = isAdded ? 'Saved to wishlist' : 'Save to wishlist';
    const heartClass = isAdded ? 'wishlist-active' : '';

    document.querySelectorAll(`[data-wishlist-book="${bookId}"]`).forEach((node) => {
      node.innerHTML = `<i class="fas fa-heart ${heartClass}"></i> ${label}`;
    });

    showToast('success', data.message || label);
    if (!isAdded && window.location.pathname === '/wishlist') {
      setTimeout(() => window.location.reload(), 350);
    }
  } catch (err) {
    btn.innerHTML = originalHtml;
    showToast('error', err.message || 'Could not update wishlist');
  } finally {
    btn.disabled = false;
  }
}

// ── Razorpay Checkout ────────────────────────────────────────────────────────
async function startCheckout(btn) {
  if (!btn) return;

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Order...';

  let bookIds = [];
  try {
    const raw = btn.dataset.bookIds || '[]';
    bookIds = JSON.parse(raw);
  } catch (_err) {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    showToast('error', 'Invalid cart data. Please refresh and try again.');
    return;
  }

  try {
    const orderRes = await fetch('/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ bookIds })
    });

    const orderType = orderRes.headers.get('content-type') || '';
    if (!orderType.includes('application/json')) {
      throw new Error('Session expired. Please login again.');
    }

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.success) {
      throw new Error(orderData.message || 'Could not create order');
    }

    if (typeof window.Razorpay !== 'function') {
      throw new Error('Razorpay SDK failed to load');
    }

    const options = {
      key: orderData.key,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: 'BookHaven',
      description: `Purchase ${orderData.books.length} book(s)`,
      order_id: orderData.order.id,
      method: {
        upi: true,
        netbanking: true,
        card: true,
        wallet: true,
        paylater: false
      },
      international: false,
      handler: async function (response) {
        try {
          console.log('Razorpay response received:', response);

          const verifyRes = await fetch('/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify(response)
          });

          console.log('Verify response status:', verifyRes.status);

          const verifyType = verifyRes.headers.get('content-type') || '';
          if (!verifyType.includes('application/json')) {
            throw new Error('Session expired. Please login again.');
          }

          const verifyData = await verifyRes.json();
          console.log('Verify response data:', verifyData);

          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.message || 'Payment verification failed');
          }

          showToast('success', 'Payment successful. Books unlocked!');
          setTimeout(() => {
            window.location.href = '/user/dashboard';
          }, 900);
        } catch (err) {
          showToast('error', err.message || 'Payment verification failed');
          btn.disabled = false;
          btn.innerHTML = originalHtml;
        }
      },
      theme: {
        color: '#c9a45c'
      },
      modal: {
        ondismiss: function () {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function () {
      showToast('error', 'Payment failed. Please try again.');
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    });
    rzp.open();
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    showToast('error', err.message || 'Checkout failed. Please try again.');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  DARK / LIGHT MODE TOGGLE
// ══════════════════════════════════════════════════════════════════════════════
(function () {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  if (!themeToggle) return;

  function applyGlobalTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('bh-theme', t);
    if (themeIcon) {
      themeIcon.className = t === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }

  // Apply saved theme
  const saved = localStorage.getItem('bh-theme') || 'dark';
  applyGlobalTheme(saved);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyGlobalTheme(current === 'dark' ? 'light' : 'dark');
  });
})();

// ══════════════════════════════════════════════════════════════════════════════
//  SEARCH AUTOCOMPLETE
// ══════════════════════════════════════════════════════════════════════════════
(function () {
  const input = document.getElementById('navSearchInput');
  const dropdown = document.getElementById('autocompleteDropdown');
  if (!input || !dropdown) return;

  let timer = null;
  let activeIndex = -1;

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      dropdown.style.display = 'none';
      return;
    }
    timer = setTimeout(() => fetchSuggestions(q), 300);
  });

  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (!items.length || dropdown.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActive(items);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex]?.click();
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      activeIndex = -1;
    }
  });

  function updateActive(items) {
    items.forEach((it, i) => it.classList.toggle('active', i === activeIndex));
  }

  async function fetchSuggestions(q) {
    try {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      const books = await res.json();
      if (!books.length) {
        dropdown.style.display = 'none';
        return;
      }

      dropdown.innerHTML = books.map(b => `
        <div class="autocomplete-item" onclick="location.href='/books/${b.id}'">
          <img src="${b.cover || ''}" alt="" onerror="this.style.display='none'">
          <div class="autocomplete-item-info">
            <div class="autocomplete-item-title">${escHtml(b.title)}</div>
            <div class="autocomplete-item-author">${escHtml(b.author)}</div>
          </div>
          <span class="autocomplete-item-price">₹${b.price}</span>
        </div>
      `).join('');
      dropdown.style.display = 'block';
      activeIndex = -1;
    } catch {
      dropdown.style.display = 'none';
    }
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) {
      dropdown.style.display = 'none';
      activeIndex = -1;
    }
  });
})();

// ══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATION SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
(function () {
  const bellBtn = document.getElementById('notifBellBtn');
  const badge = document.getElementById('notifBadge');
  const dropdownEl = document.getElementById('notifDropdown');
  const listEl = document.getElementById('notifList');
  const markReadBtn = document.getElementById('notifMarkRead');

  if (!bellBtn) return;

  // Fetch unread count on page load
  fetchNotifCount();

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dropdownEl.style.display !== 'none';
    if (isVisible) {
      dropdownEl.style.display = 'none';
    } else {
      dropdownEl.style.display = 'block';
      loadNotifications();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notifBellWrap')) {
      dropdownEl.style.display = 'none';
    }
  });

  if (markReadBtn) {
    markReadBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/notifications/read-all', { method: 'POST', headers: { 'Accept': 'application/json' } });
        badge.style.display = 'none';
        badge.textContent = '0';
        document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
        showToast('success', 'All notifications marked as read');
      } catch { /* ignore */ }
    });
  }

  async function fetchNotifCount() {
    try {
      const res = await fetch('/api/notifications/count', { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.success && data.unreadCount > 0) {
        badge.textContent = data.unreadCount > 9 ? '9+' : data.unreadCount;
        badge.style.display = 'grid';
      } else {
        badge.style.display = 'none';
      }
    } catch { /* ignore */ }
  }

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications', { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (!data.success || !data.notifications.length) {
        listEl.innerHTML = '<div class="notif-empty">No notifications yet</div>';
        return;
      }

      listEl.innerHTML = data.notifications.map(n => {
        const iconClass = {
          purchase: 'ni-purchase', new_book: 'ni-new-book',
          welcome: 'ni-welcome', system: 'ni-system', price_drop: 'ni-system'
        }[n.type] || 'ni-system';
        const iconChar = {
          purchase: '✅', new_book: '📚', welcome: '🎉', system: '🔔', price_drop: '💰'
        }[n.type] || '🔔';
        const timeAgo = getTimeAgo(new Date(n.createdAt));

        return `
          <div class="notif-item ${n.read ? '' : 'unread'}" onclick="${n.link ? `location.href='${n.link}'` : ''}">
            <div class="notif-item-icon ${iconClass}">${iconChar}</div>
            <div class="notif-item-content">
              <div class="notif-item-title">${escHtml(n.title)}</div>
              <div class="notif-item-msg">${escHtml(n.message)}</div>
              <div class="notif-item-time">${timeAgo}</div>
            </div>
          </div>
        `;
      }).join('');
    } catch {
      listEl.innerHTML = '<div class="notif-empty">Could not load notifications</div>';
    }
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function getTimeAgo(date) {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 604800) return Math.floor(s / 86400) + 'd ago';
    return date.toLocaleDateString();
  }
})();

// ══════════════════════════════════════════════════════════════════════════════
//  MULTI-LANGUAGE (i18n)
// ══════════════════════════════════════════════════════════════════════════════
(function () {
  const langToggle = document.getElementById('langToggle');
  const langLabel = document.getElementById('langLabel');
  if (!langToggle) return;

  let currentLang = localStorage.getItem('bh-lang') || 'en';
  let translations = {};

  async function loadLang(lang) {
    try {
      const res = await fetch(`/locales/${lang}.json`);
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  }

  function applyTranslations(t) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key]) el.setAttribute('placeholder', t[key]);
    });
  }

  function updateLangLabel() {
    if (langLabel) langLabel.textContent = currentLang === 'en' ? 'EN' : 'हि';
  }

  // Load and apply on page load
  updateLangLabel();
  if (currentLang !== 'en') {
    loadLang(currentLang).then(t => {
      translations = t;
      applyTranslations(t);
    });
  }

  langToggle.addEventListener('click', async () => {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    localStorage.setItem('bh-lang', currentLang);
    updateLangLabel();

    if (currentLang === 'en') {
      // Reload page to get original English from EJS
      window.location.reload();
    } else {
      translations = await loadLang(currentLang);
      applyTranslations(translations);
    }
  });
})();

// ══════════════════════════════════════════════════════════════════════════════
//  ADD TO READING LIST (used on book detail page)
// ══════════════════════════════════════════════════════════════════════════════
async function addToReadingList(listId, bookId) {
  try {
    const res = await fetch(`/lists/${listId}/add/${bookId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast('success', data.message);
    } else {
      showToast('error', data.message || 'Could not add to list');
    }
  } catch {
    showToast('error', 'Network error');
  }
}
