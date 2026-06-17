FROM node:18-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libssl3

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy app files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs &&     adduser -S nodejs -u 1001

# Fix permissions
RUN chown -R nodejs:nodejs /app/prisma /app/node_modules/.prisma

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

USER nodejs

CMD ["sh", "-c", "npx prisma db seed && node server.js"]