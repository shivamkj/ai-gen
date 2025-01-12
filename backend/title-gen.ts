import keyword_extractor from 'keyword-extractor'

export function generateTitle(message: string): string {
  const keywords = keyword_extractor.extract(message, {
    language: 'english',
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true,
  })

  return keywords
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
