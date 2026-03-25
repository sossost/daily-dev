export default function ResultLoading() {
  return (
    <div className="animate-pulse">
      <div className="text-center py-6 mb-6">
        <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mt-6" />
    </div>
  )
}
