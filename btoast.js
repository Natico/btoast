/*! btoast v0.1.0 - MIT */
// All comments must be in English
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);           // AMD
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();    // CommonJS
  } else {
    root.btoast = factory();       // Browser global
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Position to Bootstrap utility classes
  var POS2CLASS = {
    'top-right':    ['position-fixed','top-0','end-0','p-3'],
    'top-left':     ['position-fixed','top-0','start-0','p-3'],
    'top-center':   ['position-fixed','top-0','start-50','translate-middle-x','p-3'],
    'bottom-right': ['position-fixed','bottom-0','end-0','p-3'],
    'bottom-left':  ['position-fixed','bottom-0','start-0','p-3'],
    'bottom-center':['position-fixed','bottom-0','start-50','translate-middle-x','p-3']
  };

  var VALID_VARIANTS = ['primary','secondary','success','info','warning','danger','dark','light'];

  function ensureBootstrap() {
    if (!('bootstrap' in window) || !window.bootstrap || !window.bootstrap.Toast) {
      console.warn('[btoast] Bootstrap 5 JS not found. Please include bootstrap.bundle.min.js');
      return false;
    }
    return true;
  }

  var containers = new Map();

  function getContainer(pos) {
    var key = POS2CLASS[pos] ? pos : 'top-right';
    if (containers.has(key)) return containers.get(key);
    var div = document.createElement('div');
    div.className = POS2CLASS[key].join(' ');
    div.dataset.btPosition = key;
    document.body.appendChild(div);
    containers.set(key, div);
    return div;
  }

  function normalize(options) {
    var o = options || {};
    var variant = VALID_VARIANTS.indexOf(o.variant) > -1 ? o.variant : 'dark';
    return {
      id: o.id || ('bt_' + Date.now() + '_' + Math.random().toString(36).slice(2,7)),
      position: o.position || 'top-right',
      autohide: o.autohide !== false,               // default true
      delay: typeof o.delay === 'number' ? o.delay : 4000,
      dismissible: o.dismissible !== false,         // default true
      title: o.title || '',                         // optional
      ariaLive: o.ariaLive || 'polite',
      variant: variant
    };
  }

  function variantClass(v) {
    // Bootstrap 5.3 utility that sets background + legible text
    return 'text-bg-' + v;
  }

  function makeToastEl(text, o) {
    var hasHeader = !!o.title;
    var el = document.createElement('div');
    el.className = 'toast ' + variantClass(o.variant) + ' border-0';
    el.setAttribute('role','alert');
    el.setAttribute('aria-live', o.ariaLive);
    el.setAttribute('aria-atomic','true');

    if (hasHeader) {
      el.innerHTML =
        '<div class="toast-header ' + (o.variant === 'light' ? '' : 'text-white-50') + '">' +
          '<strong class="me-auto">' + o.title + '</strong>' +
          (o.dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>' : '') +
        '</div>' +
        '<div class="toast-body">' + text + '</div>';
    } else {
      el.innerHTML =
        '<div class="d-flex">' +
          '<div class="toast-body">' + text + '</div>' +
          (o.dismissible ? '<button type="button" class="btn-close ' + (o.variant === 'light' ? '' : 'btn-close-white') + ' me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' : '') +
        '</div>';
    }

    return el;
  }

  function show(text, options) {
    if (!ensureBootstrap()) return;
    var o = normalize(options);
    var container = getContainer(o.position);
    var el = makeToastEl(text, o);
    container.appendChild(el);

    var instance = new bootstrap.Toast(el, { autohide: o.autohide, delay: o.delay });
    instance.show();
    el.addEventListener('hidden.bs.toast', function () {
      // Clean up DOM node
      el.remove();
    }, { once: true });

    return {
      id: o.id,
      el: el,
      hide: function(){ instance.hide(); },
      dispose: function(){ instance.dispose(); el.remove(); }
    };
  }

  function withVariant(variant) {
    return function (text, options) {
      var o = options || {};
      o.variant = variant;
      return show(text, o);
    };
  }

  var api = {
    // Core
    show: show,
    // Toastr-like helpers
    primary:  withVariant('primary'),
    secondary:withVariant('secondary'),
    success:  withVariant('success'),
    info:     withVariant('info'),
    warning:  withVariant('warning'),
    danger:   withVariant('danger'),
    dark:     withVariant('dark'),
    light:    withVariant('light')
  };

  return api;
}));