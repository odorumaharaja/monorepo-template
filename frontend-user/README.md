# frontend-user

User-facing frontend application built with Vite, React, and TypeScript.

## Tech Stack

- [Vite](https://vite.dev/) v8 — Build tool and dev server
- [React](https://react.dev/) v19 — UI library
- [TypeScript](https://www.typescriptlang.org/) v6 — Type-safe JavaScript
- [Oxlint](https://oxc.rs/) — Fast linter

## Running in Monorepo (Recommended)

This service is intended to run as part of the monorepo via Docker Compose. See the [root README](../README.md) for setup instructions.

When running in the monorepo:
- Accessible at: `http://localhost:8000/user/`
- API endpoint is configured via the `VITE_API_URL` environment variable (defaults to `/api/user`)
- The Vite base path is set to `/user/` by Docker Compose

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
frontend-user/
├── public/              # Static assets
├── src/                 # Application source code
├── Dockerfile           # Docker image definition (node:24-alpine)
├── index.html           # Entry HTML
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tsconfig.app.json    # TypeScript config for app source
├── tsconfig.node.json   # TypeScript config for Node tooling
├── vite.config.ts       # Vite configuration
└── .oxlintrc.json       # Oxlint rules
```

## Docker

The Dockerfile uses `node:24-alpine` as the base image and runs the Vite dev server by default:

```dockerfile
FROM node:24.20.0-alpine
WORKDIR /app
CMD ["npm", "run", "dev", "--", "--host"]
```

In the Docker Compose setup, the project directory is mounted as a volume, so changes are reflected immediately via Vite HMR.

## Testing

```bash
npm run lint
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL for API requests (set to `/api/user` by Docker Compose) |
