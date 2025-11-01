'use client'

import { useEffect, useState } from 'react'
import { compile } from '@mdx-js/mdx'
import { MDXProvider } from '@mdx-js/react'
import * as runtime from 'react/jsx-runtime'

type Props = {
  source: string
  components?: Record<string, React.ComponentType<any>>
}

export default function ClientMDX({ source, components = {} }: Props) {
  const [MDXContent, setMDXContent] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    async function renderMDX() {
      const compiled = await compile(source, { outputFormat: 'function-body', useDynamicImport: false })
      const js = String(compiled)
      const { default: Content } = await import(
        'data:text/javascript;charset=utf-8,' + encodeURIComponent(js)
      )
      setMDXContent(() => Content)
    }
    renderMDX()
  }, [source])

  if (!MDXContent) return <p>Loading MDX...</p>

  return (
    <MDXProvider components={components}>
      <article className="prose">
        <MDXContent />
      </article>
    </MDXProvider>
  )
}