# Chess Opener

A touch-first mobile web app for learning chess openings. Drill the answers to the
most common openings from memory, play freely in a sandbox with a live opening
guide, and browse a study book of what you have learned and what is left to
discover.

**Live: https://arnauddc807.github.io/chess-opener/**

No build step, no dependencies, no network calls. Open `index.html` and it runs —
including offline, once the service worker has cached it. On a phone, use *Add to
Home Screen* and it installs as a standalone app.

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

## Deploying

`.github/workflows/pages.yml` publishes the repository root to GitHub Pages on
every push to `main`, gated behind `node test/run.js` — a red engine or a broken
opening line stops the deploy.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub
Actions**. There is nothing to build, so the workflow uploads the checkout as-is.

Every path in the app is relative and the manifest uses `start_url: "."`, so it
works from a project subpath (`/chess-opener/`) as well as from a domain root.
`.nojekyll` stops Pages from running the files through Jekyll.

The service worker uses stale-while-revalidate rather than cache-first: asset
filenames never change here, so cache-first would pin returning visitors to the
first version they ever loaded. Bump `CACHE` in `sw.js` when the shipped file
list changes.

## Tests

```sh
node test/run.js                                   # engine + book, no dependencies
CHROMIUM_PATH=/path/to/chrome node test/e2e.js     # UI walkthrough (playwright)
CHROMIUM_PATH=/path/to/chrome node test/pages.js   # subpath + offline + updates
```

`test/run.js` runs perft against five standard positions (including the tricky
castling, en passant and promotion cases), checks mate/stalemate detection, and
replays every line in the book to confirm it is legal and written in correct SAN.

The opening book is checked against an outside source, not against its own
opinion. `test/fixtures/eco.json` is generated from the
[Lichess opening database](https://github.com/lichess-org/chess-openings) (3,810
lines, CC0) by `test/tools/build-eco-fixture.js`: for each line it records the
deepest position that line reaches and the ECO code assigned to it. `run.js`
then checks every declared `eco` against it. The fixture pins the position as
well as the code, so editing a line's moves fails the run until the fixture is
rebuilt — an ECO code cannot quietly drift away from the moves it labels. One
line (the Leningrad Dutch, which transposes through a move order the database
does not index) is settled by hand, with the reasoning recorded in the fixture.

`test/pages.js` serves the app from a `/chess-opener/` subpath the way Pages
does and checks that nothing 404s, that the manifest and icons resolve, that the
service worker registers against the project scope, that the app boots and a
drill runs with the network switched off, and that a changed file reaches a
returning visitor.

## Layout

```
index.html            app shell and tab bar
.github/workflows/    test + deploy to GitHub Pages
css/styles.css        design system, board, all views
js/chess.js           0x88 chess engine — move generation, SAN, FEN, undo
js/openings.js        the opening book
js/pieces.js          SVG piece set
js/board.js           touch board: tap, drag, hints, promotion, animation
js/store.js           progress, spaced repetition, settings
js/app.js             views, drill engine, sandbox, study book
sw.js                 offline cache
```
