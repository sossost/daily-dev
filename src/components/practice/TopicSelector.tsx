'use client'

import { motion } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { isLocale } from '@/i18n/routing'
import { Check } from 'lucide-react'
import { CATEGORIES_WITH_FALLBACK, TOPICS, type Topic, type Difficulty } from '@/types'
import { getTopicQuestionCounts } from '@/lib/questions'
import { CategoryAccordion } from '@/components/common/CategoryAccordion'

const ANIMATION_DELAY_STEP = 0.03

const DIFFICULTY_OPTIONS: readonly { readonly value: Difficulty | 'all'; readonly labelKey: 'all' | 'easy' | 'medium' | 'hard' }[] = [
  { value: 'all', labelKey: 'all' },
  { value: 'easy', labelKey: 'easy' },
  { value: 'medium', labelKey: 'medium' },
  { value: 'hard', labelKey: 'hard' },
] as const

interface TopicSelectorProps {
  readonly selectedTopics: readonly Topic[]
  readonly difficulty: Difficulty | 'all'
  readonly onToggleTopic: (topic: Topic) => void
  readonly onToggleCategory: (topics: readonly Topic[]) => void
  readonly onSelectAll: () => void
  readonly onDeselectAll: () => void
  readonly onDifficultyChange: (difficulty: Difficulty | 'all') => void
}

export function TopicSelector({
  selectedTopics,
  difficulty,
  onToggleTopic,
  onToggleCategory,
  onSelectAll,
  onDeselectAll,
  onDifficultyChange,
}: TopicSelectorProps) {
  const t = useTranslations('practice')
  const topicT = useTranslations('topics')
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const topicCounts = getTopicQuestionCounts(locale)
  const categories = CATEGORIES_WITH_FALLBACK
  const selectedSet = new Set(selectedTopics)
  const allSelected = selectedTopics.length === TOPICS.length

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('topicSelect')}
          </h2>
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded"
          >
            {allSelected ? t('deselectAll') : t('selectAll')}
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {categories.map((category) => {
            const allCategorySelected = category.topics.every((t) => selectedSet.has(t))

            return (
              <CategoryAccordion
                key={category.id}
                category={category}
                headerRight={
                  <button
                    type="button"
                    onClick={() => onToggleCategory(category.topics)}
                    className="text-xs text-blue-500 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
                    aria-label={`${category.label} ${allCategorySelected ? t('deselectAll') : t('selectAll')}`}
                  >
                    {allCategorySelected ? t('deselect') : t('selectAll')}
                  </button>
                }
              >
                <div className="grid grid-cols-2 gap-2">
                  {category.topics.map((topic, index) => {
                    const isSelected = selectedSet.has(topic)
                    return (
                      <motion.button
                        key={topic}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * ANIMATION_DELAY_STEP }}
                        onClick={() => onToggleTopic(topic)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                          isSelected
                            ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        aria-pressed={isSelected}
                        aria-label={topicT(topic)}
                      >
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {topicT(topic)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('questionsCount', { count: topicCounts[topic] })}
                          </p>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </CategoryAccordion>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t('difficulty')}
        </h2>
        <div className="flex gap-2">
          {DIFFICULTY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onDifficultyChange(option.value)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                difficulty === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-pressed={difficulty === option.value}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
