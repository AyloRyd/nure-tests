set shell := ["bash", "-euo", "pipefail", "-c"]

[private]
default:
    @just --list --unsorted

# Install dependencies
install:
    pnpm install

# Install and build once, so dist/ exists before the first dev run
setup: install build

# Watch build into dist/ + helper server on localhost:3010
dev:
    pnpm dev

# Type-check and production build into dist/
build:
    pnpm build

# Run the unit tests
test:
    pnpm test

# Run eslint
lint:
    pnpm lint

# Type-check without building
typecheck:
    pnpm typecheck

# Lint + type-check + tests
check:
    pnpm check

# Run prettier over the repo
format:
    pnpm format

# Build and zip dist/ the same way the release workflow does
zip: build
    rm -f nure-tests.zip
    cd dist && if command -v zip >/dev/null; then zip -qr ../nure-tests.zip .; else bsdtar --format zip -cf ../nure-tests.zip .; fi
    @echo "nure-tests.zip"

# Bump the manifest version, commit, tag and push (e.g. just release 1.1.0)
release version: check
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ ! "{{ version }}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "version must look like 1.2.3" >&2; exit 1
    fi
    if [[ "$(git branch --show-current)" != "main" ]]; then
      echo "release from main" >&2; exit 1
    fi
    if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
      echo "commit or stash your changes first" >&2; exit 1
    fi
    if git rev-parse -q --verify "refs/tags/v{{ version }}" >/dev/null; then
      echo "tag v{{ version }} already exists" >&2; exit 1
    fi
    current=$(jq -r .version public/manifest.json)
    if [[ "$current" != "{{ version }}" ]]; then
      sed -i 's/"version": "[^"]*"/"version": "{{ version }}"/' public/manifest.json
      git add public/manifest.json
      git commit -m "chore: release v{{ version }}"
    fi
    git tag -a "v{{ version }}" -m "v{{ version }}"
    git push origin main "v{{ version }}"
