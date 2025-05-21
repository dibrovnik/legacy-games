'use client';

import { NewsType } from '@/types/mainpage';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Image,
  Link,
  Spacer,
} from '@heroui/react';

const NewsCard = ({
  owner,
  ownermail,
  ownerPicture,
  title,
  text,
  gameId,
  coverLink,
  buttonText,
}: NewsType) => {
  return (
    <Card className="min-w-[400px] w-[600px]">
      <CardHeader className="flex gap-3">
        <Image alt="news logo" height={40} radius="sm" src={ownerPicture} width={40} />
        <div className="flex flex-col">
          <p className="text-md">{owner}</p>
          <p className="text-small text-default-500">{ownermail}</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <Image
          alt={'/images/fruit-8.jpeg'}
          className="w-full object-cover h-[260px]"
          radius="lg"
          shadow="sm"
          src={coverLink}
          width="100%"
        />
        <Spacer y={4} />
        <h4 className="90 font-medium text-xl">{title}</h4>
        <p className="text-tiny 60">{text}</p>
        <Spacer y={2} />
      </CardBody>
      <Divider />
      <CardFooter>
        <div className="flex flex-grow gap-2 items-center">
          <div className="flex flex-col">
            <p className="text-tiny 60">Игра каждые 15 минут</p>
          </div>
        </div>
        <Spacer x={4} />
        <Button as={Link} href={`/games/`} color={'primary'} radius="full" size="sm">
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewsCard;
