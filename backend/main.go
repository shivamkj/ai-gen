package main

import (
	"embed"
	"gen-ai/providers"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
)

//go:embed dist
var distFS embed.FS

func main() {
	loadEnv(".env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "6713"
	}

	initDB()
	defer closeDB()

	// Handle graceful shutdown
	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, syscall.SIGTERM)
		<-c
		closeDB()
		os.Exit(0)
	}()

	providerRegistry = map[string]providers.Provider{
		"deepseek": &providers.OpenAI{BaseURL: "https://api.deepseek.com/v1", APIKey: os.Getenv("DEEPSEEK_API_KEY")},
		"bedrock":  &providers.Bedrock{},
	}

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("GET /api/test", handleTest)
	mux.HandleFunc("GET /api/chats", handleGetAllChats)
	mux.HandleFunc("POST /api/chats/start", handleStartChat)
	mux.HandleFunc("POST /api/chats/{id}/reply", handleReplyChat)
	mux.HandleFunc("DELETE /api/chats/{id}", handleDeleteChat)
	mux.HandleFunc("GET /api/chats/{id}/messages", handleGetMessages)
	mux.HandleFunc("DELETE /api/messages/{id}", handleDeleteMessage)

	// Frontend static files with SPA fallback
	sub, err := fs.Sub(distFS, "dist")
	if err != nil {
		log.Fatal(err)
	}
	mux.Handle("/", spaHandler{http.FS(sub)})

	log.Printf("Server starting on :%s | http://localhost:%s/\n", port, port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

// spaHandler serves static files and falls back to index.html for client-side routing
type spaHandler struct {
	fs http.FileSystem
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	f, err := h.fs.Open(r.URL.Path)
	if err != nil {
		r.URL.Path = "/"
	} else {
		f.Close()
	}
	http.FileServer(h.fs).ServeHTTP(w, r)
}
