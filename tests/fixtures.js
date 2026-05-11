const { test: base, expect } = require('@playwright/test');

exports.test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const bar = document.createElement('div');
      bar.id = '__pw_url_bar__';
      bar.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:2147483647',
        'background:#f1f3f4', 'border-bottom:2px solid #4285f4',
        'padding:5px 12px', 'font:12px/1.5 monospace', 'color:#202124',
        'box-shadow:0 2px 4px rgba(0,0,0,.2)',
      ].join(';');
      document.documentElement.prepend(bar);

      const update = () => { bar.textContent = '🌐  ' + location.href; };
      update();

      window.addEventListener('popstate', update);
      window.addEventListener('hashchange', update);

      const _push = history.pushState.bind(history);
      history.pushState = (...a) => { _push(...a); update(); };
      const _replace = history.replaceState.bind(history);
      history.replaceState = (...a) => { _replace(...a); update(); };
    });

    await use(page);
  },
});

exports.expect = expect;
