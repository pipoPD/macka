/**
 * Macka. – dochádzka a výplaty
 *
 * Skript beží v Google účte, kde je priečinok „Mackine Torty“ s dochádzkou
 * (každý zamestnanec má vlastný Sheet, v ňom hárky Január…December).
 * Appke Macka. vráti súčty za mesiac a pošle výplatu e-mailom.
 * Prístup je chránený tajným kľúčom, ktorý je len vo vlastnostiach skriptu
 * a vo Firebase (nie v kóde).
 *
 * Nastavenie (raz):
 *  1. Prihlás sa do Google účtu s dochádzkou, otvor https://script.google.com → Nový projekt.
 *  2. Vymaž obsah a vlož celý tento súbor. Projekt pomenuj „Macka. Dochádzka“.
 *  3. Hore vyber funkciu „nastav“ → Spustiť → povoľ prístup (Disk, Tabuľky, odosielanie e-mailov).
 *     V protokole sa zobrazí KĽÚČ – skopíruj ho.
 *  4. Nasadiť → Nové nasadenie → typ „Webová aplikácia“:
 *       Spustiť ako: Ja
 *       Kto má prístup: Ktokoľvek
 *     → Nasadiť → skopíruj URL (končí na /exec).
 *  5. V appke Macka. → Výplaty → Ľudia → Google dochádzka vlož URL a KĽÚČ → Uložiť.
 *
 * Po zmene kódu: vlož nový kód, ulož, potom Nasadiť → Spravovať nasadenia
 * → ceruzka → Verzia: Nová verzia → Nasadiť. URL zostane rovnaká.
 *
 * Pravidlá výpočtu (jeden riadok = jeden deň):
 *  - odpracovaný deň = riadok s časom v stĺpci „Celkový čas“ (E), bez dovolenky/paragrafu
 *  - hodiny = súčet odpracovaných hodín
 *  - nedele = počet odpracovaných nedieľ
 *  - sobota / nedeľa = hodiny odpracované v sobotu / v nedeľu (okrem sviatkov),
 *    príplatok (50 % / 100 %) sa nastavuje v appke
 *  - sviatok = hodiny odpracované v deň označený zelenou farbou
 *    (príplatok sa ráta len raz, aj keď sviatok padne na víkend)
 *  - dovolenka / paragraf = podľa poznámky (F); v ten deň sa neráta odpracovaný deň.
 *    Hodiny: číslo z poznámky (napr. „4h paragraf“), „pol“ alebo „1/2“ = 4 h,
 *    pri paragrafe inak čas zo stĺpca E, inak 8 h.
 */

var PRIECINOK = 'Mackine Torty';
var MESIACE = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August',
  'September', 'Október', 'November', 'December'];

function nastav() {
  var p = PropertiesService.getScriptProperties();
  var t = p.getProperty('TOKEN');
  if (!t) {
    t = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    p.setProperty('TOKEN', t);
  }
  Logger.log('Priečinok: ' + folder_().getName());
  Logger.log('E-maily dnes ešte môžeš poslať: ' + MailApp.getRemainingDailyQuota());
  Logger.log('KĽÚČ pre appku: ' + t);
}

// Ak by kľúč niekto získal: spusti túto funkciu a nový kľúč vlož do appky.
function novyKluc() {
  PropertiesService.getScriptProperties().deleteProperty('TOKEN');
  nastav();
}

function doGet(e) { return handle_((e && e.parameter) || {}); }

function doPost(e) {
  var p = {};
  try { p = JSON.parse(e.postData.contents); } catch (x) {}
  return handle_(p);
}

