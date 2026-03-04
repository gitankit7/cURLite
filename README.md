# cURLite

A lightweight, local-first curl command builder and executor. Organize your API requests by service, tag them with labels, bookmark the important ones, and execute them — all from a clean terminal-inspired UI.

![Built with](https://img.shields.io/badge/Built%20with-React%20%2B%20Vite%20%2B%20Express-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)

---

## Features

- **Service-based organization** — group your curl commands under named services (e.g. "Auth API", "Payment Gateway", "User Service")
- **Build curl commands visually** — pick method, set URL, headers (key-value pairs), and body; the curl command is generated live
- **Execute locally** — run curl natively on your machine via the Express backend, no CORS issues
- **Verbose mode (`-v`)** — toggle on/off; shows full TLS handshake, request/response headers in the output
- **History with dedup** — saving a request with the same method + URL replaces the old entry instead of creating duplicates
- **Bookmarks** — star important requests to pin them to the top of history
- **Labels** — tag requests with optional labels (e.g. "Get all users", "Create order"); add, edit, or remove labels anytime
- **Filter by label** — quickly find requests in history using the search filter
- **Edit commands inline** — modify any saved curl command directly in history
- **Copy to clipboard** — one-click copy for any generated or saved command
- **Persistent storage** — data saved as a plain JSON file on disk (`data/services.json`); delete it anytime to reset
- **Export / Import** — backup your data as JSON or restore from a previous export
- **Configurable ports** — customize both frontend and API server ports via environment variables

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Install & Run

```bash
git clone https://github.com/gitankit7/curlite.git
cd cURLite
npm install

# Start both frontend + backend
npm start
```

Open **http://localhost:2401** in your browser.

### Port Configuration(if ports not available or you want to customize):

Configure ports using environment variables:

```bash
# Method 1: Use specific port variables
DEV_PORT=3000 API_PORT=3001 npm start

# Method 2: Use legacy PORT variable (API will be PORT + 1)
PORT=3000 npm start  # frontend: 3000, API: 3001

# Method 3: Create .env file from .env.example
cp .env.example .env
# Edit .env with your preferred ports
npm start
```

**Default ports:**
- Frontend (Vite): `2401`
- API Server (Express): `2402`

**Environment variables:**
- `DEV_PORT` — Frontend development server port
- `API_PORT` — API server port
- `PORT` — Legacy mode: sets frontend port, API becomes PORT + 1

### Background Mode

Run cURLite in the background with error-only logging:
Need some permissions first :)
```
chmod +x scripts/background.sh
```
```bash
# Start in background (recommended for daily use)
npm run start:bg

# Check status
npm run status:bg

# View error logs
npm run logs:bg

# Stop background process
npm run stop:bg
```

**Manual background options:**
```bash
# Background with error logging
npm start > /dev/null 2> curlite-errors.log &
echo $! > curlite.pid

# Check if running
kill -0 $(cat curlite.pid) && echo "Running" || echo "Stopped"

# Stop
kill $(cat curlite.pid) && rm curlite.pid
```

> **Frontend only?** Run `npm run dev` if you just want the builder without curl execution.

## Screenshots

```
┌─────────────────────────────────────────────────┐
│  >_  cURLite                                    │
│      Select or create a service                 │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 🔵       │  │ 🟢       │  │ 🟠       │      │
│  │ Auth API │  │ Users    │  │ Payments │      │
│  │ 5 reqs   │  │ 3 reqs   │  │ 8 reqs   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                          [ + ]  │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
curlite/
├── .gitignore
├── index.html                 # Entry HTML
├── package.json
├── vite.config.js             # Vite dev server (proxies /api → Express)
├── data/                      # Auto-created, gitignored
│   └── services.json          # Your saved data
├── server/
│   └── index.js               # Express backend — curl execution + data API
└── src/
    ├── main.jsx               # React entry point
    ├── App.jsx                # Root component, state management
    ├── storage.js             # Storage layer (disk + localStorage fallback)
    ├── curl.js                # Curl command generation + clipboard helpers
    ├── components.jsx         # Shared UI components (MethodBadge, TabBtn)
    ├── ServiceListScreen.jsx  # Service grid / home screen
    └── BuilderScreen.jsx      # Builder, history, response viewer
```

## Scripts

| Command                  | Description                                       |
|--------------------------|---------------------------------------------------|
| `npm start`              | Start frontend (2401) + backend (2402)           |
| `npm run start:bg`       | **Start in background with error logging**       |
| `npm run stop:bg`        | **Stop background process**                      |
| `npm run status:bg`      | **Check background process status**              |
| `npm run logs:bg`        | **View background error logs**                   |
| `npm run dev`            | Start Vite dev server only (port 2401)           |
| `npm run server`         | Start Express API only (port 2402)               |
| `npm run build`          | Production build to `dist/`                      |
| `npm run preview`        | Preview production build                         |
| `PORT=3000 npm start`    | Run with custom ports (frontend: 3000, API: 3001) |

## Storage

All data is persisted as a **plain JSON file** at:

```
data/services.json
```

This file and folder are auto-created on first use and gitignored by default. To reset everything, just delete the `data/` folder.

The frontend also mirrors data to `localStorage` as a fast fallback, so running frontend-only (`npm run dev`) still works without the backend.

### Export / Import

From the browser console:

```js
// Download a backup
(await import('/src/storage.js')).default.exportJSON()

// Import from file
(await import('/src/storage.js')).default.importJSON(file)
```

## API Endpoints

The Express backend at `localhost:2402` (or your configured API_PORT) exposes:

| Method | Endpoint        | Description                        |
|--------|-----------------|------------------------------------|
| POST   | `/api/execute`  | Execute a curl command natively    |
| GET    | `/api/data`     | Read all services                  |
| PUT    | `/api/data`     | Save all services                  |
| GET    | `/api/health`   | Health check                       |

### Execute payload

```json
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": { "Authorization": "Bearer token123" },
  "body": "{\"name\": \"test\"}",
  "verbose": true
}
```

## Tech Stack

- **Frontend** — React 18, Vite 5
- **Backend** — Express 4, Node.js `child_process` for native curl execution
- **Styling** — Inline CSS, IBM Plex Mono + Space Grotesk fonts
- **Storage** — JSON file on disk + localStorage fallback
- **No database, no Docker, no config files** — just `npm install` and go

## Contributing

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT — do whatever you want with it.

---

Built with ☕ and a lot of curling.

