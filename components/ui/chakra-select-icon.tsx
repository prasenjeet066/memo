"use client"

import {
  HStack,
  IconButton,
  Portal,
  Select,
  createListCollection,
  useSelectContext,
} from "@chakra-ui/react"
import { Fai } from "@/components/Fontawesome"

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

const SelectTrigger = () => {
  const select = useSelectContext()
  const items = select.selectedItems as SelectItem[]
  
  return (
    <IconButton
      px="2"
      variant="outline"
      size="sm"
      {...select.getTriggerProps()}
    >
      {select.hasSelectedItems ? <Fai icon={items[0].icon} /> : null}
    </IconButton>
  )
}

export default function IconSelectBox({
  block,
  handleToolbarAction,
}: IconSelectBoxProps) {
 /** const collection = createListCollection({
    items: block.items,
  })**/
  
  const handleSelect = (values: string[]) => {
    const selectedValue = values[0]
    const selectedItem = block.items.find(item => item.value === selectedValue)
    if (selectedItem) {
      handleToolbarAction(selectedItem.action)
    }
  }
  
  return (
    <Select.Root
      //collection={collection}
      positioning={{ sameWidth: false }}
      size="sm"
      width="auto"
      defaultValue={[block.items[0].value]}
      onValueChange={handleSelect}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <SelectTrigger />
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content minW="32">
            {block.items.map(item => (
              <Select.Item item={item} key={item.value}>
                <HStack gap={3}>
                  {item.icon}
                  {item.label}
                </HStack>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}