import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Fai } from '@/components/Fontawesome';
import {useState} from 'react'
export default function IconSelectBox({
  block,
  activeAction,
  handleToolbarAction,
}: {
  block: any;
  activeAction: string | null;
  handleToolbarAction: (action: string) => void;
}) {
  const [selected, setSelected] = useState(block.items[0]);
  
  const handleSelect = (item: any) => {
    setSelected(item);
    handleToolbarAction(item.action);
  };
  
  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        variant="ghost"
        borderRadius="full"
        size="sm"
        px={3}
        py={2}
      >
        <HStack spacing={2}>
          {selected.icon && <Fai icon={selected.icon} style="fas" />}

        </HStack>
      </MenuButton>

      <MenuList>
        {block.items.map((item: any, itemIndex: number) => (
          <MenuItem key={`menu-item-${itemIndex}`} onClick={() => handleSelect(item)}>
            <HStack spacing={3}>
              {item.icon && <Fai icon={item.icon} style="fas" />}
              <Text>{item.label}</Text>
            </HStack>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}