'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  readonly icon: LucideIcon
  readonly label: string
  readonly value: string | number
  readonly subtext?: string
  readonly index: number
}

const ANIMATION_DELAY_STEP = 0.08

export function StatCard({ icon: Icon, label, value, subtext, index }: StatCardProps) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * ANIMATION_DELAY_STEP }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-gray-400 dark:text-gray-500" />
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {subtext != null && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{subtext}</p>
      )}
    </motion.div>
  )
}
