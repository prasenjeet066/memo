"use client"

import {
  HStack,
  IconButton,
  Portal,
  createListCollection,
} from "@chakra-ui/react"
import { Select } from "@chakra-ui/react"
import { Fai } from '@/components/Fontawesome'
import { useState } from "react"

interface SelectItem {
  label: string
  value: string
  icon: React.ReactNode
  action: string
}

const SelectTrigger = ({ iconBase }: { iconBase: React.ReactNode }) => {
  return (
    <Select.Trigger asChild>
      <IconButton
        px="2"
        variant="outline"
        size="sm"
      >
        <Fai icon={iconBase} />
      </IconButton>
    </Select.Trigger>
  )
}

export default function IconSelectBox({
  block,
  activeAction,
  handleToolbarAction,
}: {
  block: any
  activeAction: string | null
  handleToolbarAction: (action: string) => void
}) {
  const [selected, setSelected] = useState(block.items[0].value)
  
  // Create collection from block items
  const collection = createListCollection({
    items: block.items,
  })
  
  const handleSelect = (details: any) => {
    const selectedValue = details.value[0]
    const selectedItem = block.items.find(
      (item: SelectItem) => item.value === selectedValue
    )
    if (selectedItem) {
      setSelected(selectedValue)
      handleToolbarAction(selectedItem.action)
    }
  }
  
  return (
    <Select.Root
      collection={collection}
      positioning={{ sameWidth: false }}
      size="sm"
      width="auto"
      value={[selected]}
      onValueChange={handleSelect}
    >
      <Select.Control>
        <SelectTrigger iconBase={block.icon} />
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content minW="32">
            {block.items.map((item: SelectItem) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>
                  <HStack gap={3}>
                    {item.icon}
                    <span>{item.label}</span>
                  </HStack>
                </Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}