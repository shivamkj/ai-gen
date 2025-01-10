import { marked } from 'marked'
import { useEffect, useRef } from 'react'

export function Markdown({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current != null) addCopyButtonsToCodeBlocks(ref.current)
  }, [])

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: marked.parse(content) }} />
}

function addCopyButtonsToCodeBlocks(container: HTMLElement) {
  // Find all <pre><code> blocks within the container
  const codeBlocks = container.querySelectorAll('pre code')

  codeBlocks.forEach((codeBlock) => {
    // Create a button element
    const copyButton = document.createElement('button')
    copyButton.textContent = 'Copy'
    copyButton.style.position = 'absolute'
    copyButton.style.top = '0'
    copyButton.style.right = '0'
    copyButton.style.padding = '5px'
    copyButton.style.backgroundColor = '#1d4ed8'
    copyButton.style.color = '#FFF'
    copyButton.style.borderRadius = '3px'
    copyButton.style.cursor = 'pointer'

    codeBlock.parentElement!.appendChild(copyButton)

    // Add click event listener to the button
    copyButton.addEventListener('click', () => {
      const codeContent = codeBlock.textContent ?? ''

      // Use the Clipboard API to copy the content
      navigator.clipboard
        .writeText(codeContent)
        .then(() => {
          copyButton.textContent = 'Copied!'
          setTimeout(() => (copyButton.textContent = 'Copy'), 2000) // Reset button text after 2 seconds
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err)
        })
    })
  })
}
