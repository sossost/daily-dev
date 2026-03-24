/**
 * Progress card renderer — generates a shareable canvas image
 * showing the user's learning progress summary.
 */
import type { Topic, TopicStat } from '@/types'
import { TOPIC_LABELS } from '@/types'
import { REPORT_TITLE } from '@/lib/constants'

const CARD_WIDTH = 600
const CARD_HEIGHT = 400
const PADDING = 32
const PERCENTAGE_MULTIPLIER = 100
const FULL_CIRCLE_DEGREES = 360
const CIRCLE_START_ANGLE = -Math.PI / 2
const ACCURACY_RING_RADIUS = 44
const ACCURACY_RING_LINE_WIDTH = 8
const MAX_TOP_TOPICS = 3
const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

export interface ProgressCardData {
  readonly overallAccuracy: number
  readonly totalSessions: number
  readonly currentStreak: number
  readonly longestStreak: number
  readonly totalAnswered: number
  readonly topicStats: Record<Topic, TopicStat>
}

interface TopicEntry {
  readonly label: string
  readonly accuracy: number
}

function getTopTopics(topicStats: Record<Topic, TopicStat>): readonly TopicEntry[] {
  const attempted = (Object.keys(topicStats) as Topic[])
    .filter((topic) => topicStats[topic].totalAnswered > 0)
    .map((topic) => ({
      label: TOPIC_LABELS[topic],
      accuracy: topicStats[topic].accuracy,
    }))
    .sort((a, b) => b.accuracy - a.accuracy)

  return attempted.slice(0, MAX_TOP_TOPICS)
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawAccuracyRing(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  accuracy: number,
): void {
  // Background ring
  ctx.beginPath()
  ctx.arc(centerX, centerY, ACCURACY_RING_RADIUS, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'
  ctx.lineWidth = ACCURACY_RING_LINE_WIDTH
  ctx.stroke()

  // Progress ring
  const endAngle = CIRCLE_START_ANGLE + (accuracy / PERCENTAGE_MULTIPLIER) * Math.PI * 2
  ctx.beginPath()
  ctx.arc(centerX, centerY, ACCURACY_RING_RADIUS, CIRCLE_START_ANGLE, endAngle)
  ctx.strokeStyle = '#3B82F6'
  ctx.lineWidth = ACCURACY_RING_LINE_WIDTH
  ctx.lineCap = 'round'
  ctx.stroke()

  // Percentage text
  ctx.fillStyle = '#1F2937'
  ctx.font = `bold 20px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${accuracy}%`, centerX, centerY)
}

function drawStatItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
): void {
  ctx.fillStyle = '#6B7280'
  ctx.font = `11px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.fillText(label, x, y)

  ctx.fillStyle = '#1F2937'
  ctx.font = `bold 18px ${FONT_FAMILY}`
  ctx.fillText(value, x, y + 22)
}

export function renderProgressCard(
  canvas: HTMLCanvasElement,
  data: ProgressCardData,
): void {
  const ctx = canvas.getContext('2d')
  if (ctx == null) return

  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT

  // Background
  drawRoundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 16)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  // Subtle border
  drawRoundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 16)
  ctx.strokeStyle = '#E5E7EB'
  ctx.lineWidth = 1
  ctx.stroke()

  // Header
  ctx.fillStyle = '#1F2937'
  ctx.font = `bold 22px ${FONT_FAMILY}`
  ctx.textAlign = 'left'
  ctx.fillText('DailyDev', PADDING, PADDING + 20)

  ctx.fillStyle = '#9CA3AF'
  ctx.font = `12px ${FONT_FAMILY}`
  ctx.fillText(REPORT_TITLE, PADDING, PADDING + 40)

  // Divider
  const dividerY = PADDING + 56
  ctx.beginPath()
  ctx.moveTo(PADDING, dividerY)
  ctx.lineTo(CARD_WIDTH - PADDING, dividerY)
  ctx.strokeStyle = '#F3F4F6'
  ctx.lineWidth = 1
  ctx.stroke()

  // Accuracy ring - left section
  const ringCenterX = PADDING + ACCURACY_RING_RADIUS + 16
  const ringCenterY = dividerY + 72
  drawAccuracyRing(ctx, ringCenterX, ringCenterY, data.overallAccuracy)

  // Label under ring
  ctx.fillStyle = '#9CA3AF'
  ctx.font = `11px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.fillText('정답률', ringCenterX, ringCenterY + ACCURACY_RING_RADIUS + 20)

  // Stats section - right of ring
  const statsStartX = ringCenterX + ACCURACY_RING_RADIUS + 56
  const statsY = dividerY + 48
  const statSpacing = 100

  drawStatItem(ctx, statsStartX, statsY, '세션', `${data.totalSessions}`)
  drawStatItem(ctx, statsStartX + statSpacing, statsY, '연속 학습', `${data.currentStreak}일`)
  drawStatItem(ctx, statsStartX + statSpacing * 2, statsY, '총 문제', `${data.totalAnswered}`)

  // Longest streak sub-info
  ctx.fillStyle = '#D1D5DB'
  ctx.font = `10px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.fillText(`최장 ${data.longestStreak}일`, statsStartX + statSpacing, statsY + 40)

  // Top topics section
  const topTopics = getTopTopics(data.topicStats)
  const topicsY = dividerY + 140

  // Divider before topics
  ctx.beginPath()
  ctx.moveTo(PADDING, topicsY - 16)
  ctx.lineTo(CARD_WIDTH - PADDING, topicsY - 16)
  ctx.strokeStyle = '#F3F4F6'
  ctx.lineWidth = 1
  ctx.stroke()

  if (topTopics.length > 0) {
    ctx.fillStyle = '#9CA3AF'
    ctx.font = `11px ${FONT_FAMILY}`
    ctx.textAlign = 'left'
    ctx.fillText('TOP 토픽', PADDING, topicsY + 4)

    const barStartX = PADDING + 80
    const barWidth = CARD_WIDTH - barStartX - PADDING
    const barHeight = 20
    const barSpacing = 30

    for (let i = 0; i < topTopics.length; i++) {
      const topic = topTopics[i]
      const y = topicsY + i * barSpacing

      // Topic label
      ctx.fillStyle = '#4B5563'
      ctx.font = `12px ${FONT_FAMILY}`
      ctx.textAlign = 'left'
      ctx.fillText(topic.label, PADDING, y + 14)

      // Bar background
      drawRoundedRect(ctx, barStartX, y, barWidth, barHeight, 4)
      ctx.fillStyle = '#F3F4F6'
      ctx.fill()

      // Bar fill
      const fillWidth = Math.max((topic.accuracy / PERCENTAGE_MULTIPLIER) * barWidth, 8)
      drawRoundedRect(ctx, barStartX, y, fillWidth, barHeight, 4)
      ctx.fillStyle = '#3B82F6'
      ctx.fill()

      // Accuracy label on bar
      ctx.fillStyle = topic.accuracy > 30 ? '#FFFFFF' : '#3B82F6'
      ctx.font = `bold 10px ${FONT_FAMILY}`
      ctx.textAlign = topic.accuracy > 30 ? 'right' : 'left'
      const textX = topic.accuracy > 30 ? barStartX + fillWidth - 8 : barStartX + fillWidth + 6
      ctx.fillText(`${topic.accuracy}%`, textX, y + 14)
    }
  } else {
    ctx.fillStyle = '#D1D5DB'
    ctx.font = `12px ${FONT_FAMILY}`
    ctx.textAlign = 'center'
    ctx.fillText('아직 학습한 토픽이 없습니다', CARD_WIDTH / 2, topicsY + 20)
  }

  // Footer
  const footerY = CARD_HEIGHT - 20
  ctx.fillStyle = '#D1D5DB'
  ctx.font = `10px ${FONT_FAMILY}`
  ctx.textAlign = 'right'
  const today = new Date()
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`
  ctx.fillText(`${dateStr} 기준`, CARD_WIDTH - PADDING, footerY)
}

export function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function shareCanvasImage(canvas: HTMLCanvasElement): Promise<boolean> {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob == null) {
        resolve(false)
        return
      }

      const file = new File([blob], 'dailydev-progress.png', { type: 'image/png' })
      const shareData = { files: [file] }

      if (!navigator.canShare(shareData)) {
        resolve(false)
        return
      }

      navigator.share(shareData)
        .then(() => resolve(true))
        .catch(() => resolve(false))
    }, 'image/png')
  })
}
