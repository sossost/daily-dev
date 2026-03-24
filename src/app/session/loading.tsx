export default function SessionLoading() {
  return (
    <div className="animate-pulse">
      {/* ProgressBar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>

      {/* QuizCard */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Question text */}
        <div className="space-y-2 mb-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>

        {/* Code block */}
        <div className="h-24 bg-gray-900/10 dark:bg-gray-900 rounded-lg my-4" />

        {/* Options */}
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700"
            >
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
