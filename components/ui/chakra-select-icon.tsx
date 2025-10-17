"use client"
import {
  HStack,
  IconButton,
  Portal,
  Select,
  createListCollection,
  useSelectContext,
  Text,
} from "@chakra-ui/react"
import { Fai } from '@/components/Fontawesome';

import { useState } from "react"

interface Framework {
  label: string
  value: string
  icon: React.ReactNode
}



const SelectTrigger = (iconBase) => {
  const select = useSelectContext()
  
  return (
    <IconButton
      px="2"
      variant="outline"
      size="sm"
      {...select.getTriggerProps()}
    >
      <Fai icon = {iconBase}/>
    </IconButton>
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
  const [selected, setSelected] = useState(block.items[0])
  
  const handleSelect = (item: any) => {
    setSelected(item)
    handleToolbarAction(item.action)
  }
  
  const collection = createListCollection({
    items: block.items,
  })
  
  return (<Select.Root
  positioning={{ sameWidth: false }}
  size="sm"
  width="auto"
  defaultValue={[block.items[0].value]}
  onValueChange={(details) => {
    const selectedItem = block.items.find(
      (item: any) => item.value === details.value[0]
    )
    if (selectedItem) handleSelect(selectedItem)
  }}
>
  <Select.HiddenSelect />
  <Select.Control>
    <SelectTrigger iconBase={block.icon} />
  </Select.Control>
  <Portal>
    <Select.Positioner>
      <Select.Content minW="32">
        {block.items.map((item: any, itemIndex: number) => (
          <Select.Item key={`menu-item-${itemIndex}`} value={item.value}>
            <HStack spacing={3}>
              {item.icon}
              <Text>{item.label}</Text>
            </HStack>
            <Select.ItemIndicator />
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Positioner>
  </Portal>
</Select.Root>)
}