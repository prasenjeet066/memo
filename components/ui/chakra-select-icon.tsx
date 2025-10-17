"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HStack } from "@chakra-ui/react" // or replace with a Tailwind div if you want

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
  
  const handleSelect = (item: SelectItem) => {
    setSelectedValue(item.value)
    handleToolbarAction(item.action)
  }
  
  const selectedItem = block.items.find(item => item.value === selectedValue)
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="px-2">
          {selectedItem?.icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[8rem]">
        {block.items.map(item => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => handleSelect(item)}
            className="flex items-center gap-3"
          >
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}