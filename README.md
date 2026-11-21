# Velora — Men's Shirts (static site)

Plain HTML, CSS and JavaScript. No backend, no build step. Fully responsive.

## What is inside
- **Storefront** — home, shop, 7 collections, 12 product pages, cart, checkout, order success, track order, about, contact, delivery & returns, size guide, FAQ, privacy, terms.
- **Admin panel (design preview)** — `admin/login.html` → dashboard, orders, order detail, order tracking, payments (history, COD settlements, methods), couriers, products, add/edit product (image upload, SEO box), collections, coupons, customers, banners, pages, SEO, pixels & tracking, settings.
  The admin has no backend yet: it shows demo data and saves nothing.

## Publish on GitHub Pages
1. Create a new repository on GitHub.
2. Upload **the contents** of this folder (so `index.html` is at the repository root).
3. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

## After publishing — do these two things
1. **Replace the site address.** Find and replace `https://YOUR-USERNAME.github.io/YOUR-REPO` with your real address in all files (VS Code: *Edit → Replace in Files*). It is used for canonical links, social tags, `sitemap.xml` and `robots.txt`.
2. **Add your Pixel IDs.** Open `assets/js/tracking.js` and paste your Meta Pixel, GA4, GTM or TikTok IDs. The admin page *Pixels & tracking* generates the exact config for you.

## Notes
- `/admin/` is **not protected** on a static host; do not put real data there. Real login and saving come with the backend phase.
- Cart and orders are stored in the visitor's browser (localStorage) for demo only.
- Brand colours, fonts and text are in `assets/css/store.css` and the HTML files.
