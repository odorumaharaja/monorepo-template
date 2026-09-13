# frontend-pipecat

Real-time speech recognition frontend application built with Vite, React, TypeScript, and the [Pipecat Client SDK](https://github.com/pipecat-ai/pipecat-client-web).

## Tech Stack

- [Vite](https://vite.dev/) v8 — Build tool and dev server
- [React](https://react.dev/) v19 — UI library
- [TypeScript](https://www.typescriptlang.org/) v6 — Type-safe JavaScript
- [@pipecat-ai/client-js](https://www.npmjs.com/package/@pipecat-ai/client-js) — Pipecat JavaScript client
- [@pipecat-ai/client-react](https://www.npmjs.com/package/@pipecat-ai/client-react) — Pipecat React hooks and components
- [@pipecat-ai/websocket-transport](https://www.npmjs.com/package/@pipecat-ai/websocket-transport) — WebSocket transport layer
- [Lucide React](https://lucide.dev/) — Icon library
- [ESLint](https://eslint.org/) — Linter

## Running in Monorepo (Recommended)

This service is intended to run as part of the monorepo via Docker Compose. See the [root README](../README.md) for setup instructions.

When running in the monorepo:
- Accessible at: `http://localhost:8000/pipecat/`
- API endpoint is configured via the `VITE_API_URL` environment variable (defaults to `/api/pipecat`)
- The Vite base path is set to `/pipecat/` by Docker Compose
- Communicates with the `backend-pipecat` service via WebSocket for real-time audio streaming

## Local Development

If you want to develop this frontend independently:

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Project Structure

```
frontend-pipecat/
├── public/              # Static assets
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.tsx         # Entry point
│   ├── index.css        # Global styles
│   ├── hooks/           # Custom React hooks
│   └── assets/          # Bundled assets
├── Dockerfile           # Docker image definition (node:24-alpine)
├── index.html           # Entry HTML
├── package.json         # Dependencies and scripts
├── eslint.config.js     # ESLint configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.app.json    # TypeScript config for app source
├── tsconfig.node.json   # TypeScript config for Node tooling
└── vite.config.ts       # Vite configuration (with chunk splitting)
```

## Docker

The Dockerfile uses `node:24-alpine` as the base image and runs the Vite dev server by default:

```dockerfile
FROM node:24.20.0-alpine
WORKDIR /app
CMD ["npm", "run", "dev", "--", "--host"]
```

In the Docker Compose setup, the project directory is mounted as a volume, so changes are reflected immediately via Vite HMR.

## Vite Configuration

The Vite config includes manual chunk splitting for optimized production builds:

- `pipecat` chunk — `@pipecat-ai/*` packages
- `vendor` chunk — all other `node_modules` dependencies

## Testing

```bash
npm run lint
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL for API requests (set to `/api/pipecat` by Docker Compose) |
