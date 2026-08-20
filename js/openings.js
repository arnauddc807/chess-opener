/* openings.js — the opening book.
 * Each entry is a line you train from one side's point of view.
 *   side  : the colour you play while drilling
 *   moves : the main line in SAN, starting from move 1 for White
 *   level : 1 starter, 2 core, 3 advanced */
(function (global) {
  'use strict';

  var OPENINGS = [
    /* ---------------- Open Games: 1.e4 e5 ---------------- */
    {
      id: 'italian-giuoco-piano', name: 'Italian Game', variation: 'Giuoco Piano', eco: 'C54',
      side: 'w', family: 'Open Games', level: 1,
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+', 'Nc3'],
      idea: 'The oldest way to meet 1...e5: aim the bishop at f7, build the big pawn centre with c3 and d4, and open lines while Black is still developing.',
      plans: ['Bc4 eyes the f7 square, Black’s weakest point before castling.',
              'c3 prepares d4 — the whole point of the Giuoco Piano.',
              'After d4 exd4 cxd4 you own the centre; develop with Nc3 and castle.']
    },
    {
      id: 'ruy-lopez-closed', name: 'Ruy Lopez', variation: 'Closed, Main Line', eco: 'C92',
      side: 'w', family: 'Open Games', level: 2,
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3'],
      idea: 'The Spanish Torture. Pressure the knight defending e5, retreat the bishop to the a2–g8 diagonal, and slowly prepare d4 with c3 and Nbd2–f1–g3.',
      plans: ['Bb5 hits the defender of e5 — it is not a real pin while the d7 pawn blocks, and the pressure is positional.',
              'h3 stops ...Bg4 before playing d4; this move order matters.',
              'The knight tour Nb1–d2–f1–g3 is the classic regrouping.']
    },
    {
      id: 'ruy-lopez-berlin', name: 'Berlin Defense', variation: 'Berlin Wall', eco: 'C67',
      side: 'b', family: 'Open Games', level: 3,
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4', 'd4', 'Nd6', 'Bxc6', 'dxc6', 'dxe5', 'Nf5', 'Qxd8+', 'Kxd8'],
      idea: 'Trade queens early and head for an endgame where Black’s bishop pair compensates for the wrecked kingside pawns. Kramnik’s answer to Kasparov.',
      plans: ['Accept the doubled c-pawns — the two bishops are worth it.',
              'The king on d8 is safe: no queens are left to attack it.',
              'Black’s trumps are the bishop pair and ...Ke8, ...Be7; White’s is the healthy 4–3 kingside majority.']
    },
    {
      id: 'scotch-game', name: 'Scotch Game', variation: 'Classical', eco: 'C45',
      side: 'w', family: 'Open Games', level: 1,
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Bc5', 'Be3', 'Qf6', 'c3', 'Nge7', 'Bc4'],
      idea: 'Blow the centre open immediately. Easier to learn than the Ruy Lopez and it leads to clear, open positions.',
      plans: ['d4 on move three cuts out most of Black’s prepared systems.',
              'Be3 supports the d4 knight and stops ...Bxd4 tricks.',
              'c3 and later Nd2–b3 gives White a stable edge in space.']
    },
    {
      id: 'two-knights-fried-liver', name: 'Two Knights Defense', variation: 'Fried Liver Attack', eco: 'C57',
      side: 'w', family: 'Open Games', level: 2,
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7', 'Kxf7', 'Qf3+', 'Ke6', 'Nc3'],
      idea: 'A knight sacrifice that drags the black king into the open board on move six. Punishes the natural-looking 5...Nxd5.',
      plans: ['Ng5 attacks f7 twice — Black must react with ...d5.',
              'After 5...Nxd5?! the sacrifice Nxf7 is correct and strong.',
              'Qf3+ and Nc3 pile onto the pinned knight on d5.']
    },
    {
      id: 'evans-gambit', name: 'Evans Gambit', variation: 'Main Line', eco: 'C52',
      side: 'w', family: 'Open Games', level: 3,
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4', 'Bxb4', 'c3', 'Ba5', 'd4', 'exd4', 'O-O', 'Nge7', 'cxd4'],
      idea: 'Give up a pawn to gain a move for c3 and d4. You get a huge centre and a raging initiative — the swashbuckling way to play the Italian.',
      plans: ['b4 deflects the bishop so c3 comes with tempo.',
              'The pawn is an investment in development, not a blunder.',
              'Castle quickly and open the position while Black is behind.']
    },
    {
      id: 'petrov-defense', name: 'Petrov Defense', variation: 'Classical', eco: 'C42',
      side: 'b', family: 'Open Games', level: 2,
      moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4', 'd5', 'Bd3', 'Be7', 'O-O', 'Nc6', 'c4', 'Nb4'],
      idea: 'Symmetry as a weapon. Instead of defending e5, Black counter-attacks e4 and steers the game into solid, drawish waters.',
      plans: ['Never grab on e4 too early: 3...Nxe4? 4.Qe2 wins material.',
              'Insert ...d6 first to kick the knight, then recapture.',
              'Black equalises by finishing development, not by fighting for space.']
    },
    {
      id: 'philidor-defense', name: 'Philidor Defense', variation: 'Hanham', eco: 'C41',
      side: 'b', family: 'Open Games', level: 1,
      moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Nf6', 'Nc3', 'Nbd7', 'Bc4', 'Be7', 'O-O', 'O-O'],
      idea: 'A tough little shell. Black keeps every pawn defended, castles safely, and waits for a chance to break with ...c6 and ...d5 or ...exd4 and ...Nc5.',
      plans: ['Play ...Nbd7 not ...Nc6 — the knight belongs behind the d6 pawn.',
              'Avoid 3...Bg4?! 4.dxe5 which loses a pawn to a tactic.',
              'The freeing breaks are ...d5 and ...c6 followed by ...Qc7.']
    },
    {
      id: 'kings-gambit', name: "King's Gambit", variation: 'Kieseritzky', eco: 'C39',
      side: 'w', family: 'Open Games', level: 3,
      moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'h4', 'g4', 'Ne5', 'Nf6', 'd4', 'd6', 'Nd3', 'Nxe4', 'Bxf4'],
      idea: 'The romantic era in one move. Offer the f-pawn to rip open the f-file and own the centre. Sharp, dangerous, and enormous fun.',
      plans: ['Nf3 first — stopping ...Qh4+ is the whole reason for the move order.',
              'h4 undermines the g5 pawn chain that props up f4.',
              'You are playing for the centre and the f-file, not for the pawn back.']
    },
    {
      id: 'scholars-mate-defense', name: "Scholar's Mate", variation: 'How to refute it', eco: 'C23',
      side: 'b', family: 'Open Games', level: 1,
      moves: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'g6', 'Qf3', 'Nf6', 'Ne2', 'Bg7'],
      idea: 'The four-move mate every beginner tries. Defend f7 with pieces, kick the queen with tempo, and you finish ahead in development.',
      plans: ['...g6 attacks the queen and shuts the h5–f7 diagonal — not ...Qe7.',
              '...Nf6 blocks the new attack on f7 and develops with tempo.',
              'Every queen move by White is a move you spend developing.']
    },

    /* ---------------- Sicilian ---------------- */
    {
      id: 'sicilian-najdorf', name: 'Sicilian Defense', variation: 'Najdorf', eco: 'B90',
      side: 'b', family: 'Sicilian', level: 3,
      moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be6', 'f3', 'Be7'],
      idea: 'The sharpest mainstream defence in chess. The little move ...a6 takes b5 away from White’s pieces and prepares ...e5 or ...e6 with a huge queenside counter-attack.',
      plans: ['...a6 controls b5 before deciding between ...e5 and ...e6.',
              'Black counter-attacks on the queenside with ...b5, ...Bb7, ...Nbd7.',
              'The d5 square is the price you pay — fight for it with ...Be6 and ...Nbd7.']
    },
    {
      id: 'sicilian-dragon', name: 'Sicilian Defense', variation: 'Dragon, Yugoslav Attack', eco: 'B76',
      side: 'b', family: 'Sicilian', level: 3,
      moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'f3', 'O-O', 'Qd2', 'Nc6'],
      idea: 'Fianchetto the dark-squared bishop and fire it down the long diagonal at White’s queenside. Both sides castle opposite ways and race.',
      plans: ['The Bg7 aims at b2 — keep that diagonal open at all costs.',
              'Black’s attack comes from ...Rc8, ...Ne5–c4 and the c-file.',
              'White attacks with h4–h5 and Bh6; you must be faster.']
    },
    {
      id: 'sicilian-accelerated-dragon', name: 'Sicilian Defense', variation: 'Accelerated Dragon', eco: 'B35',
      side: 'b', family: 'Sicilian', level: 2,
      moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'g6', 'Nc3', 'Bg7', 'Be3', 'Nf6', 'Bc4', 'O-O', 'Bb3', 'd6'],
      idea: 'The Dragon without spending a move on ...d6, so Black can strike with ...d5 in one go. In return you must know the Maroczy Bind.',
      plans: ['Saving the ...d6 tempo means ...d5 can come as a single break.',
              'If White plays c4 (the Maroczy Bind), fight with ...Ng4 and ...b5.',
              'Watch the tactic Nxc6 followed by e5 — the reason ...Bg7 timing matters.']
    },
    {
      id: 'sicilian-alapin', name: 'Sicilian Defense', variation: 'Alapin (2.c3)', eco: 'B22',
      side: 'w', family: 'Sicilian', level: 1,
      moves: ['e4', 'c5', 'c3', 'Nf6', 'e5', 'Nd5', 'd4', 'cxd4', 'Nf3', 'Nc6', 'cxd4', 'd6', 'Bc4', 'Nb6', 'Bb5'],
      idea: 'Sidestep 3000 pages of Najdorf theory. Play c3 and d4 to build a classical pawn centre and get a normal game where understanding beats memory.',
      plans: ['c3 supports d4 — you get the big centre the Sicilian usually denies you.',
              'e5 gains space and kicks the knight to an awkward square.',
              'Aim for an isolated queen’s pawn position with active pieces.']
    },
    {
      id: 'sicilian-open-white', name: 'Open Sicilian', variation: 'White vs the Najdorf', eco: 'B90',
      side: 'w', family: 'Sicilian', level: 3,
      moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be6', 'f3', 'Be7', 'Qd2'],
      idea: 'The principled reply: open the centre, develop fast, and play for a kingside attack with opposite-side castling while Black is busy on the queenside.',
      plans: ['Trade on d4 and seize the lead in development.',
              'The English Attack setup is Be3, f3, Qd2, O-O-O, g4.',
              'Fight for the d5 square — it is the hole in Black’s camp.']
    },
    {
      id: 'smith-morra-gambit', name: 'Smith-Morra Gambit', variation: 'Accepted', eco: 'B21',
      side: 'w', family: 'Sicilian', level: 2,
      moves: ['e4', 'c5', 'd4', 'cxd4', 'c3', 'dxc3', 'Nxc3', 'Nc6', 'Nf3', 'd6', 'Bc4', 'e6', 'O-O', 'Nf6', 'Qe2'],
      idea: 'A pawn for a howling initiative. Every piece lands on a natural square, and Black has to defend accurately from move six.',
      plans: ['The open c- and d-files are yours — rooks to c1 and d1.',
              'Bc4 and Qe2 build the classic battery aiming at e6 and f7.',
              'If Black relaxes for two moves, the attack plays itself.']
    },

    /* ---------------- Semi-Open: 1.e4 others ---------------- */
    {
      id: 'french-winawer', name: 'French Defense', variation: 'Winawer', eco: 'C18',
      side: 'b', family: 'Semi-Open', level: 3,
      moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4', 'e5', 'c5', 'a3', 'Bxc3+', 'bxc3', 'Ne7', 'Qg4', 'Qc7'],
      idea: 'Trade the bishop for the knight to shatter White’s queenside pawns, then hammer the d4 point with ...c5 and pieces.',
      plans: ['Doubled c-pawns are a permanent target — that is the compensation.',
              'The light-squared bishop is Black’s problem piece; plan ...b6 and ...Ba6.',
              'Answer Qg4 with ...Qc7 and let White win a pawn on g7 for the open g-file.']
    },
    {
      id: 'french-advance-white', name: 'French Defense', variation: 'Advance (as White)', eco: 'C02',
      side: 'w', family: 'Semi-Open', level: 1,
      moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5', 'c3', 'Nc6', 'Nf3', 'Qb6', 'a3', 'Nh6', 'b4'],
      idea: 'Grab space, lock the centre, and leave Black’s light-squared bishop buried behind its own pawns. A one-line answer to the whole French.',
      plans: ['e5 gains space and entombs the c8 bishop.',
              'c3 holds d4 — the entire game revolves around that square.',
              'a3 and b4 gain queenside space and shut out ...Qb6 pressure.']
    },
    {
      id: 'caro-kann-classical', name: 'Caro-Kann Defense', variation: 'Classical', eco: 'B19',
      side: 'b', family: 'Semi-Open', level: 2,
      moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'h4', 'h6', 'Nf3', 'Nd7', 'h5', 'Bh7'],
      idea: 'The French’s well-behaved cousin: challenge the centre with ...d5 but get the light-squared bishop outside the pawn chain first.',
      plans: ['...c6 before ...d5 so the bishop can reach f5 — that is the whole point.',
              'Meet h4–h5 with ...h6 and retreat to h7; the bishop is fine there.',
              'Black’s structure is rock solid; play for a good endgame.']
    },
    {
      id: 'caro-kann-advance-white', name: 'Caro-Kann Defense', variation: 'Advance (as White)', eco: 'B12',
      side: 'w', family: 'Semi-Open', level: 2,
      moves: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'c5', 'Be3', 'Nd7', 'O-O', 'Ne7', 'c4'],
      idea: 'Take the space and then harass the bishop that Black was so proud of getting outside the chain.',
      plans: ['e5 stakes out space before Black is developed.',
              'Nf3 and Be2 prepare a fast kingside castle and c4 or Nbd2–b3.',
              'Long-term: attack the base of the chain with c4 or pressure d4 defenders.']
    },
    {
      id: 'scandinavian-defense', name: 'Scandinavian Defense', variation: 'Main Line 3...Qa5', eco: 'B01',
      side: 'b', family: 'Semi-Open', level: 1,
      moves: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'd4', 'Nf6', 'Nf3', 'c6', 'Bc4', 'Bf5', 'Bd2', 'e6'],
      idea: 'One line to learn and you can play it against every 1.e4 forever. Black trades the centre pawn immediately and develops with a clear plan.',
      plans: ['The queen on a5 is safe and eyes the c3 knight.',
              '...c6 gives the queen the retreat square c7 and supports ...b5.',
              'Develop ...Bf5 before ...e6 so the bishop isn’t locked in.']
    },
    {
      id: 'pirc-defense', name: 'Pirc Defense', variation: 'Austrian Attack', eco: 'B09',
      side: 'b', family: 'Semi-Open', level: 2,
      moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'f4', 'Bg7', 'Nf3', 'O-O', 'Bd3', 'Nc6', 'O-O', 'e5'],
      idea: 'Let White build the perfect centre — then tear it down with ...e5 and ...c5 while your fianchettoed bishop watches the long diagonal.',
      plans: ['Hypermodern: control the centre from a distance, occupy it later.',
              'The breaks are ...e5 and ...c5 — without one of them Black is just worse.',
              'Castle early; the Austrian Attack f4–f5 comes quickly.']
    },
    {
      id: 'alekhine-defense', name: 'Alekhine Defense', variation: 'Modern', eco: 'B04',
      side: 'b', family: 'Semi-Open', level: 3,
      moves: ['e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6', 'Nf3', 'g6', 'Bc4', 'Nb6', 'Bb3', 'Bg7', 'Qe2', 'O-O'],
      idea: 'Provoke White into over-extending. Every pawn push gains time on your knight but leaves another weakness behind.',
      plans: ['Invite e5 and d4 — then attack the over-extended pawns.',
              'Retreat the knight to b6 and hit the centre with ...dxe5 and ...c5.',
              'You are gambling that White’s space becomes a liability.']
    },
    {
      id: 'modern-defense', name: 'Modern Defense', variation: 'Tiger’s Modern (…a6)', eco: 'B06',
      side: 'b', family: 'Semi-Open', level: 2,
      moves: ['e4', 'g6', 'd4', 'Bg7', 'Nc3', 'd6', 'Be3', 'a6', 'Qd2', 'Nd7', 'Nf3', 'b5'],
      idea: 'Fianchetto first, ask questions later. Flexible, offbeat, and it dodges nearly all mainstream preparation.',
      plans: ['Delay ...Nf6 so White cannot gain time with e5.',
              '...a6 and ...b5 expand on the queenside while the centre stays fluid.',
              'The g7 bishop is the soul of the position — never trade it cheaply.']
    },

    /* ---------------- 1.d4 d5 ---------------- */
    {
      id: 'queens-gambit-declined', name: "Queen's Gambit Declined", variation: 'Exchange Variation', eco: 'D35',
      side: 'b', family: "Queen's Pawn", level: 2,
      moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'cxd5', 'exd5', 'Bg5', 'Be7', 'e3', 'c6', 'Bd3', 'Nbd7'],
      idea: 'The most respected answer to the Queen’s Gambit. Hold the centre with ...e6, accept a slightly passive bishop, and be extremely hard to beat.',
      plans: ['...e6 supports d5; the c8 bishop is the price of solidity.',
              'Free the position with ...c6, ...Nbd7 and eventually ...Ne4 or ...Nf8–e6.',
              'In the Exchange Variation watch for White’s minority attack b4–b5.']
    },
    {
      id: 'queens-gambit-white', name: "Queen's Gambit", variation: 'as White vs QGD', eco: 'D37',
      side: 'w', family: "Queen's Pawn", level: 1,
      moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'Be7', 'Bf4', 'O-O', 'e3', 'c5', 'dxc5', 'Bxc5', 'a3'],
      idea: 'Not really a gambit — c4 offers a pawn Black can never comfortably keep. You get the centre, the space and an easy plan.',
      plans: ['c4 attacks d5 from the side; taking with ...dxc4 hands you the centre.',
              'Bf4 (not Bg5) keeps things simple and pressures the queenside.',
              'a3 makes room for the bishop and prepares Rc1 and b4.']
    },
    {
      id: 'slav-defense', name: 'Slav Defense', variation: 'Main Line', eco: 'D19',
      side: 'b', family: "Queen's Pawn", level: 2,
      moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4', 'a4', 'Bf5', 'e3', 'e6', 'Bxc4', 'Bb4', 'O-O', 'O-O'],
      idea: 'The QGD without the bad bishop. Support d5 with the c-pawn instead, so the light-squared bishop can develop to f5 before ...e6.',
      plans: ['...c6 keeps the ...Bf5 diagonal open — the whole point over the QGD.',
              'Take on c4 only once White has committed the knight to c3.',
              'a4 stops ...b5 but weakens b4 — the square for your bishop.']
    },
    {
      id: 'queens-gambit-accepted', name: "Queen's Gambit Accepted", variation: 'Central Variation', eco: 'D20',
      side: 'b', family: "Queen's Pawn", level: 2,
      moves: ['d4', 'd5', 'c4', 'dxc4', 'e4', 'e5', 'Nf3', 'exd4', 'Bxc4', 'Nc6', 'O-O', 'Be6', 'Bxe6', 'fxe6'],
      idea: 'Take the pawn, give it back at the right moment, and use the free tempo to strike at the centre with ...e5 or ...c5.',
      plans: ['Do not try to hold c4 with ...b5 — a4 punishes it.',
              'Hit back with ...e5 or ...c5 immediately; the centre is the battlefield.',
              'Black trades into simple positions with active pieces.']
    },
    {
      id: 'london-system', name: 'London System', variation: 'Main Setup', eco: 'D02',
      side: 'w', family: "Queen's Pawn", level: 1,
      moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5', 'c3', 'Nc6', 'Nbd2', 'Bd6', 'Bg3', 'O-O', 'Bd3'],
      idea: 'The same setup against almost anything: d4, Bf4, e3, Nf3, c3, Nbd2, Bd3. Learn one structure, save a hundred hours of theory.',
      plans: ['Get the bishop outside the pawn chain to f4 before playing e3.',
              'The pyramid d4–e3–c3 is unbreakable; you develop behind it.',
              'Long-term: Ne5, f4 and a kingside attack, or a queenside minority attack.']
    },
    {
      id: 'catalan-opening', name: 'Catalan Opening', variation: 'Open Defence, Classical', eco: 'E05',
      side: 'w', family: "Queen's Pawn", level: 3,
      moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O', 'O-O', 'dxc4', 'Qc2', 'a6', 'Qxc4'],
      idea: 'A Queen’s Gambit with the bishop on g2. That bishop exerts pressure down the long diagonal for the entire game — sometimes for fifty moves.',
      plans: ['The g2 bishop is the whole opening: never block or trade it lightly.',
              'If Black grabs c4, regain it with Qa4 or Qc2 — do not rush.',
              'Squeeze on the queenside with Rd1, Nc3 and e4 at the right moment.']
    },

    /* ---------------- Indian Defenses ---------------- */
    {
      id: 'kings-indian-defense', name: "King's Indian Defense", variation: 'Classical Mar del Plata', eco: 'E97',
      side: 'b', family: 'Indian Defenses', level: 3,
      moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6', 'd5', 'Ne7'],
      idea: 'Hand White the centre, then launch every kingside pawn at his king. One of the most uncompromising defences ever played.',
      plans: ['After d5 the centre locks and each side attacks on its own wing.',
              'Black’s plan is ...Ne8, ...f5, ...f4, ...g5–g4 — a pawn storm.',
              'White is faster on the queenside, so you must never slow down.']
    },
    {
      id: 'nimzo-indian', name: 'Nimzo-Indian Defense', variation: 'Classical', eco: 'E32',
      side: 'b', family: 'Indian Defenses', level: 2,
      moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'Qc2', 'O-O', 'a3', 'Bxc3+', 'Qxc3', 'b6', 'Bg5', 'Bb7'],
      idea: 'Pin the knight that guards e4 and fight for the light squares. Nimzowitsch’s masterpiece and still the most respected answer to 1.d4.',
      plans: ['The pin on c3 stops e4 — that is the whole strategic point.',
              'Trading bishop for knight is fine when it doubles White’s pawns.',
              'Follow with ...b6 and ...Bb7 to fight for e4 with pieces.']
    },
    {
      id: 'grunfeld-defense', name: 'Grünfeld Defense', variation: 'Exchange', eco: 'D85',
      side: 'b', family: 'Indian Defenses', level: 3,
      moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5', 'cxd5', 'Nxd5', 'e4', 'Nxc3', 'bxc3', 'Bg7', 'Nf3', 'c5', 'Rb1', 'O-O'],
      idea: 'Let White build the biggest centre in chess — then demolish it with ...c5, ...Bg7 and pressure down the long diagonal.',
      plans: ['Trade knights on c3 to give White a big but loose pawn centre.',
              '...c5 and ...Bg7 hit d4 from two directions at once.',
              'If the centre holds, White is winning; if it cracks, Black is.']
    },
    {
      id: 'benoni-modern', name: 'Modern Benoni', variation: 'Main Line', eco: 'A72',
      side: 'b', family: 'Indian Defenses', level: 3,
      moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e6', 'Nc3', 'exd5', 'cxd5', 'd6', 'Nf3', 'g6', 'e4', 'Bg7', 'Be2', 'O-O'],
      idea: 'Unbalance the position immediately: Black gets a queenside pawn majority and the long diagonal, White gets space and a kingside attack.',
      plans: ['The ...b5 break powered by the queenside majority is Black’s trump.',
              'Rooks belong on e8 and b8; the bishop on g7 is critical.',
              'Beware White’s e4–e5 push — meet it before it arrives.']
    },
    {
      id: 'benko-gambit', name: 'Benko Gambit', variation: 'Accepted', eco: 'A59',
      side: 'b', family: 'Indian Defenses', level: 3,
      moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5', 'cxb5', 'a6', 'bxa6', 'Bxa6', 'Nc3', 'd6', 'e4', 'Bxf1', 'Kxf1', 'g6'],
      idea: 'A pawn for permanent pressure. The a- and b-files open toward White’s queenside and the pressure never goes away, even in the endgame.',
      plans: ['Rooks to a8 and b8 — the open files are the compensation.',
              'The Bg7 and the queenside rooks work together against b2 and a2.',
              'This is the rare gambit where trading queens does not help White.']
    },
    {
      id: 'budapest-gambit', name: 'Budapest Gambit', variation: 'Adler', eco: 'A52',
      side: 'b', family: 'Indian Defenses', level: 2,
      moves: ['d4', 'Nf6', 'c4', 'e5', 'dxe5', 'Ng4', 'Bf4', 'Nc6', 'Nf3', 'Bb4+', 'Nbd2', 'Qe7', 'a3', 'Ngxe5'],
      idea: 'A cheeky pawn sacrifice on move two that drags White out of theory instantly. Black regains the pawn with active pieces.',
      plans: ['...Ng4 hits e5 immediately — the pawn comes back by force.',
              'Watch for the trap 4.Bf4 Nc6 5.Nf3 Bb4+ with pressure.',
              'Rapid development is worth more than the pawn.']
    },
    {
      id: 'dutch-leningrad', name: 'Dutch Defense', variation: 'Leningrad', eco: 'A87',
      side: 'b', family: 'Indian Defenses', level: 3,
      moves: ['d4', 'f5', 'g3', 'Nf6', 'Bg2', 'g6', 'Nf3', 'Bg7', 'O-O', 'O-O', 'c4', 'd6', 'Nc3', 'Qe8', 'd5', 'Na6'],
      idea: 'Grab the e4 square with ...f5, fianchetto the bishop, and play for a kingside attack in a King’s Indian style structure.',
      plans: ['...f5 controls e4 but weakens the a2–g8 diagonal — castle fast.',
              '...Qe8–h5 or ...Qe8–g6 brings the queen into the attack.',
              'The break ...e5 is the main strategic goal.']
    },

    /* ---------------- Flank & Gambits ---------------- */
    {
      id: 'english-opening', name: 'English Opening', variation: 'Reversed Sicilian', eco: 'A29',
      side: 'w', family: 'Flank Openings', level: 2,
      moves: ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6', 'g3', 'd5', 'cxd5', 'Nxd5', 'Bg2', 'Nb6', 'O-O', 'Be7', 'd3'],
      idea: 'A Sicilian with colours reversed and an extra move. Flexible, positional, and it transposes into a dozen other openings on your terms.',
      plans: ['Fianchetto to g2 and fight for d5 from a distance.',
              'You are playing the Sicilian a tempo up — the plans mirror it.',
              'Keep the option of transposing to a Catalan or a Nimzo-English.']
    },
    {
      id: 'reti-opening', name: 'Réti Opening', variation: 'Advance Variation', eco: 'A09',
      side: 'w', family: 'Flank Openings', level: 2,
      moves: ['Nf3', 'd5', 'c4', 'd4', 'b4', 'f6', 'e3', 'e5', 'c5', 'a5', 'Na3'],
      idea: 'Attack the centre from the wings before occupying it. A hypermodern system that keeps every option open for six or seven moves.',
      plans: ['Nf3 and c4 undermine d5 without committing a centre pawn.',
              'The b4 push gains queenside space and supports c5.',
              'Transpose to the English, Catalan or a QGD whenever it suits you.']
    },
    {
      id: 'kings-indian-attack', name: "King's Indian Attack", variation: 'Universal Setup', eco: 'A08',
      side: 'w', family: 'Flank Openings', level: 1,
      moves: ['Nf3', 'd5', 'g3', 'Nf6', 'Bg2', 'e6', 'O-O', 'Be7', 'd3', 'O-O', 'Nbd2', 'c5', 'e4', 'Nc6', 'Re1'],
      idea: 'One setup, played against anything: Nf3, g3, Bg2, O-O, d3, Nbd2, e4. Then attack on the kingside. Zero memorisation required.',
      plans: ['Build the same seven-move setup no matter what Black does.',
              'The e4–e5 push is the signal to start the kingside attack.',
              'Typical follow-up: Nf1–h2–g4, h4 and Bf4.']
    },
    {
      id: 'vienna-game', name: 'Vienna Game', variation: 'Vienna Gambit', eco: 'C29',
      side: 'w', family: 'Open Games', level: 2,
      moves: ['e4', 'e5', 'Nc3', 'Nf6', 'f4', 'd5', 'fxe5', 'Nxe4', 'Nf3', 'Be7', 'd4', 'O-O', 'Bd3', 'f5', 'O-O'],
      idea: 'A King’s Gambit where White develops first, so Black never gets the ...Qh4+ counterplay that makes the King’s Gambit scary. Aggressive and safer than it looks.',
      plans: ['Developing before f4 is the point; after 2...Nf6 3.f4 the ...Qh4+ ideas never get going.',
              'The e5 pawn cramps Black and supports a kingside build-up.',
              'Develop Bd3 and Qe2 aiming at the black king.']
    },
    {
      id: 'englund-gambit-trap', name: 'Englund Gambit', variation: 'The Mate Trap', eco: 'A40',
      side: 'b', family: 'Traps & Tricks', level: 1,
      moves: ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3', 'Qe7', 'Bf4', 'Qb4+', 'Bd2', 'Qxb2', 'Bc3', 'Bb4', 'Qd2', 'Bxc3', 'Qxc3', 'Qc1#'],
      idea: 'Objectively dubious, practically lethal. If White plays the natural moves, Black mates on move eight. Every club player should see this once.',
      plans: ['...Qe7 threatens to regain the pawn and sets the trap.',
              '...Qb4+ picks up b2 and starts the hunt.',
              'The finish ...Qc1# works because White’s own knight on b1 and pawn on c2 block every defence of c1.']
    },
    {
      id: 'stafford-gambit', name: 'Stafford Gambit', variation: 'Main Trap', eco: 'C42',
      side: 'b', family: 'Traps & Tricks', level: 2,
      moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6', 'Nxc6', 'dxc6', 'd3', 'Bc5', 'Bg5', 'Nxe4', 'Bxd8', 'Bxf2+', 'Ke2', 'Bg4#'],
      idea: 'Sacrifice a pawn out of the Petrov for wild piece activity. Unsound against perfect play, devastating against natural play.',
      plans: ['...Nc6 offers the pawn to open lines toward f2 and the king.',
              'Bishops to c5 and g4 with a knight on e4 create mating nets.',
              'The greedy 7.Bxd8?? loses on the spot to ...Bxf2+ and ...Bg4#.']
    },
    {
      id: 'legals-mate', name: "Légal's Mate", variation: 'Classic Trap', eco: 'C41',
      side: 'w', family: 'Traps & Tricks', level: 1,
      moves: ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'],
      idea: 'The most famous trap in chess: give up the queen to mate with three minor pieces. From 1750 and it still works.',
      plans: ['The pin on the f3 knight is fake — you can break it with a queen sac.',
              'Nxe5 works because Bxf7+ and Nd5 build a mating net.',
              'Only play it if Black has committed ...Bg4 and a slow move like ...g6.']
    },
    {
      id: 'blackburne-shilling', name: 'Blackburne Shilling Gambit', variation: 'The Trap', eco: 'C50',
      side: 'b', family: 'Traps & Tricks', level: 1,
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nd4', 'Nxe5', 'Qg5', 'Nxf7', 'Qxg2', 'Rf1', 'Qxe4+', 'Be2', 'Nf3#'],
      idea: 'Blackburne reputedly won a shilling a time with this. It offers the e5 pawn and punishes the greedy capture with a smothered-style mate.',
      plans: ['...Nd4 looks like a beginner move and invites 4.Nxe5??.',
              '...Qg5 hits both the knight on e5 and the g2 pawn.',
              'Against the correct 4.Nxd4 exd4 just play a normal game a shade worse.']
    }
  ];

  var FAMILIES = ['Open Games', 'Sicilian', 'Semi-Open', "Queen's Pawn", 'Indian Defenses', 'Flank Openings', 'Traps & Tricks'];
  var LEVEL_NAMES = { 1: 'Starter', 2: 'Core', 3: 'Advanced' };

  global.OPENINGS = OPENINGS;
  global.FAMILIES = FAMILIES;
  global.LEVEL_NAMES = LEVEL_NAMES;
})(typeof window !== 'undefined' ? window : globalThis);
