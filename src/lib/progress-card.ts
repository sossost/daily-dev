/**
 * Progress card renderer — generates a shareable canvas image
 * showing the user's learning progress summary.
 */
import type { Topic, TopicStat } from '@/types'
import { TOPIC_LABELS } from '@/types'
import { REPORT_TITLE } from '@/lib/constants'

const CARD_WIDTH = 1200
const CARD_HEIGHT = 800
const PADDING = 64
const PERCENTAGE_MULTIPLIER = 100
const CIRCLE_START_ANGLE = -Math.PI / 2
const ACCURACY_RING_RADIUS = 88
const ACCURACY_RING_LINE_WIDTH = 16
const MAX_TOP_TOPICS = 3
const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

// Layout offsets (2x scale)
const RING_PERCENT_OFFSET_Y = -12
const RING_LABEL_OFFSET_Y = 28
const STAT_VALUE_OFFSET_Y = 44
const STAT_SUBLABEL_OFFSET_Y = 88
const SECTION_HEADER_OFFSET_Y = 8
const FIRST_BAR_OFFSET_Y = 32
const BAR_LABEL_INSET = 16
const BAR_LABEL_GAP = 12

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

  // Percentage text + label inside ring
  ctx.fillStyle = '#1F2937'
  ctx.font = `bold 40px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${accuracy}%`, centerX, centerY + RING_PERCENT_OFFSET_Y)

  ctx.fillStyle = '#9CA3AF'
  ctx.font = `20px ${FONT_FAMILY}`
  ctx.fillText('정답률', centerX, centerY + RING_LABEL_OFFSET_Y)
}

function drawStatItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
): void {
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#6B7280'
  ctx.font = `22px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.fillText(label, x, y)

  ctx.fillStyle = '#1F2937'
  ctx.font = `bold 36px ${FONT_FAMILY}`
  ctx.fillText(value, x, y + STAT_VALUE_OFFSET_Y)
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
  drawRoundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 32)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  // Subtle border
  drawRoundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 32)
  ctx.strokeStyle = '#E5E7EB'
  ctx.lineWidth = 2
  ctx.stroke()

  // Header
  ctx.fillStyle = '#1F2937'
  ctx.font = `bold 44px ${FONT_FAMILY}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('DailyDev', PADDING, PADDING + 40)

  ctx.fillStyle = '#9CA3AF'
  ctx.font = `24px ${FONT_FAMILY}`
  ctx.fillText(REPORT_TITLE, PADDING, PADDING + 76)

  // Divider
  const dividerY = PADDING + 108
  ctx.beginPath()
  ctx.moveTo(PADDING, dividerY)
  ctx.lineTo(CARD_WIDTH - PADDING, dividerY)
  ctx.strokeStyle = '#F3F4F6'
  ctx.lineWidth = 2
  ctx.stroke()

  // Accuracy ring - left section
  const ringCenterX = PADDING + ACCURACY_RING_RADIUS + 32
  const ringCenterY = dividerY + 144
  drawAccuracyRing(ctx, ringCenterX, ringCenterY, data.overallAccuracy)

  // Stats section - right of ring
  const statsStartX = ringCenterX + ACCURACY_RING_RADIUS + 112
  const statsY = dividerY + 96
  const statSpacing = 200

  drawStatItem(ctx, statsStartX, statsY, '세션', `${data.totalSessions}`)
  drawStatItem(ctx, statsStartX + statSpacing, statsY, '연속 학습', `${data.currentStreak}일`)
  drawStatItem(ctx, statsStartX + statSpacing * 2, statsY, '총 문제', `${data.totalAnswered}`)

  // Longest streak sub-info
  ctx.fillStyle = '#9CA3AF'
  ctx.font = `18px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`최장 ${data.longestStreak}일`, statsStartX + statSpacing, statsY + STAT_SUBLABEL_OFFSET_Y)

  // Top topics section
  const topTopics = getTopTopics(data.topicStats)
  const secondDividerY = ringCenterY + ACCURACY_RING_RADIUS + 56
  const topicsY = secondDividerY + 40

  // Divider before topics
  ctx.beginPath()
  ctx.moveTo(PADDING, secondDividerY)
  ctx.lineTo(CARD_WIDTH - PADDING, secondDividerY)
  ctx.strokeStyle = '#F3F4F6'
  ctx.lineWidth = 2
  ctx.stroke()

  if (topTopics.length > 0) {
    ctx.fillStyle = '#9CA3AF'
    ctx.font = `22px ${FONT_FAMILY}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('토픽별 정답률 TOP 3', PADDING, topicsY + SECTION_HEADER_OFFSET_Y)

    const barStartX = PADDING + 180
    const barWidth = CARD_WIDTH - barStartX - PADDING
    const barHeight = 36
    const barSpacing = 56
    const firstBarY = topicsY + FIRST_BAR_OFFSET_Y

    for (let i = 0; i < topTopics.length; i++) {
      const topic = topTopics[i]
      const y = firstBarY + i * barSpacing

      // Topic label — vertically centered with bar
      ctx.fillStyle = '#4B5563'
      ctx.font = `24px ${FONT_FAMILY}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(topic.label, PADDING, y + barHeight / 2)

      // Bar background
      drawRoundedRect(ctx, barStartX, y, barWidth, barHeight, 8)
      ctx.fillStyle = '#F3F4F6'
      ctx.fill()

      // Bar fill
      const fillWidth = topic.accuracy > 0
        ? Math.max((topic.accuracy / PERCENTAGE_MULTIPLIER) * barWidth, 16)
        : 0
      if (fillWidth > 0) {
        drawRoundedRect(ctx, barStartX, y, fillWidth, barHeight, 8)
        ctx.fillStyle = '#3B82F6'
        ctx.fill()
      }

      // Accuracy label — vertically centered
      ctx.font = `bold 20px ${FONT_FAMILY}`
      ctx.textBaseline = 'middle'
      const barCenterY = y + barHeight / 2
      if (topic.accuracy === 0) {
        ctx.fillStyle = '#9CA3AF'
        ctx.textAlign = 'right'
        ctx.fillText('0%', barStartX + barWidth - BAR_LABEL_GAP, barCenterY)
      } else if (topic.accuracy > 30) {
        ctx.fillStyle = '#FFFFFF'
        ctx.textAlign = 'right'
        ctx.fillText(`${topic.accuracy}%`, barStartX + fillWidth - BAR_LABEL_INSET, barCenterY)
      } else {
        ctx.fillStyle = '#3B82F6'
        ctx.textAlign = 'left'
        ctx.fillText(`${topic.accuracy}%`, barStartX + fillWidth + BAR_LABEL_GAP, barCenterY)
      }
    }
  } else {
    ctx.fillStyle = '#D1D5DB'
    ctx.font = `24px ${FONT_FAMILY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('아직 학습한 토픽이 없습니다', CARD_WIDTH / 2, topicsY + 40)
  }

  // Footer
  const footerY = CARD_HEIGHT - 40
  ctx.fillStyle = '#D1D5DB'
  ctx.font = `20px ${FONT_FAMILY}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
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
