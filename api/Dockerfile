FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

COPY src ./src

EXPOSE 5000
CMD ["node", "src/index.js"]
