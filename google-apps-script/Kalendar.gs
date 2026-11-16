/**
 * Macka. – prepojenie s Google Kalendárom a Gmailom firmy
 *
 * Tento skript beží vo firemnom Google účte a appke Macka. sprístupní
 * firemný kalendár (čítanie, pridanie, úprava a zmazanie udalosti)
 * a Gmail (zoznam e-mailov, čítanie, odpoveď) pre sekciu Správy.
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
 *
 * Po zmene tohto kódu: vlož nový kód, ulož, potom Nasadiť → Spravovať nasadenia
 * → ceruzka (Upraviť) → Verzia: Nová verzia → Nasadiť. URL zostane rovnaká.
 * Ak nová verzia potrebuje nové povolenie (napr. Gmail), najprv hore vyber
 * funkciu „nastav“ → Spustiť → povoľ prístup. Kľúč sa tým nezmení.
 *
 * Fotky pri udalostiach: vľavo „Služby“ (Services) → + → „Google Calendar API“
 * → Pridať (identifikátor musí zostať „Calendar“). Fotky sa ukladajú na Disk
 * firemného účtu do priečinka „Macka. fotky“.
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
  Logger.log('Gmail: ' + GmailApp.getInboxUnreadCount() + ' neprečítaných v Doručených');
  Logger.log('Disk: priečinok ' + folder_().getName());
  Logger.log('Fotky v kalendári: ' + (calApi_() ? 'služba Google Calendar API je pridaná' : 'CHÝBA služba Google Calendar API (Služby → + → Google Calendar API)'));
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
      var am = null;
      try { am = atts_(c.getId(), from, to); } catch (x) { am = null; }
      if (am) ev.forEach(function (e) { e.att = am[e.id] || []; });
      return out_({ ok: true, name: c.getName(), events: ev, photos: !!am });
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

    if (p.action === 'edit') {
      var ev3 = c.getEventById(p.id);
      if (!ev3) return out_({ ok: false, error: 'udalost sa nenasla' });
      if (ev3.isRecurringEvent()) return out_({ ok: false, error: 'opakovanu udalost uprav v Google Kalendari' });
      var nt = String(p.title || '').trim();
      if (!nt) return out_({ ok: false, error: 'chyba nazov' });
      ev3.setTitle(nt);
      ev3.setDescription(p.desc || '');
      ev3.setLocation(p.loc || '');
      if (p.date) {
        if (p.allDay || !p.from) {
          ev3.setAllDayDate(d_(p.date));
        } else {
          var st3 = d_(p.date + ' ' + p.from);
          var en3 = p.to ? d_(p.date + ' ' + p.to) : new Date(st3.getTime() + 60 * 60 * 1000);
          if (en3 <= st3) en3 = new Date(st3.getTime() + 60 * 60 * 1000);
          ev3.setTime(st3, en3);
        }
      }
      return out_({ ok: true, id: ev3.getId() });
    }

    if (p.action === 'del') {
      var ev2 = c.getEventById(p.id);
      if (!ev2) return out_({ ok: false, error: 'udalost sa nenasla' });
      if (ev2.isRecurringEvent()) return out_({ ok: false, error: 'opakovanu udalost zmaz v Google Kalendari' });
      ev2.deleteEvent();
      return out_({ ok: true });
    }

    if (p.action === 'photo') return out_(photo_(p));
    if (p.action === 'upload') return out_(upload_(c, p));
    if (p.action === 'unattach') return out_(unattach_(c, p));

    if (p.action === 'mail_list') return out_(mailList_(p, tz));
    if (p.action === 'mail_get') return out_(mailGet_(p, tz));
    if (p.action === 'mail_reply') return out_(mailReply_(p));
    if (p.action === 'mail_read') {
      var th0 = GmailApp.getThreadById(p.id);
      if (!th0) return out_({ ok: false, error: 'email sa nenasiel' });
      if (p.read) th0.markRead(); else th0.markUnread();
      return out_({ ok: true });
    }

    return out_({ ok: false, error: 'neznama akcia' });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}

/* ---- Gmail (sekcia Správy) ---- */

