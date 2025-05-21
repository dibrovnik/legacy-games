'use client';

import { Wrapper } from '@/components/wrapper';
import { Button, Card, CardFooter, Image, Link, Spacer } from '@heroui/react';

export default function App() {
  return (
    <>
      <Wrapper className="flex flex-row max-w-[800px] items-center">
        <Spacer y={8} />
        <Card
          isFooterBlurred
          className="border-none aspect-square max-w-[240px] mx-auto"
          radius="lg"
        >
          <Image
            alt="Woman listing to music"
            className="object-cover w-full h-full"
            src="https://i.imgur.com/o2sGI3F.png"
          />
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white/80">Королевская Лотерея</p>
            <Button
              as={Link}
              href={`/games/battleRoyaleGame`}
              color={'primary'}
              radius="full"
              size="sm"
            >
              Играть
            </Button>
          </CardFooter>
        </Card>
        <Spacer x={4} />

        <Card
          isFooterBlurred
          className="border-none aspect-square max-w-[240px] mx-auto"
          radius="lg"
        >
          <Image
            alt="Woman listing to music"
            className="object-cover w-full h-full"
            src="https://i.imgur.com/IWEnTUq.png"
          />
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white/80">Проект Синдикат</p>
            <Button
              as={Link}
              href={`/games/syndicateGame`}
              color={'primary'}
              radius="full"
              size="sm"
            >
              Играть
            </Button>
          </CardFooter>
        </Card>
        <Spacer x={4} />
        <Card
          isFooterBlurred
          className="border-none aspect-square max-w-[240px] mx-auto"
          radius="lg"
        >
          <Image
            alt="Woman listing to music"
            className="object-cover w-full h-full"
            src="https://i.imgur.com/0zf8jqb.png"
          />
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white/80">Взрывная Дуэль</p>
            <Button as={Link} href={`/games/minesweeper`} color={'primary'} radius="full" size="sm">
              Играть
            </Button>
          </CardFooter>
        </Card>
      </Wrapper>

      <div>
        <Card
          isFooterBlurred
          className="border-none aspect-square w-[300px] h-[170px] mx-auto"
          radius="lg"
        >
          <Image
            className="text-center"
            alt="Woman listing to music"
            src="https://storage.izvenyaisya.ru/files/e4f0a93a6ef03718124211714abd402c"
          />
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white/80">Новые игры скоро...</p>
            <Button as={Link} href={`/`} color={'primary'} radius="full" size="sm">
              На главную
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
