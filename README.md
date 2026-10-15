# Two Beauty – website

Static site (index.html) + Google Calendar booking via Apps Script. No monthly cost.

## 1) Google Calendar link (salon's own Google account)
1. Sign in to Google with the salon account, open https://script.google.com → New project.
2. Paste `apps-script/Code.gs`, save, **Deploy → New deployment → Web app**; Execute as **Me**, access **Anyone**. Authorize.
3. Copy the `/exec` URL and paste it into `CONFIG.endpoint` in `index.html`.
4. Bookings appear in a calendar called "Two Beauty Randevular" (pale red = pending; recolor to confirm).

## 2) Fill in the details (`CONFIG` in index.html)
`whatsapp` (digits only, e.g. 905xxxxxxxxx), `phone`, `address`, `maps`, and hours (`open`, `close`, `closedDays`; keep equal to Code.gs).
Photos: put files in `images/` and list them in `CONFIG.photos`, e.g. `{src:"images/1.jpg",cat:"nail"}`.

## 3) GitHub Pages
```
git init && git add . && git commit -m "Two Beauty site"
gh repo create otillion/two-beauty --public --source=. --push
```
Repo → Settings → Pages → Deploy from branch `main` / root. Site: https://otillion.github.io/two-beauty/
