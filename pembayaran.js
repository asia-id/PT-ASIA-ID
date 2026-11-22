/* pembayaran.js — pilihan metode pembayaran setelah klik Beli / Checkout / Ambil paket.
   Hanya QRIS yang aktif; e-wallet lain tampil abu-abu (maintenance).
   File ini terpisah dari index.html, jadi hash CSP skrip inline di index.html tidak berubah. */
(function () {
  'use strict';

  /* ===== Daftar metode. Ubah status ke 'aktif' bila sudah siap dipakai. ===== */
  const METODE = [
    { id: 'qris',      nama: 'QRIS',      ket: 'Bayar dari semua e-wallet & mobile banking', logo: 'logo/qris.svg',      status: 'aktif' },
    { id: 'dana',      nama: 'DANA',      logo: 'logo/dana.svg',      status: 'maintenance' },
    { id: 'gopay',     nama: 'GoPay',     logo: 'logo/gopay.svg',     status: 'maintenance' },
    { id: 'ovo',       nama: 'OVO',       logo: 'logo/ovo.svg',       status: 'maintenance' },
    { id: 'shopeepay', nama: 'ShopeePay', logo: 'logo/shopeepay.svg', status: 'maintenance' },
    { id: 'linkaja',   nama: 'LinkAja',   logo: 'logo/linkaja.svg',   status: 'maintenance' },
    { id: 'isaku',     nama: 'iSaku',     logo: 'logo/isaku.svg',     status: 'maintenance' }
  ];

  /* true  = klik Beli langsung masuk ke QRIS (sheet pilih metode dilewati)
     false = tampilkan sheet pilih metode pembayaran dulu */
  const LANGSUNG_QRIS = true;

  /* Tombol yang dicegat: Beli, Checkout (keranjang), Ambil paket, Ambil paket (promo) */
  const TARGET = 'button[data-buy],button[data-co],button[data-paket],button[data-bundle]';
  const ATTR = ['data-buy', 'data-co', 'data-paket', 'data-bundle'];

  let sheet = null, noteEl = null, sumEl = null, pending = null, allow = false;

  const $ = (s) => document.querySelector(s);
  function el(tag, cls, txt) {
    const x = document.createElement(tag);
    if (cls) x.className = cls;
    if (txt != null) x.textContent = txt;
    return x;
  }

  function logo(m) {
    const w = el('span', 'pay-logo');
    const i = new Image();
    i.alt = ''; i.decoding = 'async'; i.draggable = false; i.src = m.logo;
    i.addEventListener('error', () => { w.textContent = m.nama; w.classList.add('fb'); });
    w.appendChild(i);
    return w;
  }

  function bangun() {
    sheet = el('div', 'sheet');
    sheet.id = 'm-bayar';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'payT');

    const inn = el('div', 'in');
    const x = el('button', 'x', '×');
    x.setAttribute('data-close', '');
    x.setAttribute('aria-label', 'Tutup');
    const h = el('h3', null, 'Pilih metode pembayaran');
    h.id = 'payT';
    sumEl = el('div', 'pay-sum');
    inn.append(x, h, sumEl);

    /* QRIS (aktif) */
    inn.appendChild(el('div', 'pay-sec', 'Tersedia'));
    const q = METODE.find((m) => m.status === 'aktif');
    if (q) {
      const b = el('button', 'pay-qris');
      b.type = 'button';
      b.setAttribute('data-pay', q.id);
      const t = el('span', 'pay-txt');
      t.append(el('b', null, q.nama), el('small', null, q.ket || ''));
      b.append(logo(q), t, el('span', 'pay-tag ok', 'Tersedia'));
      inn.appendChild(b);
    }

    /* E-wallet lain (maintenance, abu-abu) */
    inn.appendChild(el('div', 'pay-sec', 'E-wallet · sedang maintenance'));
    const g = el('div', 'pay-grid');
    METODE.filter((m) => m.status !== 'aktif').forEach((m) => {
      const c = el('div', 'pay-mt');
      c.setAttribute('role', 'button');
      c.setAttribute('aria-disabled', 'true');
      c.tabIndex = 0;
      c.dataset.mt = m.nama;
      c.append(logo(m), el('b', null, m.nama), el('span', 'pay-tag', 'Maintenance'));
      g.appendChild(c);
    });
    inn.appendChild(g);

    noteEl = el('p', 'pay-note', 'Pilih QRIS untuk melanjutkan pembayaran.');
    noteEl.setAttribute('role', 'status');
    inn.appendChild(noteEl);

    sheet.appendChild(inn);
    document.body.appendChild(sheet);

    sheet.addEventListener('click', (e) => {
      const pay = e.target.closest('[data-pay]');
      if (pay) return lanjut();
      const mt = e.target.closest('.pay-mt');
      if (mt) peringatan(mt.dataset.mt);
    });
    sheet.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const mt = e.target.closest('.pay-mt');
      if (mt) { e.preventDefault(); peringatan(mt.dataset.mt); }
    });
  }

  function peringatan(nama) {
    noteEl.textContent = nama + ' sedang maintenance. Silakan bayar dengan QRIS.';
    noteEl.classList.add('warn');
    sheet.classList.remove('pay-sheet-shake'); void sheet.offsetWidth; sheet.classList.add('pay-sheet-shake');
  }

  /* Ringkasan nama & harga dari kartu tempat tombol berada */
  function ringkasan(btn) {
    const box = btn.closest('.prod,.struk,.row.card');
    sumEl.textContent = '';
    if (!box) return;
    let nama = '';
    const jd = box.querySelector('h3,h2');
    if (jd) nama = jd.textContent;
    else {
      const sp = box.querySelector('span');
      if (sp) {
        const c = sp.cloneNode(true);
        c.querySelectorAll('.harga,small,br').forEach((n) => n.remove());
        nama = c.textContent;
      }
    }
    const hg = box.querySelector('.harga');
    nama = nama.replace(/\s+/g, ' ').trim();
    if (!nama && !hg) return;
    sumEl.append(el('span', null, nama || 'Pesanan'), el('b', null, hg ? hg.textContent.trim() : ''));
  }

  function buka(btn) {
    if (!sheet) bangun();
    const a = ATTR.find((k) => btn.hasAttribute(k));
    pending = { attr: a, val: btn.getAttribute(a), node: btn };
    ringkasan(btn);
    noteEl.textContent = 'Pilih QRIS untuk melanjutkan pembayaran.';
    noteEl.classList.remove('warn');
    sheet.classList.remove('pay-sheet-shake');
    sheet.classList.add('open');
    const ov = $('#ov'); if (ov) ov.classList.add('open');
    const q = sheet.querySelector('[data-pay]'); if (q) q.focus({ preventScroll: true });
  }

  function tutup() {
    if (sheet) sheet.classList.remove('open');
    const ov = $('#ov');
    if (ov && !document.documentElement.classList.contains('toslock')) ov.classList.remove('open');
  }

  /* QRIS dipilih: tutup sheet lalu jalankan klik asli supaya alur QRIS di index.html berjalan seperti biasa */
  function lanjut() {
    const p = pending; pending = null;
    tutup();
    if (!p) return;
    let t = null;
    try { t = document.querySelector('button[' + p.attr + (p.val ? '="' + CSS.escape(p.val) + '"' : '') + ']'); } catch (e) { /* abaikan */ }
    t = t || p.node;
    if (!t || t.disabled) return;
    allow = true;
    try { t.click(); } finally { allow = false; }
  }

  /* Fase capture: berjalan sebelum handler klik milik index.html */
  document.addEventListener('click', (e) => {
    if (allow || LANGSUNG_QRIS) return;
    const t = e.target instanceof Element ? e.target.closest(TARGET) : null;
    if (!t || t.disabled) return;
    if (document.documentElement.classList.contains('toslock')) return; /* popup S&K masih terkunci */
    e.preventDefault();
    e.stopImmediatePropagation();
    buka(t);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet && sheet.classList.contains('open')) tutup();
  });

  /* ===== Foto produk: latar blur dari foto itu sendiri, foto tampil utuh di depannya ===== */
  function foto() {
    document.querySelectorAll('#produkList .ico').forEach((b) => {
      const img = b.querySelector('img');
      const src = img ? img.getAttribute('src') || '' : '';
      if (/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+\/]+=*$/.test(src)) {
        if (b.dataset.fs !== String(src.length)) {
          b.style.setProperty('--foto', 'url("' + src + '")');
          b.dataset.fs = String(src.length);
        }
        b.classList.add('has-foto');
      } else {
        b.classList.remove('has-foto');
        b.style.removeProperty('--foto');
        delete b.dataset.fs;
      }
    });
  }
  function pantau() {
    const list = $('#produkList');
    if (!list) return;
    foto();
    new MutationObserver(foto).observe(list, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pantau);
  else pantau();
})();
