"use client"

import React, { useState, useRef, useEffect } from "react"

interface SelectItem {
  label: string
  value: string
  icon: React.ReactNode
  action: string
}

interface IconSelectBoxProps {
  block: {
    icon: React.ReactNode
    items: SelectItem[]
  }
  activeAction: string | null
  handleToolbarAction: (action: string) => void
}

export default function IconSelectBox({
  block,
  handleToolbarAction,
}: IconSelectBoxProps) {
  const [open, setOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(block.items[0].value)
  const dropdownRef = useRef < HTMLDivElement > (null)
  
  const selectedItem = block.items.find(item => item.value === selectedValue)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  const handleSelect = (item: SelectItem) => {
    setSelectedValue(item.value)
    handleToolbarAction(item.action)
    setOpen(false)
  }
  
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        className="flex items-center justify-center px-2 py-1 border rounded-sm border-gray-300 hover:bg-gray-100 focus:outline-none"
        onClick={() => setOpen(prev => !prev)}
      >
        {selectedItem?.icon}
      </button>

      {open && (
        <div className="absolute mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg z-10">
          {block.items.map(item => (
            <div
              key={item.value}
              onClick={() => handleSelect(item)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}