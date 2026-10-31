# Local Admin and Telegram setup

## Run the local site

Open two terminals in this project folder:

Terminal 1:
```bash
npm run server
```

Terminal 2:
```bash
npm run dev
```

Open the local Vite URL printed in Terminal 2 (usually http://localhost:8080), then open `/admin`.

## Local admin login

The included `.env` is only a local starter configuration:
- Username: `admin`
- Password: `TravelCaravan-ChangeMe-2026!`

Change `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env` before using this project anywhere public. Never commit `.env` to GitHub.

## Telegram booking hand-off

When a customer confirms a booking, the site opens the direct chat for `@Xakimovsoxib` with the booking details prefilled. The customer presses Send to transmit the message. Telegram does not guarantee that a website can open a private chat by phone number alone; a public Telegram username is needed for a reliable direct-to-chat link. If the booking API is unavailable, the form still opens the Telegram share page so the customer can send the request manually.

## Important for Vercel

The current `server/index.mjs` is a persistent Node server. A static Vercel deployment does not automatically run it. The local `.env` and local server only fix local development. For the online website, deploy this Node server to a Node host and configure the Vercel site's API base/proxy to point to that server, then set the admin and Telegram environment variables in that host's dashboard. Do not upload the local `.env` to GitHub or Vercel source.
