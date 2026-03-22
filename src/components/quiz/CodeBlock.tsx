'use client'

import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = 'javascript' }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current != null) {
      Prism.highlightElement(codeRef.current)
    }
  }, [code])

  return (
    <div className="rounded-lg bg-gray-900 p-4 overflow-x-auto my-4">
      <pre className="m-0">
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  )
}
