/* ============================================================================
   BRAND CONTRAST SOLVER
   Corrects the OKLCH generated ramp so every contrast bearing step hits its
   WCAG target exactly, rather than approximately.

   Runs synchronously in <head>, before first paint. The CSS generator has
   already painted a close value, so there is no flash — this only nudges.
   ============================================================================ */
(function () {
  'use strict';

  /* Which steps carry a contrast obligation, what they must clear, and what
     they are measured against. Everything not listed here is decorative and
     is left exactly as the CSS generator produced it. */
  /* Each ratio is the MEDIAN that _brand-auto.css already paints, not the WCAG
     floor. Two reasons. First, if the JS solved to the bare minimum it would
     visibly lighten every brand colour the moment it ran, because the CSS
     baseline sits well above the floor. Matching the median makes the
     correction invisible. Second, building to exactly 4.5 leaves no margin;
     these sit comfortably clear of it.

     WCAG floors for reference: 600 needs 3.0, 700 needs 4.5, 800 needs 4.5. */
  var TARGETS = {
    '300': { ratio: 8.8, against: 'dark'  },  // dark mode secondary text
    '400': { ratio: 6.7, against: 'dark'  },  // dark mode text + solid fill
    '600': { ratio: 4.3, against: 'light' },  // icons, focus ring   (floor 3.0)
    '700': { ratio: 6.3, against: 'light' },  // body text, button   (floor 4.5)
    '800': { ratio: 8.2, against: 'light' }   // hover, headings     (floor 4.5)
  };

  var LIGHT_BG = [255, 255, 255];
  var DARK_BG  = [37, 40, 45];   // must equal --gray-950

  /* ---------- colour maths ---------- */

  function srgbToLinear(c) {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(rgb) {
    return 0.2126 * srgbToLinear(rgb[0]) +
           0.7152 * srgbToLinear(rgb[1]) +
           0.0722 * srgbToLinear(rgb[2]);
  }

  function contrast(a, b) {
    var la = luminance(a), lb = luminance(b);
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  function oklchToRgbRaw(L, C, H) {
    var h = H * Math.PI / 180;
    var a = C * Math.cos(h), b = C * Math.sin(h);
    var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    var s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    return [
       4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    ];
  }

  function encode(x) {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  }

  function inGamut(v) {
    for (var i = 0; i < 3; i++) if (v[i] < -0.001 || v[i] > 1.001) return false;
    return true;
  }

  /* Pull chroma back until the colour fits inside sRGB. Without this a
     saturated hue at an extreme lightness clips and the measured contrast
     stops matching what actually paints. */
  function oklchToRgb(L, C, H) {
    var lo = 0, hi = C;
    if (!inGamut(oklchToRgbRaw(L, C, H))) {
      for (var i = 0; i < 24; i++) {
        var mid = (lo + hi) / 2;
        if (inGamut(oklchToRgbRaw(L, mid, H))) lo = mid; else hi = mid;
      }
      C = lo;
    }
    var v = oklchToRgbRaw(L, C, H);
    return [
      Math.max(0, Math.min(255, Math.round(encode(v[0]) * 255))),
      Math.max(0, Math.min(255, Math.round(encode(v[1]) * 255))),
      Math.max(0, Math.min(255, Math.round(encode(v[2]) * 255)))
    ];
  }

  function rgbToOklch(rgb) {
    var r = srgbToLinear(rgb[0]), g = srgbToLinear(rgb[1]), b = srgbToLinear(rgb[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var H = Math.atan2(B, A) * 180 / Math.PI;
    return { L: L, C: Math.sqrt(A * A + B * B), H: H < 0 ? H + 360 : H };
  }

  /* ---------- the solve ---------- */

  /* Binary search lightness until the MEASURED ratio equals the target.
     This is the whole difference from the CSS version: that one assumes a
     lightness will land somewhere useful, this one checks. */
  function solve(C, H, targetRatio, bg, darker) {
    var lo = darker ? 0.0 : 0.0, hi = 1.0;
    for (var i = 0; i < 30; i++) {
      var mid = (lo + hi) / 2;
      var got = contrast(oklchToRgb(mid, C, H), bg);
      if (darker) { if (got > targetRatio) lo = mid; else hi = mid; }
      else        { if (got > targetRatio) hi = mid; else lo = mid; }
    }
    var L = (lo + hi) / 2;
    /* Nudge until we are at or above target, never below. */
    for (var k = 0; k < 40; k++) {
      if (contrast(oklchToRgb(L, C, H), bg) >= targetRatio) break;
      L += darker ? -0.002 : 0.002;
      if (L < 0 || L > 1) break;
    }
    return Math.max(0, Math.min(1, L));
  }

  function toHex(rgb) {
    return '#' + rgb.map(function (v) {
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
  }

  /* Chroma multipliers must match _brand-auto.css so the corrected steps sit
     in the same family as the ones CSS generated. */
  var CMUL = { '300': 0.80, '400': 0.95, '600': 1.00, '700': 0.95, '800': 0.88 };

  function correct(baseRgb, prefix, root) {
    var base = rgbToOklch(baseRgb);
    var out = {};
    for (var step in TARGETS) {
      var t = TARGETS[step];
      var dark = t.against === 'light';           // dark swatch on a light page
      var bg = dark ? LIGHT_BG : DARK_BG;
      var C = base.C * CMUL[step];
      var L = solve(C, base.H, t.ratio, bg, dark);
      var hex = toHex(oklchToRgb(L, C, base.H));
      root.style.setProperty('--' + prefix + '-' + step, hex);
      out[step] = { hex: hex, ratio: contrast(oklchToRgb(L, C, base.H), bg) };
    }
    return out;
  }

  /* ---------- entry point ---------- */

  function parse(str, doc) {
    str = (str || '').trim();
    if (!str) return null;
    var probe = doc.createElement('span');
    probe.style.color = str;
    probe.style.display = 'none';
    doc.body ? doc.body.appendChild(probe) : doc.documentElement.appendChild(probe);
    var resolved = getComputedStyle(probe).color;
    probe.parentNode.removeChild(probe);
    var m = resolved.match(/\d+/g);
    return m ? [+m[0], +m[1], +m[2]] : null;
  }

  function run() {
    var root = document.documentElement;
    var cs = getComputedStyle(root);
    var report = {};
    [['--brand-base', 'brand'], ['--accent-base', 'accent']].forEach(function (pair) {
      var rgb = parse(cs.getPropertyValue(pair[0]), document);
      if (rgb) report[pair[1]] = correct(rgb, pair[1], root);
    });
    window.__brandContrast = report;   // inspect in devtools
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { rgbToOklch: rgbToOklch, oklchToRgb: oklchToRgb,
                       contrast: contrast, solve: solve, toHex: toHex,
                       CMUL: CMUL, TARGETS: TARGETS,
                       LIGHT_BG: LIGHT_BG, DARK_BG: DARK_BG };
  } else {
    run();
  }
})();
