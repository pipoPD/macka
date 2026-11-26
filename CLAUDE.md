# Macka. – pokyny pre Claude Code

## Dohoda (najdôležitejšie)
- **Komunikuj vždy po slovensky, krátko a vecne.**
- **Pred každou zmenou kódu najprv krátko povedz, čo by si zmenil, a počkaj na potvrdenie („áno“).** Čítať a prezerať súbory môžeš bez pýtania.
- Pred prácou si stiahni najnovší stav (`git fetch` + `origin/main`), na appke pracuje viac relácií naraz.

## Bezpečnosť – repozitár je VEREJNÝ
- Do kódu **nikdy** nedávaj údaje zákazníkov, mená ani mzdy zamestnancov, e-maily, heslá ani kľúče.
- Objednávky, výplaty a ľudia sú len vo Firebase. Pole `SEED_ORDERS` musí ostať prázdne.
- `firestore.rules` obsahuje vymyslené e-maily, skutočné pravidlá sú vo Firebase konzole.

## O appke
- **Macka.** (vždy s bodkou) je názov cukrárne aj appky. Web cukrárne: https://www.mackinetorty.sk
- Appku používajú len dvaja ľudia (majitelia), zamestnanci k nej prístup nemajú.
- Beží na GitHub Pages: https://pipopd.github.io/macka/ (vetva `main`, koreň). Po pushi do `main` sa sama aktualizuje do 1–2 minút.
- Statická PWA bez build kroku: `index.html` (HTML + CSS + JS v jednom), `cennik-web.js`, `firebase-config.js`, `sw.js`, `manifest.webmanifest`, ikony.
- **Pri každej zmene kódu zvýš verziu cache v `sw.js`** (`mt-cache-vN`).
- Vzhľad: krémové pozadie, farebné zaoblené dlaždice, písma Fraunces (nadpisy) a Nunito (text), tmavý režim.

## Firebase
- Projekt `mackine-torty` (plán Spark, bez automatických záloh), SDK 10.14.1 z gstatic, offline cache zapnutá.
- Prihlásenie e-mail + heslo, 2 účty. Firestore pravidlá povoľujú len tieto dva účty (cesta `apps/**`).
- Dokumenty:
  - `apps/vianoce2026`: `{cakes, boxes, pair, rez, dph}`; koláč `{id, name, recId, batch, items}` – `recId` = recept, z ktorého sa berie norma (staré `batch`/`items` v koláči sú len záloha spred presunu noriem do receptov), `rez` = rezerva na straty v %, `dph` = sadzba DPH na predaj v % (marža krabičiek sa ráta bez DPH); objednávky v `apps/vianoce2026/orders/{id}`: `{no, name, contact, lines[{kind: box|mix|cake, id, qty, note}], price, note}`
  - `apps/vyplaty`: `{people:[{id, name, type: emp|brig, rate, meal, sun, wkd, satp, sunp, dov, par, dovN, active, sheet, email}], gs:{url, token}}`; mesiace v `apps/vyplaty/months/{RRRR-MM}`: `{entries:{osobaId:{days, hours, sundays, sat, sunh, wkd, hol, vac, par, rew, candy, extra, note, imported, sent, rt:{rate,meal,sun,wkd,satp,sunp}} alebo {fixed: suma}}}`
  - Dochádzka: Apps Script `google-apps-script/Dochadzka.gs` (priečinok „Mackine Torty“ na Drive, Sheet na osobu, hárky podľa mesiacov). `people.sheet` = názov Sheetu, `gs` = URL a kľúč skriptu (len vo Firebase). Načíta dni, hodiny, nedele, hodiny v sobotu a v nedeľu, sviatok (zelená farba), dovolenku a paragraf (poznámka) a posiela výplatu e-mailom.
  - `apps/cennik`: `{src, napSeed, kolDel, torty:[…], kolace:[…], napoje:[…]}`; položka `{id, name, desc, valid, flav, note, vars:[{n, d, p, od, u, min}]}`
  - `apps/suroviny`: `{items:[{id, name, unit: kg|l|ks, pack, price, sup, note}]}` – katalóg surovín, `price` = € **bez DPH** za balenie `pack` (firma je platiteľ DPH). Normy sa párujú podľa `ingId`, inak podľa názvu.
  - `apps/recepty`: `{mig, items:[{id, name, cat, yield, alg, batch, items[{name, qty, unit: g|kg|ml|l|ks, ingId}], cakeId, parts:[{t, ingr, steps}], note}]}` – recepty a normy (texty len vo Firebase, nikdy v kóde). `alg` = alergény EÚ 1–14, `batch`/`items` = norma na 1 dávku (`batch` = ks z dávky, chýba = 1, `ingId` = surovina z katalógu), `cakeId` = pôvodný koláč (len pri importe), `mig` = normy z Vianoc už jednorazovo prenesené. Nahrávanie zo súboru `macka-recepty` (JSON).
  - `apps/nastavenia`: staré, nepoužíva sa.
  - `apps/zaloha`: `{last, file, size, docs, err, errAt}` – stav zálohy, zapisuje ho len Apps Script.
