# Travel Caravan booking / admin update

## What changed
- Vehicle name, photos, status and other admin vehicle edits are persisted in localStorage and synchronized between tabs/windows.
- Vehicle prices are no longer shown on the public fleet, vehicle details, booking flow, or customer booking history.
- Booking flow now explains that final pricing is agreed based on route, distance, dates and passenger needs.
- Admin booking notifications remain persistent through the booking store and update across same-browser tabs.
- Admin **Confirm** opens the Travel Caravan Telegram chat with the booking details pre-filled.
- Customer booking success screen includes a direct Telegram contact button.

## Important Telegram limitation
A normal website cannot silently send a Telegram message to a personal account just from a phone number. Telegram requires the user to send the message, or a Telegram Bot/API backend with a bot token and chat ID.

## Important persistence limitation
The current app stores cars/bookings in browser localStorage. This survives refreshes on the same browser/origin and synchronizes between tabs, but it does **not** create a shared database between different devices or browsers. For production, a shared backend/database should be connected so the public website and admin panel see the same cars and bookings everywhere.
