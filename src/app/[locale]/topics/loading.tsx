export default function TopicsLoading() {
  return (
    <div className="animate-pulse">
      <div className="-mt-8 pt-3 pb-3 flex items-center gap-3">
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
