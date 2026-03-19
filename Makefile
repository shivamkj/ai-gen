.PHONY: build dev clean

# Build the frontend then embed it into a single Go binary
build:
	pnpm build
	go build -ldflags="-s -w" -o ai-gen .

# Run frontend dev server (Node.js backend via Vite plugin)
dev:
	pnpm dev

clean:
	rm -f ai-gen
