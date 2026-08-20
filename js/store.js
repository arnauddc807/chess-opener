/* store.js — progress, spaced repetition and settings, persisted to localStorage. */
(function (global) {
  'use strict';

  var KEY = 'chess-opener.v1';
  var DAY = 86400000;
  /* Leitner-style intervals in days, indexed by box. */
  var INTERVALS = [0, 1, 2, 4, 8, 16, 32];
  var MASTER_BOX = 4;

  var defaults = {
    progress: {},               /* id -> { box, attempts, clears, bestErrors, lastSeen, dueAt, totalErrors } */
    settings: {
      side: 'both',             /* both | w | b */
      levels: [1, 2, 3],
      showCoords: true,
      autoHint: true,
      pieceSpeed: 'normal',
      sound: true,
      boardTheme: 'forest'
    },
    stats: { xp: 0, streak: 0, lastActiveDay: null, drillsDone: 0, movesRight: 0, movesWrong: 0 }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function merge(base, patch) {
    var out = clone(base);
    Object.keys(patch || {}).forEach(function (k) {
      if (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k]) && out[k]) {
        out[k] = merge(out[k], patch[k]);
      } else if (patch[k] !== undefined) {
        out[k] = patch[k];
      }
    });
    return out;
  }

  var state;
  try {
    state = merge(defaults, JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch (e) {
    state = clone(defaults);
  }

  var listeners = [];

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
    listeners.forEach(function (fn) { fn(state); });
  }

  function dayStamp(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function entry(id) {
    if (!state.progress[id]) {
      state.progress[id] = { box: 0, attempts: 0, clears: 0, bestErrors: null, lastSeen: null, dueAt: 0, totalErrors: 0 };
    }
    return state.progress[id];
  }

  var Store = {
    state: state,

    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },

    get: function (id) { return state.progress[id] || null; },

    settings: function () { return state.settings; },

    setSetting: function (key, value) { state.settings[key] = value; save(); },

    stats: function () { return state.stats; },

    /* New | Learning | Learned */
    status: function (id) {
      var e = state.progress[id];
      if (!e || e.attempts === 0) return 'new';
      if (e.box >= MASTER_BOX) return 'learned';
      return 'learning';
    },

    isDue: function (id) {
      var e = state.progress[id];
      if (!e || e.attempts === 0) return true;
      return Date.now() >= e.dueAt;
    },

    /* Record a completed drill run. errors = wrong first-tries in that run. */
    recordRun: function (id, errors) {
      var e = entry(id);
      e.attempts++;
      e.clears++;
      e.totalErrors += errors;
      e.lastSeen = Date.now();
      if (e.bestErrors === null || errors < e.bestErrors) e.bestErrors = errors;

      if (errors === 0) e.box = Math.min(e.box + 1, INTERVALS.length - 1);
      else if (errors <= 2) e.box = Math.max(1, e.box);
      else e.box = Math.max(0, e.box - 1);

      e.dueAt = Date.now() + INTERVALS[e.box] * DAY;

      var gained = Math.max(4, 20 - errors * 4);
      state.stats.xp += gained;
      state.stats.drillsDone++;

      var today = dayStamp();
      if (state.stats.lastActiveDay !== today) {
        var yesterday = dayStamp(new Date(Date.now() - DAY));
        state.stats.streak = state.stats.lastActiveDay === yesterday ? state.stats.streak + 1 : 1;
        state.stats.lastActiveDay = today;
      }
      save();
      return { xp: gained, box: e.box, dueAt: e.dueAt };
    },

    recordMove: function (correct) {
      if (correct) state.stats.movesRight++; else state.stats.movesWrong++;
      /* batched: persisted on the next run record or settings change */
    },

    /* Persist stats that are otherwise batched until the next completed run. */
    flush: function () { save(); },

    markAttempted: function (id) { var e = entry(id); e.attempts = e.attempts || 0; save(); },

    resetOpening: function (id) { delete state.progress[id]; save(); },

    resetAll: function () {
      state.progress = {};
      state.stats = clone(defaults.stats);
      save();
    },

    exportData: function () { return JSON.stringify(state, null, 2); },

    importData: function (json) {
      var parsed = JSON.parse(json);
      state = merge(defaults, parsed);
      Store.state = state;
      save();
      return true;
    },

    dueLabel: function (id) {
      var e = state.progress[id];
      if (!e || e.attempts === 0) return 'Not started';
      var diff = e.dueAt - Date.now();
      if (diff <= 0) return 'Due now';
      var days = Math.ceil(diff / DAY);
      return days === 1 ? 'Due tomorrow' : 'Due in ' + days + ' days';
    },

    MASTER_BOX: MASTER_BOX,
    INTERVALS: INTERVALS
  };

  global.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);
