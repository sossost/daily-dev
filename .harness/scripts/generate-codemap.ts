/**
 * Codemap generator — auto-generates project context from source code.
 * Extracts: file tree, JSDoc comments, type definitions, store interfaces,
 * exported functions, import dependencies, and constants.
 *
 * Output: .harness/docs/codemap.md
 * Used by: harness agents to understand project structure without exploration.
 */
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_DIR = path.resolve(__dirname, '../..')
const SRC_DIR = path.join(PROJECT_DIR, 'src')
const DATA_DIR = path.join(PROJECT_DIR, 'data')
const OUTPUT_FILE = path.join(PROJECT_DIR, '.harness/docs/codemap.md')

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function findFiles(dir: string, ext: string[]): string[] {
  const results: string[] = []

  function walk(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (ext.some((e) => entry.name.endsWith(e))) {
        results.push(fullPath)
      }
    }
  }

  walk(dir)
  return results.sort()
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

interface FileInfo {
  relativePath: string
  moduleDoc: string | null
  exports: ExportInfo[]
  imports: string[]
  interfaces: InterfaceInfo[]
  constants: ConstantInfo[]
}

interface ExportInfo {
  name: string
  kind: 'function' | 'const' | 'type' | 'interface' | 'class' | 'component'
  doc: string | null
  signature: string | null
}

interface InterfaceInfo {
  name: string
  doc: string | null
  body: string
}

interface ConstantInfo {
  name: string
  value: string
}

function extractModuleDoc(content: string): string | null {
  const match = content.match(/^\/\*\*\s*\n([\s\S]*?)\*\/\s*\n/m)
  if (match == null) return null
  return match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter((line) => line.length > 0)
    .join(' ')
}

function extractJSDoc(content: string, position: number): string | null {
  const before = content.slice(0, position)

  // Find the last */ before this position
  const closeIdx = before.lastIndexOf('*/')
  if (closeIdx === -1) return null

  // Only whitespace/newlines allowed between */ and the export
  const gap = before.slice(closeIdx + 2).trim()
  if (gap.length > 0) return null

  // Find the matching /** for this */
  const openIdx = before.lastIndexOf('/**', closeIdx)
  if (openIdx === -1) return null

  const docBody = before.slice(openIdx + 3, closeIdx)
  return docBody
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter((line) => line.length > 0)
    .join(' ')
}

