package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
)

// AiResponse is the unified response from any AI provider.
type AiResponse struct {
	Content     string `json:"content"`
	InputToken  *int   `json:"input_token"`
	OutputToken *int   `json:"output_token"`
}

// Message represents a chat message stored in the DB and sent to AI APIs.
type Message struct {
	Role      string `json:"role"`
	Content   string `json:"content"`
	ImageData string `json:"image_data,omitempty"`
}

// callDeepSeek calls the DeepSeek API (OpenAI-compatible) over plain HTTP.
func callDeepSeek(model string, messages []Message) (*AiResponse, error) {
	type contentPart struct {
		Type     string `json:"type"`
		Text     string `json:"text,omitempty"`
		ImageURL *struct {
			URL string `json:"url"`
		} `json:"image_url,omitempty"`
	}
	type oaiMessage struct {
		Role    string `json:"role"`
		Content any    `json:"content"`
	}

	oaiMessages := make([]oaiMessage, 0, len(messages))
	for _, msg := range messages {
		if msg.ImageData != "" {
			oaiMessages = append(oaiMessages, oaiMessage{
				Role: msg.Role,
				Content: []contentPart{
					{Type: "text", Text: msg.Content},
					{Type: "image_url", ImageURL: &struct {
						URL string `json:"url"`
					}{URL: msg.ImageData}},
				},
			})
		} else {
			oaiMessages = append(oaiMessages, oaiMessage{Role: msg.Role, Content: msg.Content})
		}
	}

	body, _ := json.Marshal(map[string]any{
		"model":       model,
		"messages":    oaiMessages,
		"temperature": 0,
		"max_tokens":  8192,
	})

	req, err := http.NewRequest("POST", "https://api.deepseek.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+os.Getenv("DEEPSEEK_API_KEY"))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
		} `json:"usage"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.Error != nil {
		return nil, fmt.Errorf("deepseek error: %s", result.Error.Message)
	}

	content := ""
	if len(result.Choices) > 0 {
		content = result.Choices[0].Message.Content
	}
	in := result.Usage.PromptTokens
	out := result.Usage.CompletionTokens
	return &AiResponse{Content: content, InputToken: &in, OutputToken: &out}, nil
}

// callBedrock calls AWS Bedrock using the official AWS SDK v2.
func callBedrock(model string, messages []Message) (*AiResponse, error) {
	region := os.Getenv("AWS_REGION")
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	if region == "" || accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("missing AWS credentials: AWS_REGION=%q, AWS_ACCESS_KEY_ID set=%v, AWS_SECRET_ACCESS_KEY set=%v",
			region, accessKey != "", secretKey != "")
	}

	client := bedrockruntime.New(bedrockruntime.Options{
		Region:      region,
		Credentials: credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
	})

	type imageSource struct {
		Type      string `json:"type"`
		MediaType string `json:"media_type"`
		Data      string `json:"data"`
	}
	type contentPart struct {
		Type   string       `json:"type"`
		Text   string       `json:"text,omitempty"`
		Source *imageSource `json:"source,omitempty"`
	}
	type bedrockMsg struct {
		Role    string `json:"role"`
		Content any    `json:"content"`
	}

	bedrockMessages := make([]bedrockMsg, 0, len(messages))
	for _, msg := range messages {
		if msg.ImageData != "" {
			mediaType, base64Data := "", ""
			if idx := strings.Index(msg.ImageData, ";base64,"); idx >= 0 {
				mediaType = strings.TrimPrefix(msg.ImageData[:idx], "data:")
				base64Data = msg.ImageData[idx+8:]
			}
			text := msg.Content
			if text == "" {
				text = "What is in this image?"
			}
			bedrockMessages = append(bedrockMessages, bedrockMsg{
				Role: msg.Role,
				Content: []contentPart{
					{Type: "image", Source: &imageSource{Type: "base64", MediaType: mediaType, Data: base64Data}},
					{Type: "text", Text: text},
				},
			})
		} else {
			bedrockMessages = append(bedrockMessages, bedrockMsg{Role: msg.Role, Content: msg.Content})
		}
	}

	payload, _ := json.Marshal(map[string]any{
		"anthropic_version": "bedrock-2023-05-31",
		"max_tokens":        20000,
		"messages":          bedrockMessages,
		"temperature":       0.2,
	})

	out, err := client.InvokeModel(context.Background(), &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(model),
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
		Body:        payload,
	})
	if err != nil {
		return nil, fmt.Errorf("bedrock invoke error: %w", err)
	}

	var result struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
		Usage struct {
			InputTokens  int `json:"input_tokens"`
			OutputTokens int `json:"output_tokens"`
		} `json:"usage"`
	}
	if err := json.Unmarshal(out.Body, &result); err != nil {
		return nil, fmt.Errorf("bedrock decode error: %w", err)
	}

	content := ""
	if len(result.Content) > 0 {
		content = result.Content[0].Text
	}
	in := result.Usage.InputTokens
	outTokens := result.Usage.OutputTokens
	return &AiResponse{Content: content, InputToken: &in, OutputToken: &outTokens}, nil
}
