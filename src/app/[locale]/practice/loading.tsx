export default function PracticeLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="space-y-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  )
}
