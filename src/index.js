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
    progressBar: !!o.progressBar
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

// Attach a progress bar to the toast element if enabled
function attachProgress(el, o, instance) {
  if (!o.progressBar || !o.autohide || !(o.delay > 0)) return;

  // Create track and fill using Bootstrap utility backgrounds
  const track = document.createElement('div');
  track.className = 'bt-progress-track bg-body-secondary';
  track.style.height = '2px';
  track.style.width = '100%';
  track.style.opacity = '0.6';

  const fill = document.createElement('div');
  fill.className = `bt-progress-fill bg-${o.variant}`; // colored fill
  fill.style.height = '2px';
  fill.style.width = '100%';

  track.appendChild(fill);
  el.appendChild(track);

  let rafId = 0;
  const start = performance.now();
  const total = Math.max(1, o.delay);

  function step(now) {
    const elapsed = now - start;
    const remaining = Math.max(0, 1 - (elapsed / total));
    fill.style.width = (remaining * 100).toFixed(2) + '%';
    if (remaining > 0) {
      rafId = requestAnimationFrame(step);
    }
  }

  rafId = requestAnimationFrame(step);

  // Cleanup when the toast hides/disposes
  const cleanup = () => { if (rafId) cancelAnimationFrame(rafId); };
  el.addEventListener('hidden.bs.toast', cleanup, { once: true });
}

function makeToastEl(text, o) {
  const hasHeader = !!o.title;
  const showIcon = !o.noIcon;
  const effectiveIconClass = showIcon ? (o.iconClass || `btoast-${o.variant}-icon`) : '';
  const mode = (hasHeader && showIcon) ? 'title-icon' : (showIcon ? 'icon' : 'message');

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
        <div class="toast-body flex-grow-1">${text}</div>
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
        <div class="toast-body flex-grow-1">${text}</div>
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
      <div class="toast-body ${bodyCls}">${text}</div>
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
  const container = getContainer(o.position);
  const el = makeToastEl(text, o);
  container.appendChild(el);
  // Attach progress bar if needed
  const instance = new bootstrap.Toast(el, { autohide: o.autohide, delay: o.delay });
  attachProgress(el, o, instance);
  instance.show();
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