# Use a stable Node.js LTS version for broader compatibility
FROM node:lts

# Create and set working directory
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app
WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Switch to non-root user for security
USER node

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application code
COPY --chown=node:node . .

# Expose the port (informational, Railway uses PORT env variable)
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]

# Optional: Add healthcheck for Railway
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:${PORT:-3000}/ || exit 1