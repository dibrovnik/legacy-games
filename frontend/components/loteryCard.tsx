'use client';

import { fetchApi } from '@/features/functions/api';
import { User } from '@/types/user';
import { addToast, Button, Card, CardBody, Progress } from '@heroui/react';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const MAX_SELECT = 6;
const TOTAL_NUMBERS = 36;

const LotteryCard = ({ syndicate, userId }: { syndicate: any; userId: string }) => {
  const [selected, setSelected] = useState<number[]>([]);
  const { data: sessionData, status, update } = useSession();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      if (sessionData.user) {
        setUser(sessionData?.user);
      }
    } else {
      setUser(null);
      setSession(null);
    }
  }, [sessionData]);

  const toggleNumber = (num: number) => {
    if (selected.includes(num)) {
      setSelected(selected.filter((n) => n !== num));
    } else if (selected.length < MAX_SELECT) {
      setSelected([...selected, num]);
    }
  };

  const handleBuyTickets = async () => {
    if (syndicate && userId && selected) {
      const selections = [selected];

      if (selections.length === 0) {
        addToast({
          title: 'Ошибка',
          description:
            'Неверный выбор билетов. Пожалуйста, введите номера типа "1,2,3,4,5" или "1,2,3,4,5;6,7,8,9,10". Номера должны быть от 1 до 36, ровно 5 на каждый билет.',
          variant: 'flat',
          color: 'danger',
        });
        return;
      }

      await fetchApi(
        `/syndicates/${syndicate.id}/tickets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selections: selections,
          }),
        },
        session?.access_token,
      )
        .then((res) => {
          addToast({
            title: 'Билеты куплены',
            variant: 'flat',
            color: 'success',
          });
        })
        .catch((error) => {
          addToast({
            title: 'Ошибка при покупке билетов',

            variant: 'flat',
            color: 'danger',
          });
        });
    }
  };

  const selectRandom = () => {
    const all = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const shuffled = all.sort(() => 0.5 - Math.random());
    setSelected(shuffled.slice(0, MAX_SELECT));
  };

  return (
    <>
      <div className="flex flex-col gap-4 items-center">
        <Card
          className="w-300"
          style={{
            width: 500,
            backgroundImage: "url('https://images.unsplash.com/photo-1547721064-da6cfb341d50')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/60 z-0" /> {/* затемнение */}
          <div className="relative z-10 p-4">
            <CardBody>
              <div className="mb-4">
                <Progress value={(selected.length / MAX_SELECT) * 100} color="primary" />
                <p className="text-sm mt-1">
                  Выбрано: {selected.length} из {MAX_SELECT}
                </p>
              </div>

              <Button
                color="primary"
                variant="solid"
                size="sm"
                onClick={selectRandom}
                className="mb-4"
              >
                Случайные числа
              </Button>

              <div className={`grid grid-cols-6 gap-1 text-center text-sm`}>
                {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => toggleNumber(num)}
                    className={`rounded py-1 ${
                      selected.includes(num)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </CardBody>
          </div>
        </Card>
        <Button
          color="primary"
          variant="solid"
          size="sm"
          onPress={() => handleBuyTickets()}
          className="mb-4"
        >
          Оплатить билет {`300$`}
        </Button>
      </div>
    </>
  );
};

export default LotteryCard;
