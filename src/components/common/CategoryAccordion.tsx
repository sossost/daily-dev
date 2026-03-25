'use client'

import { type ReactNode, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { CategoryDefinition } from '@/types'

interface CategoryAccordionProps {
  readonly category: CategoryDefinition
  readonly defaultOpen?: boolean
  readonly headerRight?: ReactNode
  readonly children: ReactNode
}

export function CategoryAccordion({
  category,
  defaultOpen = true,
  headerRight,
  children,
}: CategoryAccordionProps) {
  const tc = useTranslations('common')
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const buttonId = `accordion-btn-${category.id}`
  const panelId = `accordion-panel-${category.id}`

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          id={buttonId}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 flex-1 min-w-0 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={`${category.label}`}
        >
          <span className="text-base" aria-hidden="true">
            {category.icon}
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {category.label}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {tc('topicCount', { count: category.topics.length })}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-auto"
          >
            <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
          </motion.span>
        </button>
        {headerRight != null && (
          <div className="flex-shrink-0">{headerRight}</div>
        )}
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
