FROM oven/bun

# Install dependencies
RUN apt-get update && apt-get install -y ffmpeg curl python3 rsync python3-pycryptodome

# Install yt-dlp using apt-get
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/bin/yt-dlp
RUN chmod a+rx /usr/bin/yt-dlp  # Make executable

# Install bun deps
COPY package.json bun.lockb .
RUN bun install --ignore-scripts

# Copy app files
COPY . .

# Link tt binary
RUN bun link

CMD ["/bin/bash"]