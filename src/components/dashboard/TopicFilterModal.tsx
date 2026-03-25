'use client'

import { useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { CATEGORIES_WITH_FALLBACK, TOPICS, type Topic } from '@/types'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { CategoryAccordion } from '@/components/common/CategoryAccordion'

const ANIMATION_DELAY_STEP = 0.02

interface TopicFilterModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function TopicFilterModal({ isOpen, onClose }: TopicFilterModalProps) {
  const t = useTranslations('session')
  const topicT = useTranslations('topics')
  const commonT = useTranslations('common')
  const practiceT = useTranslations('practice')
  const enabledTopics = useTopicFilterStore((s) => s.enabledTopics)
  const enableAll = useTopicFilterStore((s) => s.enableAll)
  const disableAll = useTopicFilterStore((s) => s.disableAll)
  const toggleTopic = useTopicFilterStore((s) => s.toggleTopic)
  const toggleCategory = useTopicFilterStore((s) => s.toggleCategory)

  const categories = CATEGORIES_WITH_FALLBACK
  const enabledSet = new Set(enabledTopics)
  const allEnabled = enabledTopics.length === TOPICS.length

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            role="presentation"
          />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={t('filterSettings')}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('filterTitle')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={commonT('close')}
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('filterDescription')}
            </p>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('selectedCount', { count: enabledTopics.length, total: TOPICS.length })}
              </span>
              <button
                type="button"
                onClick={allEnabled ? disableAll : enableAll}
                className="text-xs text-blue-500 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                {allEnabled ? practiceT('deselectAll') : practiceT('selectAll')}
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {categories.map((category) => {
                const allCategoryEnabled = category.topics.every((t) => enabledSet.has(t))

                return (
                  <CategoryAccordion
                    key={category.id}
                    category={category}
                    headerRight={
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.topics)}
                        className="text-xs text-blue-500 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
                        aria-label={`${category.label} ${allCategoryEnabled ? practiceT('deselectAll') : practiceT('selectAll')}`}
                      >
                        {allCategoryEnabled ? practiceT('deselect') : practiceT('selectAll')}
                      </button>
                    }
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {category.topics.map((topic, index) => (
                        <TopicFilterItem
                          key={topic}
                          topic={topic}
                          isEnabled={enabledSet.has(topic)}
                          index={index}
                          onToggle={toggleTopic}
                        />
                      ))}
                    </div>
                  </CategoryAccordion>
                )
              })}
            </div>

            {enabledTopics.length === 0 && (
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 text-center">
                {t('minTopicWarning')}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface TopicFilterItemProps {
  readonly topic: Topic
  readonly isEnabled: boolean
  readonly index: number
  readonly onToggle: (topic: Topic) => void
}

function TopicFilterItem({ topic, isEnabled, index, onToggle }: TopicFilterItemProps) {
  const topicT = useTranslations('topics')

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * ANIMATION_DELAY_STEP }}
      onClick={() => onToggle(topic)}
      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
        isEnabled
          ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      aria-pressed={isEnabled}
      aria-label={topicT(topic)}
    >
      <div
        className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
          isEnabled
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700'
        }`}
      >
        {isEnabled && <Check size={14} />}
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {topicT(topic)}
      </span>
    </motion.button>
  )
}
