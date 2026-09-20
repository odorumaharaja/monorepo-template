FROM node:24.20.0-alpine

WORKDIR /app

# For dev mode, we assume the code (and node_modules) is mounted as a volume.
# For production offline mode, the code is also mounted, and we just run preview.
# The default command will be running the vite dev server or preview depending on docker-compose.
# We'll default to the dev server.
CMD ["npm", "run", "dev", "--", "--host"]
