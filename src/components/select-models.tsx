import { useAction, useStoreX } from '@/global-state'
import { Ctx } from '@/chat-page'

export const models = [
  {
    name: 'Deepseek v3',
    modelId: 'deepseek-chat',
  },
  {
    name: 'Claude 3.5 Sonnet',
    modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
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
