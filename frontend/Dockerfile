# Base image
FROM node:18-alpine

# Install curl
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --production;
RUN rm -rf ./.next/cache

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Start Next.js in development mode
CMD ["npm", "run", "dev"]