/*! btoast v0.1.0 - MIT */
// All comments must be in English

// Note: expects Bootstrap JS to be globally available (window.bootstrap)
// If you import Bootstrap via ESM too, make sure it runs before this.

const POS2CLASS = {
  'top-right':    ['position-fixed','top-0','end-0','p-3'],
  'top-left':     ['position-fixed','top-0','start-0','p-3'],
  'top-center':   ['position-fixed','top-0','start-50','translate-middle-x','p-3'],
  'bottom-right': ['position-fixed','bottom-0','end-0','p-3'],
  'bottom-left':  ['position-fixed','bottom-0','start-0','p-3'],
  'bottom-center':['position-fixed','bottom-0','start-50','translate-middle-x','p-3']
};

const VALID_VARIANTS = ['primary','secondary','success','info','warning','danger','dark','light'];

function ensureBootstrap() {
  if (!('bootstrap' in window) || !window.bootstrap || !window.bootstrap.Toast) {
    console.warn('[btoast] Bootstrap 5 JS not found. Please include bootstrap.bundle.min.js');
    return false;
  }
  return true;
}

const containers = new Map();

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
    delay: typeof o.delay === 'number' ? o.delay : 4000,
    dismissible: o.dismissible !== false,
    title: o.title || '',
    ariaLive: o.ariaLive || 'polite',
    variant
  };
}

const variantClass = (v) => `text-bg-${v}`;

function makeToastEl(text, o) {
  const hasHeader = !!o.title;
  const el = document.createElement('div');
  el.className = `toast ${variantClass(o.variant)} border-0`;
  el.setAttribute('role','alert');
  el.setAttribute('aria-live', o.ariaLive);
  el.setAttribute('aria-atomic','true');

  if (hasHeader) {
    el.innerHTML = `
      <div class="toast-header ${o.variant === 'light' ? '' : 'text-white-50'}">
        <strong class="me-auto">${o.title}</strong>
        ${o.dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>' : ''}
      </div>
      <div class="toast-body">${text}</div>
    `;
  } else {
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${text}</div>
        ${o.dismissible ? `<button type="button" class="btn-close ${o.variant === 'light' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>` : ''}
      </div>
    `;
  }
  return el;
}

export function show(text, options) {
  if (!ensureBootstrap()) return;
  const o = normalize(options);
  const container = getContainer(o.position);
  const el = makeToastEl(text, o);
  container.appendChild(el);

  const instance = new bootstrap.Toast(el, { autohide: o.autohide, delay: o.delay });
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

export const primary  = helpers('primary');
export const secondary= helpers('secondary');
export const success  = helpers('success');
export const info     = helpers('info');
export const warning  = helpers('warning');
export const danger   = helpers('danger');
export const dark     = helpers('dark');
export const light    = helpers('light');

export default { show, primary, secondary, success, info, warning, danger, dark, light };