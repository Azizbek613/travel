# Travel Caravan — local booking/admin setup

## Run the website and booking server

Use two terminal windows in the project folder.

Terminal 1:
```bash
npm install
npm run dev
```

Terminal 2:
```bash
npm run server
```

Keep both terminals open while testing locally. The website development server forwards `/api` requests to `http://localhost:8787`.

## Enable the Admin Panel

1. Copy `.env.example` to a new file named `.env` in the project root.
2. Change `ADMIN_PASSWORD` to a strong private password.
3. Set a long random `SESSION_SECRET`.
4. Restart `npm run server`.
5. Open the site's `/admin` page and sign in with username `admin` (unless `ADMIN_USER` was changed) and the password you set.

Never upload `.env` to GitHub or share its secrets.

## Telegram notifications

For automatic booking notifications to the manager:
1. Create a bot with Telegram's official `@BotFather`.
2. Put its token in `TELEGRAM_BOT_TOKEN` in `.env`.
3. From the manager's Telegram account, open that bot and press **Start**.
4. Run `npm run telegram:setup` and follow the prompts to set `TELEGRAM_CHAT_ID`.
5. Restart the booking server and test a booking.

When a customer presses **Confirm Booking**, the booking is saved through the server. The website also opens the direct chat for @Xakimovsoxib with the booking details prefilled; the customer presses Send to transmit the message. Telegram does not allow a website to silently send a message from a customer's personal account.

## Production hosting note

`npm run server` is a separate Node.js backend. Vercel static hosting does not automatically run this server process. To make booking and admin features work on the public website, deploy the Node backend to a Node-capable host and configure the frontend's `/api` requests to reach that backend, or implement equivalent serverless API routes. Do not put Telegram bot tokens or admin passwords in frontend code.
