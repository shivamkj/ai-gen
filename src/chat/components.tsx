import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useState } from 'react'

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export const Loader = () => {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-sm text-gray-600">Processing your request...</p>
    </div>
  )
}

export default function CodeCopyBtn({ children }: { children: React.ReactNode }) {
  const [copyOk, setCopyOk] = useState(false)

  const iconColor = copyOk ? '#0af20a' : '#ddd'
  const icon = copyOk ? 'fa-check-square' : 'fa-copy'

  const handleClick = (_: React.MouseEvent<HTMLElement>) => {
    navigator.clipboard.writeText(children[0].props.children[0])
    console.log(children)

    setCopyOk(true)
    setTimeout(() => {
      setCopyOk(false)
    }, 500)
  }

  return (
    <div className="code-copy-btn">
      <i className={`fas ${icon}`} onClick={handleClick} style={{ color: iconColor }} />
    </div>
  )
}
