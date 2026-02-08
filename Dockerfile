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

# Install ttyd (web terminal)
RUN set -eux; \
    arch="$(uname -m)"; \
    case "$arch" in \
        x86_64) bin="ttyd.x86_64" ;; \
        aarch64|arm64) bin="ttyd.aarch64" ;; \
        *) echo "Unsupported arch: $arch" >&2; exit 1 ;; \
    esac; \
    curl -L "https://github.com/tsl0922/ttyd/releases/latest/download/${bin}" -o /usr/local/bin/ttyd; \
    chmod a+rx /usr/local/bin/ttyd

# Copy app and deps
COPY --from=deps /app/node_modules /app/node_modules
COPY package.json /app/
COPY tsconfig.json /app/
COPY src /app/src

# Expose CLI on PATH
RUN chmod a+rx /app/src/treetrum.ts \
    && ln -s /app/src/treetrum.ts /usr/local/bin/tt

# Override base image entrypoint so our CMD runs directly.
ENTRYPOINT []

# Expose web terminal port
EXPOSE 7681

# Run web terminal (use bash; run `tt` inside)
# -W/--writable enables interactive input
CMD ["ttyd", "-p", "7681", "-W", "bash"]
