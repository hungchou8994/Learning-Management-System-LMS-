FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create logs directory and ensure uploads directory exists
RUN mkdir -p /app/logs /app/src/uploads && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3010

# Start the app
CMD ["npm", "run", "dev"] 