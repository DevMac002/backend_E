FROM node:20-bullseye

# Install libvips and libheif so Sharp can decode HEIC/other formats
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    libvips-dev \
    libheif-dev \
    ca-certificates \
    wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# copy package.json first to leverage Docker cache
COPY package*.json ./

# install dependencies
RUN npm ci --only=production

# copy source
COPY . .

# Ensure migrations are run by the orchestrator or entrypoint. Default start.
EXPOSE 3000

CMD ["npm", "start"]
