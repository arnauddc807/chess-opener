/* chess.js — a compact, dependency-free chess engine (0x88 board).
 * Supports: legal move generation, castling, en passant, promotion,
 * FEN import/export, SAN generation & parsing, undo, check/mate detection. */
(function (global) {
  'use strict';

  var WHITE = 'w', BLACK = 'b';
  var PAWN = 'p', KNIGHT = 'n', BISHOP = 'b', ROOK = 'r', QUEEN = 'q', KING = 'k';

  var START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  var OFFSETS = {
    n: [-18, -33, -31, -14, 18, 33, 31, 14],
    b: [-17, -15, 17, 15],
    r: [-16, 1, 16, -1],
    q: [-17, -16, -15, 1, 17, 16, 15, -1],
    k: [-17, -16, -15, 1, 17, 16, 15, -1]
  };

  var BITS = { NORMAL: 1, CAPTURE: 2, BIG_PAWN: 4, EP_CAPTURE: 8, PROMOTION: 16, KSIDE_CASTLE: 32, QSIDE_CASTLE: 64 };

  var RANK_2 = 6, RANK_7 = 1;

  var ROOKS = {
    w: [{ square: 112, flag: BITS.QSIDE_CASTLE }, { square: 119, flag: BITS.KSIDE_CASTLE }],
    b: [{ square: 0, flag: BITS.QSIDE_CASTLE }, { square: 7, flag: BITS.KSIDE_CASTLE }]
  };

  function file(sq) { return sq & 15; }
  function rank(sq) { return sq >> 4; }
  function algebraic(sq) { return 'abcdefgh'[file(sq)] + (8 - rank(sq)); }
  function squareOf(name) {
    if (typeof name !== 'string' || name.length !== 2) return -1;
    var f = 'abcdefgh'.indexOf(name[0]);
    var r = '87654321'.indexOf(name[1]);
    if (f < 0 || r < 0) return -1;
    return r * 16 + f;
  }
  function swap(c) { return c === WHITE ? BLACK : WHITE; }

  function Chess(fen) {
    this.board = new Array(128).fill(null);
    this.kings = { w: -1, b: -1 };
    this.turnColor = WHITE;
    this.castling = { w: 0, b: 0 };
    this.epSquare = -1;
    this.halfMoves = 0;
    this.moveNumber = 1;
    this.history = [];
    this.load(fen || START_FEN);
  }

  Chess.prototype.reset = function () { this.load(START_FEN); };

  Chess.prototype.clear = function () {
    this.board = new Array(128).fill(null);
    this.kings = { w: -1, b: -1 };
    this.turnColor = WHITE;
    this.castling = { w: 0, b: 0 };
    this.epSquare = -1;
    this.halfMoves = 0;
    this.moveNumber = 1;
    this.history = [];
  };

  Chess.prototype.load = function (fen) {
    var tokens = fen.split(/\s+/);
    var position = tokens[0];
    this.clear();
    var sq = 0;
    for (var i = 0; i < position.length; i++) {
      var ch = position[i];
      if (ch === '/') { sq += 8; continue; }
      if ('0123456789'.indexOf(ch) >= 0) { sq += parseInt(ch, 10); continue; }
      var color = ch === ch.toUpperCase() ? WHITE : BLACK;
      var type = ch.toLowerCase();
      this.board[sq] = { type: type, color: color };
      if (type === KING) this.kings[color] = sq;
      sq++;
    }
    this.turnColor = tokens[1] === 'b' ? BLACK : WHITE;
    var cast = tokens[2] || '-';
    if (cast.indexOf('K') >= 0) this.castling.w |= BITS.KSIDE_CASTLE;
    if (cast.indexOf('Q') >= 0) this.castling.w |= BITS.QSIDE_CASTLE;
    if (cast.indexOf('k') >= 0) this.castling.b |= BITS.KSIDE_CASTLE;
    if (cast.indexOf('q') >= 0) this.castling.b |= BITS.QSIDE_CASTLE;
    this.epSquare = (!tokens[3] || tokens[3] === '-') ? -1 : squareOf(tokens[3]);
    this.halfMoves = parseInt(tokens[4], 10) || 0;
    this.moveNumber = parseInt(tokens[5], 10) || 1;
    return true;
  };

  Chess.prototype.fen = function () {
    var empty = 0, out = '';
    for (var i = 0; i <= 119; i++) {
      if (this.board[i]) {
        if (empty > 0) { out += empty; empty = 0; }
        var p = this.board[i];
        out += p.color === WHITE ? p.type.toUpperCase() : p.type;
      } else { empty++; }
      if ((i + 1) & 0x88) {
        if (empty > 0) out += empty;
        if (i !== 119) out += '/';
        empty = 0;
        i += 8;
      }
    }
    var cflags = '';
    if (this.castling.w & BITS.KSIDE_CASTLE) cflags += 'K';
    if (this.castling.w & BITS.QSIDE_CASTLE) cflags += 'Q';
    if (this.castling.b & BITS.KSIDE_CASTLE) cflags += 'k';
    if (this.castling.b & BITS.QSIDE_CASTLE) cflags += 'q';
    cflags = cflags || '-';
    var ep = this.epSquare === -1 ? '-' : algebraic(this.epSquare);
    return [out, this.turnColor, cflags, ep, this.halfMoves, this.moveNumber].join(' ');
  };

  Chess.prototype.turn = function () { return this.turnColor; };

  Chess.prototype.get = function (name) {
    var sq = squareOf(name);
    if (sq === -1 || (sq & 0x88)) return null;
    var p = this.board[sq];
    return p ? { type: p.type, color: p.color } : null;
  };

  Chess.prototype.put = function (piece, name) {
    var sq = squareOf(name);
    if (sq === -1 || (sq & 0x88)) return false;
    this.board[sq] = { type: piece.type, color: piece.color };
    if (piece.type === KING) this.kings[piece.color] = sq;
    return true;
  };

  function buildMove(board, from, to, flags, promotion) {
    var move = {
      color: board[from].color,
      from: from, to: to, flags: flags,
      piece: board[from].type
    };
    if (promotion) { move.flags |= BITS.PROMOTION; move.promotion = promotion; }
    if (board[to]) move.captured = board[to].type;
    else if (flags & BITS.EP_CAPTURE) move.captured = PAWN;
    return move;
  }

  Chess.prototype.generateMoves = function (options) {
    var self = this;
    var moves = [];
    var us = this.turnColor, them = swap(us);
    var secondRank = { b: RANK_7, w: RANK_2 };
    var legal = !options || options.legal !== false;
    var singleSquare = options && options.square !== undefined ? options.square : null;

    var firstSq = 0, lastSq = 119;
    if (singleSquare !== null) {
      if (singleSquare & 0x88) return [];
      firstSq = lastSq = singleSquare;
    }

    function addMove(from, to, flags) {
      if (self.board[from].type === PAWN && (rank(to) === 0 || rank(to) === 7)) {
        [QUEEN, ROOK, BISHOP, KNIGHT].forEach(function (pr) {
          moves.push(buildMove(self.board, from, to, flags, pr));
        });
      } else {
        moves.push(buildMove(self.board, from, to, flags));
      }
    }

    for (var i = firstSq; i <= lastSq; i++) {
      if (i & 0x88) { i += 7; continue; }
      var piece = this.board[i];
      if (!piece || piece.color !== us) continue;

      if (piece.type === PAWN) {
        var dir = us === WHITE ? -16 : 16;
        var one = i + dir;
        if (!(one & 0x88) && !this.board[one]) {
          addMove(i, one, BITS.NORMAL);
          var two = i + dir * 2;
          if (secondRank[us] === rank(i) && !this.board[two]) addMove(i, two, BITS.BIG_PAWN);
        }
        var caps = us === WHITE ? [-17, -15] : [17, 15];
        for (var c = 0; c < 2; c++) {
          var target = i + caps[c];
          if (target & 0x88) continue;
          if (this.board[target] && this.board[target].color === them) addMove(i, target, BITS.CAPTURE);
          else if (target === this.epSquare) addMove(i, target, BITS.EP_CAPTURE);
        }
      } else {
        var offs = OFFSETS[piece.type];
        for (var j = 0; j < offs.length; j++) {
          var offset = offs[j], sq = i;
          while (true) {
            sq += offset;
            if (sq & 0x88) break;
            if (!this.board[sq]) {
              addMove(i, sq, BITS.NORMAL);
            } else {
              if (this.board[sq].color === them) addMove(i, sq, BITS.CAPTURE);
              break;
            }
            if (piece.type === KNIGHT || piece.type === KING) break;
          }
        }
      }
    }

    // castling
    if (singleSquare === null || lastSq === this.kings[us]) {
      if (this.kings[us] !== -1 && !this.isAttacked(them, this.kings[us])) {
        var kingSq = this.kings[us];
        if (this.castling[us] & BITS.KSIDE_CASTLE) {
          var kTo = kingSq + 2;
          if (!this.board[kingSq + 1] && !this.board[kTo] &&
              !this.isAttacked(them, kingSq + 1) && !this.isAttacked(them, kTo)) {
            moves.push(buildMove(this.board, kingSq, kTo, BITS.KSIDE_CASTLE));
          }
        }
        if (this.castling[us] & BITS.QSIDE_CASTLE) {
          var qTo = kingSq - 2;
          if (!this.board[kingSq - 1] && !this.board[kingSq - 2] && !this.board[kingSq - 3] &&
              !this.isAttacked(them, kingSq - 1) && !this.isAttacked(them, qTo)) {
            moves.push(buildMove(this.board, kingSq, qTo, BITS.QSIDE_CASTLE));
          }
        }
      }
    }

    if (!legal) return moves;

    var legalMoves = [];
    for (var m = 0; m < moves.length; m++) {
      this.makeMove(moves[m]);
      if (!this.kingAttacked(us)) legalMoves.push(moves[m]);
      this.undoMove();
    }
    return legalMoves;
  };

  Chess.prototype.isAttacked = function (color, square) {
    for (var i = 0; i <= 119; i++) {
      if (i & 0x88) { i += 7; continue; }
      var piece = this.board[i];
      if (!piece || piece.color !== color) continue;
      var diff = square - i;
      if (piece.type === PAWN) {
        var caps = color === WHITE ? [-17, -15] : [17, 15];
        if (diff === caps[0] || diff === caps[1]) return true;
        continue;
      }
      if (piece.type === KNIGHT || piece.type === KING) {
        var offs = OFFSETS[piece.type];
        for (var j = 0; j < offs.length; j++) if (diff === offs[j]) return true;
        continue;
      }
      var slides = OFFSETS[piece.type];
      for (var k = 0; k < slides.length; k++) {
        var sq = i;
        while (true) {
          sq += slides[k];
          if (sq & 0x88) break;
          if (sq === square) return true;
          if (this.board[sq]) break;
        }
      }
    }
    return false;
  };

  Chess.prototype.kingAttacked = function (color) {
    if (this.kings[color] === -1) return false;
    return this.isAttacked(swap(color), this.kings[color]);
  };

  Chess.prototype.inCheck = function () { return this.kingAttacked(this.turnColor); };
  Chess.prototype.isCheckmate = function () { return this.inCheck() && this.generateMoves().length === 0; };
  Chess.prototype.isStalemate = function () { return !this.inCheck() && this.generateMoves().length === 0; };

  Chess.prototype.insufficientMaterial = function () {
    var counts = {}, bishops = [], pieces = 0;
    for (var i = 0; i <= 119; i++) {
      if (i & 0x88) { i += 7; continue; }
      var p = this.board[i];
      if (!p) continue;
      pieces++;
      counts[p.type] = (counts[p.type] || 0) + 1;
      if (p.type === BISHOP) bishops.push((rank(i) + file(i)) % 2);
    }
    if (pieces === 2) return true;
    if (pieces === 3 && (counts[BISHOP] === 1 || counts[KNIGHT] === 1)) return true;
    if (pieces === bishops.length + 2) {
      var sum = bishops.reduce(function (a, b) { return a + b; }, 0);
      if (sum === 0 || sum === bishops.length) return true;
    }
    return false;
  };

  Chess.prototype.isGameOver = function () {
    return this.isCheckmate() || this.isStalemate() || this.halfMoves >= 100 || this.insufficientMaterial();
  };

  Chess.prototype.makeMove = function (move) {
    var us = this.turnColor, them = swap(us);
    this.history.push({
      move: move,
      kings: { w: this.kings.w, b: this.kings.b },
      turn: this.turnColor,
      castling: { w: this.castling.w, b: this.castling.b },
      epSquare: this.epSquare,
      halfMoves: this.halfMoves,
      moveNumber: this.moveNumber
    });

    this.board[move.to] = this.board[move.from];
    this.board[move.from] = null;

    if (move.flags & BITS.EP_CAPTURE) {
      this.board[us === BLACK ? move.to - 16 : move.to + 16] = null;
    }
    if (move.flags & BITS.PROMOTION) {
      this.board[move.to] = { type: move.promotion, color: us };
    }
    if (this.board[move.to].type === KING) {
      this.kings[us] = move.to;
      if (move.flags & BITS.KSIDE_CASTLE) {
        this.board[move.to - 1] = this.board[move.to + 1];
        this.board[move.to + 1] = null;
      } else if (move.flags & BITS.QSIDE_CASTLE) {
        this.board[move.to + 1] = this.board[move.to - 2];
        this.board[move.to - 2] = null;
      }
      this.castling[us] = 0;
    }

    if (this.castling[us]) {
      for (var i = 0; i < ROOKS[us].length; i++) {
        if (move.from === ROOKS[us][i].square && (this.castling[us] & ROOKS[us][i].flag)) {
          this.castling[us] ^= ROOKS[us][i].flag;
          break;
        }
      }
    }
    if (this.castling[them]) {
      for (var j = 0; j < ROOKS[them].length; j++) {
        if (move.to === ROOKS[them][j].square && (this.castling[them] & ROOKS[them][j].flag)) {
          this.castling[them] ^= ROOKS[them][j].flag;
          break;
        }
      }
    }

    this.epSquare = (move.flags & BITS.BIG_PAWN)
      ? (us === WHITE ? move.to + 16 : move.to - 16)
      : -1;

    if (move.piece === PAWN || (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE))) this.halfMoves = 0;
    else this.halfMoves++;

    if (us === BLACK) this.moveNumber++;
    this.turnColor = them;
  };

  Chess.prototype.undoMove = function () {
    var old = this.history.pop();
    if (!old) return null;
    var move = old.move;
    this.kings = old.kings;
    this.turnColor = old.turn;
    this.castling = old.castling;
    this.epSquare = old.epSquare;
    this.halfMoves = old.halfMoves;
    this.moveNumber = old.moveNumber;

    var us = this.turnColor, them = swap(us);

    this.board[move.from] = this.board[move.to];
    this.board[move.from].type = move.piece;
    this.board[move.to] = null;

    if (move.flags & BITS.CAPTURE) {
      this.board[move.to] = { type: move.captured, color: them };
    } else if (move.flags & BITS.EP_CAPTURE) {
      var idx = us === BLACK ? move.to - 16 : move.to + 16;
      this.board[idx] = { type: PAWN, color: them };
    }
    if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
      var castlingTo, castlingFrom;
      if (move.flags & BITS.KSIDE_CASTLE) { castlingTo = move.to + 1; castlingFrom = move.to - 1; }
      else { castlingTo = move.to - 2; castlingFrom = move.to + 1; }
      this.board[castlingTo] = this.board[castlingFrom];
      this.board[castlingFrom] = null;
    }
    return move;
  };

  Chess.prototype.moveToSan = function (move, moves) {
    var output = '';
    if (move.flags & BITS.KSIDE_CASTLE) output = 'O-O';
    else if (move.flags & BITS.QSIDE_CASTLE) output = 'O-O-O';
    else {
      if (move.piece !== PAWN) {
        output += move.piece.toUpperCase() + disambiguator(move, moves);
      }
      if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
        if (move.piece === PAWN) output += algebraic(move.from)[0];
        output += 'x';
      }
      output += algebraic(move.to);
      if (move.flags & BITS.PROMOTION) output += '=' + move.promotion.toUpperCase();
    }
    this.makeMove(move);
    if (this.inCheck()) output += this.isCheckmate() ? '#' : '+';
    this.undoMove();
    return output;
  };

  function disambiguator(move, moves) {
    var ambiguities = 0, sameRank = 0, sameFile = 0;
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      if (move.piece === m.piece && move.from !== m.from && move.to === m.to) {
        ambiguities++;
        if (rank(move.from) === rank(m.from)) sameRank++;
        if (file(move.from) === file(m.from)) sameFile++;
      }
    }
    if (!ambiguities) return '';
    var from = algebraic(move.from);
    if (sameRank > 0 && sameFile > 0) return from;
    if (sameFile > 0) return from[1];
    return from[0];
  }

  function cleanSan(san) { return String(san).replace(/[+#]?[?!]*$/, '').replace(/0/g, 'O'); }

  Chess.prototype.moveFromSan = function (san) {
    var moves = this.generateMoves();
    var target = cleanSan(san);
    for (var i = 0; i < moves.length; i++) {
      if (cleanSan(this.moveToSan(moves[i], moves)) === target) return moves[i];
    }
    return null;
  };

  Chess.prototype.prettyMove = function (move, moves) {
    var san = this.moveToSan(move, moves || this.generateMoves());
    return {
      color: move.color,
      from: algebraic(move.from),
      to: algebraic(move.to),
      piece: move.piece,
      san: san,
      captured: move.captured,
      promotion: move.promotion,
      flags: move.flags
    };
  };

  /* move(): accepts SAN string or {from, to, promotion} */
  Chess.prototype.move = function (input) {
    var moves = this.generateMoves();
    var chosen = null;
    if (typeof input === 'string') {
      var target = cleanSan(input);
      for (var i = 0; i < moves.length; i++) {
        if (cleanSan(this.moveToSan(moves[i], moves)) === target) { chosen = moves[i]; break; }
      }
    } else if (input && input.from && input.to) {
      var from = squareOf(input.from), to = squareOf(input.to);
      for (var j = 0; j < moves.length; j++) {
        if (moves[j].from === from && moves[j].to === to &&
            (!(moves[j].flags & BITS.PROMOTION) || moves[j].promotion === (input.promotion || QUEEN))) {
          chosen = moves[j]; break;
        }
      }
    }
    if (!chosen) return null;
    var pretty = this.prettyMove(chosen, moves);
    this.makeMove(chosen);
    return pretty;
  };

  Chess.prototype.undo = function () {
    var m = this.undoMove();
    return m ? { from: algebraic(m.from), to: algebraic(m.to), piece: m.piece, color: m.color } : null;
  };

  Chess.prototype.moves = function (options) {
    options = options || {};
    var opts = {};
    if (options.square) opts.square = squareOf(options.square);
    var ugly = this.generateMoves(opts);
    var self = this;
    var all = this.generateMoves();
    if (options.verbose) {
      return ugly.map(function (m) { return self.prettyMove(m, all); });
    }
    return ugly.map(function (m) { return self.moveToSan(m, all); });
  };

  Chess.prototype.historySan = function () {
    var reversed = [], sans = [];
    while (this.history.length > 0) reversed.push(this.undoMove());
    while (reversed.length > 0) {
      var m = reversed.pop();
      sans.push(this.moveToSan(m, this.generateMoves()));
      this.makeMove(m);
    }
    return sans;
  };

  /* Board as 8 rows of 8 for rendering; each entry null or {type,color,square} */
  Chess.prototype.grid = function () {
    var rows = [];
    for (var r = 0; r < 8; r++) {
      var row = [];
      for (var f = 0; f < 8; f++) {
        var sq = r * 16 + f;
        var p = this.board[sq];
        row.push(p ? { type: p.type, color: p.color, square: algebraic(sq) } : { square: algebraic(sq) });
      }
      rows.push(row);
    }
    return rows;
  };

  Chess.SQUARES = (function () {
    var out = [];
    for (var i = 0; i <= 119; i++) { if (i & 0x88) { i += 7; continue; } out.push(algebraic(i)); }
    return out;
  })();
  Chess.START_FEN = START_FEN;

  global.Chess = Chess;
})(typeof window !== 'undefined' ? window : globalThis);
