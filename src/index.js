/*! btoast - MIT */
// All comments must be in English

const POS2CLASS = {
  'top-right':    ['position-fixed','top-0','end-0','p-3'],
  'top-left':     ['position-fixed','top-0','start-0','p-3'],
  'top-center':   ['position-fixed','top-0','start-50','translate-middle-x','p-3'],
  'bottom-right': ['position-fixed','bottom-0','end-0','p-3'],
  'bottom-left':  ['position-fixed','bottom-0','start-0','p-3'],
  'bottom-center':['position-fixed','bottom-0','start-50','translate-middle-x','p-3']
};

const VALID_VARIANTS = ['primary','secondary','success','info','warning','danger','dark','light'];
const containers = new Map();

function ensureBootstrap() {
  if (!('bootstrap' in window) || !window.bootstrap || !window.bootstrap.Toast) {
    console.warn('[btoast] Bootstrap 5 JS not found. Include bootstrap.bundle.min.js before using btoast.');
    return false;
  }
  return true;
}

function getContainer(pos) {
  const key = POS2CLASS[pos] ? pos : 'top-right';
  if (containers.has(key)) return containers.get(key);
  const div = document.createElement('div');
  div.className = POS2CLASS[key].join(' ');
  div.dataset.btPosition = key;
  document.body.appendChild(div);
  containers.set(key, div);
  return div;
}

