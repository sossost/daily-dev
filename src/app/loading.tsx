export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-6" />
      <div className="flex gap-4 mb-6">
        <div className="flex-1 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
