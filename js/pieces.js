/* pieces.js — hand-built SVG piece set. One 45x45 viewBox per piece.
 * Shapes use fill:var(--pc-fill) and stroke:var(--pc-line) so a single
 * definition serves both colours. */
(function (global) {
  'use strict';

  var SHAPES = {
    p: '<circle cx="22.5" cy="12.5" r="5.4"/>' +
       '<path d="M22.5 17.4c-3.9 0-7 2.6-7 5.9 0 2.1 1.1 3.5 2.2 4.5-2 2.6-3.9 5.2-4.7 8.2h19c-.8-3-2.7-5.6-4.7-8.2 1.1-1 2.2-2.4 2.2-4.5 0-3.3-3.1-5.9-7-5.9z"/>' +
       '<rect x="11.2" y="36.6" width="22.6" height="4.2" rx="1.6"/>',

    r: '<path d="M12 12.2V8.6h4.1v2.2h4.3V8.6h4.2v2.2h4.3V8.6H33v3.6l-3 3.4v11.6l3 3v3.2H12v-3.2l3-3V15.6z"/>' +
       '<rect x="9.6" y="35.4" width="25.8" height="5.4" rx="1.8"/>' +
       '<path d="M15.2 32.4h14.6" class="pc-detail"/>' +
       '<path d="M15 15.6h15" class="pc-detail"/>',

    n: '<path d="M20.4 8.2c1.3-2 4.6-2.3 6.6-.4 2.8 2.6 5 6.9 5.7 12 .5 3.6.6 7.4.6 11.4v3.6H14v-3.9c0-3.6 1.3-6.4 3.6-8.7l3.6-3.5-4.6 1.6c-2 .7-3.9.2-4.8-1.3-.9-1.6-.4-3.5 1.2-4.7l5.1-3.7z"/>' +
       '<circle cx="25.4" cy="14.6" r="1.7" class="pc-eye"/>' +
       '<path d="M17.6 20.4c1.6-1.2 3.4-2 5.2-2.4" class="pc-detail"/>' +
       '<rect x="10.6" y="35.4" width="24.8" height="5.4" rx="1.8"/>',

    b: '<circle cx="22.5" cy="8.6" r="3"/>' +
       '<path d="M22.5 12c-4.6 3.1-7.6 7.6-7.6 12.1 0 2.6 1.1 4.6 2.6 6h10c1.5-1.4 2.6-3.4 2.6-6 0-4.5-3-9-7.6-12.1z"/>' +
       '<path d="M22.5 16.6v8M19 20.6h7" class="pc-detail"/>' +
       '<path d="M14.6 31.6h15.8c1.6 0 2.6 1 2.6 2.2s-1 2.2-2.6 2.2H14.6c-1.6 0-2.6-1-2.6-2.2s1-2.2 2.6-2.2z"/>' +
       '<rect x="10.4" y="35.6" width="24.2" height="5.2" rx="1.8"/>',

    q: '<circle cx="8.6" cy="14" r="2.7"/><circle cx="16.6" cy="10.4" r="2.7"/>' +
       '<circle cx="22.5" cy="8.6" r="3"/><circle cx="28.4" cy="10.4" r="2.7"/>' +
       '<circle cx="36.4" cy="14" r="2.7"/>' +
       '<path d="M9.6 16.6l3.5 13.8h18.8l3.5-13.8-6.6 4.6-2.9-9-2.9 9-2.9-9-2.9 9z"/>' +
       '<path d="M12.6 30.4h19.8c1.6 0 2.7 1 2.7 2.3s-1.1 2.3-2.7 2.3H12.6c-1.6 0-2.7-1-2.7-2.3s1.1-2.3 2.7-2.3z"/>' +
       '<rect x="9.4" y="35.2" width="26.2" height="5.6" rx="1.9"/>',

    k: '<path d="M20.8 3h3.4v3.1h3.1v3.4h-3.1v3.3h-3.4V9.5h-3.1V6.1h3.1z"/>' +
       '<path d="M22.5 13.4c3.4-3.4 9.4-3 11.4 1.2 1.7 3.6-.2 7-2.4 9.6l-2.3 2.8v3.4H15.8v-3.4l-2.3-2.8c-2.2-2.6-4.1-6-2.4-9.6 2-4.2 8-4.6 11.4-1.2z"/>' +
       '<path d="M15.8 24.4c4.4-2 8.9-2 13.4 0" class="pc-detail"/>' +
       '<path d="M12.8 30.4h19.4c1.6 0 2.7 1 2.7 2.3s-1.1 2.3-2.7 2.3H12.8c-1.6 0-2.7-1-2.7-2.3s1.1-2.3 2.7-2.3z"/>' +
       '<rect x="9.4" y="35.2" width="26.2" height="5.6" rx="1.9"/>'
  };

  var CACHE = {};

  function pieceSvg(type, color) {
    var key = color + type;
    if (CACHE[key]) return CACHE[key];
    var svg = '<svg class="piece-svg piece-' + color + '" viewBox="0 0 45 45" aria-hidden="true" focusable="false">' +
      '<g class="pc">' + SHAPES[type] + '</g></svg>';
    CACHE[key] = svg;
    return svg;
  }

  var NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

  global.Pieces = { svg: pieceSvg, names: NAMES };
})(typeof window !== 'undefined' ? window : globalThis);
