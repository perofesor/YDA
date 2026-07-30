/* ============================================================================
 *  YDA — Client-side HTML sanitizer (last line of defense in the browser)
 * ----------------------------------------------------------------------------
 *  The server already strips dangerous markup, and a strict CSP blocks any
 *  third-party script/iframe. This adds a THIRD independent layer: before the
 *  SPA injects admin-authored HTML (project.content, post.content, settings…)
 *  with innerHTML, we run it through the browser's own DOM parser and remove
 *  every executable / third-party-loading node. If anything malicious ever
 *  reached the page it is neutralized before it can render.
 *
 *  Exposes:
 *    window.SafeHTML(html)  -> sanitized HTML string (safe for innerHTML)
 *    window.SafeText(text)  -> plain text with all markup stripped
 *    window.SafeURL(url)    -> url or '' if it uses a dangerous scheme
 * ==========================================================================*/
(function () {
  'use strict';

  var FORBIDDEN_TAGS = {
    SCRIPT: 1, IFRAME: 1, FRAME: 1, FRAMESET: 1, OBJECT: 1, EMBED: 1,
    APPLET: 1, STYLE: 1, LINK: 1, META: 1, BASE: 1, FORM: 1, INPUT: 1,
    BUTTON: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1, NOSCRIPT: 1, TEMPLATE: 1,
    SVG: 1, MATH: 1, PORTAL: 1, AUDIO: 1, VIDEO: 1, SOURCE: 1, TRACK: 1,
    MARQUEE: 1, BLINK: 1
  };

  function badUrl(v) {
    if (!v) return false;
    var s = String(v).trim().replace(/\s+/g, '').toLowerCase();
    return /^(javascript:|vbscript:|livescript:|mocha:|data:text\/html|data:application)/.test(s);
  }

  function scrub(node) {
    // Walk children in reverse so removals don't disturb iteration.
    var kids = node.childNodes;
    for (var i = kids.length - 1; i >= 0; i--) {
      var el = kids[i];
      if (el.nodeType === 1) { // element
        if (FORBIDDEN_TAGS[el.tagName]) {
          node.removeChild(el);
          continue;
        }
        // Strip every attribute that is an event handler, a dangerous URL,
        // or an ad/tracking hook.
        var attrs = el.attributes;
        for (var j = attrs.length - 1; j >= 0; j--) {
          var name = attrs[j].name;
          var val = attrs[j].value;
          var ln = name.toLowerCase();
          if (ln.indexOf('on') === 0) { el.removeAttribute(name); continue; }
          if (ln === 'style' && /expression|javascript:|url\s*\(/i.test(val)) { el.removeAttribute(name); continue; }
          if ((ln === 'href' || ln === 'src' || ln === 'action' || ln === 'formaction' ||
               ln === 'xlink:href' || ln === 'poster' || ln === 'srcdoc' || ln === 'background') && badUrl(val)) {
            el.removeAttribute(name); continue;
          }
          if (ln.indexOf('data-ad') === 0) { el.removeAttribute(name); }
        }
        scrub(el); // recurse
      }
    }
  }

  window.SafeHTML = function (html) {
    if (html == null) return '';
    if (typeof html !== 'string') return html;
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    scrub(tpl.content);
    return tpl.innerHTML;
  };

  window.SafeText = function (text) {
    if (text == null) return '';
    var d = document.createElement('div');
    d.innerHTML = String(text);
    return (d.textContent || d.innerText || '').trim();
  };

  window.SafeURL = function (url) {
    if (url == null) return '';
    var v = String(url).trim();
    if (v === '') return '';
    if (badUrl(v)) return '';
    return v;
  };
})();
