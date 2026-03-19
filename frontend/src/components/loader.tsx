export const Loader = () => {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-sm text-gray-600">Processing your request...</p>
    </div>
  )
}
