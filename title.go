package main

import (
	"strings"
	"unicode"
)

var stopWords = map[string]bool{
	"a": true, "an": true, "the": true, "and": true, "or": true, "but": true,
	"in": true, "on": true, "at": true, "to": true, "for": true, "of": true,
	"with": true, "by": true, "from": true, "is": true, "are": true, "was": true,
	"were": true, "be": true, "been": true, "being": true, "have": true, "has": true,
	"had": true, "do": true, "does": true, "did": true, "will": true, "would": true,
	"could": true, "should": true, "may": true, "might": true, "shall": true,
	"can": true, "need": true, "ought": true, "used": true,
	"i": true, "you": true, "he": true, "she": true, "it": true, "we": true,
	"they": true, "me": true, "him": true, "her": true, "us": true, "them": true,
	"my": true, "your": true, "his": true, "its": true, "our": true, "their": true,
	"this": true, "that": true, "these": true, "those": true, "what": true,
	"which": true, "who": true, "how": true, "when": true, "where": true, "why": true,
	"not": true, "no": true, "so": true, "as": true, "if": true, "up": true,
	"out": true, "about": true, "into": true, "just": true, "also": true,
	"more": true, "get": true, "use": true, "make": true, "like": true,
	"please": true, "help": true, "want": true, "know": true, "write": true,
}

// generateTitle extracts up to 4 meaningful keywords from a message and joins them.
func generateTitle(message string) string {
	words := strings.FieldsFunc(message, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})

	var keywords []string
	seen := map[string]bool{}
	for _, w := range words {
		lower := strings.ToLower(w)
		if len(lower) < 3 || stopWords[lower] || seen[lower] {
			continue
		}
		seen[lower] = true
		keywords = append(keywords, strings.ToUpper(lower[:1])+lower[1:])
		if len(keywords) == 4 {
			break
		}
	}

	if len(keywords) == 0 {
		return "New Chat"
	}
	return strings.Join(keywords, " ")
}
