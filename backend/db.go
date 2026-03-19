package main

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var db *sql.DB

func initDB() {
	var err error
	db, err = sql.Open("sqlite", "chats.db")
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS chats (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			model TEXT NOT NULL,
			title TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			chat_id INTEGER,
			role TEXT CHECK(role IN ('user', 'assistant', 'system')),
			content TEXT,
			image_data TEXT,
			input_token INTEGER,
			output_token INTEGER,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(chat_id) REFERENCES chats(id)
		)
	`)
	if err != nil {
		log.Fatal(err)
	}

	// Migration: add image_data column if it doesn't exist yet
	var count int
	row := db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('messages') WHERE name='image_data'`)
	if err := row.Scan(&count); err == nil && count == 0 {
		db.Exec(`ALTER TABLE messages ADD COLUMN image_data TEXT`)
	}

	// Migration: add provider column to chats if it doesn't exist yet
	row = db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('chats') WHERE name='provider'`)
	if err := row.Scan(&count); err == nil && count == 0 {
		db.Exec(`ALTER TABLE chats ADD COLUMN provider TEXT NOT NULL DEFAULT ''`)
	}
}

func closeDB() {
	if db != nil {
		db.Close()
	}
}
