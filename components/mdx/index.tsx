'use client'

import { useEffect, useState } from 'react'
import { evaluate } from '@mdx-js/mdx'
import { MDXProvider } from '@mdx-js/react'
import * as runtime from 'react/jsx-runtime'

type Props = {
  source: string
  components?: Record<string, React.ComponentType<any>>
}

export default function ClientMDX({ source, components = {} }: Props) {
  const [Content, setContent] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    async function renderMDX() {
      const { default: MDXContent } = await evaluate(source, {
        ...runtime,
        useDynamicImport: false,
      })
      setContent(() => MDXContent)
    }

    renderMDX()
  }, [source])

  if (!Content) return <p>Loading MDX...</p>

  return (
    <MDXProvider components={components}>
      <article className="prose">
        <Content />
      </article>
    </MDXProvider>
  )
}