/**
 * Macka. – prepojenie s Google Kalendárom firmy
 *
 * Tento skript beží vo firemnom Google účte a appke Macka. sprístupní
 * firemný kalendár (čítanie, pridanie a zmazanie udalosti).
 * Prístup je chránený tajným kľúčom, ktorý je uložený len vo vlastnostiach
 * skriptu a vo Firebase (nie v kóde).
 *
 * Nastavenie (raz):
 *  1. Prihlás sa do firemného Google účtu a otvor https://script.google.com → Nový projekt.
 *  2. Vymaž obsah a vlož celý tento súbor. Projekt pomenuj „Macka. Kalendár“.
 *  3. Hore vyber funkciu „nastav“ → Spustiť → povoľ prístup ku kalendáru.
 *     V protokole (Execution log) sa zobrazí KĽÚČ – skopíruj ho.
 *  4. Nasadiť (Deploy) → Nové nasadenie → typ „Webová aplikácia“:
 *       Spustiť ako: Ja (firemný účet)
 *       Kto má prístup: Ktokoľvek (Anyone)
 *     → Nasadiť → skopíruj URL webovej aplikácie (končí na /exec).
 *  5. V appke Macka. → Kalendár vlož URL a KĽÚČ → Uložiť.
 */

// Prázdne = hlavný kalendár firemného účtu. Iný kalendár: vlož jeho ID
// (Nastavenia kalendára → Integrovať kalendár → ID kalendára).
var CAL_ID = '';

function nastav() {
  var p = PropertiesService.getScriptProperties();
  var t = p.getProperty('TOKEN');
  if (!t) {
    t = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    p.setProperty('TOKEN', t);
  }
  var c = cal_();
  Logger.log('Kalendár: ' + c.getName() + ' (' + c.getTimeZone() + ')');
  Logger.log('KĽÚČ pre appku: ' + t);
}

// Ak by kľúč niekto získal: spusti túto funkciu, potom „nastav“ a nový kľúč vlož do appky.
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

function cal_() {
  return CAL_ID ? CalendarApp.getCalendarById(CAL_ID) : CalendarApp.getDefaultCalendar();
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function handle_(p) {
  try {
    var t = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!t || p.token !== t) return out_({ ok: false, error: 'kluc' });
    var c = cal_(), tz = c.getTimeZone();
    function d_(s) { return Utilities.parseDate(s, tz, s.length > 10 ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'); }
    function f_(d, fmt) { return Utilities.formatDate(d, tz, fmt); }

    if (p.action === 'info') return out_({ ok: true, name: c.getName(), tz: tz });

    if (p.action === 'list') {
      var from = d_(p.from), to = d_(p.to);
      var ev = c.getEvents(from, to).map(function (x) {
        var all = x.isAllDayEvent();
        var s = all ? x.getAllDayStartDate() : x.getStartTime();
        var e = all ? x.getAllDayEndDate() : x.getEndTime();
        return {
          id: x.getId(),
          title: x.getTitle(),
          allDay: all,
          start: f_(s, all ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm"),
          end: f_(e, all ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm"),
          loc: x.getLocation() || '',
          desc: x.getDescription() || '',
          color: x.getColor() || '',
          rec: x.isRecurringEvent()
        };
      });
      return out_({ ok: true, name: c.getName(), events: ev });
    }

    if (p.action === 'add') {
      var title = String(p.title || '').trim();
      if (!title || !p.date) return out_({ ok: false, error: 'chyba nazov alebo datum' });
      var opt = { description: p.desc || '', location: p.loc || '' };
      var x;
      if (p.allDay || !p.from) {
        x = c.createAllDayEvent(title, d_(p.date), opt);
      } else {
        var st = d_(p.date + ' ' + p.from);
        var en = p.to ? d_(p.date + ' ' + p.to) : new Date(st.getTime() + 60 * 60 * 1000);
        if (en <= st) en = new Date(st.getTime() + 60 * 60 * 1000);
        x = c.createEvent(title, st, en, opt);
      }
      return out_({ ok: true, id: x.getId() });
    }

    if (p.action === 'del') {
      var ev2 = c.getEventById(p.id);
      if (!ev2) return out_({ ok: false, error: 'udalost sa nenasla' });
      if (ev2.isRecurringEvent()) return out_({ ok: false, error: 'opakovanu udalost zmaz v Google Kalendari' });
      ev2.deleteEvent();
      return out_({ ok: true });
    }

    return out_({ ok: false, error: 'neznama akcia' });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}
