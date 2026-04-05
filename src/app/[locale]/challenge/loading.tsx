export default function ChallengeLoading() {
  return (
    <div className="animate-pulse">
      <div className="-mt-8 pt-3 pb-3">
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-7 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
        <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="space-y-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  )
}