function who_(s) {
  s = String(s || '');
  var m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].trim(), email: m[2].trim() } : { name: '', email: s.trim() };
}

function mailList_(p, tz) {
  var q = String(p.q || 'in:inbox');
  var start = Math.max(0, +p.start || 0), max = Math.min(50, Math.max(1, +p.max || 25));
  var threads = GmailApp.search(q, start, max);
  var msgs = threads.length ? GmailApp.getMessagesForThreads(threads) : [];
  var list = threads.map(function (t, i) {
    var ms = msgs[i] || [], last = ms[ms.length - 1], first = ms[0];
    var other = null;
    for (var j = ms.length - 1; j >= 0; j--) { if (!ms[j].isDraft()) { other = ms[j]; break; } }
    var txt = last ? String(last.getPlainBody() || '').replace(/\s+/g, ' ').trim() : '';
    return {
      id: t.getId(),
      subject: t.getFirstMessageSubject() || '',
      from: who_(other ? other.getFrom() : ''),
      to: last ? last.getTo() : '',
      date: Utilities.formatDate(t.getLastMessageDate(), tz, "yyyy-MM-dd'T'HH:mm"),
      unread: t.isUnread(),
      count: t.getMessageCount(),
      star: t.hasStarredMessages(),
      snip: txt.slice(0, 160)
    };
  });
  return { ok: true, threads: list, more: threads.length === max };
}

function mailGet_(p, tz) {
  var t = GmailApp.getThreadById(p.id);
  if (!t) return { ok: false, error: 'email sa nenasiel' };
  var ms = t.getMessages().filter(function (m) { return !m.isDraft() && !m.isInTrash(); }).map(function (m) {
    return {
      id: m.getId(),
      from: who_(m.getFrom()),
      to: m.getTo() || '',
      cc: m.getCc() || '',
      replyTo: m.getReplyTo() || '',
      date: Utilities.formatDate(m.getDate(), tz, "yyyy-MM-dd'T'HH:mm"),
      subject: m.getSubject() || '',
      body: String(m.getPlainBody() || '').slice(0, 30000),
      att: m.getAttachments({ includeInlineImages: false }).map(function (a) {
        return { name: a.getName(), size: a.getSize() };
      })
    };
  });
  if (p.markRead && t.isUnread()) t.markRead();
  return { ok: true, id: t.getId(), subject: t.getFirstMessageSubject() || '', messages: ms, me: Session.getEffectiveUser().getEmail() };
}

// Odpoveď na posledný e-mail vo vlákne. Ak má Gmail nastavenú adresu firmy
// v „Odoslať ako“, pošle sa z nej; inak z Gmailu a odpovede zákazníka
// pôjdu na adresu firmy (Reply-To).
function mailReply_(p) {
  var t = GmailApp.getThreadById(p.id);
  if (!t) return { ok: false, error: 'email sa nenasiel' };
  var body = String(p.body || '').trim();
  if (!body) return { ok: false, error: 'prazdna odpoved' };
  var ms = t.getMessages().filter(function (m) { return !m.isDraft(); });
  var me = Session.getEffectiveUser().getEmail().toLowerCase();
  var addr = String(p.addr || '').trim().toLowerCase();
  var target = null;
  for (var i = ms.length - 1; i >= 0; i--) {
    var f = who_(ms[i].getFrom()).email.toLowerCase();
    if (f !== me && f !== addr) { target = ms[i]; break; }
  }
  if (!target) target = ms[ms.length - 1];
  var opt = {};
  if (p.name) opt.name = String(p.name);
  if (addr) {
    var al = GmailApp.getAliases().map(function (a) { return a.toLowerCase(); });
    if (al.indexOf(addr) >= 0) opt.from = addr; else opt.replyTo = addr;
  }
  target.reply(body, opt);
  return { ok: true, from: opt.from || me };
}

