'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { CATEGORIES_WITH_FALLBACK, TOPICS, type Position, type Topic } from '@/types'
import { getTopicsForPosition, getPositionTopicCount, POSITIONS } from '@/lib/topics'
import { CategoryAccordion } from '@/components/common/CategoryAccordion'

interface OnboardingModalProps {
  readonly isOpen: boolean
  readonly onComplete: (position: Position | null, topics: readonly Topic[]) => void
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const t = useTranslations('onboarding')
  const topicT = useTranslations('topics')
  const practiceT = useTranslations('practice')
  const dialogRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<readonly Topic[]>([...TOPICS])

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus()
    }
  }, [isOpen])

  const handlePositionSelect = useCallback((position: Position) => {
    setSelectedPosition(position)
    setSelectedTopics(getTopicsForPosition(position))
  }, [])

  const handleNext = useCallback(() => {
    if (selectedPosition != null) {
      setStep(2)
    }
  }, [selectedPosition])

  const handleBack = useCallback(() => {
    setStep(1)
  }, [])

  const handleSkip = useCallback(() => {
    onComplete(null, [...TOPICS])
  }, [onComplete])

  const handleStart = useCallback(() => {
    onComplete(selectedPosition, selectedTopics)
  }, [onComplete, selectedPosition, selectedTopics])

  const handleToggleTopic = useCallback((topic: Topic) => {
    setSelectedTopics((prev) => {
      const exists = prev.includes(topic)
      return exists ? prev.filter((t) => t !== topic) : [...prev, topic]
    })
  }, [])

  const handleToggleCategory = useCallback((topics: readonly Topic[]) => {
    setSelectedTopics((prev) => {
      const prevSet = new Set(prev)
      const allEnabled = topics.every((t) => prevSet.has(t))
      if (allEnabled) {
        const topicsSet = new Set(topics)
        return prev.filter((t) => !topicsSet.has(t))
      }
      return [...prev, ...topics.filter((t) => !prevSet.has(t))]
    })
  }, [])

  // Body scroll lock
  useEffect(() => {
    if (isOpen === false) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl outline-none max-h-[85vh] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label={t('title')}
            >
              {step === 1 ? (
                <StepPosition
                  selectedPosition={selectedPosition}
                  onSelect={handlePositionSelect}
                  onNext={handleNext}
                  onSkip={handleSkip}
                />
              ) : selectedPosition != null ? (
                <StepTopics
                  selectedPosition={selectedPosition}
                  selectedTopics={selectedTopics}
                  onToggleTopic={handleToggleTopic}
                  onToggleCategory={handleToggleCategory}
                  onBack={handleBack}
                  onStart={handleStart}
                  topicT={topicT}
                  practiceT={practiceT}
                />
              ) : null}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ---------- Step 1: Position Selection ----------

const POSITION_CONFIG: ReadonlyArray<{
  position: Position
  labelKey: string
  descKey: string
  color: string
}> = [
  { position: 'frontend', labelKey: 'frontend', descKey: 'frontendDesc', color: 'blue' },
  { position: 'backend', labelKey: 'backend', descKey: 'backendDesc', color: 'green' },
  { position: 'fullstack', labelKey: 'fullstack', descKey: 'fullstackDesc', color: 'purple' },
  { position: 'devops', labelKey: 'devops', descKey: 'devopsDesc', color: 'orange' },
]

const POSITION_COLORS: Record<string, { selected: string; idle: string }> = {
  blue: {
    selected: 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-200 dark:ring-blue-800',
    idle: 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800',
  },
  green: {
    selected: 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/30 ring-2 ring-green-200 dark:ring-green-800',
    idle: 'border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800',
  },
  purple: {
    selected: 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-200 dark:ring-purple-800',
    idle: 'border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800',
  },
  orange: {
    selected: 'border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/30 ring-2 ring-orange-200 dark:ring-orange-800',
    idle: 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800',
  },
}

interface StepPositionProps {
  readonly selectedPosition: Position | null
  readonly onSelect: (position: Position) => void
  readonly onNext: () => void
  readonly onSkip: () => void
}

function StepPosition({ selectedPosition, onSelect, onNext, onSkip }: StepPositionProps) {
  const t = useTranslations('onboarding')

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {t('selectPosition')}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {POSITION_CONFIG.map(({ position, labelKey, descKey, color }) => {
          const isSelected = selectedPosition === position
          const topicCount = getPositionTopicCount(position)
          const colors = POSITION_COLORS[color]

          return (
            <button
              key={position}
              type="button"
              onClick={() => onSelect(position)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected ? colors.selected : colors.idle
              }`}
              aria-pressed={isSelected}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t(labelKey)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t(descKey)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {t('topicCount', { count: topicCount })}
              </p>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {t('skip')}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={selectedPosition == null}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t('next')}
          <ArrowRight size={16} />
        </button>
      </div>
    </>
  )
}

// ---------- Step 2: Topic Customization ----------

interface StepTopicsProps {
  readonly selectedPosition: Position
  readonly selectedTopics: readonly Topic[]
  readonly onToggleTopic: (topic: Topic) => void
  readonly onToggleCategory: (topics: readonly Topic[]) => void
  readonly onBack: () => void
  readonly onStart: () => void
  readonly topicT: ReturnType<typeof useTranslations>
  readonly practiceT: ReturnType<typeof useTranslations>
}

function StepTopics({
  selectedPosition,
  selectedTopics,
  onToggleTopic,
  onToggleCategory,
  onBack,
  onStart,
  topicT,
  practiceT,
}: StepTopicsProps) {
  const t = useTranslations('onboarding')
  const sessionT = useTranslations('session')
  const selectedSet = new Set(selectedTopics)

  return (
    <>
      {/* Header - fixed */}
      <div className="mb-3 shrink-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {t('customizeTopics')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('customizeDescription', { position: t(selectedPosition) })}
        </p>
        <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          {sessionT('selectedCount', { count: selectedTopics.length, total: TOPICS.length })}
        </div>
      </div>

      {/* Scrollable topic list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {CATEGORIES_WITH_FALLBACK.map((category) => {
            const allCategoryEnabled = category.topics.every((ct) => selectedSet.has(ct))

            return (
              <CategoryAccordion
                key={category.id}
                category={category}
                headerRight={
                  <button
                    type="button"
                    onClick={() => onToggleCategory(category.topics)}
                    className="text-xs text-blue-500 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
                  >
                    {allCategoryEnabled ? practiceT('deselect') : practiceT('selectAll')}
                  </button>
                }
              >
                <div className="grid grid-cols-2 gap-2">
                  {category.topics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => onToggleTopic(topic)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${
                        selectedSet.has(topic)
                          ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      aria-pressed={selectedSet.has(topic)}
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                          selectedSet.has(topic)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        {selectedSet.has(topic) && <Check size={14} />}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {topicT(topic)}
                      </span>
                    </button>
                  ))}
                </div>
              </CategoryAccordion>
            )
          })}
        </div>
      </div>

      {/* Footer - fixed */}
      <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
        {selectedTopics.length === 0 && (
          <p className="mb-2 text-sm text-amber-600 dark:text-amber-400 text-center">
            {sessionT('minTopicWarning')}
          </p>
        )}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={16} />
            {t('back')}
          </button>
          <button
            type="button"
            onClick={onStart}
            disabled={selectedTopics.length === 0}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('start')}
          </button>
        </div>
      </div>
    </>
  )
}
