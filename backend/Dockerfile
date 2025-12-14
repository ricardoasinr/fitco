FROM node:20-alpine

WORKDIR /app

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code (for production build)
COPY . .

# Copy and set permissions for entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Build the application (for production)
RUN npm run build

# Expose port
EXPOSE 3000

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Default to production, but can be overridden in docker-compose
CMD ["npm", "run", "start:prod"]

