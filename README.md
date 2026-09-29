<div align="center">

![TokenFlow](/web/public/logo.svg)

# TokenFlow

**One key. Every model. Pay as you go.**

A self-hosted, unified AI model API marketplace — an OpenAI-compatible gateway
that fronts many providers and models behind a single API key, with users,
quota, billing, and a full admin console built in.

</div>

## Features

- **OpenAI-compatible API** — point any existing SDK or tool at TokenFlow and
  route to OpenAI, Anthropic, Gemini, and many more providers
- **Multi-provider channels** — per-channel keys, models, weights, and health
  monitoring with automatic failover
- **Users & quota** — registration, tokens (API keys), top-ups, usage tracking,
  and per-token rate limits
- **Billing-ready** — per-model pricing, redemption codes, and payment
  integration hooks
- **Admin console** — full dashboard for channels, users, logs, and settings
- **Self-hosted** — SQLite out of the box; PostgreSQL/MySQL/Redis for scale

## Quick start (Docker)

```bash
docker compose up -d --build
# open http://localhost:3000
```

The first launch opens a setup wizard to create the administrator account.

## Development

Prerequisites: **Go ≥ 1.24**, **bun** (npm is not supported for the frontend),
and optionally gcc.

```bash
# Frontend (build first — it is embedded into the Go binary)
cd web && bun install && bun run build

# Backend
go build -o tokenflow.exe .
PORT=3001 ./tokenflow.exe --log-dir ./logs   # SQLite at tokenflow.db
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for architecture notes and the
development workflow.

## License

TokenFlow is licensed under the [GNU AGPL-3.0](./LICENSE).

TokenFlow is a fork of [new-api](https://github.com/QuantumNous/new-api)
(AGPL-3.0) by QuantumNous, which is itself based on
[one-api](https://github.com/songquanpeng/one-api) by JustSong. Attribution and
additional license terms are preserved in [NOTICE](./NOTICE).
