.PHONY: test test-contracts test-frontend build-contracts build-frontend lint deploy trustlines ci clean help

# ─── Default target ───────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  Aetheris Protocol — Build System"
	@echo ""
	@echo "  Usage: make <target>"
	@echo ""
	@echo "  Targets:"
	@echo "    test             Run contract (cargo) + frontend (vitest) tests"
	@echo "    build-contracts  Build all 3 WASM contracts"
	@echo "    build-frontend   Build Next.js production bundle"
	@echo "    lint             Lint Rust + TypeScript/Next.js"
	@echo "    deploy           Deploy contracts to Stellar Testnet"
	@echo "    trustlines       Set up AETH asset trustlines"
	@echo "    ci               Full pipeline: lint → test → build"
	@echo "    clean            Remove all build artifacts"
	@echo ""

# ─── Rust / Soroban ───────────────────────────────────────────────────────────
test: test-contracts test-frontend

test-contracts:
	cd contracts && cargo test --all -- --nocapture

test-frontend:
	cd frontend && npm test

build-contracts:
	cd contracts/aether-token && cargo build --target wasm32-unknown-unknown --release
	cd contracts/amm-vault && cargo build --target wasm32-unknown-unknown --release
	cd contracts/operations-router && cargo build --target wasm32-unknown-unknown --release
	./bin/stellar contract optimize --wasm contracts/target/wasm32-unknown-unknown/release/amm_vault.wasm
	./bin/stellar contract optimize --wasm contracts/target/wasm32-unknown-unknown/release/operations_router.wasm
	@echo "✓ WASM artifacts at contracts/target/wasm32-unknown-unknown/release/"

lint-contracts:
	cd contracts && cargo fmt --all -- --check
	cd contracts && cargo clippy --target wasm32-unknown-unknown -- -D warnings

# ─── Frontend ─────────────────────────────────────────────────────────────────
build-frontend:
	cd frontend && npm run build

lint-frontend:
	cd frontend && npm run lint
	cd frontend && npx tsc --noEmit

# ─── Combined ─────────────────────────────────────────────────────────────────
lint: lint-contracts lint-frontend

# ─── Deployment ───────────────────────────────────────────────────────────────
deploy:
	node scripts/deploy.js

trustlines:
	node scripts/setup-trustlines.js

# ─── Full CI pipeline ─────────────────────────────────────────────────────────
ci: lint test build-contracts build-frontend
	@echo ""
	@echo "✓ CI pipeline complete"
	@echo ""

# ─── Cleanup ──────────────────────────────────────────────────────────────────
clean:
	cd contracts && cargo clean
	cd frontend && rm -rf .next out node_modules/.cache
	@echo "✓ Clean complete"
