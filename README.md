# btoast-js

A tiny wrapper around **Bootstrap 5 Toasts** that makes them feel like toastr—zero jQuery, supports **UMD & ESM**, and comes with optional Sass/CSS for icons and tidy spacing.

> Works wherever Bootstrap 5 CSS + JS (bundle) are available.

---

## ✨ Features
- **Simple API**: `btoast.success('Saved!')` and friends.
- **Automatic layout**: inferred from the presence of `title` and `icon` settings.
  - *message* → subtle body
  - *icon* → solid side rail + subtle body
  - *title-icon* → solid header (icon + title) + subtle body
- **Icons by class**: built‑in defaults (`.btoast-success-icon`, etc.) or your own via `iconClass`. Disable with `noIcon`.
- **Actions**: `approve/deny` buttons with `onApprove/onDeny` callbacks (with `this` bound to the toast context: `this.close()`/`this.dispose()`).
- **Click behaviors**: `onClick`, `dismissOnClick`.
- **Timing**: `delay`, `autohide`, **progress bar**, `pauseOnHover`, `extendedDelay`.
- **Duplicates**: `preventDuplicates`, `dedupeKey`, `onDuplicate: 'reshow'|'ignore'`.
- **Ordering**: `newestOnTop`.
- **Debug**: opt‑in console payload (`debug: true`).
- **No jQuery**, minimal footprint.

---

## 📦 Install

**Via npm (recommended for apps/bundlers):**
```bash
npm i btoast-js
```

**Via CDN (UMD build):**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/btoast-js/dist/btoast.css">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/btoast-js/dist/btoast.umd.js"></script>
```
> Replace versions as needed. Bootstrap **bundle** is required (for Toast).

### CSS
btoast ships a small optional stylesheet (spacing, default icon sizes, icon SVGs). Load it if you want ready‑to‑use icons/spacing.
- npm/ESM: `import 'btoast-js/dist/btoast.css'`
- CDN: `<link rel="stylesheet" href=".../btoast-js.css">`

---

## 🚀 Quick start

### UMD (script tag)
```html
<!-- Bootstrap CSS is assumed to be already on the page -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/js/bootstrap.bundle.min.js"></script>
<script src="/dist/btoast.umd.js"></script>
<script>
  btoast.success('File saved', {
    title: 'Success',
    delay: 3000,
    progressBar: true,
    newestOnTop: true
  });
</script>
```

### ESM (React/Vue/Vite/etc.)
```js
import { success } from 'btoast-js';
import 'btoast-js/dist/btoast.css';

success('Welcome!', { title: 'Hello', delay: 4000, progressBar: true });
```

---

## 🧩 API
btoast exposes named helpers for each Bootstrap variant, plus a generic `show`.

```js
import { show, success, info, warning, danger, primary, secondary, dark, light } from 'btoast-js';

show('Plain message');
success('Saved!', { title: 'Success' });
```

### Options
| Option | Type | Default | Description |
|---|---|---:|---|
| `title` | `string` | `''` | Optional title. If present (and icon enabled) btoast switches to **title-icon** layout. |
| `variant` | `'primary'|'secondary'|'success'|'info'|'warning'|'danger'|'dark'|'light'` | `'dark'` | Bootstrap color variant. |
| `position` | `'top-right'|'bottom-right'|'bottom-left'|'top-left'|'top-center'|'bottom-center'|'top-full'|'bottom-full'` | `'top-right'` | Where to place the toast container. |
| `dismissible` | `boolean` | `true` | Shows Bootstrap close button (×). |
| `autohide` | `boolean` | `true` | Passes through to Bootstrap (unless we manage timers for hover/extended). |
| `delay` | `number` (ms) | `4000` | Base timeout. `0` → sticky. |
| `progressBar` | `boolean` | `false` | Shows a thin progress bar that drains over `delay`. |
| `pauseOnHover` | `boolean` | `true` | Pauses countdown on hover; resumes with `extendedDelay`. |
| `extendedDelay` | `number` (ms) | `1000` | After mouse leaves, wait this long before hiding. |
| `newestOnTop` | `boolean` | `false` | Insert new toasts at the top of the stack. |
| `preventDuplicates` | `boolean` | `false` | Don’t create a new toast if one with the same key already exists in that position. |
| `dedupeKey` | `string` | _computed_ | Custom key for duplicate detection. Default is `variant|title|message|position`. |
| `onDuplicate` | `'reshow'|'ignore'` | `'reshow'` | What to do when a duplicate is detected. |
| `noIcon` | `boolean` | `false` | Disable icons entirely. |
| `iconClass` | `string` | `''` | Custom icon class to render (`.bt-icon` + your class). Defaults per variant (e.g. `.btoast-success-icon`). |
| `onClick` | `(evt, ctx) => void` | `null` | Body click handler (not the close button). `ctx` includes `{ id, el }`. |
| `dismissOnClick` | `boolean` | `true` | Dismiss when the toast body is clicked. |
| `approveText` | `string` | `''` | If set (or `onApprove` provided), shows an **Approve** button. |
| `denyText` | `string` | `''` | If set (or `onDeny` provided), shows a **Deny** button. |
| `onApprove` | `(evt, ctx) => any` | `null` | Called when Approve is clicked. Bound `this` is the toast context `{ id, el, instance, close(), dispose() }`. Returns `true` internally after execution. |
| `onDeny` | `(evt, ctx) => any` | `null` | Called when Deny is clicked. Same context binding; returns `false` internally after execution. |
| `debug` | `boolean` | `false` | Logs a structured payload after `show()`. Also available on `el.__btoastDebug`. |

> **Layout inference**: If `title` is set and icons are enabled → *title-icon*; if only icon is enabled → *icon*; otherwise → *message*.

### Return value (handle)
`show()` and helpers return a handle:
```ts
{
  id: string,
  el: HTMLElement,
  hide(): void,
  dispose(): void
}
```

---

## 🧪 Test page
There is a simple control page for manual testing:
```
/test/control.html
```
It uses the **UMD** build from `dist/` and lets you toggle most options. Load it via a local server.

---

## 🎨 Theming & icons
- Default icons are provided via CSS classes:
  - `.btoast-success-icon`, `.btoast-info-icon`, `.btoast-warning-icon`, `.btoast-danger-icon`, etc.
- You can supply your own via `iconClass` or disable with `noIcon: true`.
- Sass variables (see `src/styles/_variables.scss`):
  - `$bt-icon-size`, `$bt-icon-gap`, `$bt-border-radius`, `$bt-shadow` …
- The CSS also adds a small margin around each toast so stacks don’t stick together.

---

## ⚙️ Development
```bash
# install deps
npm i

# build JS (UMD + ESM) and CSS
npm run build

# dev watch for CSS only
npm run dev:css
```
The build outputs:
```
dist/btoast.es.js
dist/btoast.umd.js
dist/btoast.css
```

---

## ❓FAQ
- **Do I need the CSS file?**
  Not for core behavior or the progress bar. You’ll want it for default icons/spacing and tidy edges in the icon layouts.
- **Which Bootstrap files are required?**
  Bootstrap CSS + **bootstrap.bundle.min.js** (the bundle includes Popper and Toast JS).

---

## 📄 License
MIT