/* ---- Fotky pri udalostiach (prílohy z Disku) ---- */

function calApi_() { return typeof Calendar !== 'undefined'; }

function folder_() {
  var it = DriveApp.getFoldersByName('Macka. fotky');
  return it.hasNext() ? it.next() : DriveApp.createFolder('Macka. fotky');
}

// Prílohy udalostí v danom období: { iCalUID: [ {fileId, title, mime, url} ] }
function atts_(calId, from, to) {
  if (!calApi_()) return null;
  var map = {}, page;
  do {
    var r = Calendar.Events.list(calId, {
      timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: true,
      maxResults: 2500, pageToken: page,
      fields: 'nextPageToken,items(iCalUID,attachments(fileId,title,mimeType,fileUrl))'
    });
    (r.items || []).forEach(function (it) {
      if (it.attachments && it.attachments.length) {
        map[it.iCalUID] = it.attachments.map(function (a) {
          return { fileId: a.fileId || '', title: a.title || '', mime: a.mimeType || '', url: a.fileUrl || '' };
        });
      }
    });
    page = r.nextPageToken;
  } while (page);
  return map;
}

function restEvent_(calId, uid) {
  var r = Calendar.Events.list(calId, { iCalUID: uid, fields: 'items(id,recurringEventId,attachments)' });
  return (r.items || [])[0] || null;
}

// Fotka ako base64: náhľad (malý) alebo celá
function photo_(p) {
  if (!p.fileId) return { ok: false, error: 'chyba subor' };
  var f = DriveApp.getFileById(p.fileId), b = null;
  if (!p.full) { try { b = f.getThumbnail(); } catch (x) { b = null; } }
  if (!b) {
    if (!p.full && String(f.getMimeType()).indexOf('image/') !== 0) return { ok: false, error: 'bez nahladu' };
    if (f.getSize() > 15 * 1024 * 1024) return { ok: false, error: 'subor je prilis velky' };
    b = f.getBlob();
  }
  return { ok: true, mime: b.getContentType() || 'image/jpeg', data: Utilities.base64Encode(b.getBytes()), name: f.getName() };
}

function attCopy_(a) { return { fileUrl: a.fileUrl, title: a.title, mimeType: a.mimeType, fileId: a.fileId }; }

// Nahratie fotky na Disk a pripojenie k udalosti
function upload_(c, p) {
  if (!calApi_()) return { ok: false, error: 'sluzba' };
  if (!p.id || !p.data) return { ok: false, error: 'chyba udalost alebo subor' };
  var ev = restEvent_(c.getId(), p.id);
  if (!ev) return { ok: false, error: 'udalost sa nenasla' };
  var att = (ev.attachments || []).map(attCopy_);
  if (att.length >= 25) return { ok: false, error: 'udalost uz ma 25 priloh' };
  var blob = Utilities.newBlob(Utilities.base64Decode(p.data), p.mime || 'image/jpeg', p.name || 'foto.jpg');
  var f = folder_().createFile(blob);
  att.push({ fileUrl: 'https://drive.google.com/open?id=' + f.getId(), title: f.getName(), mimeType: f.getMimeType(), fileId: f.getId() });
  Calendar.Events.patch({ attachments: att }, c.getId(), ev.id, { supportsAttachments: true });
  return { ok: true, fileId: f.getId() };
}

// Odobratie fotky z udalosti (súbor zostane na Disku)
function unattach_(c, p) {
  if (!calApi_()) return { ok: false, error: 'sluzba' };
  var ev = restEvent_(c.getId(), p.id);
  if (!ev) return { ok: false, error: 'udalost sa nenasla' };
  var att = (ev.attachments || []).filter(function (a) { return a.fileId !== p.fileId; }).map(attCopy_);
  Calendar.Events.patch({ attachments: att }, c.getId(), ev.id, { supportsAttachments: true });
  return { ok: true };
}
