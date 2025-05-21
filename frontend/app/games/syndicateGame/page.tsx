'use client';

import AllSyndicatesClient from '@/components/AllSyndicatesClient';
import { title } from '@/components/primitives';
import { Wrapper } from '@/components/wrapper';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  useDisclosure,
} from '@heroui/react';

export default function Page() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <Wrapper className="flex flex-col gap-8">
      <h1 className={title()}>Командный Выигрыш</h1>
      <AllSyndicatesClient />
      <Button onPress={onOpen}>Правила Игры</Button>
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
        TODO: ПРАВИЛА ИГРЫ
        <DrawerContent className="p-4">
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1">Правила игры</DrawerHeader>
              <DrawerBody>
                <p>Игра 1: Командный выигрыш (новое видение лотерейных синдикатов)</p>
                <p>
                  Представьте классическую лотерею, но с элементами командной игры. Командный
                  выигрыш позволяет игрокам объединяться в синдикаты. Если билет команды приносит
                  джекпот, приз справедливо распределяется между всеми её участниками
                  пропорционально их вкладу.
                </p>
                <p>
                  Это не только многократно увеличивает шансы каждого игрока почувствовать победу,
                  но и добавляет важный социальный элемент, превращая индивидуальное участие в
                  коллективное приключение.
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
