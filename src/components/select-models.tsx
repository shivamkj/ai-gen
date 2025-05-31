import { useAction, useStoreX } from '@/global-state'
import { Ctx } from '@/chat-page'

export const models = [
  {
    name: 'Claude 4 Sonnet',
    modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
  },
  {
    name: 'Claude 3.7 Sonnet',
    modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  },
  {
    name: 'Deepseek v3',
    modelId: 'deepseek-chat',
  },
]

export function SelectModel({ chatId: selectedChatId }: { chatId: number | undefined }) {
  const selectedModel = useStoreX(Ctx, (s) => s.selectedModel)
  const { changeModel } = useAction(Ctx)

  return (
    <div className="p-4 border-b flex items-center justify-between bg-gray-800 border-gray-700">
      {selectedChatId == undefined && (
        <select
          name="models"
          id="models"
          className="w-48 border text-sm rounded-lg block p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => changeModel(e.target.value)}
          value={selectedModel}>
          {models.map((m, index) => (
            <option key={index} value={m.modelId}>
              {m.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
