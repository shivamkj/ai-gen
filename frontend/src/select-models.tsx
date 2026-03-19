import { useAction, useStoreX } from '@/utils/global-state'
import { Ctx } from '@/chat-page'

export const models = [
  {
    name: 'Claude 4.6 Sonnet',
    modelId: 'us.anthropic.claude-sonnet-4-6',
    provider: 'bedrock',
  },
  {
    name: 'Claude 4.5 Sonnet',
    modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
    provider: 'bedrock',
  },
  {
    name: 'Deepseek v3',
    modelId: 'deepseek-chat',
    provider: 'deepseek',
  },
]

const joinBy = '&*'

export function SelectModel({ chatId: selectedChatId }: { chatId: number | undefined }) {
  const selectedModel = useStoreX(Ctx, (s) => s.selectedModel)
  const selectedProvider = useStoreX(Ctx, (s) => s.selectedProvider)
  const { setModelAndProvider } = useAction(Ctx)

  return (
    <div className="p-4 border-b flex items-center justify-between bg-gray-800 border-gray-700">
      {selectedChatId == undefined && (
        <select
          name="models"
          id="models"
          className="w-48 border text-sm rounded-lg block p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            const [modelId, provider] = (e.target as HTMLSelectElement).value.split(joinBy)
            setModelAndProvider(modelId, provider)
          }}
          value={`${selectedModel}${joinBy}${selectedProvider}`}>
          {models.map((m, index) => (
            <option key={index} value={`${m.modelId}${joinBy}${m.provider}`}>
              {m.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
