# Macka. – nastavenie webovej aplikácie

Appka beží na tvojej doméne a údaje sa ukladajú do bezplatnej databázy Firebase. Obaja ju otvoríte cez ten istý odkaz (PC aj mobil) a vidíte tie isté údaje.

## 1. Založ Firebase projekt (bezplatný)
1. Choď na https://console.firebase.google.com a prihlás sa Google účtom.
2. **Add project** (Vytvoriť projekt) → názov napr. `mackine-torty` → Google Analytics vypni → Create.

## 2. Pridaj webovú appku a skopíruj nastavenie
1. V projekte klikni na ikonu **`</>`** (Web) → názov `Macka` → Register app (hosting nezapínaj).
2. Zobrazí sa blok `firebaseConfig`. Hodnoty z neho prepíš do súboru **`firebase-config.js`** (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

## 3. Prihlasovanie (len vy dvaja)
1. **Build → Authentication → Get started → Sign-in method → Email/Password** → zapni → Save.
2. Záložka **Users → Add user**: pridaj svoj e-mail a heslo, potom e-mail manželky a jej heslo.
3. V **Settings → User actions** vypni **Enable create (sign-up)**, ak je táto možnosť dostupná.

## 4. Databáza
1. **Build → Firestore Database → Create database** → región `eur3 (europe-west)` → Production mode → Create.
2. Záložka **Rules**: vymaž všetko, vlož obsah súboru **`firestore.rules`**, v ňom prepíš oba e-maily na vaše (rovnaké ako pri používateľoch) a klikni **Publish**.

## 5. Nahraj na hosting
Nahraj všetky tieto súbory do jedného priečinka na webe, napr. `mackinetorty.sk/Macka/`:
`index.html`, `firebase-config.js`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`
(Súbory `firestore.rules` a `NAVOD.md` nahrávať netreba.) Stránka musí bežať cez **https**.

## 6. Prvé spustenie
Otvor `https://mackinetorty.sk/Macka/` a prihlás sa. Pri úplne prvom spustení sa do databázy sama nahrá ponuka (koláče a krabičky). Objednávky sa zadávajú v appke.

## 7. Aplikácia v mobile
- **iPhone (Safari):** Zdieľať → Pridať na plochu.
- **Android (Chrome):** menu ⋮ → Pridať na plochu / Inštalovať aplikáciu.
Prihlásenie zostane uložené, nemusíš sa prihlasovať stále.

## Záloha
V appke je záložka **Záloha**: tlačidlo **Stiahnuť zálohu** uloží všetky údaje do súboru a **Obnoviť zo zálohy** ich vráti späť. Odporúčam stiahnuť zálohu aspoň raz týždenne.

## Bezpečnosť
Údaje (mená a telefónne čísla zákazníkov) sú dostupné iba prihláseným účtom z pravidiel v kroku 4. Heslá nikam neposielaj a pre každého zvoľ iné.

## Google Kalendár firmy
Sekcia **Kalendár** zobrazuje firemný Google Kalendár a vie doň pridávať a mazať udalosti. Prepojenie ide cez skript `google-apps-script/Kalendar.gs`, ktorý beží vo firemnom Google účte (postup je priamo v appke v sekcii Kalendár aj na začiatku skriptu). URL skriptu a kľúč sa ukladajú len do Firebase (`apps/nastavenia`), nie do kódu.

Sekcia **Správy** zobrazuje e-maily firemného Gmailu cez ten istý skript (akcie `mail_list`, `mail_get`, `mail_reply`, `mail_read`): zoznam (Doručené, Odoslané, Hľadať), čítanie vlákna, odpoveď a tlačidlo **+ Do kalendára**, ktoré otvorí formulár novej udalosti s predvyplneným menom, dátumom, časom a telefónom z e-mailu. E-maily z firemnej adresy na doméne sa do Gmailu dostanú preposielaním kópie u poskytovateľa schránky. Adresa firmy (Reply-To) a meno odosielateľa sú len vo Firebase (`apps/nastavenia` → `mail`).
