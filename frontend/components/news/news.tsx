'use client';

import { Spacer } from '@heroui/react';
import NewsCard from './newsCard';

const News = () => {
  return (
    <>
      Лента новостей
      <div className="flex-col gap-4 items-center">
        <NewsCard
          owner="LegacyGames"
          ownermail="info@legacygames.ru"
          ownerPicture={
            'https://avatars.mds.yandex.net/i?id=53d37dd19ab4320f449da117cf257187_l-5374508-images-thumbs&n=13'
          }
          title="Королевская Лотерея"
          text="Выигрывает только самый удачливый"
          gameId="1"
          coverLink="https://avatars.mds.yandex.net/i?id=344c49cf05b56eb89c6a7ae7aa228bc8_l-9283819-images-thumbs&n=13"
          buttonText="Играть"
        />
        <Spacer y={4} />
      </div>
    </>
  );
};

export default News;
