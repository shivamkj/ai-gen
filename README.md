# ai-gen

A minimal AI chat app with a Go backend and Preact frontend, served as a single binary.

## Models

- Claude 4.6 Sonnet (via AWS Bedrock)
- Claude 4.5 Sonnet (via AWS Bedrock)
- DeepSeek v3 (via DeepSeek API)

## Setup

Create a `.env` file:

```env
# For Bedrock models
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# For DeepSeek
DEEPSEEK_API_KEY=...

# Optional
PORT=6713
```

## Dev

```sh
# Frontend dev server
cd frontend && pnpm dev

# Build & run production binary
cd frontend && pnpm build
./ai-gen
```

## Stack

- **Backend:** Go, SQLite (`modernc.org/sqlite`), AWS Bedrock SDK
- **Frontend:** Preact, Tailwind CSS v4, Vite
