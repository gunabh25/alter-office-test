# -------------------------
# BASE IMAGE
# -------------------------
FROM node:20-alpine AS base

WORKDIR /app

# -------------------------
# COPY ONLY PACKAGE FILES FIRST
# (Better caching)
# -------------------------
COPY package*.json ./

# -------------------------
# INSTALL ONLY PROD DEPENDENCIES
# -------------------------
RUN npm install --omit=dev

# -------------------------
# COPY APP FILES (EXCLUDING DOTFILES)
# IMPORTANT: This prevents copying .env or other local secrets
# -------------------------
COPY . .

# Explicitly delete any accidental .env copied
RUN rm -f .env || true

# -------------------------
# GENERATE PRISMA CLIENT
# -------------------------
RUN npx prisma generate

# -------------------------
# EXPOSE RENDER PORT
# -------------------------
EXPOSE 10000

# -------------------------
# START SERVER
# -------------------------
CMD ["node", "src/server.js"]
