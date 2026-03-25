/**
 * Question loader — statically imports all topic JSON files at build time.
 * Provides locale-aware, indexed access by ID and topic. No runtime I/O.
 */
import type { Question, Topic } from '@/types'
import type { Locale } from '@/i18n/routing'

// Korean imports
import scopeKo from '../../data/questions/ko/scope.json'
import closureKo from '../../data/questions/ko/closure.json'
import prototypeKo from '../../data/questions/ko/prototype.json'
import thisKo from '../../data/questions/ko/this.json'
import eventLoopKo from '../../data/questions/ko/event-loop.json'
import asyncKo from '../../data/questions/ko/async.json'
import typeCoercionKo from '../../data/questions/ko/type-coercion.json'
import typescriptKo from '../../data/questions/ko/typescript.json'
import promiseKo from '../../data/questions/ko/promise.json'
import domManipulationKo from '../../data/questions/ko/dom-manipulation.json'
import cssLayoutKo from '../../data/questions/ko/css-layout.json'
import webPerformanceKo from '../../data/questions/ko/web-performance.json'
import reactBasicsKo from '../../data/questions/ko/react-basics.json'
import dataStructuresKo from '../../data/questions/ko/data-structures.json'
import designPatternsKo from '../../data/questions/ko/design-patterns.json'
import networkKo from '../../data/questions/ko/network.json'
import algorithmsKo from '../../data/questions/ko/algorithms.json'
import nodejsKo from '../../data/questions/ko/nodejs.json'
import browserApiKo from '../../data/questions/ko/browser-api.json'
import apiDesignKo from '../../data/questions/ko/api-design.json'
import webSecurityKo from '../../data/questions/ko/web-security.json'
import databaseKo from '../../data/questions/ko/database.json'
import gitAdvancedKo from '../../data/questions/ko/git-advanced.json'

// English imports
import scopeEn from '../../data/questions/en/scope.json'
import closureEn from '../../data/questions/en/closure.json'
import prototypeEn from '../../data/questions/en/prototype.json'
import thisEn from '../../data/questions/en/this.json'
import eventLoopEn from '../../data/questions/en/event-loop.json'
import asyncEn from '../../data/questions/en/async.json'
import typeCoercionEn from '../../data/questions/en/type-coercion.json'
import typescriptEn from '../../data/questions/en/typescript.json'
import promiseEn from '../../data/questions/en/promise.json'
import domManipulationEn from '../../data/questions/en/dom-manipulation.json'
import cssLayoutEn from '../../data/questions/en/css-layout.json'
import webPerformanceEn from '../../data/questions/en/web-performance.json'
import reactBasicsEn from '../../data/questions/en/react-basics.json'
import dataStructuresEn from '../../data/questions/en/data-structures.json'
import designPatternsEn from '../../data/questions/en/design-patterns.json'
import networkEn from '../../data/questions/en/network.json'
import algorithmsEn from '../../data/questions/en/algorithms.json'
import nodejsEn from '../../data/questions/en/nodejs.json'
import browserApiEn from '../../data/questions/en/browser-api.json'
import apiDesignEn from '../../data/questions/en/api-design.json'
import webSecurityEn from '../../data/questions/en/web-security.json'
import databaseEn from '../../data/questions/en/database.json'
import gitAdvancedEn from '../../data/questions/en/git-advanced.json'

// JSON imports are typed as { topic: string } (not Topic union).
// Structural validation is handled by .harness/scripts/validate.sh at commit time,
// so the cast here is safe for runtime use.
function buildQuestionList(imports: unknown[][]): Question[] {
  return imports.flat() as Question[]
}

const QUESTIONS_BY_LOCALE: Record<Locale, Question[]> = {
  ko: buildQuestionList([
    scopeKo, closureKo, prototypeKo, thisKo, eventLoopKo, asyncKo,
    typeCoercionKo, typescriptKo, promiseKo, domManipulationKo,
    cssLayoutKo, webPerformanceKo, reactBasicsKo, dataStructuresKo,
    designPatternsKo, networkKo, algorithmsKo, nodejsKo,
    browserApiKo, apiDesignKo, webSecurityKo, databaseKo,
    gitAdvancedKo,
  ]),
  en: buildQuestionList([
    scopeEn, closureEn, prototypeEn, thisEn, eventLoopEn, asyncEn,
    typeCoercionEn, typescriptEn, promiseEn, domManipulationEn,
    cssLayoutEn, webPerformanceEn, reactBasicsEn, dataStructuresEn,
    designPatternsEn, networkEn, algorithmsEn, nodejsEn,
    browserApiEn, apiDesignEn, webSecurityEn, databaseEn,
    gitAdvancedEn,
  ]),
}

const INDEX_BY_LOCALE: Record<Locale, Map<string, Question>> = {
  ko: new Map(QUESTIONS_BY_LOCALE.ko.map((q) => [q.id, q])),
  en: new Map(QUESTIONS_BY_LOCALE.en.map((q) => [q.id, q])),
}

function resolveLocale(locale?: Locale): Locale {
  return locale != null && locale in QUESTIONS_BY_LOCALE ? locale : 'en'
}

export function getAllQuestions(locale?: Locale): Question[] {
  return QUESTIONS_BY_LOCALE[resolveLocale(locale)]
}

export function getQuestionsByTopic(topic: Topic, locale?: Locale): Question[] {
  return getAllQuestions(locale).filter((q) => q.topic === topic)
}

export function getQuestionById(id: string, locale?: Locale): Question | null {
  return INDEX_BY_LOCALE[resolveLocale(locale)].get(id) ?? null
}

export function getTopicQuestionCounts(locale?: Locale): Record<Topic, number> {
  const counts = {} as Record<Topic, number>

  for (const question of getAllQuestions(locale)) {
    const current = counts[question.topic] ?? 0
    counts[question.topic] = current + 1
  }

  return counts
}