function parseFile(filePath: string): FileInfo {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(PROJECT_DIR, filePath)

  const moduleDoc = extractModuleDoc(content)
  const exports: ExportInfo[] = []
  const imports: string[] = []
  const interfaces: InterfaceInfo[] = []
  const constants: ConstantInfo[] = []

  // Extract imports (from @/ or relative)
  const importRegex = /import.*from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)['"]/g
  let importMatch
  while ((importMatch = importRegex.exec(content)) !== null) {
    imports.push(importMatch[1])
  }

  // Extract exported functions
  const funcRegex = /^export\s+(?:async\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([^\n{]+))?/gm
  let funcMatch
  while ((funcMatch = funcRegex.exec(content)) !== null) {
    const name = funcMatch[1]
    const params = funcMatch[3].replace(/\s+/g, ' ').trim()
    const returnType = funcMatch[4]?.trim() ?? ''
    const isComponent = /^[A-Z]/.test(name) && filePath.endsWith('.tsx')

    exports.push({
      name,
      kind: isComponent ? 'component' : 'function',
      doc: extractJSDoc(content, funcMatch.index),
      signature: returnType ? `(${params}) → ${returnType}` : `(${params})`,
    })
  }

  // Extract exported consts (stores, components, values)
  const constRegex = /^export\s+(?:const|let)\s+(\w+)(?:\s*:\s*([^\n=]+))?\s*=/gm
  let constMatch
  while ((constMatch = constRegex.exec(content)) !== null) {
    const name = constMatch[1]
    // Skip if already captured as function
    if (exports.some((e) => e.name === name)) continue

    const isComponent = /^[A-Z]/.test(name) && filePath.endsWith('.tsx')
    const isStore = name.startsWith('use') && content.includes('create<')

    exports.push({
      name,
      kind: isComponent ? 'component' : isStore ? 'const' : 'const',
      doc: extractJSDoc(content, constMatch.index),
      signature: constMatch[2]?.trim() ?? null,
    })
  }

  // Extract exported types/interfaces
  const typeRegex = /^export\s+(?:type|interface)\s+(\w+)/gm
  let typeMatch
  while ((typeMatch = typeRegex.exec(content)) !== null) {
    exports.push({
      name: typeMatch[1],
      kind: 'type',
      doc: extractJSDoc(content, typeMatch.index),
      signature: null,
    })
  }

  // Extract interface bodies (for store shape)
  const interfaceRegex = /^interface\s+(\w+State\w*)\s*(?:extends\s+[^{]+)?\{([^}]+)\}/gm
  let ifaceMatch
  while ((ifaceMatch = interfaceRegex.exec(content)) !== null) {
    interfaces.push({
      name: ifaceMatch[1],
      doc: extractJSDoc(content, ifaceMatch.index),
      body: ifaceMatch[2]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .join('\n  '),
    })
  }

  // Extract UPPER_SNAKE_CASE constants with simple literal values only
  const upperConstRegex = /^(?:export\s+)?const\s+([A-Z][A-Z_0-9]+)\s*(?::\s*[^=]+)?\s*=\s*([^\n;]+)/gm
  let ucMatch
  while ((ucMatch = upperConstRegex.exec(content)) !== null) {
    const rawValue = ucMatch[2].trim()
    // Only include simple literals (numbers, strings, simple arrays)
    if (/^[\d._]+$/.test(rawValue) || /^['"]/.test(rawValue)) {
      constants.push({ name: ucMatch[1], value: rawValue })
    }
  }

  return { relativePath, moduleDoc, exports, imports, interfaces, constants }
}

// ---------------------------------------------------------------------------
// Data directory analysis
// ---------------------------------------------------------------------------

function analyzeDataDir(): string {
  const questionFiles = findFiles(DATA_DIR, ['.json'])
  const lines: string[] = []

  for (const file of questionFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const questions = JSON.parse(content) as Array<{ id: string }>
    const name = path.basename(file, '.json')
    lines.push(`- ${name}.json — ${questions.length} questions`)
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

function generateCodemap(files: FileInfo[]): string {
  const lines: string[] = []

  lines.push('# DailyDev — Project Context')
  lines.push('')
  lines.push('> Auto-generated by `generate-codemap.ts`. Do not edit manually.')
  lines.push('')

  // Group files by directory
  const groups = new Map<string, FileInfo[]>()
  for (const file of files) {
    const dir = path.dirname(file.relativePath)
    const group = groups.get(dir) ?? []
    group.push(file)
    groups.set(dir, group)
  }

  // Constants section
  const allConstants = files.flatMap((f) => f.constants)
  if (allConstants.length > 0) {
    lines.push('## Constants')
    lines.push('')
    for (const c of allConstants) {
      lines.push(`- \`${c.name}\` = \`${c.value}\``)
    }
    lines.push('')
  }

  // Store interfaces section
  const allInterfaces = files.flatMap((f) =>
    f.interfaces.map((iface) => ({ ...iface, file: f.relativePath })),
  )
  if (allInterfaces.length > 0) {
    lines.push('## Store Interfaces')
    lines.push('')
    for (const iface of allInterfaces) {
      lines.push(`### ${iface.name} (\`${iface.file}\`)`)
      if (iface.doc != null) lines.push(`> ${iface.doc}`)
      lines.push('```')
      lines.push(`  ${iface.body}`)
      lines.push('```')
      lines.push('')
    }
  }

  // Data directory
  lines.push('## Data')
  lines.push('')
  lines.push(analyzeDataDir())
  lines.push('')

  // Modules section
  lines.push('## Modules')
  lines.push('')

  const dirOrder = [
    'src/types',
    'src/lib',
    'src/stores',
    'src/app',
    'src/app/session',
    'src/app/session/result',
    'src/app/topics',
    'src/components',
    'src/components/dashboard',
    'src/components/quiz',
    'src/components/result',
    'src/hooks',
  ]

  const sortedDirs = [...groups.keys()].sort((a, b) => {
    const ai = dirOrder.indexOf(a)
    const bi = dirOrder.indexOf(b)
    const aN = ai === -1 ? 999 : ai
    const bN = bi === -1 ? 999 : bi
    return aN - bN
  })

  for (const dir of sortedDirs) {
    const groupFiles = groups.get(dir)
    if (groupFiles == null) continue

    lines.push(`### ${dir}/`)
    lines.push('')

    for (const file of groupFiles) {
      const fileName = path.basename(file.relativePath)
      const docLine = file.moduleDoc != null ? ` — ${file.moduleDoc}` : ''
      lines.push(`#### \`${fileName}\`${docLine}`)

      if (file.exports.length > 0) {
        for (const exp of file.exports) {
          const sig = exp.signature != null ? ` ${exp.signature}` : ''
          const doc = exp.doc != null ? ` — ${exp.doc}` : ''
          lines.push(`- \`${exp.name}\`${sig}${doc}`)
        }
      }

      if (file.imports.length > 0) {
        const deps = file.imports
          .filter((i) => i.startsWith('@/'))
          .map((i) => i.replace('@/', ''))
        if (deps.length > 0) {
          lines.push(`- *deps*: ${deps.join(', ')}`)
        }
      }

      lines.push('')
    }
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const files = findFiles(SRC_DIR, ['.ts', '.tsx']).map(parseFile)
  const codemap = generateCodemap(files)

  fs.writeFileSync(OUTPUT_FILE, codemap, 'utf-8')

  const exportCount = files.reduce((sum, f) => sum + f.exports.length, 0)
  console.log(
    `Codemap generated: ${files.length} files, ${exportCount} exports → ${OUTPUT_FILE}`,
  )
}

main()
