import { readFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { OpenAI } from 'openai'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const envSecret = dotenv.parse(readFileSync('./.env.development.local'))

export interface AiResponse {
  content: string
  input_token: number | undefined
  output_token: number | undefined
}

const maxTokens = 12000

const deepSeekModel = new OpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: envSecret.DEEPSEEK_API_KEY })

export async function deepSeek(model: string, messages: any[]): Promise<AiResponse> {
  const completion = await deepSeekModel.chat.completions.create({
    model: model,
    messages: messages,
    temperature: 0,
    max_tokens: maxTokens,
  })

  return {
    content: completion.choices[0]?.message?.content || '',
    input_token: completion.usage?.prompt_tokens,
    output_token: completion.usage?.completion_tokens,
  }
}

const bedrockClient = new BedrockRuntimeClient({
  region: envSecret.AWS_REGION, // Replace with your region
  credentials: {
    accessKeyId: envSecret.AWS_ACCESS_KEY_ID, // Replace with your access key ID
    secretAccessKey: envSecret.AWS_SECRET_ACCESS_KEY, // Replace with your secret access key
  },
})

export async function bedrock(model: string, messages: any[]): Promise<AiResponse> {
  const command = new InvokeModelCommand({
    modelId: model,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      messages: messages,
      temperature: 0.2,
    }),
  })
  const response = await bedrockClient.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))

  return {
    content: responseBody.content[0].text,
    input_token: responseBody.usage?.input_tokens,
    output_token: responseBody.usage?.output_tokens,
  }
}
