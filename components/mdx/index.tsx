'use client'

import { useEffect, useState } from 'react'
import { evaluate } from '@mdx-js/mdx'
import { MDXProvider } from '@mdx-js/react'
import * as runtime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'

type Props = {
  source: string
  components?: Record<string, React.ComponentType<any>>
}

// Default table components with proper styling
const defaultComponents = {
  table: (props: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-300" {...props} />
    </div>
  ),
  thead: (props: any) => <thead className="bg-gray-50" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-gray-200 bg-white" {...props} />,
  tr: (props: any) => <tr {...props} />,
  th: (props: any) => (
    <th 
      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900" 
      {...props} 
    />
  ),
  td: (props: any) => (
    <td 
      className="whitespace-nowrap px-3 py-4 text-sm text-gray-500" 
      {...props} 
    />
  ),
}

export default function ClientMDX({ source, components = {} }: Props) {
  const [Content, setContent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function renderMDX() {
      try {
        const { default: MDXContent } = await evaluate(source, {
          ...runtime,
          useDynamicImport: false,
          remarkPlugins: [remarkGfm], // Enable GitHub Flavored Markdown (tables)
        })
        setContent(() => MDXContent)
        setError(null)
      } catch (err) {
        console.error('MDX rendering error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render MDX')
      }
    }

    renderMDX()
  }, [source])

  if (error) return <p className="text-red-500">Error: {error}</p>
  if (!Content) return <p>Loading MDX...</p>

  // Merge default table components with custom components
  const mergedComponents = { ...defaultComponents, ...components }

  return (
    <MDXProvider components={mergedComponents}>
      <article className="prose prose-slate max-w-none">
        <Content />
      </article>
    </MDXProvider>
  )
}