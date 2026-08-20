/* Regenerates test/fixtures/eco.json from the Lichess ECO database.
 *
 * The fixture is the independent source of truth for the `eco` field on every
 * opening: it records, for each line, the DEEPEST position in the database that
 * the line reaches, and the ECO code the database assigns to it. test/run.js
 * then checks the book against it, so an ECO code cannot drift and a line
 * cannot be edited without the mismatch showing up.
 *
 * Usage:
 *   curl -O https://raw.githubusercontent.com/lichess-org/chess-openings/master/{a,b,c,d,e}.tsv
 *   node test/tools/build-eco-fixture.js <dir-with-tsvs>
 *
 * Source: https://github.com/lichess-org/chess-openings (CC0). */
'use strict';
var fs = require('fs'), path = require('path');
var root = path.join(__dirname, '..', '..');
var g = {};
new Function('globalThis', 'window', fs.readFileSync(path.join(root, 'js/chess.js'), 'utf8') + ';return globalThis;')(g, g);
new Function('globalThis', 'window', fs.readFileSync(path.join(root, 'js/openings.js'), 'utf8') + ';return globalThis;')(g, g);

var dir = process.argv[2];
if (!dir) { console.error('usage: node build-eco-fixture.js <dir-with-a..e.tsv>'); process.exit(2); }
var posKey = function (c) { return c.fen().split(' ').slice(0, 4).join(' '); };

/* Index every database line by the position it reaches. */
var index = new Map(), lines = 0;
['a', 'b', 'c', 'd', 'e'].forEach(function (f) {
  fs.readFileSync(path.join(dir, f + '.tsv'), 'utf8').split('\n').slice(1).forEach(function (row) {
    if (!row.trim()) return;
    var parts = row.split('\t'), eco = parts[0], name = parts[1];
    var sans = parts[2].replace(/\d+\.(\.\.)?/g, '').trim().split(/\s+/).filter(Boolean);
    var c = new g.Chess();
    for (var i = 0; i < sans.length; i++) if (!c.move(sans[i])) return;
    lines++;
    index.set(posKey(c), { eco: eco, name: name });
  });
});

/* Lines whose exact position the database does not index, where the code has
 * been settled by hand. Keep the reason with the entry. */
var MANUAL = {
  'dutch-leningrad': {
    eco: 'A87',
    reason: 'This move order (2.g3 before c4) transposes into the Leningrad only at 7.Nc3, ' +
            'which the database indexes solely via its A88 (7...c6) and A89 (7...Nc6) children. ' +
            '7...Qe8 is neither, so it stays in the A87 parent bucket.'
  }
};

var out = { source: 'https://github.com/lichess-org/chess-openings', databaseLines: lines, openings: {} };
var unmatched = [];
g.OPENINGS.forEach(function (o) {
  if (MANUAL[o.id]) {
    out.openings[o.id] = { eco: MANUAL[o.id].eco, source: 'manual', reason: MANUAL[o.id].reason };
    return;
  }
  var c = new g.Chess(), best = null;
  o.moves.forEach(function (m, i) {
    c.move(m);
    var hit = index.get(posKey(c));
    if (hit) best = { ply: i + 1, fen: posKey(c), eco: hit.eco, name: hit.name };
  });
  if (!best) { unmatched.push(o.id); return; }
  best.source = 'lichess-deepest';
  out.openings[o.id] = best;
});
if (unmatched.length) console.error('no database match (add to MANUAL): ' + unmatched.join(', '));

fs.writeFileSync(path.join(root, 'test/fixtures/eco.json'), JSON.stringify(out, null, 2) + '\n');
console.log('wrote test/fixtures/eco.json from ' + lines + ' database lines, ' +
            Object.keys(out.openings).length + ' openings');
