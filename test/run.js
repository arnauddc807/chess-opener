/* Dependency-free checks: engine correctness (perft) + opening book validity.
 * Run with:  node test/run.js  */
'use strict';
var fs = require('fs'), path = require('path');
var ROOT = path.join(__dirname, '..');
var scope = {};
function load(f) { new Function('globalThis', 'window', fs.readFileSync(path.join(ROOT, f), 'utf8'))(scope, undefined); }
load('js/chess.js');
load('js/openings.js');
var Chess = scope.Chess;

var pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ok   ' + msg); }
  else { fail++; console.log('  FAIL ' + msg); }
}

function perft(c, depth) {
  if (depth === 0) return 1;
  var moves = c.generateMoves(), n = 0;
  for (var i = 0; i < moves.length; i++) { c.makeMove(moves[i]); n += perft(c, depth - 1); c.undoMove(); }
  return n;
}

console.log('\nengine — perft');
[
  ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', [20, 400, 8902, 197281], 'initial position'],
  ['r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039, 97862], 'kiwipete (castling, pins)'],
  ['8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238], 'en passant + discovered check'],
  ['r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1', [6, 264, 9467], 'promotions'],
  ['rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379], 'promotion with capture']
].forEach(function (t) {
  var c = new Chess(t[0]);
  t[1].forEach(function (expected, i) {
    var got = perft(c, i + 1);
    ok(got === expected, t[2] + ' depth ' + (i + 1) + ' = ' + expected + (got === expected ? '' : ' (got ' + got + ')'));
  });
});

console.log('\nengine — rules');
(function () {
  var c = new Chess();
  ['f3', 'e5', 'g4', 'Qh4'].forEach(function (m) { c.move(m); });
  ok(c.isCheckmate(), "Fool's mate is detected as checkmate");

  c = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  ok(c.isStalemate(), 'stalemate is detected');

  c = new Chess('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
  ok(c.move('exd5') !== null, 'pawn capture works');

  c = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  ok(c.move('O-O') !== null && c.get('f1').type === 'r', 'kingside castling moves the rook');

  c = new Chess('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
  ok(c.move('O-O-O') !== null && c.get('d8').type === 'r', 'queenside castling moves the rook');

  c = new Chess('8/3p4/8/4P3/8/8/8/K6k b - - 0 1');
  c.move('d5');
  ok(c.move('exd6') !== null && c.get('d5') === null, 'en passant removes the captured pawn');

  c = new Chess();
  var before = c.fen();
  c.move('e4'); c.undo();
  ok(c.fen() === before, 'undo restores the exact position');

  c = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  ok(c.moves().length === 20 && c.moves().indexOf('Nf3') >= 0, 'SAN move list generated');
})();

console.log('\nopening book');
var seen = {};
scope.OPENINGS.forEach(function (o) {
  var c = new Chess(), problem = null;
  for (var i = 0; i < o.moves.length; i++) {
    var m = c.move(o.moves[i]);
    if (!m) { problem = 'illegal move ' + (i + 1) + ' (' + o.moves[i] + ')'; break; }
    if (m.san !== o.moves[i]) { problem = 'move ' + (i + 1) + ' should be written ' + m.san; break; }
  }
  if (!problem && seen[o.id]) problem = 'duplicate id';
  if (!problem && (!o.idea || !o.plans || o.plans.length < 2)) problem = 'missing idea or plans';
  if (!problem && scope.FAMILIES.indexOf(o.family) === -1) problem = 'unknown family ' + o.family;
  if (!problem && o.moves.length < 6) problem = 'line is too short to drill';
  seen[o.id] = true;
  ok(!problem, o.id + (problem ? ' — ' + problem : ''));
});
ok(scope.OPENINGS.filter(function (o) { return o.side === 'w'; }).length >= 10, 'enough White lines');
ok(scope.OPENINGS.filter(function (o) { return o.side === 'b'; }).length >= 10, 'enough Black lines');

/* ECO codes, checked against the Lichess opening database rather than against
 * our own opinion. test/fixtures/eco.json records the deepest position each
 * line reaches and the code that database assigns to it; regenerate it with
 * test/tools/build-eco-fixture.js. Because the fixture pins the FEN as well as
 * the code, editing a line's moves fails here until the fixture is rebuilt. */
console.log('\nECO codes (vs. Lichess database)');
var fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/eco.json'), 'utf8'));
scope.OPENINGS.forEach(function (o) {
  var exp = fixture.openings[o.id];
  if (!exp) { ok(false, o.id + ' — no ECO fixture entry; rebuild test/fixtures/eco.json'); return; }
  if (exp.source === 'manual') {
    ok(o.eco === exp.eco, o.id + ' — ' + o.eco + ' (settled by hand: ' +
      (o.eco === exp.eco ? 'ok' : 'expected ' + exp.eco) + ')');
    return;
  }
  var c = new Chess(), reached = null;
  for (var i = 0; i < o.moves.length && i < exp.ply; i++) c.move(o.moves[i]);
  reached = c.fen().split(' ').slice(0, 4).join(' ');
  if (reached !== exp.fen) {
    ok(false, o.id + ' — line changed at ply ' + exp.ply + '; rebuild test/fixtures/eco.json');
    return;
  }
  ok(o.eco === exp.eco, o.id + ' — ' + o.eco +
    (o.eco === exp.eco ? ' (' + exp.name + ')' : ' should be ' + exp.eco + ' (' + exp.name + ')'));
});

/* Each line should finish on a move by the side being drilled, so the last
 * thing the learner does is play their own move. */
console.log('\nline shape');
scope.OPENINGS.forEach(function (o) {
  var lastMover = o.moves.length % 2 === 1 ? 'w' : 'b';
  ok(lastMover === o.side, o.id + ' — ends on a ' + lastMover + ' move, drilled as ' + o.side);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
