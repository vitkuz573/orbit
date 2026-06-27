.PHONY: dev build lint test clean docker-up docker-down

# ─── Backend ────────────────────────────────────────────────────────────────

backend-dev:
	cargo run --manifest-path backend/Cargo.toml

backend-build:
	cargo build --release --manifest-path backend/Cargo.toml

backend-lint:
	cargo clippy --manifest-path backend/Cargo.toml -- -D warnings

backend-test:
	cargo nextest run --manifest-path backend/Cargo.toml

backend-clean:
	cargo clean --manifest-path backend/Cargo.toml

# ─── Frontend ───────────────────────────────────────────────────────────────

frontend-dev:
	pnpm --dir frontend dev

frontend-build:
	pnpm --dir frontend build

frontend-lint:
	pnpm --dir frontend lint

frontend-typecheck:
	pnpm --dir frontend typecheck

frontend-clean:
	rm -rf frontend/.next frontend/node_modules

# ─── Docker ─────────────────────────────────────────────────────────────────

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# ─── Quality ────────────────────────────────────────────────────────────────

lint: backend-lint frontend-lint

typecheck: frontend-typecheck

test: backend-test

build: backend-build frontend-build

clean: backend-clean frontend-clean

# ─── Git ────────────────────────────────────────────────────────────────────

pre-commit-install:
	pre-commit install

pre-commit-run:
	pre-commit run --all-files

# ─── All ────────────────────────────────────────────────────────────────────

dev: backend-dev frontend-dev

all: lint typecheck test build
