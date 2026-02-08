FROM oven/bun AS deps
WORKDIR /app

# Install production dependencies only
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun AS runtime
WORKDIR /app

# System dependencies (runtime)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        curl \
        ca-certificates \
        python3 \
        rsync \
        python3-pycryptodome \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/bin/yt-dlp \
    && chmod a+rx /usr/bin/yt-dlp

# Copy app and deps
COPY --from=deps /app/node_modules /app/node_modules
COPY package.json /app/
COPY src /app/src

# Expose CLI on PATH
RUN chmod a+rx /app/src/treetrum.ts \
    && ln -s /app/src/treetrum.ts /usr/local/bin/tt

# Keep the container alive for exec/attach usage
CMD ["sleep", "infinity"]
