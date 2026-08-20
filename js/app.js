/* app.js — views, drill engine, sandbox and study book. */
(function () {
  'use strict';

  var OPENINGS = window.OPENINGS;
  var FAMILIES = window.FAMILIES;
  var Store = window.Store;

  /* ------------------------------------------------------------------ icons */
  var I = {
    train: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none"/>',
    sandbox: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    book: '<path d="M4 4.6A2.6 2.6 0 0 1 6.6 2H20v17.4H6.6A2.6 2.6 0 0 0 4 22z"/><path d="M4 19.4A2.6 2.6 0 0 1 6.6 16.8H20"/>',
    you: '<circle cx="12" cy="8" r="3.6"/><path d="M4.6 20.5a7.4 7.4 0 0 1 14.8 0"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    undo: '<path d="M4 9h11a5 5 0 0 1 0 10h-4"/><path d="M8 5L4 9l4 4"/>',
    flip: '<path d="M17 3l4 4-4 4"/><path d="M21 7H8a4 4 0 0 0-4 4v1"/><path d="M7 21l-4-4 4-4"/><path d="M3 17h13a4 4 0 0 0 4-4v-1"/>',
    reset: '<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3"/><path d="M3 4.5V10h5.5"/>',
    bulb: '<path d="M9.5 18h5"/><path d="M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.8 1 .9 1.6h5c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z"/>',
    play: '<path d="M7 4.6l12.5 7.4L7 19.4z"/>',
    next: '<path d="M4.5 12h14"/><path d="M13 6l6 6-6 6"/>',
    prev: '<path d="M19.5 12h-14"/><path d="M11 6l-6 6 6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.2v2.6M12 19.2v2.6M4.6 4.6l1.9 1.9M17.5 17.5l1.9 1.9M2.2 12h2.6M19.2 12h2.6M4.6 19.4l1.9-1.9M17.5 6.5l1.9-1.9"/>',
    flame: '<path d="M12 22a7 7 0 0 0 7-7c0-5-4.2-6-4.2-10.2 0 0-2.8 1.4-2.8 5 0-1.5-1-3-2.6-3.6C9.4 8.2 5 9.7 5 15a7 7 0 0 0 7 7z"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M4 12.5l5.2 5.2L20 7"/>',
    skip: '<path d="M5 5l9 7-9 7z"/><path d="M18 5v14"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'
  };

  function svg(name, size) {
    return '<svg viewBox="0 0 24 24" ' + (size ? 'width="' + size + '" height="' + size + '"' : '') + '>' + I[name] + '</svg>';
  }

  /* ---------------------------------------------------------------- helpers */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(sel, evt, fn, root) {
    qsa(sel, root).forEach(function (n) { n.addEventListener(evt, fn); });
  }
  function byId(id) { return OPENINGS.filter(function (o) { return o.id === id; })[0]; }
  function sideName(s) { return s === 'w' ? 'White' : 'Black'; }

  var toastTimer;
  function toast(msg) {
    var t = qs('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1900);
  }

  function buzz(pattern) {
    if (navigator.vibrate && Store.settings().sound) { try { navigator.vibrate(pattern); } catch (e) {} }
  }

  /* -------------------------------------------------------------------- sfx */
  var Sfx = (function () {
    var ctx = null;
    function ac() {
      if (!Store.settings().sound) return null;
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, dur, type, gain, delay) {
      var c = ac(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      var t0 = c.currentTime + (delay || 0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain || 0.09, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    }
    return {
      move: function () { tone(320, 0.07, 'triangle', 0.07); },
      right: function () { tone(660, 0.1, 'sine', 0.07); tone(990, 0.13, 'sine', 0.055, 0.07); },
      wrong: function () { tone(150, 0.18, 'sawtooth', 0.05); },
      done: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.16, 'sine', 0.06, i * 0.09); }); }
    };
  })();

  /* ------------------------------------------------------------------- data */
  function filteredOpenings() {
    var s = Store.settings();
    return OPENINGS.filter(function (o) {
      if (s.side !== 'both' && o.side !== s.side) return false;
      if (s.levels.indexOf(o.level) === -1) return false;
      return true;
    });
  }

  function dueOpenings() {
    return filteredOpenings().filter(function (o) {
      return Store.status(o.id) !== 'new' && Store.isDue(o.id);
    }).sort(function (a, b) {
      return (Store.get(a.id).dueAt || 0) - (Store.get(b.id).dueAt || 0);
    });
  }

  function newOpenings() {
    return filteredOpenings().filter(function (o) { return Store.status(o.id) === 'new'; })
      .sort(function (a, b) { return a.level - b.level; });
  }

  function buildSession(size) {
    size = size || 5;
    var out = dueOpenings().slice(0, size);
    if (out.length < size) {
      var fresh = newOpenings();
      for (var i = 0; i < fresh.length && out.length < size; i++) out.push(fresh[i]);
    }
    if (out.length < size) {
      var rest = filteredOpenings().filter(function (o) {
        return out.indexOf(o) === -1;
      }).sort(function () { return Math.random() - 0.5; });
      for (var j = 0; j < rest.length && out.length < size; j++) out.push(rest[j]);
    }
    return out;
  }

  /* ------------------------------------------------------------------- shell */
  var App = {
    view: 'train',
    params: {},
    token: 0,
    board: null,
    drill: null,
    sandbox: null,
    detail: null
  };

  function setTab(name) {
    qsa('.tabbar button').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === name); });
  }

  function tabFor(view) {
    if (view === 'drill' || view === 'result' || view === 'train') return 'train';
    if (view === 'sandbox') return 'sandbox';
    if (view === 'book' || view === 'detail') return 'book';
    return 'you';
  }

  function go(view, params) {
    if (App.board) { App.board.destroy(); App.board = null; }
    if (App.detail && App.detail.timer) clearInterval(App.detail.timer);
    App.token++;
    App.view = view;
    App.params = params || {};
    setTab(tabFor(view));
    render();
    window.scrollTo(0, 0);
  }
  App.go = go;

  function render() {
    var main = qs('#main');
    var renderers = {
      train: renderTrain, drill: renderDrill, result: renderResult,
      sandbox: renderSandbox, book: renderBook, detail: renderDetail, you: renderYou
    };
    main.innerHTML = '';
    var view = document.createElement('div');
    view.className = 'view';
    main.appendChild(view);
    renderers[App.view](view);
    renderBadges();
  }

  function setBar(title, sub, opts) {
    opts = opts || {};
    var bar = qs('#appbar');
    var left = opts.back
      ? '<button class="icon-btn" id="back-btn" aria-label="Back">' + svg('back') + '</button>'
      : '';
    var right = opts.right || '';
    bar.innerHTML = left +
      '<h1>' + esc(title) + (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</h1>' + right;
    if (opts.back) qs('#back-btn').addEventListener('click', opts.back);
  }

  function renderBadges() {
    var n = dueOpenings().length;
    var badge = qs('.tabbar [data-tab="train"] .badge');
    if (badge) badge.remove();
    if (n > 0) {
      var b = document.createElement('span');
      b.className = 'badge';
      b.textContent = n > 99 ? '99+' : n;
      qs('.tabbar [data-tab="train"]').appendChild(b);
    }
  }

  /* -------------------------------------------------------------- TRAIN home */
  function renderTrain(root) {
    var stats = Store.stats();
    setBar('Train', null, {
      right: '<span class="streak-chip">' + svg('flame', 15) + ' ' + stats.streak + '</span>'
    });

    var due = dueOpenings(), fresh = newOpenings();
    var all = filteredOpenings();
    var learned = all.filter(function (o) { return Store.status(o.id) === 'learned'; }).length;

    var html = '';

    html += '<div class="card">' +
      '<div class="row spread" style="align-items:flex-start">' +
        '<div class="grow">' +
          '<div style="font-size:19px;font-weight:700;letter-spacing:-.02em">Today\'s session</div>' +
          '<div class="muted tiny" style="margin-top:3px">' +
            (due.length ? due.length + ' line' + (due.length === 1 ? '' : 's') + ' due for review' :
             fresh.length ? 'Nothing due — learn something new' : 'Everything reviewed. Free practice!') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="stat-grid" style="margin:14px 0 12px">' +
        '<div class="stat"><div class="v" style="color:var(--accent)">' + due.length + '</div><div class="k">Due</div></div>' +
        '<div class="stat"><div class="v" style="color:var(--info)">' + fresh.length + '</div><div class="k">New</div></div>' +
        '<div class="stat"><div class="v" style="color:var(--good)">' + learned + '</div><div class="k">Learned</div></div>' +
      '</div>' +
      '<button class="btn btn-primary btn-block" id="start-session">' + svg('play', 18) + ' Start 5-line session</button>' +
      '</div>';

    var upNext = buildSession(5);
    html += '<div class="section-title">Up next</div><div class="op-list">';
    upNext.forEach(function (o) { html += openingRow(o); });
    html += '</div>';

    html += '<div class="section-title">Quick start</div>' +
      '<div class="row" style="gap:8px">' +
        '<button class="btn grow" id="random-line">Random line</button>' +
        '<button class="btn grow" id="learn-new"' + (fresh.length ? '' : ' disabled') + '>Learn a new one</button>' +
      '</div>';

    root.innerHTML = html;

    qs('#start-session').addEventListener('click', function () { startSession(buildSession(5)); });
    qs('#random-line').addEventListener('click', function () {
      var list = filteredOpenings();
      startSession([list[Math.floor(Math.random() * list.length)]]);
    });
    qs('#learn-new').addEventListener('click', function () {
      var f = newOpenings();
      if (f.length) startSession([f[0]]);
    });
    bindOpeningRows(root, function (o) { startSession([o]); });
  }

  function openingRow(o, opts) {
    opts = opts || {};
    var status = Store.status(o.id);
    var e = Store.get(o.id);
    var box = e ? e.box : 0;
    var mastery = '';
    for (var i = 1; i <= 5; i++) mastery += '<i class="' + (box >= i ? 'on' : '') + '"></i>';
    var label = { new: 'New', learning: 'Learning', learned: 'Learned' }[status];
    return '<button class="op-item" data-open="' + o.id + '">' +
      '<div class="op-mark ' + o.side + '">' + window.Pieces.svg('p', o.side) + '</div>' +
      '<div class="op-body">' +
        '<div class="op-name">' + esc(o.name) + '</div>' +
        '<div class="op-var">' + esc(o.variation) + ' · ' + esc(o.eco) + '</div>' +
        '<div class="op-tags">' +
          '<span class="pill pill-' + status + '">' + label + '</span>' +
          '<span class="pill">as ' + sideName(o.side) + '</span>' +
          (opts.showDue && e ? '<span class="pill">' + esc(Store.dueLabel(o.id)) + '</span>' : '') +
        '</div>' +
        '<div class="mastery">' + mastery + '</div>' +
      '</div>' +
      '<span class="chev">' + svg('chev') + '</span>' +
    '</button>';
  }

  function bindOpeningRows(root, fn) {
    on('.op-item', 'click', function () { fn(byId(this.dataset.open)); }, root);
  }

  /* ------------------------------------------------------------------ DRILL */
  function startSession(list) {
    App.session = { queue: list.slice(), index: 0, results: [] };
    startDrill(App.session.queue[0]);
  }

  function startDrill(opening) {
    App.drill = {
      opening: opening,
      chess: new window.Chess(),
      ply: 0,
      errors: 0,
      hintLevel: 0,
      done: false,
      revealed: false
    };
    go('drill');
  }

  function renderDrill(root) {
    var d = App.drill;
    var o = d.opening;
    var total = o.moves.length;
    var mine = 0;
    for (var i = 0; i < total; i++) if ((i % 2 === 0 ? 'w' : 'b') === o.side) mine++;

    setBar(o.name, o.variation, {
      back: function () { go('train'); },
      right: '<button class="icon-btn" id="drill-info" aria-label="Line info">' + svg('eye') + '</button>'
    });

    root.innerHTML =
      '<div class="drill-head">' +
        '<div class="grow">' +
          '<div class="meta">' + esc(o.eco) + ' · playing <strong>' + sideName(o.side) + '</strong> · ' + mine + ' moves to recall</div>' +
        '</div>' +
        '<span class="pill pill-' + Store.status(o.id) + '">' + { new: 'New', learning: 'Learning', learned: 'Learned' }[Store.status(o.id)] + '</span>' +
      '</div>' +
      '<div class="progress-track"><div class="progress-fill" id="drill-progress" style="width:0%"></div></div>' +
      '<div class="board-wrap fit" style="--board-reserve:372px"><div id="board"></div></div>' +
      '<div class="prompt" id="prompt"><span class="dot"></span><span id="prompt-text">Get ready…</span></div>' +
      '<div class="movelist" id="movelist"></div>' +
      '<div class="action-row">' +
        '<button class="btn btn-sm" id="btn-hint">' + svg('bulb', 17) + ' Hint</button>' +
        '<button class="btn btn-sm" id="btn-answer">' + svg('eye', 17) + ' Answer</button>' +
        '<button class="btn btn-sm" id="btn-skip">' + svg('skip', 17) + ' Skip</button>' +
      '</div>';

    App.board = new window.Board(qs('#board'), {
      chess: d.chess,
      orientation: o.side,
      showCoords: Store.settings().showCoords,
      onMove: onDrillMove
    });

    qs('#btn-hint').addEventListener('click', drillHint);
    qs('#btn-answer').addEventListener('click', drillAnswer);
    qs('#btn-skip').addEventListener('click', function () { finishDrill(true); });
    qs('#drill-info').addEventListener('click', function () { go('detail', { id: o.id, from: 'drill' }); });

    updateDrillUI();
    scheduleOpponent();
  }

  function drillSideToMove() {
    return App.drill.ply % 2 === 0 ? 'w' : 'b';
  }

  function updateDrillUI() {
    var d = App.drill;
    if (!d) return;
    var o = d.opening;
    var pct = Math.round((d.ply / o.moves.length) * 100);
    var bar = qs('#drill-progress');
    if (bar) bar.style.width = pct + '%';

    var ml = qs('#movelist');
    if (ml) {
      var html = '';
      for (var i = 0; i < o.moves.length; i++) {
        if (i % 2 === 0) html += '<span class="mv num">' + (i / 2 + 1) + '.</span>';
        if (i < d.ply) html += '<span class="mv' + (i === d.ply - 1 ? ' cur' : '') + '">' + esc(o.moves[i]) + '</span>';
        else html += '<span class="mv hidden-move">···</span>';
      }
      ml.innerHTML = html;
    }
    if (App.board) App.board.update();
  }

  function setPrompt(text, cls) {
    var p = qs('#prompt');
    if (!p) return;
    p.className = 'prompt ' + (cls || '');
    if (!cls || cls === 'turn-w' || cls === 'turn-b') p.classList.add('turn-' + drillSideToMove());
    qs('#prompt-text').innerHTML = text;
  }

  function scheduleOpponent() {
    var d = App.drill;
    if (!d || d.done) return;
    if (d.ply >= d.opening.moves.length) { finishDrill(false); return; }

    if (drillSideToMove() === d.opening.side) {
      App.board.setLocked(false);
      var num = Math.floor(d.ply / 2) + 1;
      setPrompt('Your move as <strong>' + sideName(d.opening.side) + '</strong> — move ' + num);
      return;
    }

    App.board.setLocked(true);
    setPrompt('Opponent is replying…', 'thinking');
    var tok = App.token;
    setTimeout(function () {
      if (App.token !== tok || App.drill !== d || d.done) return;
      var san = d.opening.moves[d.ply];
      var m = d.chess.move(san);
      if (m) {
        App.board.setLastMove(m.from, m.to);
        Sfx.move();
      }
      d.ply++;
      d.hintLevel = 0;
      App.board.setHint(null);
      updateDrillUI();
      scheduleOpponent();
    }, d.ply === 0 ? 420 : 640);
  }

  function onDrillMove(from, to, promotion) {
    var d = App.drill;
    if (!d || d.done) return;
    var expected = d.opening.moves[d.ply];
    var move = d.chess.move({ from: from, to: to, promotion: promotion || 'q' });
    if (!move) return;

    if (move.san === expected) {
      App.board.setLastMove(from, to);
      App.board.setHint(null);
      Store.recordMove(true);
      d.ply++;
      d.hintLevel = 0;
      updateDrillUI();
      Sfx.right();
      buzz(12);
      setPrompt('<strong>' + esc(expected) + '</strong> — that\'s the book move.', 'ok');
      var tok = App.token;
      setTimeout(function () { if (App.token === tok) scheduleOpponent(); }, 480);
    } else {
      d.chess.undo();
      App.board.update();
      App.board.flashError(to);
      Store.recordMove(false);
      d.errors++;
      Sfx.wrong();
      buzz([18, 40, 18]);
      setPrompt('<strong>' + esc(move.san) + '</strong> isn\'t the book move here. Try again — or tap Hint.', 'err');
    }
  }

  function drillHint() {
    var d = App.drill;
    if (!d || d.done || drillSideToMove() !== d.opening.side) return;
    var expected = d.opening.moves[d.ply];
    var m = d.chess.moveFromSan(expected);
    if (!m) return;
    var pretty = d.chess.prettyMove(m);
    d.hintLevel++;
    if (d.hintLevel === 1) {
      App.board.setHint({ from: pretty.from });
      setPrompt('Move this piece — the <strong>' + window.Pieces.names[pretty.piece] + '</strong>.', 'turn-' + d.opening.side);
    } else {
      App.board.setHint({ from: pretty.from, to: pretty.to });
      setPrompt('Play <strong>' + esc(pretty.from) + ' → ' + esc(pretty.to) + '</strong>.', 'turn-' + d.opening.side);
      d.errors += (d.hintLevel === 2 ? 1 : 0);
    }
  }

  function drillAnswer() {
    var d = App.drill;
    if (!d || d.done || drillSideToMove() !== d.opening.side) return;
    var expected = d.opening.moves[d.ply];
    var m = d.chess.move(expected);
    if (!m) return;
    d.errors++;
    d.ply++;
    d.hintLevel = 0;
    App.board.setLastMove(m.from, m.to);
    App.board.setHint(null);
    Sfx.move();
    updateDrillUI();
    setPrompt('The move was <strong>' + esc(expected) + '</strong>.', 'turn-' + d.opening.side);
    var tok = App.token;
    setTimeout(function () { if (App.token === tok) scheduleOpponent(); }, 620);
  }

  function finishDrill(skipped) {
    var d = App.drill;
    if (!d || d.done) return;
    d.done = true;
    var result = { opening: d.opening, errors: d.errors, skipped: !!skipped };
    if (!skipped) {
      result.record = Store.recordRun(d.opening.id, d.errors);
      Sfx.done();
      buzz([14, 50, 14, 50, 22]);
    }
    else Store.flush();
    if (App.session) App.session.results.push(result);
    go('result', { result: result });
  }

  /* ----------------------------------------------------------------- RESULT */
  function renderResult(root) {
    var r = App.params.result;
    var o = r.opening;
    var s = App.session;
    var hasNext = s && s.index + 1 < s.queue.length;

    setBar('Session', null, { back: function () { App.session = null; go('train'); } });

    var perfect = !r.skipped && r.errors === 0;
    var title = r.skipped ? 'Skipped' : perfect ? 'Flawless!' : r.errors <= 2 ? 'Nicely done' : 'Keep at it';
    var face = r.skipped ? '⏭' : perfect ? '★' : r.errors <= 2 ? '✓' : '↻';
    var msg = r.skipped ? 'No progress recorded for this line.'
      : perfect ? 'Every move from memory. This line moves up a level.'
      : r.errors <= 2 ? 'Almost there — a couple of slips.'
      : 'This one needs another pass. It will come back soon.';

    var html = '<div class="card">' +
      '<div class="result-hero">' +
        '<div class="big" style="color:' + (perfect ? 'var(--good)' : r.skipped ? 'var(--text-faint)' : 'var(--accent)') + '">' + face + '</div>' +
        '<h2>' + title + '</h2>' +
        '<p>' + msg + '</p>' +
      '</div>' +
      '<div class="stat-grid">' +
        '<div class="stat"><div class="v">' + r.errors + '</div><div class="k">Slips</div></div>' +
        '<div class="stat"><div class="v">' + (r.record ? '+' + r.record.xp : '—') + '</div><div class="k">XP</div></div>' +
        '<div class="stat"><div class="v">' + (r.record ? 'L' + r.record.box : '—') + '</div><div class="k">Level</div></div>' +
      '</div>' +
      '<div class="tiny muted" style="text-align:center">' + esc(o.name) + ' · ' + esc(Store.dueLabel(o.id)) + '</div>' +
      '</div>';

    html += '<div class="card card-tight">' +
      '<div class="tiny faint" style="margin-bottom:6px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">The line</div>' +
      '<div class="movelist" style="max-height:none">' + moveListHtml(o.moves) + '</div>' +
      '<div class="divider"></div>' +
      '<div class="idea">' + esc(o.idea) + '</div>' +
      '</div>';

    html += '<div class="row" style="gap:8px;margin-top:4px">' +
      '<button class="btn grow" id="again">' + svg('reset', 17) + ' Again</button>' +
      (hasNext
        ? '<button class="btn btn-primary grow" id="next">Next line ' + svg('next', 17) + '</button>'
        : '<button class="btn btn-primary grow" id="finish">' + svg('check', 17) + ' Finish</button>') +
      '</div>';

    html += '<button class="btn btn-ghost btn-block" id="study" style="margin-top:10px">Open in study book</button>';

    root.innerHTML = html;

    qs('#again').addEventListener('click', function () { startDrill(o); });
    qs('#study').addEventListener('click', function () { go('detail', { id: o.id }); });
    if (hasNext) {
      qs('#next').addEventListener('click', function () {
        App.session.index++;
        startDrill(App.session.queue[App.session.index]);
      });
    } else {
      qs('#finish').addEventListener('click', function () {
        var res = App.session ? App.session.results : [];
        App.session = null;
        if (res.length > 1) toast('Session complete — ' + res.length + ' lines');
        go('train');
      });
    }
  }

  function moveListHtml(moves, upto, tappable) {
    var html = '';
    for (var i = 0; i < moves.length; i++) {
      if (i % 2 === 0) html += '<span class="mv num">' + (i / 2 + 1) + '.</span>';
      var cls = 'mv' + (tappable ? ' tap' : '') + (upto !== undefined && i === upto - 1 ? ' cur' : '');
      html += '<span class="' + cls + '" data-ply="' + i + '">' + esc(moves[i]) + '</span>';
    }
    return html;
  }

  /* ---------------------------------------------------------------- SANDBOX */
  function renderSandbox(root) {
    var sb = App.sandbox;
    if (!sb) {
      sb = App.sandbox = {
        chess: new window.Chess(),
        history: [],
        orientation: 'w',
        autoBook: false,
        lastMatch: null
      };
    }

    setBar('Sandbox', 'Free play with a live opening guide', {
      right: '<button class="icon-btn" id="sb-flip" aria-label="Flip board">' + svg('flip') + '</button>'
    });

    root.innerHTML =
      '<div class="board-wrap fit" style="--board-reserve:300px"><div id="board"></div></div>' +
      '<div class="sandbox-status" id="sb-status"></div>' +
      '<div id="sb-book"></div>' +
      '<div class="action-row" style="grid-template-columns:repeat(3,1fr)">' +
        '<button class="btn btn-sm" id="sb-undo">' + svg('undo', 17) + ' Undo</button>' +
        '<button class="btn btn-sm" id="sb-reset">' + svg('reset', 17) + ' Reset</button>' +
        '<button class="btn btn-sm" id="sb-copy">FEN</button>' +
      '</div>' +
      '<div class="card card-tight" style="margin-top:12px">' +
        '<div class="toggle-row" id="sb-auto-row">' +
          '<div class="lbl">Book auto-reply<small>The other side answers with a book move</small></div>' +
          '<div class="switch' + (sb.autoBook ? ' on' : '') + '" id="sb-auto"></div>' +
        '</div>' +
      '</div>' +
      '<div class="section-title">Moves</div>' +
      '<div class="movelist" id="sb-moves" style="max-height:none"></div>';

    App.board = new window.Board(qs('#board'), {
      chess: sb.chess,
      orientation: sb.orientation,
      showCoords: Store.settings().showCoords,
      onMove: onSandboxMove
    });

    qs('#sb-flip').addEventListener('click', function () {
      sb.orientation = sb.orientation === 'w' ? 'b' : 'w';
      App.board.flip();
    });
    qs('#sb-undo').addEventListener('click', function () {
      if (!sb.history.length) return;
      sb.chess.undo();
      sb.history.pop();
      App.board.setLastMove(null, null);
      App.board.update();
      updateSandbox();
    });
    qs('#sb-reset').addEventListener('click', function () {
      sb.chess.reset();
      sb.history = [];
      App.board.setLastMove(null, null);
      App.board.update();
      updateSandbox();
    });
    qs('#sb-copy').addEventListener('click', function () {
      var fen = sb.chess.fen();
      if (navigator.clipboard) navigator.clipboard.writeText(fen).then(function () { toast('FEN copied'); },
        function () { toast(fen); });
      else toast(fen);
    });
    qs('#sb-auto-row').addEventListener('click', function () {
      sb.autoBook = !sb.autoBook;
      qs('#sb-auto').classList.toggle('on', sb.autoBook);
      toast(sb.autoBook ? 'Book auto-reply on' : 'Book auto-reply off');
    });

    updateSandbox();
  }

  function onSandboxMove(from, to, promotion) {
    var sb = App.sandbox;
    var m = sb.chess.move({ from: from, to: to, promotion: promotion || 'q' });
    if (!m) return;
    sb.history.push(m.san);
    App.board.setLastMove(from, to);
    App.board.update();
    Sfx.move();
    updateSandbox();

    if (sb.autoBook) {
      var replies = bookMovesFrom(sb.history);
      if (replies.length) {
        App.board.setLocked(true);
        var tok = App.token;
        setTimeout(function () {
          if (App.token !== tok) return;
          var pick = replies[0].san;
          var mm = sb.chess.move(pick);
          if (mm) {
            sb.history.push(mm.san);
            App.board.setLastMove(mm.from, mm.to);
            App.board.update();
            Sfx.move();
          }
          App.board.setLocked(false);
          updateSandbox();
        }, 520);
      }
    }
  }

  /* openings whose main line starts with the given move list */
  function matchingOpenings(history) {
    return OPENINGS.filter(function (o) {
      if (o.moves.length < history.length) return false;
      for (var i = 0; i < history.length; i++) if (o.moves[i] !== history[i]) return false;
      return true;
    });
  }

  function bookMovesFrom(history) {
    var matches = matchingOpenings(history);
    var seen = {}, out = [];
    matches.forEach(function (o) {
      var san = o.moves[history.length];
      if (!san) return;
      if (!seen[san]) { seen[san] = { san: san, names: [] }; out.push(seen[san]); }
      seen[san].names.push(o.name + (o.variation ? ' · ' + o.variation : ''));
    });
    return out;
  }

  function updateSandbox() {
    var sb = App.sandbox;
    var matches = matchingOpenings(sb.history);
    var status = qs('#sb-status');
    var bookWrap = qs('#sb-book');

    if (sb.history.length && matches.length) sb.lastMatch = { names: matches, depth: sb.history.length };

    if (!sb.history.length) {
      status.innerHTML = '<div class="txt"><div class="t1">Make a move</div>' +
        '<div class="t2">Every move is checked against the book</div></div>';
    } else if (matches.length) {
      var best = matches[0];
      status.innerHTML = '<span class="eco">' + esc(best.eco) + '</span>' +
        '<div class="txt"><div class="t1">' + esc(best.name) + '</div>' +
        '<div class="t2">' + (matches.length > 1
          ? matches.length + ' book lines still possible'
          : esc(best.variation) + ' · in book') + '</div></div>';
    } else {
      var lm = sb.lastMatch;
      status.innerHTML = '<span class="eco" style="background:var(--surface-2);color:var(--text-dim)">—</span>' +
        '<div class="txt"><div class="t1">Out of book</div>' +
        '<div class="t2">' + (lm ? 'Left ' + esc(lm.names[0].name) + ' after ' + lm.depth + ' plies' : 'No book line matches') + '</div></div>';
    }

    var replies = bookMovesFrom(sb.history);
    if (replies.length) {
      var html = '<div class="section-title">Book continuations</div><div class="book-moves">';
      replies.slice(0, 8).forEach(function (r) {
        html += '<button class="book-move" data-san="' + esc(r.san) + '">' + esc(r.san) +
          '<small>' + esc(r.names[0].split(' · ')[0]) + (r.names.length > 1 ? ' +' + (r.names.length - 1) : '') + '</small></button>';
      });
      html += '</div>';
      bookWrap.innerHTML = html;
      on('.book-move', 'click', function () {
        var m = sb.chess.move(this.dataset.san);
        if (!m) return;
        sb.history.push(m.san);
        App.board.setLastMove(m.from, m.to);
        App.board.update();
        Sfx.move();
        updateSandbox();
      }, bookWrap);
    } else {
      bookWrap.innerHTML = '';
    }

    var ml = qs('#sb-moves');
    if (ml) {
      ml.innerHTML = sb.history.length ? moveListHtml(sb.history, sb.history.length)
        : '<span class="mv num">No moves yet</span>';
    }

    if (matches.length === 1 && sb.history.length === matches[0].moves.length) {
      var o = matches[0];
      bookWrap.insertAdjacentHTML('beforeend',
        '<button class="btn btn-block btn-sm" id="sb-open-detail" style="margin-top:10px">' +
        'Complete line — open ' + esc(o.name) + ' in the book</button>');
      var btn = qs('#sb-open-detail');
      if (btn) btn.addEventListener('click', function () { go('detail', { id: o.id }); });
    }

    if (sb.chess.isGameOver()) {
      var msg = sb.chess.isCheckmate() ? 'Checkmate — ' + sideName(sb.chess.turn() === 'w' ? 'b' : 'w') + ' wins'
        : sb.chess.isStalemate() ? 'Stalemate' : 'Draw';
      status.innerHTML = '<span class="eco" style="background:var(--bad-soft);color:var(--bad)">END</span>' +
        '<div class="txt"><div class="t1">' + msg + '</div><div class="t2">Tap Reset to play again</div></div>';
    }
  }

  /* ------------------------------------------------------------------- BOOK */
  var bookFilter = { q: '', family: 'all', status: 'all', side: 'all' };

  function renderBook(root) {
    setBar('Study book', OPENINGS.length + ' lines to explore');

    var chips = function (key, opts) {
      return opts.map(function (o) {
        return '<button class="chip' + (bookFilter[key] === o.v ? ' on' : '') + '" data-f="' + key + '" data-v="' + esc(o.v) + '">' + esc(o.l) + '</button>';
      }).join('');
    };

    var html =
      '<div class="search-wrap">' + svg('search') +
        '<input class="search" id="book-search" type="search" placeholder="Search openings, ECO, ideas…" value="' + esc(bookFilter.q) + '">' +
      '</div>' +
      '<div class="filter-row">' + chips('status', [
        { v: 'all', l: 'All' }, { v: 'new', l: 'To discover' },
        { v: 'learning', l: 'Learning' }, { v: 'learned', l: 'Learned' }
      ]) + '</div>' +
      '<div class="filter-row">' + chips('side', [
        { v: 'all', l: 'Both colours' }, { v: 'w', l: 'As White' }, { v: 'b', l: 'As Black' }
      ]) + '</div>' +
      '<div class="filter-row">' + chips('family', [{ v: 'all', l: 'Every family' }].concat(
        FAMILIES.map(function (f) { return { v: f, l: f }; })
      )) + '</div>' +
      '<div id="book-list"></div>';

    root.innerHTML = html;

    qs('#book-search').addEventListener('input', function () {
      bookFilter.q = this.value;
      paintBookList();
    });
    on('.chip', 'click', function () {
      bookFilter[this.dataset.f] = this.dataset.v;
      qsa('.chip[data-f="' + this.dataset.f + '"]', root).forEach(function (c) { c.classList.remove('on'); });
      this.classList.add('on');
      paintBookList();
    }, root);

    paintBookList();
  }

  function paintBookList() {
    var q = bookFilter.q.trim().toLowerCase();
    var list = OPENINGS.filter(function (o) {
      if (bookFilter.family !== 'all' && o.family !== bookFilter.family) return false;
      if (bookFilter.side !== 'all' && o.side !== bookFilter.side) return false;
      if (bookFilter.status !== 'all' && Store.status(o.id) !== bookFilter.status) return false;
      if (q) {
        var hay = (o.name + ' ' + o.variation + ' ' + o.eco + ' ' + o.family + ' ' + o.idea + ' ' + o.moves.join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    var wrap = qs('#book-list');
    if (!list.length) {
      wrap.innerHTML = '<div class="empty"><div class="ic">♟</div><h3>Nothing here</h3>' +
        '<p>Try a different filter or search term.</p></div>';
      return;
    }

    var byFamily = {};
    list.forEach(function (o) { (byFamily[o.family] = byFamily[o.family] || []).push(o); });

    var html = '';
    FAMILIES.forEach(function (fam) {
      if (!byFamily[fam]) return;
      html += '<div class="section-title">' + esc(fam) + ' <span class="faint">(' + byFamily[fam].length + ')</span></div>';
      html += '<div class="op-list">';
      byFamily[fam].forEach(function (o) { html += openingRow(o, { showDue: true }); });
      html += '</div>';
    });
    wrap.innerHTML = html;
    bindOpeningRows(wrap, function (o) { go('detail', { id: o.id }); });
  }

  /* ----------------------------------------------------------------- DETAIL */
  function renderDetail(root) {
    var o = byId(App.params.id);
    var d = App.detail = { opening: o, chess: new window.Chess(), ply: 0, playing: false, timer: null };

    setBar(o.name, o.variation, {
      back: function () {
        clearInterval(d.timer);
        if (App.params.from === 'drill') go('train'); else go('book');
      }
    });

    var status = Store.status(o.id);
    var e = Store.get(o.id);

    root.innerHTML =
      '<div class="detail-head">' +
        '<div class="tags">' +
          '<span class="pill pill-' + status + '">' + { new: 'To discover', learning: 'Learning', learned: 'Learned' }[status] + '</span>' +
          '<span class="pill">' + esc(o.eco) + '</span>' +
          '<span class="pill pill-' + o.side + '">You play ' + sideName(o.side) + '</span>' +
          '<span class="pill">' + esc(window.LEVEL_NAMES[o.level]) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="board-wrap fit" style="--board-reserve:330px"><div id="board"></div></div>' +
      '<div class="sandbox-status" id="d-status"></div>' +
      '<div class="stepper">' +
        '<button class="btn btn-sm" id="d-start">' + svg('reset', 16) + '</button>' +
        '<button class="btn btn-sm" id="d-prev">' + svg('prev', 16) + '</button>' +
        '<button class="btn btn-sm" id="d-next">' + svg('next', 16) + '</button>' +
        '<button class="btn btn-sm" id="d-play">' + svg('play', 16) + '</button>' +
      '</div>' +
      '<div class="movelist" id="d-moves" style="max-height:none;margin-top:14px"></div>' +
      '<div class="card" style="margin-top:14px">' +
        '<div class="section-title" style="margin-top:0">The idea</div>' +
        '<div class="idea">' + esc(o.idea) + '</div>' +
        '<div class="section-title">Key plans</div>' +
        '<ul class="plans">' + o.plans.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      (e && e.attempts ? '<div class="card card-tight tiny muted">' +
        'Practised ' + e.attempts + ' time' + (e.attempts === 1 ? '' : 's') + ' · best run ' +
        (e.bestErrors === 0 ? 'flawless' : e.bestErrors + ' slip' + (e.bestErrors === 1 ? '' : 's')) +
        ' · ' + esc(Store.dueLabel(o.id)) + '</div>' : '') +
      '<button class="btn btn-primary btn-block" id="d-train" style="margin-top:6px">' + svg('play', 18) + ' Train this line</button>' +
      (e ? '<button class="btn btn-ghost btn-block btn-sm" id="d-forget" style="margin-top:10px;color:var(--text-faint)">Reset my progress on this line</button>' : '');

    App.board = new window.Board(qs('#board'), {
      chess: d.chess,
      orientation: o.side,
      interactive: false,
      showCoords: Store.settings().showCoords
    });
    App.board.setLocked(true);

    qs('#d-start').addEventListener('click', function () { detailGoto(0); });
    qs('#d-prev').addEventListener('click', function () { detailGoto(d.ply - 1); });
    qs('#d-next').addEventListener('click', function () { detailGoto(d.ply + 1); });
    qs('#d-play').addEventListener('click', detailTogglePlay);
    qs('#d-train').addEventListener('click', function () { clearInterval(d.timer); startSession([o]); });
    var forget = qs('#d-forget');
    if (forget) forget.addEventListener('click', function () {
      Store.resetOpening(o.id);
      toast('Progress reset');
      go('detail', App.params);
    });

    paintDetail();
  }

  function detailGoto(ply) {
    var d = App.detail;
    var o = d.opening;
    ply = Math.max(0, Math.min(o.moves.length, ply));
    if (ply === d.ply) return;
    if (ply < d.ply) {
      while (d.ply > ply) { d.chess.undo(); d.ply--; }
      App.board.setLastMove(null, null);
    } else {
      var last = null;
      while (d.ply < ply) { last = d.chess.move(o.moves[d.ply]); d.ply++; }
      if (last) App.board.setLastMove(last.from, last.to);
      Sfx.move();
    }
    App.board.update();
    paintDetail();
  }

  function detailTogglePlay() {
    var d = App.detail;
    if (d.playing) {
      clearInterval(d.timer);
      d.playing = false;
      qs('#d-play').innerHTML = svg('play', 16);
      return;
    }
    if (d.ply >= d.opening.moves.length) detailGoto(0);
    d.playing = true;
    qs('#d-play').innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    var tok = App.token;
    d.timer = setInterval(function () {
      if (App.token !== tok || App.detail !== d) { clearInterval(d.timer); return; }
      if (d.ply >= d.opening.moves.length) { detailTogglePlay(); return; }
      detailGoto(d.ply + 1);
    }, 900);
  }

  function paintDetail() {
    var d = App.detail;
    var o = d.opening;
    var ml = qs('#d-moves');
    if (ml) {
      ml.innerHTML = moveListHtml(o.moves, d.ply, true);
      on('.mv.tap', 'click', function () { detailGoto(parseInt(this.dataset.ply, 10) + 1); }, ml);
    }
    var st = qs('#d-status');
    if (st) {
      var turn = d.ply % 2 === 0 ? 'White' : 'Black';
      st.innerHTML = '<span class="eco">' + (d.ply === 0 ? 'START' : (Math.floor((d.ply - 1) / 2) + 1) + (d.ply % 2 ? '.' : '…')) + '</span>' +
        '<div class="txt"><div class="t1">' +
          (d.ply === 0 ? 'Starting position' : 'After ' + esc(o.moves[d.ply - 1])) + '</div>' +
        '<div class="t2">' + (d.ply >= o.moves.length ? 'End of the line' : turn + ' to move · ' + (o.moves.length - d.ply) + ' left') + '</div></div>';
    }
    qs('#d-prev').disabled = d.ply === 0;
    qs('#d-next').disabled = d.ply >= o.moves.length;
  }

  /* -------------------------------------------------------------------- YOU */
  function renderYou(root) {
    var st = Store.stats();
    var s = Store.settings();
    setBar('Progress', 'Your repertoire at a glance');

    var counts = { new: 0, learning: 0, learned: 0 };
    OPENINGS.forEach(function (o) { counts[Store.status(o.id)]++; });
    var total = OPENINGS.length;
    var totalMoves = st.movesRight + st.movesWrong;
    var acc = totalMoves ? Math.round((st.movesRight / totalMoves) * 100) : 0;

    var html = '<div class="card">' +
      '<div class="stat-grid" style="margin:0">' +
        '<div class="stat"><div class="v" style="color:var(--accent)">' + st.streak + '</div><div class="k">Day streak</div></div>' +
        '<div class="stat"><div class="v">' + st.xp + '</div><div class="k">XP</div></div>' +
        '<div class="stat"><div class="v">' + acc + '%</div><div class="k">Accuracy</div></div>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="row spread tiny"><span class="muted">Repertoire mastered</span>' +
        '<span><strong>' + counts.learned + '</strong> <span class="faint">/ ' + total + '</span></span></div>' +
      '<div class="xp-bar"><i style="width:' + Math.round((counts.learned / total) * 100) + '%"></i></div>' +
      '<div class="row row-wrap tiny" style="gap:8px;margin-top:12px">' +
        '<span class="tiny"><span class="pill pill-learned">' + counts.learned + ' learned</span></span>' +
        '<span class="tiny"><span class="pill pill-learning">' + counts.learning + ' learning</span></span>' +
        '<span class="tiny"><span class="pill pill-new">' + counts.new + ' to discover</span></span>' +
      '</div>' +
      '<div class="tiny muted" style="margin-top:12px">' + st.drillsDone + ' drills completed · ' + totalMoves + ' moves recalled</div>' +
    '</div>';

    html += '<div class="section-title">Training filter</div><div class="card">' +
      '<div class="tiny muted" style="margin-bottom:10px">Which lines the daily session draws from.</div>' +
      '<div class="filter-row" style="margin:0;padding-left:0;padding-right:0">' +
        [['both', 'Both colours'], ['w', 'As White'], ['b', 'As Black']].map(function (p) {
          return '<button class="chip' + (s.side === p[0] ? ' on' : '') + '" data-side="' + p[0] + '">' + p[1] + '</button>';
        }).join('') +
      '</div>' +
      '<div class="filter-row" style="margin:0;padding-left:0;padding-right:0;padding-bottom:0">' +
        [[1, 'Starter'], [2, 'Core'], [3, 'Advanced']].map(function (p) {
          return '<button class="chip' + (s.levels.indexOf(p[0]) >= 0 ? ' on' : '') + '" data-level="' + p[0] + '">' + p[1] + '</button>';
        }).join('') +
      '</div></div>';

    html += '<div class="section-title">Board</div><div class="card">' +
      '<div class="filter-row" style="margin:0;padding-left:0;padding-right:0">' +
        [['forest', 'Forest'], ['walnut', 'Walnut'], ['ocean', 'Ocean'], ['slate', 'Slate']].map(function (p) {
          return '<button class="chip' + (s.boardTheme === p[0] ? ' on' : '') + '" data-board="' + p[0] + '">' + p[1] + '</button>';
        }).join('') +
      '</div>' +
      '<div class="toggle-row" data-toggle="showCoords">' +
        '<div class="lbl">Coordinates<small>Show file and rank labels</small></div>' +
        '<div class="switch' + (s.showCoords ? ' on' : '') + '"></div>' +
      '</div>' +
      '<div class="toggle-row" data-toggle="sound">' +
        '<div class="lbl">Sound &amp; haptics<small>Feedback on every move</small></div>' +
        '<div class="switch' + (s.sound ? ' on' : '') + '"></div>' +
      '</div></div>';

    html += '<div class="section-title">Data</div><div class="card">' +
      '<button class="btn btn-block btn-sm" id="export">Export progress</button>' +
      '<button class="btn btn-block btn-sm" id="import" style="margin-top:8px">Import progress</button>' +
      '<button class="btn btn-block btn-sm" id="wipe" style="margin-top:8px;color:var(--bad)">Reset everything</button>' +
      '</div>' +
      '<div class="tiny faint" style="text-align:center;margin-top:18px">Chess Opener · works offline · your progress stays on this device</div>';

    root.innerHTML = html;

    on('[data-side]', 'click', function () { Store.setSetting('side', this.dataset.side); render(); }, root);
    on('[data-level]', 'click', function () {
      var lv = parseInt(this.dataset.level, 10);
      var levels = Store.settings().levels.slice();
      var i = levels.indexOf(lv);
      if (i >= 0) { if (levels.length > 1) levels.splice(i, 1); } else levels.push(lv);
      Store.setSetting('levels', levels);
      render();
    }, root);
    on('[data-board]', 'click', function () {
      Store.setSetting('boardTheme', this.dataset.board);
      applyTheme();
      render();
    }, root);
    on('[data-toggle]', 'click', function () {
      var key = this.dataset.toggle;
      Store.setSetting(key, !Store.settings()[key]);
      render();
    }, root);

    qs('#export').addEventListener('click', function () {
      var data = Store.exportData();
      if (navigator.clipboard) navigator.clipboard.writeText(data).then(function () { toast('Progress copied to clipboard'); },
        function () { window.prompt('Copy your progress', data); });
      else window.prompt('Copy your progress', data);
    });
    qs('#import').addEventListener('click', function () {
      var json = window.prompt('Paste exported progress');
      if (!json) return;
      try { Store.importData(json); toast('Progress restored'); render(); }
      catch (e) { toast('That did not look like valid data'); }
    });
    qs('#wipe').addEventListener('click', function () {
      if (window.confirm('Erase all progress and start fresh?')) {
        Store.resetAll();
        toast('All progress cleared');
        render();
      }
    });
  }

  /* ------------------------------------------------------------------- init */
  function applyTheme() {
    document.documentElement.setAttribute('data-board', Store.settings().boardTheme);
  }

  function init() {
    applyTheme();
    qsa('.tabbar button').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.dataset.tab;
        if (t === 'train') { App.session = null; go('train'); }
        else go(t);
      });
    });
    go('train');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.App = App;
})();
