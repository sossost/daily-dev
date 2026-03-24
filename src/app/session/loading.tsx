export default function SessionLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8" />
      <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mt-6" />
    </div>
  )
}
