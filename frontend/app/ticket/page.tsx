'use client';

import Ticket from '@/components/ticket';
import { Wrapper } from '@/components/wrapper';
import { Button } from '@heroui/button';
import { useState } from 'react';

export default function TicketPage() {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  return (
    <Wrapper className="flex justify-center">
      <div className="flex flex-col gap-8">
        <Ticket onSelectionChange={setSelectedSeats} />
        <Button color="primary" isDisabled={selectedSeats.length !== 2}>
          Купить билет
        </Button>
      </div>
    </Wrapper>
  );
}
