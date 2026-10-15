/**
 * Two Beauty – booking endpoint (Google Apps Script web app).
 * Writes every booking into the salon's own Google Calendar and reports busy slots.
 * Deploy: Extensions > Apps Script (signed in as the salon's Google account) > paste > Deploy > Web app
 *         Execute as: Me | Who has access: Anyone.  Paste the /exec URL into CONFIG.endpoint in index.html.
 */
var CALENDAR_NAME = 'Two Beauty Randevular';
var TZ = 'Europe/Istanbul';
var OPEN = 10, CLOSE = 19;                 // keep equal to CONFIG in index.html
var CLOSED_DAYS = [0];                     // 0 = Sunday
var MASTERS = ['olga', 'ozlem'];

function cal_() {
  var c = CalendarApp.getCalendarsByName(CALENDAR_NAME);
  return c.length ? c[0] : CalendarApp.createCalendar(CALENDAR_NAME, {timeZone: TZ});
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function start_(date, time) {
  var p = date.split('-'), h = parseInt(time.split(':')[0], 10);
  return new Date(+p[0], +p[1] - 1, +p[2], h, 0, 0);
}
function masterOf_(ev) { return ev.getTag('master'); }

// GET ?action=busy&from=YYYY-MM-DD&to=YYYY-MM-DD  -> {busy:["2026-10-20_1100_olga", ...]}
function doGet(e) {
  var p = e.parameter || {};
  if (p.action !== 'busy') return out_({ok: true});
  var f = start_(p.from, '00:00'), t = start_(p.to, '23:00');
  var busy = [];
  cal_().getEvents(f, t).forEach(function (ev) {
    var m = masterOf_(ev); if (!m) return;
    var s = ev.getStartTime();
    busy.push(Utilities.formatDate(s, TZ, 'yyyy-MM-dd') + '_' + Utilities.formatDate(s, TZ, 'HHmm') + '_' + m);
  });
  return out_({busy: busy});
}

// POST JSON {date,time,master,service,name,phone,note,hp}
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var b = JSON.parse(e.postData.contents);
    if (b.hp) return out_({ok: false, reason: 'spam'});
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || !/^\d{2}:00$/.test(b.time)) return out_({ok: false, reason: 'bad'});
    var s = start_(b.date, b.time), h = s.getHours();
    if (CLOSED_DAYS.indexOf(s.getDay()) > -1 || h < OPEN || h >= CLOSE || s < new Date()) return out_({ok: false, reason: 'bad'});
    var name = String(b.name || '').slice(0, 80), phone = String(b.phone || '').slice(0, 30);
    if (name.length < 2 || phone.replace(/\D/g, '').length < 10) return out_({ok: false, reason: 'bad'});

    var c = cal_(), e2 = new Date(s.getTime() + 3600000);
    var taken = {};
    c.getEvents(s, e2).forEach(function (ev) { taken[masterOf_(ev)] = true; });
    var order = b.master === 'any' ? MASTERS : [b.master];
    var pick = null;
    for (var i = 0; i < order.length; i++) if (MASTERS.indexOf(order[i]) > -1 && !taken[order[i]]) { pick = order[i]; break; }
    if (!pick) return out_({ok: false, reason: 'taken'});

    var ev = c.createEvent(String(b.service || '').slice(0, 60) + ' · ' + name + ' (' + pick + ')', s, e2, {
      description: 'Tel: ' + phone + '\nUsta: ' + pick + '\nNot: ' + String(b.note || '').slice(0, 400) + '\nDil: ' + b.lang + '\nDurum: bekliyor'
    });
    ev.setTag('master', pick);
    ev.setColor(CalendarApp.EventColor.PALE_RED);
    return out_({ok: true, master: pick});
  } finally {
    lock.releaseLock();
  }
}
