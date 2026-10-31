# Travel Caravan

Website (English + Russian, English is the default) with an online booking form,
an admin panel and Telegram notifications for every new booking.

## How it works

- Customers book on the website → the booking is saved **on the server**
  (`server/data/bookings.json`) and a message is sent to your Telegram.
- `/admin` shows every booking from every device (refreshes every few seconds,
  with a pop-up for new bookings). Confirm / cancel / complete / delete from there.
- Customers can check their booking in **My Bookings** (booking ID + phone number).

## First-time setup

```bash
npm install
cp .env.example .env        # then open .env and fill it in
```

### 1. Admin login
In `.env` set `ADMIN_USER`, `ADMIN_PASSWORD` (choose a strong one) and `SESSION_SECRET`.

### 2. Telegram notifications
A website cannot send a Telegram message to a phone number directly — Telegram
only allows it through a **bot**. One-time setup (2 minutes):

1. In Telegram open **@BotFather** → `/newbot` → copy the token into `.env` as `TELEGRAM_BOT_TOKEN`.
2. From the Telegram account **+998 90 710 64 64** open your new bot and press **START**.
3. Run `npm run telegram:setup` — it finds the chat id, saves it to `.env` and sends a test message.

You can re-test any time in **Admin → Settings → Send test message**.

### 3. Run

```bash
npm run build
npm run server              # website + API + admin on http://localhost:8787
```

Development (hot reload): run `npm run server` in one terminal and `npm run dev`
in another, then open http://localhost:8080.

## Deploying

The site now has a small Node.js backend, so host it where Node can run
(a VPS, Render, Railway, Fly.io …) with `npm run build && npm run server` as the start
command and the variables from `.env` set in the host's settings.
Static-only hosting (GitHub Pages, plain Netlify) will not work for bookings.
Keep the `server/data` folder on a **persistent disk** — that's where bookings are stored.

## Notes

- Vehicles and their edits (admin → Vehicles) are still stored in each browser's
  localStorage, not on the server. Bookings are fully server-side.
- The charts on the admin dashboard use sample numbers, not real statistics.
