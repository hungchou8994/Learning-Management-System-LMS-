FROM node:18-alpine

WORKDIR /usr/src/app

# Install build tools, compilers and runtimes
RUN apk add --no-cache \
    build-base \
    g++ \
    python3 \
    py3-pip \
    openjdk11 \
    && ln -sf python3 /usr/bin/python

# Set JAVA_HOME environment variable
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk
ENV PATH=$JAVA_HOME/bin:$PATH

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create temp directory for code processing
RUN mkdir -p temp && chmod 777 temp

# Expose port
EXPOSE 3003

# Start the service
CMD ["npm", "start"] 