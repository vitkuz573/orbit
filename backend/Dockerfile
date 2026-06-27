# ─── Builder ─────────────────────────────────────────────────────────────────
FROM rust:1.85-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libc6-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release 2>/dev/null || true

COPY src/ src/
RUN cargo build --release

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    android-tools-adb \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 orbit

COPY --from=builder /app/target/release/orbit-backend /usr/local/bin/orbit-backend

USER orbit
EXPOSE 8080

ENTRYPOINT ["orbit-backend"]
