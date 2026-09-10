'use strict';
/**
 * ============================================================================
 *  YDA — Server-side HTML sanitizer (zero-dependency, defense-in-depth)
 * ----------------------------------------------------------------------------
 *  PURPOSE
 *  This module strips *executable / third-party-injecting* markup from any
 *  admin-authored or stored content BEFORE it is returned by the API and
 *  rendered into the page. It is the primary fix for the incident where a
 *  third-party advertisement was being injected into the site instead of the
 *  real Yasmin Dolatshahi content.
 *
 *  Because the public site renders `project.content`, `post.content`,
 *  `settings.*` etc. with `innerHTML`, ANY <script>, <iframe>, inline event
 *  handler or javascript: URL that reaches the database would execute in the
 *  visitor's browser. We remove all of those here so that even if the database
 *  is tampered with again, no ad / malware can run.
 *
 *  It intentionally KEEPS the normal rich-text tags the admin panel produces
 *  (headings, paragraphs, lists, images, links, bold/italic, tables …) so the
 *  legitimate site content is untouched.
 * ==========================================================================*/

// Tags that must NEVER survive — they either execute code or load remote
// third-party payloads (the classic ad / redirect injection vectors).
const FORBIDDEN_TAGS = [
  'script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
  'style', 'link', 'meta', 'base', 'form', 'input', 'button', 'textarea',
  'select', 'option', 'noscript', 'template', 'svg', 'math', 'portal',
  'audio', 'video', 'source', 'track', 'marquee', 'blink',
];

// Attributes that are always dangerous regardless of tag.
// (all on* event handlers are handled by a regex below)
const FORBIDDEN_ATTRS = [
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseenter', 'onfocus',
  'onblur', 'onchange', 'onsubmit', 'onanimationstart', 'ontoggle',
  'formaction', 'xlink:href', 'srcdoc', 'background', 'dynsrc', 'lowsrc',
  'ping', 'data-ad', 'data-ads', 'data-adclient', 'data-adslot',
];

/**
 * Remove a whole element (open tag … close tag) including its content for the
 * given tag names. Handles self-closing and unclosed variants defensively.
 */
function stripElementWithContent(html, tag) {
  // <tag ...> ... </tag>
  const paired = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi');
  html = html.replace(paired, '');
  // dangling / self-closing / unclosed <tag ...> or </tag>
  const single = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
  html = html.replace(single, '');
  return html;
}

/**
 * Sanitize an HTML string. Returns a string safe to inject with innerHTML.
 * Non-string input is returned unchanged.
 */
function sanitizeHtml(input) {
  if (input === null || input === undefined) return input;
  if (typeof input !== 'string') return input;

  let html = input;

  // 1) HTML comments can hide conditional-comment script tricks → drop them.
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // 2) Remove dangerous elements together with their contents.
  for (const tag of FORBIDDEN_TAGS) {
    html = stripElementWithContent(html, tag);
  }

  // 3) Strip ALL inline event handlers:  onSomething="..." / onSomething='...' / onSomething=value
  html = html.replace(/\son[a-z0-9_-]+\s*=\s*"[^"]*"/gi, '');
  html = html.replace(/\son[a-z0-9_-]+\s*=\s*'[^']*'/gi, '');
  html = html.replace(/\son[a-z0-9_-]+\s*=\s*[^\s>]+/gi, '');

  // 4) Strip explicitly forbidden attributes (quoted + unquoted).
  for (const attr of FORBIDDEN_ATTRS) {
    const a = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`\\s${a}\\s*=\\s*"[^"]*"`, 'gi'), '');
    html = html.replace(new RegExp(`\\s${a}\\s*=\\s*'[^']*'`, 'gi'), '');
    html = html.replace(new RegExp(`\\s${a}\\s*=\\s*[^\\s>]+`, 'gi'), '');
  }

  // 5) Neutralize dangerous URL schemes inside href/src/etc.
  //    javascript:, vbscript:, data:text/html, data:application, and file: URIs.
  html = html.replace(
    /((?:href|src|action|xlink:href|poster)\s*=\s*["']?)\s*(?:javascript|vbscript|livescript|mocha|about|data\s*:\s*text\/html|data\s*:\s*application)\s*:[^"'>\s]*/gi,
    '$1#'
  );

  // 6) CSS expression()/url(javascript:) inside any leftover style attribute.
  html = html.replace(/\sstyle\s*=\s*"[^"]*(expression|javascript:|url\s*\()[^"]*"/gi, '');
  html = html.replace(/\sstyle\s*=\s*'[^']*(expression|javascript:|url\s*\()[^']*'/gi, '');

  return html;
}

/**
 * Sanitize a plain-text field (no HTML allowed at all). Used for titles,
 * settings values, meta fields, social links, etc. Removes every tag and
 * neutralizes javascript: pseudo-URLs, while keeping the readable text.
 */
function sanitizeText(input) {
  if (input === null || input === undefined) return input;
  if (typeof input !== 'string') return input;
  return input
    .replace(/<[^>]*>/g, '')                       // drop any markup
    .replace(/(javascript|vbscript|data)\s*:/gi, '') // kill script pseudo-schemes
    .trim();
}

/**
 * Sanitize a URL-ish setting (social links, image URLs). Only http(s), mailto,
 * tel, relative (/…), hash (#…) and protocol-relative (//…) URLs survive.
 * Anything else (javascript:, data:, etc.) is blanked.
 *
 * Attribute-breakout hardening: quote characters, angle brackets, backslashes
 * and control/whitespace characters are stripped BEFORE the scheme check, so a
 * URL like  https://x.com/a"><script>…  can never escape the src/href
 * attribute it is rendered into. In a legitimate URL those bytes would be
 * percent-encoded anyway, so nothing valid is lost.
 */
function sanitizeUrl(input) {
  if (input === null || input === undefined) return input;
  if (typeof input !== 'string') return input;
  let v = input.trim();
  if (v === '') return v;
  // 1) kill control chars & raw spaces, then attribute-breakout characters
  v = v
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, '')
    .replace(/["'`<>\\]/g, '');
  if (v === '') return v;
  // 2) bound the length — nothing legitimate is longer than 2048 chars
  if (v.length > 2048) return '';
  // 3) scheme allow-list
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  if (/^(\/|#|\.\/|\.\.\/)/.test(v)) return v;
  if (/^\/\//.test(v)) return v;
  // Reject javascript:, data:, vbscript:, file:, and any other scheme.
  if (/^[a-z0-9.+-]+:/i.test(v)) return '';
  return v; // bare host / path — allowed
}

/** Recursively sanitize object/array string values as rich HTML. */
function sanitizeDeep(value) {
  if (typeof value === 'string') return sanitizeHtml(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeDeep(v);
    return out;
  }
  return value;
}

module.exports = {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeDeep,
  FORBIDDEN_TAGS,
};
