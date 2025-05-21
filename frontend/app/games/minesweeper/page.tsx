'use client';
import Minesweeper from '@/components/minesweeper';
import { title } from '@/components/primitives';
import { Wrapper } from '@/components/wrapper';
import { Button } from '@heroui/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  useDisclosure,
} from '@heroui/react';

export default function GamesTempPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <Wrapper className="flex flex-col gap-4 items-center">
      <h1 className={title()}>Взрывная Дуэль</h1>
      <Minesweeper />
      <Button onPress={onOpen}>Правила Игры</Button>
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
        TODO: ПРАВИЛА ИГРЫ
        <DrawerContent className="p-4">
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1">Правила игры</DrawerHeader>
              <DrawerBody>
                <p>Игра 3: PVP: Минное поле (более азартная версия обычных лотерейных билетов)</p>
                <p>
                  Наше PvP-Минное поле — это азартная дуэль, где два игрока делают ставки и
                  поочередно открывают ячейки на поле, пытаясь не подорваться на мине.
                </p>
                <p>
                  Это не просто лотерея, это прямое соревнование, где удача сочетается с интуицией,
                  создавая напряженную и моментально понятную битву за выигрыш.
                </p>
              </DrawerBody>
              <DrawerFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Закрыть
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </Wrapper>
  );
}