function handle_(p) {
  var out;
  try {
    var t = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!t || p.token !== t) out = { ok: false, error: 'kluc' };
    else if (p.action === 'ping') out = { ok: true, folder: folder_().getName(), ver: 2 };
    else if (p.action === 'read') out = read_(p);
    else if (p.action === 'mail') out = mail_(p);
    else out = { ok: false, error: 'neznama akcia' };
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function folder_() {
  var it = DriveApp.getFoldersByName(PRIECINOK);
  if (!it.hasNext()) throw new Error('Priečinok „' + PRIECINOK + '“ sa nenašiel.');
  return it.next();
}

function file_(name) {
  name = String(name || '').trim();
  if (!name) throw new Error('Chýba názov súboru dochádzky.');
  var it = folder_().getFilesByName(name), f = null, n = 0;
  while (it.hasNext()) {
    var x = it.next();
    if (x.getMimeType() === MimeType.GOOGLE_SHEETS) { f = x; n++; }
  }
  if (!n) throw new Error('V priečinku „' + PRIECINOK + '“ nie je tabuľka „' + name + '“.');
  if (n > 1) throw new Error('V priečinku je viac tabuliek „' + name + '“.');
  return SpreadsheetApp.openById(f.getId());
}

// „8:56“ → 8.933…; prázdne/nečíslo → 0
function hours_(s) {
  s = String(s || '').trim();
  var m = s.match(/^(\d+):(\d{1,2})(?::\d{1,2})?$/);
  if (m) return +m[1] + +m[2] / 60;
  var n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

// zelená výplň bunky (svetlá aj tmavá), biela/sivá nie
function green_(hex) {
  var m = String(hex || '').match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return false;
  var r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return g > r && g > b && g - Math.min(r, b) >= 15;
}

function noteHours_(note, dflt) {
  var m = note.match(/(\d+(?:[.,]\d+)?)\s*(h|hod)/i);
  if (m) return parseFloat(m[1].replace(',', '.'));
  if (/\bpol\b|1\/2|poldeň|pol dňa/i.test(note)) return 4;
  return dflt;
}

function r2_(n) { return Math.round(n * 100) / 100; }

function read_(p) {
  var ym = String(p.ym || '');
  var mm = ym.match(/^(\d{4})-(\d{2})$/);
  if (!mm) throw new Error('Zlý mesiac.');
  var year = +mm[1], mon = +mm[2];
  var ss = file_(p.file);
  var sh = ss.getSheetByName(MESIACE[mon - 1]);
  if (!sh) throw new Error('V tabuľke „' + ss.getName() + '“ nie je hárok „' + MESIACE[mon - 1] + '“.');
  var last = sh.getLastRow();
  var res = { ok: true, file: ss.getName(), sheet: sh.getName(), days: 0, hours: 0, sundays: 0, sat: 0, sunh: 0, hol: 0, vac: 0, par: 0, holDays: [], notes: [] };
  if (last < 2) return res;
  var rng = sh.getRange(2, 1, last - 1, 6);
  var vals = rng.getDisplayValues(), bgs = rng.getBackgrounds();
  var found = false;
  for (var i = 0; i < vals.length; i++) {
    var v = vals[i];
    var d = String(v[0]).trim().match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
    if (!d) continue;
    if (+d[3] !== year || +d[2] !== mon) continue;
    found = true;
    var dow = new Date(year, mon - 1, +d[1]).getDay(); // 0 = nedeľa, 6 = sobota
    var h = hours_(v[4]);
    var note = String(v[5] || '').trim();
    var isHol = bgs[i].some(green_);
    if (isHol) res.holDays.push(+d[1] + '.');
    var low = note.toLowerCase();
    if (/paragraf|§|lekár|lekar/.test(low)) {
      res.par += noteHours_(note, h || 8);
      continue;
    }
    if (/dovolenk|\bdv\b|\d\s*dv\b/.test(low)) {
      res.vac += noteHours_(note, 8);
      continue;
    }
    if (note) res.notes.push(+d[1] + '. ' + note);
    if (!h) continue;
    res.days++;
    res.hours += h;
    if (dow === 0) res.sundays++;
    if (isHol) res.hol += h;
    else if (dow === 6) res.sat += h;
    else if (dow === 0) res.sunh += h;
  }
  if (!found) throw new Error('Na hárku „' + sh.getName() + '“ nie sú dni z ' + mon + '/' + year + '.');
  ['hours', 'sat', 'sunh', 'hol', 'vac', 'par'].forEach(function (k) { res[k] = r2_(res[k]); });
  return res;
}

function mail_(p) {
  var to = String(p.to || '').trim();
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(to)) throw new Error('Zlý e-mail.');
  var subject = String(p.subject || '').slice(0, 200);
  var body = String(p.body || '').slice(0, 10000);
  if (!subject || !body) throw new Error('Prázdny e-mail.');
  MailApp.sendEmail({ to: to, subject: subject, body: body, name: 'Macka.' });
  return { ok: true };
}
