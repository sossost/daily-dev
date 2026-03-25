'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { CATEGORIES_WITH_FALLBACK, TOPICS, type Position, type Topic } from '@/types'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { getTopicsForPosition, POSITIONS } from '@/lib/topics'
import { CategoryAccordion } from '@/components/common/CategoryAccordion'

const ANIMATION_DELAY_STEP = 0.02

interface TopicFilterModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function TopicFilterModal({ isOpen, onClose }: TopicFilterModalProps) {
  const t = useTranslations('topicFilter')
  const sessionT = useTranslations('session')
  const commonT = useTranslations('common')
  const practiceT = useTranslations('practice')
  const onboardingT = useTranslations('onboarding')

  const storeTopics = useTopicFilterStore((s) => s.enabledTopics)
  const applyFilter = useTopicFilterStore((s) => s.applyFilter)

  // Local draft state — only committed to store on "Apply"
  const [draft, setDraft] = useState<readonly Topic[]>([...storeTopics])

  // Sync draft when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraft([...storeTopics])
    }
  }, [isOpen, storeTopics])

  // Body scroll lock
  useEffect(() => {
    if (isOpen === false) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const draftSet = new Set(draft)
  const allEnabled = draft.length === TOPICS.length
  const hasTopics = draft.length > 0

  // --- Draft manipulation ---

  const toggleTopic = useCallback((topic: Topic) => {
    setDraft((prev) => {
      const exists = prev.includes(topic)
      return exists ? prev.filter((t) => t !== topic) : [...prev, topic]
    })
  }, [])

  const toggleCategory = useCallback((topics: readonly Topic[]) => {
    setDraft((prev) => {
      const prevSet = new Set(prev)
      const allOn = topics.every((t) => prevSet.has(t))
      if (allOn) {
        const off = new Set(topics)
        return prev.filter((t) => !off.has(t))
      }
      return [...prev, ...topics.filter((t) => !prevSet.has(t))]
    })
  }, [])

  const togglePositionTopics = useCallback((position: Position) => {
    setDraft((prev) => {
      const prevSet = new Set(prev)
      const posTopics = getTopicsForPosition(position)
      const allOn = posTopics.every((t) => prevSet.has(t))
      if (allOn) {
        const off = new Set(posTopics)
        return prev.filter((t) => !off.has(t))
      }
      return [...prev, ...posTopics.filter((t) => !prevSet.has(t))]
    })
  }, [])

  const selectAll = useCallback(() => setDraft([...TOPICS]), [])
  const deselectAll = useCallback(() => setDraft([]), [])

  // --- Actions ---

  const handleApply = useCallback(() => {
    // Derive position from draft
    let matchedPosition: Position | null = null
    for (const pos of POSITIONS) {
      const posTopics = getTopicsForPosition(pos)
      if (posTopics.every((t) => draft.includes(t))) {
        matchedPosition = pos
      }
    }
    applyFilter(matchedPosition, draft)
    onClose()
  }, [draft, applyFilter, onClose])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen === false) return
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
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 max-h-[70vh] sm:max-h-[65vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={t('title')}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('title')}
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

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {t('description')}
            </p>

            {/* Position quick-toggle buttons */}
            <div className="flex gap-2 mb-3">
              {POSITIONS.map((position) => (
                <PositionQuickButton
                  key={position}
                  position={position}
                  enabledSet={draftSet}
                  onToggle={togglePositionTopics}
                  label={onboardingT(position)}
                />
              ))}
            </div>

            {/* Count + Select All */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {sessionT('selectedCount', { count: draft.length, total: TOPICS.length })}
              </span>
              <button
                type="button"
                onClick={allEnabled ? deselectAll : selectAll}
                className="text-xs text-blue-500 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                {allEnabled ? practiceT('deselectAll') : practiceT('selectAll')}
              </button>
            </div>

            {/* Scrollable topic list */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {CATEGORIES_WITH_FALLBACK.map((category) => {
                  const allCategoryEnabled = category.topics.every((ct) => draftSet.has(ct))

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
                            isEnabled={draftSet.has(topic)}
                            index={index}
                            onToggle={toggleTopic}
                          />
                        ))}
                      </div>
                    </CategoryAccordion>
                  )
                })}
              </div>
            </div>

            {/* Footer: warning + apply */}
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
              {hasTopics === false && (
                <p className="mb-2 text-sm text-amber-600 dark:text-amber-400 text-center">
                  {sessionT('minTopicWarning')}
                </p>
              )}
              <button
                type="button"
                onClick={handleApply}
                disabled={hasTopics === false}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {t('apply')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------- Position Quick Button ----------

const POSITION_BUTTON_COLORS: Record<'active' | 'inactive', string> = {
  active: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  inactive: 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
}

interface PositionQuickButtonProps {
  readonly position: Position
  readonly enabledSet: ReadonlySet<Topic>
  readonly onToggle: (position: Position) => void
  readonly label: string
}

function PositionQuickButton({ position, enabledSet, onToggle, label }: PositionQuickButtonProps) {
  const positionTopics = useMemo(() => getTopicsForPosition(position), [position])
  const allEnabled = positionTopics.every((t) => enabledSet.has(t))

  return (
    <button
      type="button"
      onClick={() => onToggle(position)}
      className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-lg border transition-colors ${
        allEnabled ? POSITION_BUTTON_COLORS.active : POSITION_BUTTON_COLORS.inactive
      }`}
      aria-pressed={allEnabled}
    >
      {label}
    </button>
  )
}

// ---------- Topic Item ----------

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
