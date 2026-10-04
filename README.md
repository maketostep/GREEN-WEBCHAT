# GREEN-API Web Chat for MAX

<p>
  <a href="https://maketostep.github.io/GREEN-WEBCHAT/"><img alt="Live demo" src="https://img.shields.io/badge/demo-GitHub%20Pages-0a7cff.svg?logo=github&logoColor=white"></a>
  <img alt="React" src="https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178c6.svg?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff.svg?logo=vite&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8.svg?logo=tailwindcss&logoColor=white">
  <img alt="Tests: 44 passing" src="https://img.shields.io/badge/tests-44%20passing-brightgreen.svg">
  <a href="https://drive.google.com/drive/folders/1NNwOi0LG3oiYZcWn9pG3mL_WtUGga__e?usp=sharing"><img alt="Demo video" src="https://img.shields.io/badge/demo-video-red.svg?logo=googledrive&logoColor=white"></a>
</p>

**English** | [Русский](README.ru.md)

**Live demo:** [maketostep.github.io/GREEN-WEBCHAT](https://maketostep.github.io/GREEN-WEBCHAT/)
**Demo video:** [Google Drive](https://drive.google.com/drive/folders/1NNwOi0LG3oiYZcWn9pG3mL_WtUGga__e?usp=sharing)

A browser chat for the MAX messenger built on [GREEN-API](https://green-api.com/max). You sign
in with your instance credentials, open a chat by phone number, send text messages and read
replies as they arrive. The interface follows [web.max.ru](https://web.max.ru): the same
"space" palette, bubbles, chat list and mobile layout.

The app has no backend. GREEN-API answers with `Access-Control-Allow-Origin: *`, so the
browser calls the API directly, and the whole project builds into static files.

![Desktop](docs/screenshot.png)

<img alt="Mobile" src="docs/screenshot-mobile.png" width="320">

## Getting started

```bash
npm install
npm run dev
```

You need Node 20.19+ or 22.12+. Open the address Vite prints and sign in:

1. Create a MAX instance in the [GREEN-API console](https://console.green-api.com). The free
   Developer plan works.
2. Authorize it: in the MAX app open Profile → Devices → Sign in with QR code and scan the code
   from the console.
3. Copy `idInstance` and `apiTokenInstance`. You can leave `apiUrl` empty: the app builds it
   from the first four digits of `idInstance`, for example `https://3100.api.green-api.com`.

To skip typing the keys, copy `.env.example` to `.env` and fill it in. The dev server fills
the login form from it. Production builds never contain these values, which you can check
with a search through `dist`. `npm run dev` runs `vite --host` and serves the filled form to
your local network, so keep real keys in `.env` only on a network you trust.

| Command | What it does |
|---|---|
| `npm run dev` | dev server with hot reload |
| `npm test` | Vitest, 44 tests |
| `npm run build` | type check and production build into `dist` |
| `npm run preview` | serves `dist` locally |
| `npm run lint` | oxlint |

## How it works

```
  browser tab                                     GREEN-API (MAX instance)
  -----------                                     ------------------------
  login form ──── getStateInstance ─────────────▶ authorized?
  sidebar    ──── getSettings / setSettings ────▶ incoming notifications on?
             ──── getChats ─────────────────────▶ personal chats
  new chat   ──── checkAccount(phone) ──────────▶ numeric chatId
  open chat  ──── getChatHistory(chatId, 100) ──▶ last messages
  composer   ──── sendMessage(chatId, text) ────▶ idMessage
  poll loop  ──── receiveNotification (20 s) ───▶ incoming message
             ──── deleteNotification(receiptId) ▶ queue moves on
        │
        ▼
  reducer ──▶ localStorage ──▶ other tabs (storage event)
```

| File | Responsible for |
|---|---|
| `src/api/green-api.ts` | HTTP calls, error texts, `apiUrl` from `idInstance` |
| `src/lib/poll.ts` | long polling loop, deleting every notification, retry every 5 s |
| `src/lib/notification.ts` | parsing incoming notifications |
| `src/lib/history.ts` | parsing `getChats` and `getChatHistory` responses |
| `src/lib/chat-state.ts` | reducer: chats, messages, send status, merging history |
| `src/lib/storage.ts` | localStorage, recovery from broken data |
| `src/lib/phone.ts` | normalizing Russian and Belarusian numbers |
| `src/hooks/useNotifications.ts` | one polling tab per instance via Web Locks |
| `src/components/Messenger.tsx` | sending, retries, chat list and history loading, tab sync |
| `src/components/ReceivingNotice.tsx` | instance settings check and the "Enable" button |

## Decision log

**chatId comes from CheckAccount.** MAX identifies a person by a numeric `chatId`
(`"10000000"`), and incoming notifications carry that id, never the phone. A chat opened with
`79991234567@c.us` would never match the reply. So a new chat first calls `checkAccount`, and
the app skips that call for a number it already knows: the Developer plan allows 100 checks a
month.

**Every notification gets deleted.** The HTTP API queue is FIFO. A status or media
notification left in place blocks every message behind it, so the loop deletes all of them and
passes only text to the chat. A message reaches the reducer before its notification gets
deleted. If the delete fails, the same notification comes back, and the reducer drops it by
`idMessage`.

**The settings check appeared after a live run.** On a real instance the reply never showed
up. `getSettings` returned `incomingWebhook: "no"`, and the GREEN-API docs confirm that a new
instance starts with every notification turned off. Now the app checks the settings after
login and offers an "Enable" button. It does not switch the setting silently: `setSettings`
reboots the instance, and the change takes up to five minutes. A configured `webhookUrl` only
gets an explanation, because clearing it would break someone else's integration.

**Rate limits in development.** React StrictMode runs effects twice in dev, and GREEN-API
answered the second `getSettings` with 429. The check now retries a 429 up to three times with
a two second pause.

**One tab polls the queue.** Two open tabs used to take turns reading the queue, so a reply
showed up in only one of them, and the other tab could overwrite it in localStorage. The poll
loop now runs inside `navigator.locks.request`, the other tabs pick up changes through the
`storage` event, and signing out in one tab signs out the rest.

**History loads when you open a chat.** `getChats` returns the list in one request, but
fetching history for a few dozen chats at once would run into the per second limit. The app loads the
last 100 messages of a chat when you open it. After a send, the local message takes the
`idMessage` from the response, so the same message from history does not show up twice. The
app accepts that id only if it is a non empty string, otherwise it keeps the local one.

**Keys stay out of the build.** `vite.config.ts` exposes `.env` keys to client code only when
`command === 'serve'`. A production build sees just `VITE_` variables, and a search for the
token in `dist` finds nothing.

**Local ids without crypto.randomUUID.** With `vite --host` you can open the dev server from a
phone over plain HTTP. `crypto.randomUUID` does not exist in that insecure context and sending
crashed, so local ids use time plus `Math.random`.

**Scrolling without JS.** The message list is a `flex-col-reverse` container: the browser keeps
it pinned to the newest message. The list remounts per chat (`key`), otherwise it kept the
scroll position of the previous chat.

**Colors.** Tokens come from web.max.ru (the "space" theme). Two of them failed the WCAG AA
contrast check, so the error red is `#e0242f` instead of `#ff303c`, and secondary text in the
chat list uses the darker grey. Icons come from Phosphor.

## Tests

```bash
npm test
```

44 Vitest tests cover the API requests (URL, method, body for every endpoint), notification
and history parsing, the reducer, recovery from broken saved data and the polling loop: abort during a
request, abort during the retry pause and the five second retry interval.

Manual check in a browser, against a mocked API and against a real instance: sign in, enable
notifications, open a chat by phone, send, get the reply in the same chat.

## Deploy

`.github/workflows/deploy.yml` installs dependencies, runs the tests, builds and publishes
`dist` to GitHub Pages on every push to `main`. The `gh-pages` branch holds the same build,
made locally, as a fallback when Actions cannot run.

## Limitations

- Text messages and personal chats only: no media, groups, reactions or read receipts.
- Phone numbers from Russia (+7) and Belarus (+375): CheckAccount accepts no other countries.
- The free Developer plan allows 3 chats and 100 CheckAccount calls a month.
- History covers the last 100 messages of a chat, and GREEN-API keeps three months.
- Messages you send from the MAX app on your phone show up after you reopen the chat.
- Credentials live in localStorage of your browser, since there is no server to keep them.
