'use client';

import { Wrapper } from '@/components/wrapper';
import { Card, CardBody, Progress, Spacer } from '@heroui/react';

export default function App() {
  return (
    <Wrapper className="flex-col gap-4 items-center max-w-[500px]">
      <Card>
        <CardBody>
          <p>Сыграйте 10 раз в Королевскую Лотерею</p>
          <Progress aria-label="Loading..." color="danger" value={60} />
        </CardBody>
      </Card>
      <Spacer y={2} />
      <Card>
        <CardBody>
          <p>Поучаствуйте во всех сувенирных лотереях</p>
          <Progress aria-label="Loading..." color="warning" value={40} />
        </CardBody>
      </Card>
      <Spacer y={2} />

      <Card>
        <CardBody>
          <p>Добавьте 10 друзей</p>
          <Progress aria-label="Loading..." color="success" value={40} />
        </CardBody>
      </Card>
      <Spacer y={2} />

      <Card>
        <CardBody>
          <p>Одержите победу во Взрывном Сражении</p>
          <Progress aria-label="Loading..." color="primary" value={0} />
        </CardBody>
      </Card>
      <Spacer y={2} />

      <Card>
        <CardBody>
          <p>Потратьте 10000 бонусных баллов</p>
          <Progress aria-label="Loading..." color="primary" value={50} />
        </CardBody>
      </Card>
    </Wrapper>
  );
}
