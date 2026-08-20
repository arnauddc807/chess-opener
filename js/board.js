/* board.js — touch-first chess board.
 * Tap-to-move and drag-to-move, legal-move dots, animated piece transitions,
 * promotion sheet, hint and error feedback. */
(function (global) {
  'use strict';

  var FILES = 'abcdefgh';

  function fileIndex(sq) { return FILES.indexOf(sq[0]); }
  function rankIndex(sq) { return 8 - parseInt(sq[1], 10); }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  function Board(container, options) {
    this.opts = Object.assign({
      orientation: 'w',
      interactive: true,
      showCoords: true,
      onMove: null,          /* (from, to, promotion) -> boolean|undefined */
      onSquareTap: null
    }, options || {});

    this.container = container;
    this.chess = this.opts.chess || new global.Chess();
    this.selected = null;
    this.targets = [];
    this.pieceEls = [];      /* { el, square, type, color } */
    this.dragging = null;
    this.pendingPromotion = null;
    this.locked = false;

    this.build();
    this.update();
  }

  Board.prototype.build = function () {
    var self = this;
    this.container.classList.add('board');
    this.container.innerHTML = '';

    this.squaresLayer = el('div', 'board-squares');
    this.markLayer = el('div', 'board-marks');
    this.piecesLayer = el('div', 'board-pieces');
    this.promoLayer = el('div', 'board-promo hidden');

    this.container.appendChild(this.squaresLayer);
    this.container.appendChild(this.markLayer);
    this.container.appendChild(this.piecesLayer);
    this.container.appendChild(this.promoLayer);

    this.buildSquares();

    this.onDown = function (e) { self.handleDown(e); };
    this.onMoveEvt = function (e) { self.handleMove(e); };
    this.onUp = function (e) { self.handleUp(e); };

    this.container.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMoveEvt, { passive: false });
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  };

  Board.prototype.destroy = function () {
    this.container.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMoveEvt);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  };

  /* Squares are rebuilt in display order, so data-square always matches what
     the player sees — including when the board is flipped for Black. */
  Board.prototype.buildSquares = function () {
    var flipped = this.opts.orientation === 'b';
    var showCoords = this.opts.showCoords;
    this.squaresLayer.innerHTML = '';
    this.squareEls = {};
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        var f = flipped ? 7 - col : col;
        var r = flipped ? 7 - row : row;
        var sq = FILES[f] + (8 - r);
        var s = el('div', 'sq ' + ((r + f) % 2 === 0 ? 'light' : 'dark'));
        s.dataset.square = sq;
        if (showCoords && row === 7) s.appendChild(el('span', 'coord file', FILES[f]));
        if (showCoords && col === 0) s.appendChild(el('span', 'coord rank', String(8 - r)));
        this.squaresLayer.appendChild(s);
        this.squareEls[sq] = s;
      }
    }
  };

  Board.prototype.setOrientation = function (color) {
    this.opts.orientation = color;
    this.buildSquares();
    this.layoutAll();
  };

  Board.prototype.flip = function () {
    this.setOrientation(this.opts.orientation === 'w' ? 'b' : 'w');
  };

  Board.prototype.coordsFor = function (sq) {
    var f = fileIndex(sq), r = rankIndex(sq);
    if (this.opts.orientation === 'b') { f = 7 - f; r = 7 - r; }
    return { f: f, r: r };
  };

  Board.prototype.placeEl = function (node, sq) {
    var c = this.coordsFor(sq);
    node.style.transform = 'translate(' + (c.f * 100) + '%,' + (c.r * 100) + '%)';
  };

  Board.prototype.layoutAll = function () {
    var self = this;
    this.pieceEls.forEach(function (p) {
      p.el.classList.add('no-anim');
      self.placeEl(p.el, p.square);
    });
    /* force reflow then re-enable animation */
    void this.container.offsetWidth;
    this.pieceEls.forEach(function (p) { p.el.classList.remove('no-anim'); });
    this.renderMarks();
  };

  Board.prototype.makePieceEl = function (piece, sq) {
    var node = el('div', 'piece', global.Pieces.svg(piece.type, piece.color));
    node.dataset.square = sq;
    node.dataset.piece = piece.color + piece.type;
    this.placeEl(node, sq);
    this.piecesLayer.appendChild(node);
    return node;
  };

  function dist(a, b) {
    return Math.abs(fileIndex(a) - fileIndex(b)) + Math.abs(rankIndex(a) - rankIndex(b));
  }

  /* Reconcile DOM pieces with the engine position, reusing elements so moves animate. */
  Board.prototype.update = function () {
    var self = this;
    var desired = [];
    var grid = this.chess.grid();
    grid.forEach(function (row) {
      row.forEach(function (cell) {
        if (cell.type) desired.push({ square: cell.square, type: cell.type, color: cell.color });
      });
    });

    var existing = this.pieceEls.slice();
    var matched = [];
    var usedExisting = new Set();

    /* pass 1: same square, same piece */
    desired.forEach(function (d) {
      for (var i = 0; i < existing.length; i++) {
        var e = existing[i];
        if (usedExisting.has(e)) continue;
        if (e.square === d.square && e.type === d.type && e.color === d.color) {
          usedExisting.add(e); matched.push({ e: e, d: d }); d._done = true; return;
        }
      }
    });

    /* pass 2: same piece elsewhere — nearest wins, so a move slides */
    desired.forEach(function (d) {
      if (d._done) return;
      var best = null, bestDist = 99;
      for (var i = 0; i < existing.length; i++) {
        var e = existing[i];
        if (usedExisting.has(e)) continue;
        if (e.type !== d.type || e.color !== d.color) continue;
        var dd = dist(e.square, d.square);
        if (dd < bestDist) { best = e; bestDist = dd; }
      }
      if (best) { usedExisting.add(best); matched.push({ e: best, d: d }); d._done = true; }
    });

    /* apply matches */
    matched.forEach(function (m) {
      if (m.e.square !== m.d.square) {
        m.e.square = m.d.square;
        m.e.el.dataset.square = m.d.square;
        self.placeEl(m.e.el, m.d.square);
      }
    });

    /* create newcomers */
    var next = matched.map(function (m) { return m.e; });
    desired.forEach(function (d) {
      if (d._done) { delete d._done; return; }
      var node = self.makePieceEl(d, d.square);
      node.classList.add('appearing');
      setTimeout(function () { node.classList.remove('appearing'); }, 20);
      next.push({ el: node, square: d.square, type: d.type, color: d.color });
      delete d._done;
    });

    /* remove leftovers */
    existing.forEach(function (e) {
      if (usedExisting.has(e)) return;
      e.el.classList.add('leaving');
      var node = e.el;
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 180);
    });

    this.pieceEls = next;
    this.renderMarks();
  };

  Board.prototype.setLastMove = function (from, to) {
    this.lastMove = from && to ? { from: from, to: to } : null;
    this.renderMarks();
  };

  Board.prototype.setHint = function (hint) {
    this.hint = hint || null;   /* {from,to} or {square} */
    this.renderMarks();
  };

  Board.prototype.renderMarks = function () {
    var self = this;
    this.markLayer.innerHTML = '';
    function mark(sq, cls) {
      var m = el('div', 'mark ' + cls);
      self.placeEl(m, sq);
      self.markLayer.appendChild(m);
    }
    if (this.lastMove) { mark(this.lastMove.from, 'last'); mark(this.lastMove.to, 'last'); }
    if (this.errorSquare) mark(this.errorSquare, 'error');
    if (this.hint) {
      if (this.hint.from) mark(this.hint.from, 'hint');
      if (this.hint.to) mark(this.hint.to, 'hint');
      if (this.hint.square) mark(this.hint.square, 'hint');
    }
    if (this.selected) mark(this.selected, 'selected');
    this.targets.forEach(function (t) {
      mark(t.to, self.chess.get(t.to) || t.flags & 8 ? 'target capture' : 'target');
    });
    if (this.chess.inCheck()) {
      var king = null;
      this.chess.grid().forEach(function (row) {
        row.forEach(function (c) { if (c.type === 'k' && c.color === self.chess.turn()) king = c.square; });
      });
      if (king) mark(king, 'check');
    }
  };

  Board.prototype.squareAt = function (clientX, clientY) {
    var rect = this.squaresLayer.getBoundingClientRect();
    var x = clientX - rect.left, y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    var f = Math.floor(x / (rect.width / 8));
    var r = Math.floor(y / (rect.height / 8));
    f = Math.max(0, Math.min(7, f));
    r = Math.max(0, Math.min(7, r));
    if (this.opts.orientation === 'b') { f = 7 - f; r = 7 - r; }
    return FILES[f] + (8 - r);
  };

  Board.prototype.pieceAt = function (sq) {
    for (var i = 0; i < this.pieceEls.length; i++) if (this.pieceEls[i].square === sq) return this.pieceEls[i];
    return null;
  };

  Board.prototype.select = function (sq) {
    var piece = this.chess.get(sq);
    if (!piece || piece.color !== this.chess.turn()) { this.deselect(); return false; }
    this.selected = sq;
    this.targets = this.chess.moves({ square: sq, verbose: true });
    this.renderMarks();
    return true;
  };

  Board.prototype.deselect = function () {
    this.selected = null;
    this.targets = [];
    this.renderMarks();
  };

  Board.prototype.handleDown = function (e) {
    if (!this.opts.interactive || this.locked || this.pendingPromotion) return;
    if (e.button !== undefined && e.button !== 0) return;
    var sq = this.squareAt(e.clientX, e.clientY);
    if (!sq) return;

    if (this.opts.onSquareTap) this.opts.onSquareTap(sq);

    var target = this.selected ? this.findTarget(sq) : null;
    if (target) { e.preventDefault(); this.commit(this.selected, sq); return; }

    var piece = this.chess.get(sq);
    if (piece && piece.color === this.chess.turn()) {
      e.preventDefault();
      var alreadySelected = this.selected === sq;
      this.select(sq);
      var pe = this.pieceAt(sq);
      if (pe) {
        this.dragging = {
          pieceEl: pe, from: sq, startX: e.clientX, startY: e.clientY,
          moved: false, wasSelected: alreadySelected
        };
        pe.el.setPointerCapture && pe.el.setPointerCapture(e.pointerId);
      }
    } else {
      this.deselect();
    }
  };

  Board.prototype.findTarget = function (sq) {
    for (var i = 0; i < this.targets.length; i++) if (this.targets[i].to === sq) return this.targets[i];
    return null;
  };

  Board.prototype.handleMove = function (e) {
    if (!this.dragging) return;
    var dx = e.clientX - this.dragging.startX;
    var dy = e.clientY - this.dragging.startY;
    if (!this.dragging.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
    e.preventDefault();
    this.dragging.moved = true;
    var pe = this.dragging.pieceEl;
    pe.el.classList.add('dragging');
    var c = this.coordsFor(this.dragging.from);
    pe.el.style.transform = 'translate(' + (c.f * 100) + '%,' + (c.r * 100) + '%) translate(' + dx + 'px,' + dy + 'px) scale(1.15)';
    var over = this.squareAt(e.clientX, e.clientY);
    if (over !== this.hoverSquare) {
      this.hoverSquare = over;
      Object.keys(this.squareEls).forEach(function (k) { this.squareEls[k].classList.remove('hover'); }, this);
      if (over && this.findTarget(over)) this.squareEls[over].classList.add('hover');
    }
  };

  Board.prototype.handleUp = function (e) {
    if (!this.dragging) return;
    var drag = this.dragging;
    this.dragging = null;
    var pe = drag.pieceEl;
    pe.el.classList.remove('dragging');
    Object.keys(this.squareEls).forEach(function (k) { this.squareEls[k].classList.remove('hover'); }, this);
    this.hoverSquare = null;

    if (!drag.moved) {
      /* plain tap: toggle selection off if tapping the same piece twice */
      if (drag.wasSelected) this.deselect();
      this.placeEl(pe.el, pe.square);
      return;
    }
    var to = this.squareAt(e.clientX, e.clientY);
    this.placeEl(pe.el, pe.square);
    if (to && this.findTarget(to)) this.commit(drag.from, to);
    else this.deselect();
  };

  Board.prototype.commit = function (from, to) {
    var target = this.findTarget(to);
    this.deselect();
    if (!target) return;
    if (target.flags & 16) { this.askPromotion(from, to); return; }
    this.emitMove(from, to, null);
  };

  Board.prototype.emitMove = function (from, to, promotion) {
    if (this.opts.onMove) this.opts.onMove(from, to, promotion);
  };

  Board.prototype.askPromotion = function (from, to) {
    var self = this;
    var color = this.chess.turn();
    this.pendingPromotion = { from: from, to: to };
    this.promoLayer.innerHTML = '';
    var sheet = el('div', 'promo-sheet');
    sheet.appendChild(el('div', 'promo-title', 'Promote to'));
    var row = el('div', 'promo-row');
    ['q', 'r', 'b', 'n'].forEach(function (t) {
      var b = el('button', 'promo-btn', global.Pieces.svg(t, color));
      b.setAttribute('aria-label', global.Pieces.names[t]);
      b.addEventListener('click', function () {
        self.promoLayer.classList.add('hidden');
        var p = self.pendingPromotion;
        self.pendingPromotion = null;
        self.emitMove(p.from, p.to, t);
      });
      row.appendChild(b);
    });
    sheet.appendChild(row);
    var cancel = el('button', 'promo-cancel', 'Cancel');
    cancel.addEventListener('click', function () {
      self.promoLayer.classList.add('hidden');
      self.pendingPromotion = null;
    });
    sheet.appendChild(cancel);
    this.promoLayer.appendChild(sheet);
    this.promoLayer.classList.remove('hidden');
  };

  Board.prototype.flashError = function (sq) {
    var self = this;
    this.errorSquare = sq;
    this.container.classList.add('shake');
    this.renderMarks();
    setTimeout(function () { self.container.classList.remove('shake'); }, 380);
    setTimeout(function () { self.errorSquare = null; self.renderMarks(); }, 700);
  };

  Board.prototype.setLocked = function (v) {
    this.locked = v;
    this.container.classList.toggle('locked', !!v);
    if (v) this.deselect();
  };

  global.Board = Board;
})(typeof window !== 'undefined' ? window : globalThis);
