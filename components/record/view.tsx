import { useState, useEffect } from 'react'

interface Props {
  __data: {
    data: {
      title ? : string
      content ? : string
    }
  }
}

export const Viewer = function({
  __data
}: Props) {
  const [data, setData] = useState < any > (null)
  
  useEffect(() => {
    if (__data?.data) {
      setData(__data.data)
    }
  }, [__data])
  
  if (!data) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">
            {data.title}
          </h1>
        </div>
      </div>
      
      <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2 py-1">
        <div className="flex items-center border-l pl-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors m-2 rounded-full"
            aria-label="Edit document"
            type="button"
            title="Edit Article"
          >
            Edit Article 
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white relative" dangerouslySetInnerHTML={{ __html: data?.content || '' }}/>
    </div>
  )
}