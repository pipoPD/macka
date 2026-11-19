/**
 * Macka. – dochádzka, výplaty a záloha
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
 * ZÁLOHA (každú noc o 3:00 do priečinka „Macka. zálohy“ na Disku, 30 dní):
 *  1. Nastavenia projektu (ozubené koliesko vľavo) → zaškrtni
 *     „Zobraziť súbor manifestu appsscript.json v editore“.
 *  2. V Editore otvor appsscript.json a nahraď jeho obsah súborom
 *     google-apps-script/appsscript.json (v appke: Záloha → Kopírovať manifest). Ulož.
 *  3. Hore vyber funkciu „zapniZalohu“ → Spustiť → povoľ prístup.
 *     Skript musí bežať pod Google účtom, ktorý vlastní projekt Firebase.
 *  4. Nasadiť → Spravovať nasadenia → ceruzka → Nová verzia → Nasadiť.
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
    else if (p.action === 'ping') out = { ok: true, folder: folder_().getName(), ver: 3 };
    else if (p.action === 'read') out = read_(p);
    else if (p.action === 'mail') out = mail_(p);
    else if (p.action === 'zalohaNow') out = zalohuj();
    else if (p.action === 'zalohaList') out = zalohaList_();
    else if (p.action === 'zalohaGet') out = zalohaGet_(p);
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

/* ===================== ZÁLOHA ===================== */

var PROJEKT = 'mackine-torty';
var ZALOHY = 'Macka. zálohy';
var ZALOHY_DNI = 30;

// Spusti raz: nastaví nočnú zálohu (o 3:00) a hneď jednu urobí.
function zapniZalohu() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'zalohuj') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('zalohuj').timeBased().everyDays(1).atHour(3).create();
  var r = zalohuj();
  Logger.log('Nočná záloha zapnutá. Prvá záloha: ' + r.file + ' (' + r.docs + ' dokumentov, ' + r.size + ' B)');
}

function zalohuj() {
  try {
    var docs = {};
    walkCol_('apps', docs);
    var n = Object.keys(docs).length;
    if (!n) throw new Error('Databáza je prázdna, zálohu som neuložil.');
    var now = new Date();
    var name = 'macka-zaloha-' + Utilities.formatDate(now, 'Europe/Bratislava', 'yyyy-MM-dd') + '.json';
    var json = JSON.stringify({ app: 'macka-zaloha', ver: 1, created: now.toISOString(), project: PROJEKT, docs: docs });
    var f = zFolder_();
    var old = f.getFilesByName(name);
    while (old.hasNext()) old.next().setTrashed(true);
    var file = f.createFile(name, json, 'application/json');
    var limit = now.getTime() - ZALOHY_DNI * 864e5;
    var it = f.getFiles();
    while (it.hasNext()) {
      var x = it.next();
      if (/^macka-zaloha-.*\.json$/.test(x.getName()) && x.getDateCreated().getTime() < limit) x.setTrashed(true);
    }
    var info = { last: now.toISOString(), file: name, size: json.length, docs: n, err: '', errAt: '' };
    fs_('patch', 'apps/zaloha', { fields: toFields_(info) });
    info.ok = true;
    info.id = file.getId();
    return info;
  } catch (err) {
    var msg = String(err && err.message || err);
    try {
      fs_('patch', 'apps/zaloha?updateMask.fieldPaths=err&updateMask.fieldPaths=errAt',
        { fields: toFields_({ err: msg, errAt: new Date().toISOString() }) });
    } catch (x) {}
    throw err;
  }
}

function zFolder_() {
  var it = DriveApp.getFoldersByName(ZALOHY);
  return it.hasNext() ? it.next() : DriveApp.createFolder(ZALOHY);
}

function zalohaList_() {
  var it = zFolder_().getFiles(), out = [];
  while (it.hasNext()) {
    var x = it.next();
    if (!/^macka-zaloha-.*\.json$/.test(x.getName())) continue;
    out.push({ id: x.getId(), name: x.getName(), size: x.getSize(), date: x.getDateCreated().toISOString() });
  }
  out.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  return { ok: true, files: out };
}

function zalohaGet_(p) {
  var f = DriveApp.getFileById(String(p.id || ''));
  var par = f.getParents(), inside = false, fid = zFolder_().getId();
  while (par.hasNext()) if (par.next().getId() === fid) inside = true;
  if (!inside || !/^macka-zaloha-.*\.json$/.test(f.getName())) throw new Error('Súbor nie je záloha.');
  return { ok: true, name: f.getName(), data: JSON.parse(f.getBlob().getDataAsString('UTF-8')) };
}

// Firestore REST pod Google účtom vlastníka projektu (pravidlá sa neuplatnia)
function fs_(method, path, body) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + PROJEKT + '/databases/(default)/documents/' + path;
  var o = {
    method: method,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': PROJEKT },
    muteHttpExceptions: true
  };
  if (body) { o.contentType = 'application/json'; o.payload = JSON.stringify(body); }
  var r = UrlFetchApp.fetch(url, o), code = r.getResponseCode(), t = r.getContentText();
  if (code >= 300) {
    var m = t;
    try { m = JSON.parse(t).error.message; } catch (x) {}
    if (code === 403) m = 'Firebase odmietol prístup. Skript musí bežať pod Google účtom, ktorý vlastní projekt ' + PROJEKT + ', a v appsscript.json musí byť povolenie „datastore“. (' + m + ')';
    throw new Error('Firebase ' + code + ': ' + m);
  }
  return t ? JSON.parse(t) : {};
}

function walkCol_(col, out) {
  var token = '';
  do {
    var r = fs_('get', col + '?pageSize=300&showMissing=true' + (token ? '&pageToken=' + encodeURIComponent(token) : ''));
    (r.documents || []).forEach(function (d) {
      var rel = d.name.split('/documents/')[1];
      if (rel === 'apps/zaloha') return;
      if (d.createTime) {
        var data = fromFields_(d.fields || {});
        if (rel === 'apps/vyplaty' && data.gs) delete data.gs.token; // kľúč do zálohy nepatrí
        out[rel] = data;
      }
      var ct = '';
      do {
        var c = fs_('post', rel + ':listCollectionIds', ct ? { pageSize: 100, pageToken: ct } : { pageSize: 100 });
        (c.collectionIds || []).forEach(function (id) { walkCol_(rel + '/' + id, out); });
        ct = c.nextPageToken || '';
      } while (ct);
    });
    token = r.nextPageToken || '';
  } while (token);
}

function fromFields_(f) {
  var o = {};
  Object.keys(f).forEach(function (k) { o[k] = fromVal_(f[k]); });
  return o;
}

function fromVal_(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) return fromFields_(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromVal_);
  if ('timestampValue' in v) return v.timestampValue;
  if ('referenceValue' in v) return v.referenceValue;
  if ('geoPointValue' in v) return v.geoPointValue;
  if ('bytesValue' in v) return v.bytesValue;
  return null;
}

function toFields_(o) {
  var f = {};
  Object.keys(o).forEach(function (k) {
    var v = o[k];
    f[k] = typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : { stringValue: String(v) };
  });
  return f;
}
