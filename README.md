# Chess Opener

A touch-first mobile web app for learning chess openings. Drill the answers to the
most common openings from memory, play freely in a sandbox with a live opening
guide, and browse a study book of what you have learned and what is left to
discover.

No build step, no dependencies, no network calls. Open `index.html` and it runs —
including offline, once the service worker has cached it.

## The three modes

**Train** — the app plays the opponent's book moves and you have to find your
side's reply. A wrong move is rejected on the spot; two levels of hint are a tap
away. Finishing a line without slips promotes it to the next spaced-repetition
level, so it comes back in 1, 2, 4, 8, 16 or 32 days. The daily session pulls
five lines: whatever is due first, then something new.

**Sandbox** — free play for both sides. Every move is matched against the book,
so the header tells you which opening you are in (and how many book lines are
still possible), when you have left the book, and which continuations exist from
here. Tap a continuation to play it, or switch on *book auto-reply* and let the
other side answer for you while you explore.

**Study book** — all 45 lines, grouped by family and filterable by *to discover*,
*learning* or *learned*, by colour, and by search. Each line has a board you can
step or auto-play through, the idea behind the opening in plain language, and its
key plans.

## What is in the book

45 lines, each validated as legal chess, covering both colours:

| Family | Lines |
| --- | --- |
| Open Games | Italian, Ruy Lopez (Closed and Berlin), Scotch, Two Knights/Fried Liver, Evans Gambit, Petrov, Philidor, King's Gambit, Vienna, refuting Scholar's Mate |
| Sicilian | Najdorf (both sides), Dragon, Accelerated Dragon, Alapin, Smith-Morra |
| Semi-Open | French (Winawer and Advance), Caro-Kann (Classical and Advance), Scandinavian, Pirc, Alekhine, Modern |
| Queen's Pawn | QGD, QGA, Slav, London, Catalan, Queen's Gambit as White |
| Indian Defenses | King's Indian, Nimzo-Indian, Grünfeld, Benoni, Benko, Budapest, Dutch |
| Flank Openings | English, Réti, King's Indian Attack |
| Traps & Tricks | Englund mate trap, Stafford Gambit, Légal's Mate, Blackburne Shilling |

## Touch details

Tap a piece then tap a square, or drag — both work. Legal destinations show as
dots, captures as rings. Everything tappable is at least 48px. The board shrinks
on short screens so the prompt and buttons never fall below the fold, safe-area
insets are respected, and there is a promotion sheet instead of a keyboard
shortcut. Sound and haptic feedback can be switched off.

Progress lives in `localStorage` on the device, and can be exported or imported
as JSON from the **You** tab.

## Running it

Any static file server works:

```sh
python3 -m http.server 8000     # then open http://localhost:8000
```

Opening `index.html` from the filesystem works too, except that the service
worker (offline caching) needs an `http(s)` origin.

## Tests

```sh
node test/run.js                # engine perft + rules + book validation, no deps
CHROMIUM_PATH=/path/to/chrome node test/e2e.js   # UI walkthrough, needs playwright
```

`test/run.js` runs perft against five standard positions (including the tricky
castling, en passant and promotion cases), checks mate/stalemate detection, and
replays every line in the book to confirm it is legal and written in correct SAN.

## Layout

```
index.html            app shell and tab bar
css/styles.css        design system, board, all views
js/chess.js           0x88 chess engine — move generation, SAN, FEN, undo
js/openings.js        the opening book
js/pieces.js          SVG piece set
js/board.js           touch board: tap, drag, hints, promotion, animation
js/store.js           progress, spaced repetition, settings
js/app.js             views, drill engine, sandbox, study book
sw.js                 offline cache
```
