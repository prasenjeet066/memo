"use client"

import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [selectedValue, setSelectedValue] = React.useState(block.items[0].value)
  
  const handleValueChange = (value: string) => {
    const selectedItem = block.items.find(item => item.value === value)
    if (selectedItem) {
      setSelectedValue(value)
      handleToolbarAction(selectedItem.action)
    }
  }
  
  const selectedItem = block.items.find(item => item.value === selectedValue)
  
  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-auto px-2 py-1">
        <div className="flex items-center gap-2">
          {selectedItem?.icon}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="w-40">
        {block.items.map(item => (
          <SelectItem key={item.value} value={item.value}>
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}