function normalize(options) {
  const o = options || {};
  const variant = VALID_VARIANTS.includes(o.variant) ? o.variant : 'dark';
  return {
    id: o.id || `bt_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    position: o.position || 'top-right',
    autohide: o.autohide !== false,
    delay: typeof o.delay === 'number' ? o.delay : 4_000,
    dismissible: o.dismissible !== false,
    title: o.title || '',
    ariaLive: o.ariaLive || 'polite',
    variant,
    noIcon: !!o.noIcon,
    iconClass: o.iconClass || '',
    progressBar: !!o.progressBar,
    extendedDelay: typeof o.extendedDelay === 'number' ? o.extendedDelay : 1000,
    pauseOnHover: o.pauseOnHover !== false,
    preventDuplicates: !!o.preventDuplicates,
    dedupeKey: typeof o.dedupeKey === 'string' ? o.dedupeKey : '',
    onDuplicate: o.onDuplicate === 'ignore' ? 'ignore' : 'reshow',
    newestOnTop: !!o.newestOnTop,
    debug: !!o.debug,
    onClick: typeof o.onClick === 'function' ? o.onClick : null,
    dismissOnClick: o.dismissOnClick !== false,
    approveText: typeof o.approveText === 'string' ? o.approveText : '',
    denyText: typeof o.denyText === 'string' ? o.denyText : '',
    onApprove: typeof o.onApprove === 'function' ? o.onApprove : null,
    onDeny: typeof o.onDeny === 'function' ? o.onDeny : null
  };
}

// Helpers for color schemes
function textEmphasisClass(v){
  if (v === 'light') return 'text-body';
  if (v === 'dark') return 'text-dark-emphasis';
  return `text-${v}-emphasis`;
}
function subtleClasses(v){
  return `bg-${v}-subtle ${textEmphasisClass(v)}`;
}
function solidClasses(v){
  return `bg-${v} text-white`;
}

function computeKey(text, o){
  if (o.dedupeKey) return o.dedupeKey;
  const title = (o.title || '').trim();
  const body = (text || '').trim();
  return [o.variant, title, body, o.position].join('|');
}

// Attach a progress bar to the toast element if enabled
function attachProgress(el, o) {
  if (!o.progressBar || !o.autohide || !(o.delay > 0)) return null;

  const track = document.createElement('div');
  track.className = 'bt-progress-track bg-body-secondary';
  track.style.height = '2px';
  track.style.width = '100%';
  track.style.opacity = '0.6';

  const fill = document.createElement('div');
  fill.className = `bt-progress-fill bg-${o.variant}`;
  fill.style.height = '2px';
  fill.style.width = '100%';

  track.appendChild(fill);
  el.appendChild(track);

  let rafId = 0;
  let start = 0;
  let duration = 0;

  function frame(now) {
    const elapsed = now - start;
    const remaining = Math.max(0, 1 - (elapsed / duration));
    fill.style.width = (remaining * 100).toFixed(2) + '%';
    if (remaining > 0) rafId = requestAnimationFrame(frame);
  }

  function reset(newDuration) {
    if (rafId) cancelAnimationFrame(rafId);
    duration = Math.max(1, newDuration);
    start = performance.now();
    fill.style.width = '100%';
    rafId = requestAnimationFrame(frame);
  }

  function pause() {
    if (!rafId) return 0;
    const now = performance.now();
    const elapsed = now - start;
    const remainingMs = Math.max(0, duration - elapsed);
    cancelAnimationFrame(rafId);
    rafId = 0;
    return remainingMs;
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  el.addEventListener('hidden.bs.toast', stop, { once: true });

  // kick off initial run
  reset(o.delay);

  return { reset, pause, stop };
}

function makeToastEl(text, o) {
  const hasHeader = !!o.title;
  const showIcon = !o.noIcon;
  const effectiveIconClass = showIcon ? (o.iconClass || `btoast-${o.variant}-icon`) : '';
  const mode = (hasHeader && showIcon) ? 'title-icon' : (showIcon ? 'icon' : 'message');

  const actionsHtml = (o.onApprove || o.onDeny || o.approveText || o.denyText)
    ? `<div class="mt-2 d-flex gap-2 justify-content-end bt-actions">
         ${ (o.onDeny || o.denyText) ? `<button type="button" class="btn btn-sm btn-outline-secondary bt-action-deny">${o.denyText || 'Deny'}</button>` : ''}
         ${ (o.onApprove || o.approveText) ? `<button type="button" class="btn btn-sm btn-primary bt-action-approve">${o.approveText || 'Approve'}</button>` : ''}
       </div>`
    : '';

  const el = document.createElement('div');
  // base toast shell
  el.className = `toast border-0 rounded-3 shadow-sm overflow-hidden`;
  el.setAttribute('role','alert');
  el.setAttribute('aria-live', o.ariaLive);
  el.setAttribute('aria-atomic','true');

  // MODE: message (single row, subtle body)
  if (mode === 'message') {
    el.classList.add(...subtleClasses(o.variant).split(' '));
    el.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="toast-body flex-grow-1">${text}${actionsHtml}</div>
        ${o.dismissible ? `<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>` : ''}
      </div>
    `;
    return el;
  }

  // MODE: icon (single row, left rail with solid color)
  if (mode === 'icon') {
    el.classList.add(...subtleClasses(o.variant).split(' '));
    const rail = `
      <div class="d-flex align-items-center justify-content-center px-3 py-2 ${solidClasses(o.variant)}">
        ${showIcon ? `<span class="bt-icon ${effectiveIconClass}"></span>` : ''}
      </div>`;
    el.innerHTML = `
      <div class="d-flex align-items-stretch">
        ${rail}
        <div class="toast-body flex-grow-1">${text}${actionsHtml}</div>
        ${o.dismissible ? `<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>` : ''}
      </div>
    `;
    return el;
  }

  // MODE: title-icon (header row with icon + title, body row for message)
  if (mode === 'title-icon') {
    const closeBtn = o.dismissible
      ? `<button type="button" class="btn-close ${o.variant === 'light' ? '' : 'btn-close-white'}" data-bs-dismiss="toast" aria-label="Close"></button>`
      : '';

    const headerCls = `${solidClasses(o.variant)} border-0`;
    const bodyCls = `${subtleClasses(o.variant)}`;

    el.innerHTML = `
      <div class="toast-header ${headerCls}">
        ${showIcon ? `<span class="me-2 d-inline-flex align-items-center bt-icon ${effectiveIconClass}"></span>` : ''}
        <strong class="me-auto">${o.title || ''}</strong>
        ${closeBtn}
      </div>
      <div class="toast-body ${bodyCls}">${text}${actionsHtml}</div>
    `;
    return el;
  }

  // Fallback: original header/body structure (no special theming)
  // This branch keeps backward compatibility if someone passes title without mode
  el.classList.add(...subtleClasses(o.variant).split(' '));
  el.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="toast-body flex-grow-1">${text}</div>
      ${o.dismissible ? '<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' : ''}
    </div>
  `;
  return el;
}

export function show(text, options) {
  if (!ensureBootstrap()) return;
  const o = normalize(options);
  const inferredMode = (o.title && !o.noIcon) ? 'title-icon' : (!o.title && !o.noIcon ? 'icon' : 'message');
  const container = getContainer(o.position);

  // Prevent Duplicates
  const key = computeKey(text, o);
  if (o.preventDuplicates) {
    const existing = Array.from(container.querySelectorAll('.toast')).find(t => t.dataset && t.dataset.btKey === key);
    if (existing) {
      const existingInstance = bootstrap.Toast.getOrCreateInstance(existing);
      if (o.onDuplicate === 'reshow') existingInstance.show();
      return {
        id: existing.id || key,
        el: existing,
        hide: () => existingInstance.hide(),
        dispose: () => { existingInstance.dispose(); existing.remove(); }
      };
    }
  }

  const el = makeToastEl(text, o);
  el.dataset.btKey = key;
  if (o.newestOnTop && container.firstChild) {
    container.insertBefore(el, container.firstChild);
  } else {
    container.appendChild(el);
  }
  // Click behavior (body/header/rail); ignore native close button
  el.addEventListener('click', (evt) => {
    const target = evt.target;
    // If the click originated from a close button or action buttons, let Bootstrap handle it
    if (target.closest && (target.closest('.btn-close') || target.closest('.bt-actions'))) return;
    if (typeof o.onClick === 'function') {
      try { o.onClick(evt, { id: o.id, el }); } catch (_) { /* no-op */ }
    }
    if (o.dismissOnClick) {
      const inst = bootstrap.Toast.getOrCreateInstance(el);
      inst.hide();
    }
  });
  const manageAuto = o.autohide && (o.pauseOnHover || (o.extendedDelay > 0));
  const instance = new bootstrap.Toast(el, { autohide: manageAuto ? false : o.autohide, delay: o.delay });
  const progressCtrl = attachProgress(el, o);

  // Wire approve/deny actions if present
  const ctx = {
    id: o.id,
    el,
    instance,
    close: () => instance.hide(),
    hide: () => instance.hide(),
    dispose: () => { instance.dispose(); el.remove(); }
  };
  const approveBtn = el.querySelector('.bt-action-approve');
  if (approveBtn) {
    approveBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      try { if (typeof o.onApprove === 'function') o.onApprove.call(ctx, evt, ctx); } catch(_) {}
      return true; // explicit true per requirement
    });
  }
  const denyBtn = el.querySelector('.bt-action-deny');
  if (denyBtn) {
    denyBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      try { if (typeof o.onDeny === 'function') o.onDeny.call(ctx, evt, ctx); } catch(_) {}
      return false; // explicit false per requirement
    });
  }

  if (manageAuto) {
    let hideTid = 0;
    function startHide(ms) {
      if (hideTid) clearTimeout(hideTid);
      hideTid = setTimeout(() => instance.hide(), Math.max(0, ms));
      if (progressCtrl) progressCtrl.reset(ms);
    }

    // Start initial countdown
    startHide(o.delay);

    if (o.pauseOnHover) {
      el.addEventListener('mouseenter', () => {
        if (hideTid) { clearTimeout(hideTid); hideTid = 0; }
        if (progressCtrl) progressCtrl.pause();
      });
      el.addEventListener('mouseleave', () => {
        const ext = typeof o.extendedDelay === 'number' ? o.extendedDelay : 1000;
        startHide(ext);
      });
    }
  }

  instance.show();
  if (o.debug) {
    const payload = {
      toastId: o.id,
      state: 'visible',
      startTime: new Date(),
      options: { ...o, onClick: o.onClick ? '[Function]' : null },
      map: {
        variant: o.variant,
        position: o.position,
        mode: inferredMode,
        classes: {
          container: container.className,
          toast: el.className
        }
      }
    };
    // expose for quick devtools inspection
    el.__btoastDebug = payload;
    try { console.log(payload); } catch (_) {}
  }
  el.addEventListener('hidden.bs.toast', () => el.remove(), { once: true });

  return {
    id: o.id,
    el,
    hide: () => instance.hide(),
    dispose: () => { instance.dispose(); el.remove(); }
  };
}

const helpers = (variant) => (text, o) => show(text, { ...(o||{}), variant });

export const primary   = helpers('primary');
export const secondary = helpers('secondary');
export const success   = helpers('success');
export const info      = helpers('info');
export const warning   = helpers('warning');
export const danger    = helpers('danger');
export const dark      = helpers('dark');
export const light     = helpers('light');

const api = { show, primary, secondary, success, info, warning, danger, dark, light };
export default api;