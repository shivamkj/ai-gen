/**
 * Extracts code blocks from LLM output and creates bash command to create files from LLM code blocks.
 */
export function llmOutputToBash(output: string): string {
  // Find all code blocks (surrounded by triple backticks)
  const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/g
  const codeBlocks: string[] = []
  let match

  while ((match = codeBlockRegex.exec(output)) !== null) {
    codeBlocks.push(match[1])
  }

  const files: { path: string; content: string }[] = []

  // Process each code block to find file paths and content
  for (const block of codeBlocks) {
    // Look for file path in comments at the beginning of code blocks
    // Matches patterns like: // path/to/file.js or /* path/to/file.js */
    const filePathRegex = /^\s*(?:\/\/|\/\*)\s*([^\s*]+\.[a-zA-Z0-9]+)\s*(?:\*\/)?/m
    const filePathMatch = block.match(filePathRegex)

    if (filePathMatch) {
      const fullPath = filePathMatch[1]
      const fileName = fullPath.split('/').pop() || ''

      // Remove the file path comment from the content
      let content = block.replace(filePathRegex, '').trim()

      // Update imports to reference files in the same directory
      content = updateImports(content, fullPath)

      files.push({ path: fileName, content })
    }
  }

  // Generate bash script to create files
  return generateBashScript(files)
}

/**
 * Updates import statements to reference files in the same directory
 */
function updateImports(content: string, originalPath: string): string {
  // Handle ES6 imports
  content = content.replace(
    /import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g,
    (match, importPath) => {
      // Skip absolute imports or node_modules imports
      if (importPath.startsWith('/') || (!importPath.startsWith('./') && !importPath.startsWith('../'))) {
        return match
      }

      // Get just the filename from the import path
      const importedFile = importPath.split('/').pop()
      return match.replace(importPath, `./${importedFile}`)
    }
  )

  // Handle CommonJS requires
  content = content.replace(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g, (match, importPath) => {
    // Skip absolute imports or node_modules imports
    if (importPath.startsWith('/') || (!importPath.startsWith('./') && !importPath.startsWith('../'))) {
      return match
    }

    // Get just the filename from the import path
    const importedFile = importPath.split('/').pop()
    return match.replace(importPath, `./${importedFile}`)
  })

  return content
}

/**
 * Generates a bash script to create all files
 */
function generateBashScript(files: { path: string; content: string }[]): string {
  let script = '#!/bin/bash\n\n'

  for (const file of files) {
    // Escape special characters in the content for bash
    const escapedContent = file.content
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`')

    script += `# Creating ${file.path}\n`
    script += `cat > "${file.path}" << 'EOF'\n${file.content}\nEOF\n\n`
  }

  script += "echo 'All files created successfully!'\n"
  return script
}
