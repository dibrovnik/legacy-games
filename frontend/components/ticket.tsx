'use client';

import { Card, CardBody, CardHeader } from '@heroui/card';
import { Image } from '@heroui/react';
import NextImage from 'next/image';
import { useEffect, useState } from 'react';

interface TicketProps {
  onSelectionChange?: (selected: number[]) => void;
}

export default function Ticket({ onSelectionChange }: TicketProps) {
  const seats = Array.from({ length: 24 }, () => '10');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const toggleSeat = (idx: number) => {
    if (selectedSeats.includes(idx)) {
      setSelectedSeats((prev) => prev.filter((i) => i !== idx));
    } else if (selectedSeats.length < 2) {
      setSelectedSeats((prev) => [...prev, idx]);
    }
  };

  useEffect(() => {
    onSelectionChange?.(selectedSeats);
  }, [selectedSeats, onSelectionChange]);
  return (
    <Card className="bg-[#F7F3F3] p-2 max-w-fit">
      <CardHeader className="flex flex-col items-start gap-2 text-black">
        <p className=" text-gray-500 text-[18px]">Серия 00211212</p>
        <p className="text-[24px]">Смоленск</p>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="flex items-center gap-8 flex-grow">
          <div className="grid grid-cols-8 gap-2">
            {seats.map((num, idx) => {
              const isSelected = selectedSeats.includes(idx);
              const isDisabled = selectedSeats.length >= 2 && !isSelected;

              return (
                <label key={idx} className="flex items-stretch justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggleSeat(idx)}
                    className="hidden"
                  />

                  <span
                    className={`
                      flex items-center justify-center
                      rounded-full px-4 py-2 text-[16px]
											select-none
                      ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}
                      ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {num}
                  </span>
                </label>
              );
            })}
          </div>
          <div>
            <Image
              removeWrapper
              src="https://s3-alpha-sig.figma.com/img/656c/efe7/f3949ca5cfe32ee0b2a0a139e54b35bc?Expires=1748822400&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=bY3fRM8aPz-H-2F4pjZC9IHA8UCUbA8T4N5QJrdzyUloPxYzgrvNhoCfPE~5H9ZKNPUwxDx~3qW0A5YziQDBarvp8e~SMRj7s4aLf5mycCV2Sno8kLh52ToetUtJ4VzoBCJgamuWwvJxZjrTmBkYUdaDgFRV~fq38aHMI2WImpbY5SiMMMjGRsTw5akt--orNgEde6efloBfHFQyxkjTwNUWW8MT3XP7ZG5aRS~oEMcRExmuwyYEotpEHVQzCzmTQBzCUwdQA93-CcrmcMX84iy8dHKQN9~xMQEC5otpy32eI38ynZnIxEu8lq~VXaTiNVrNu7v~2sO5GXw0D-N7LA__"
              as={NextImage}
              alt="Смоленский собор"
              width={136}
              height={136}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
