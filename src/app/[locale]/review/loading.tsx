export default function ReviewLoading() {
  return (
    <div className="animate-pulse">
      <div className="-mt-8 pt-3 pb-3 flex items-center gap-3">
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div>
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
