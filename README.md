# HoneyDip website

Static website for the HoneyDip product launch (TQM project, Muhammad Khalil).
No build step: plain HTML, CSS and JavaScript. Smooth scrolling uses Lenis (included in `js/`).

## Put it live on GitHub Pages
1. Create a new public repository on GitHub, for example `honeydip`.
2. Upload everything in this folder (index.html, css, js, assets) to the repository root.
3. Open **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute the site is live at `https://YOUR-USERNAME.github.io/honeydip/`.

## Change the order buttons
Open `js/main.js` and edit the two lines at the top:
- `WHATSAPP = ''` → put your number with country code, e.g. `'923001234567'`
- `EMAIL = '...'` → your email