- Záloha: `Dochadzka.gs` (+ manifest `google-apps-script/appsscript.json` so scope `datastore`) každú noc o 3:00 cez Firestore REST pod účtom vlastníka projektu uloží všetko z `apps/**` (bez `apps/zaloha` a bez `gs.token`) do priečinka „Macka. zálohy“ na Drive ako `macka-zaloha-RRRR-MM-DD.json`, drží 30 dní. Sekcia Záloha v appke: stav, zoznam, stiahnutie, obnova (najprv záloha aktuálneho stavu). Upozornenie v menu, ak je záloha staršia ako 7 dní.
- Zmeny v `cennik-web.js` sa do existujúcej databázy nepremietnu samé (treba jednorazovú úpravu s príznakom ako `napSeed`/`kolDel`, alebo úpravu v appke).

## Sekcie (hlavné menu)
Vianoce 2026 (hotové; Koláče: krabička → koláč → detail s normou z prepojeného receptu; nákupný zoznam s cenami a marža krabičiek), Recepty a normy (jedna sekcia, dlaždica Normy zrušená; zoznam podľa abecedy, detail s alergénmi, normou s cenami a postupom po častiach, úprava normy aj textu, nahratie zo súboru; fotky zatiaľ nie), Cenník – Torty/Koláče/Nápoje (hotové), Výplaty (hotové), Záloha (hotová), Náklady – Suroviny (katalóg s cenami, hotový), Cukráreň/Firma (prázdne).
Kalendár a Správy boli zámerne odstránené, nevracať ich.

## Výplaty – výpočet
hodiny × hodinovka + dni × strava − nedele × odpočet + sobota hod × hodinovka × príplatok sobota % (predvolene 50) + nedeľa hod × hodinovka × príplatok nedeľa % (predvolene 100) + (sviatok + dovolenka + paragraf) hod × hodinovka + odmeny + Candy Bar + Iné, zaokrúhlené na celé eurá. Mesiac si pri prvom zápise uloží sadzby (`rt`), aby zmena sadzieb neprepísala históriu. Brigádnici nemajú dovolenku ani paragraf. Staré pole `wkd` (víkend hod × `rt.wkd`) ostáva len pre staré mesiace. Sviatok na víkend = len príplatok za sviatok. Pracuje sa aj vo sviatky, voľný sviatok sa neprepláca. Dovolenka a paragraf: `dovN` = nárok dní/rok, čerpanie sa ráta z mesiacov roka (1 deň = 8 h), paragraf max 7 dní/rok (len upozornenie). Staré texty `dov`/`par` sa ukazujú, len kým nie je `dovN`.

## Plán (poradie)
1. Výplaty: údaje automaticky z jedného Google Sheetu s dochádzkou (pravdepodobne Google Apps Script), ručne len odmeny; e-maily zamestnancov (len vo Firebase) a odoslanie výplaty e-mailom.
2. Automatická denná záloha celej appky na Google Drive (30 dní), záloha v hlavnom menu, upozornenie ak chýba > 7 dní.
3. Normy surovín → nákupný zoznam.
4. Náklady a cena torty (prepojenie s cenníkom, marža).
5. Recepty s fotkami.
