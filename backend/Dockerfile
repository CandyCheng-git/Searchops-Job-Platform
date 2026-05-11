FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { if (res.statusCode !== 200) process.exit(1); }).on('error', () => process.exit(1));"

CMD ["npm", "start"]