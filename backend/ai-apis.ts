import { readFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { OpenAI } from 'openai'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const envSecret = dotenv.parse(readFileSync('./.env.development.local'))

const enum Providers {
  deepSeek,
  bedrock,
}

export interface AiResponse {
  content: string
  input: number | undefined
  output: number | undefined
}

const deepSeekModel = new OpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: envSecret.DEEPSEEK_API_KEY })

export async function deepSeek(model: string, messages: any[]): Promise<AiResponse> {
  const completion = await deepSeekModel.chat.completions.create({
    model: model,
    messages: messages,
    stream: false,
  })

  return {
    content: completion.choices[0]?.message?.content || '',
    input: completion.usage?.prompt_tokens,
    output: completion.usage?.completion_tokens,
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
    modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: messages,
    }),
  })
  const response = await bedrockClient.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))

  console.log(responseBody)

  return {
    content: responseBody.content[0].text,
    input: responseBody.usage?.input_tokens,
    output: responseBody.usage?.output_tokens,
  }
}
