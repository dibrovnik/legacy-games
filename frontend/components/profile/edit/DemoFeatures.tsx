'use client';
import { subtitle } from '@/components/primitives';
import { fetchApi } from '@/features/functions/api';
import { User } from '@/types/user';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { addToast, Button } from '@heroui/react';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DemoFeatures() {
  const { data: sessionData, status, update } = useSession();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [firstName, setFirstName] = useState(user?.first_name);
  const [lastName, setLastName] = useState(user?.last_name);
  const [email, setEmail] = useState(user?.email);
  const [phone, setPhone] = useState(user?.phone);
  const [balance, setBalance] = useState(user?.balance_rub);
  const [bonusBalance, setBonusBalance] = useState(user?.balance_bonus);

  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      if (sessionData.user) {
        setUser(sessionData?.user as User);
        setFirstName(sessionData?.user.first_name);
        setLastName(sessionData?.user.last_name);
        setEmail(sessionData?.user.email);
        setPhone(sessionData?.user.phone);
        setBalance(sessionData?.user.balance_rub);
        setBonusBalance(sessionData?.user.balance_bonus);
        setIsVip(sessionData?.user.vip_active);
      }
    } else {
      setSession(null);
      setUser(null);
    }
  }, [sessionData]);

  const handleSave = async () => {
    if (status !== 'authenticated' || !session) return;

    try {
      // собираем полезную нагрузку
      const payload = {
        balance_rub: balance,
        balance_bonus: bonusBalance,
      };

      // PUT запрос на бэкенд
      const updatedUser = (await fetchApi(
        '/users/me',
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        },
        session.access_token,
      )) as User; // предполагаем, что API возвращает обновлённого пользователя
      // обновляем клиентскую сессию, чтобы Navbar сразу показал новые данные
      await update!({
        ...session,
        user: updatedUser,
        expires: session.expires,
      });

      setUser(updatedUser);
      addToast({
        title: 'Данные сохранены',
        variant: 'flat',
        color: 'success',
      });
    } catch (err: any) {
      console.error(err);
    }
  };
  return (
    <>
      <Card className="p-4 w-full max-w-1/2">
        <CardHeader className={subtitle()}>Тестовые функции</CardHeader>
        <CardBody className="flex justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                className="flex-1"
                label="Основной баланс"
                labelPlacement="outside"
                placeholder="Основной баланс"
                type="text"
                value={balance}
                onValueChange={setBalance}
              />
              <Input
                className="flex-1"
                label="Бонусный баланс"
                labelPlacement="outside"
                placeholder="Бонусный баланс"
                type="text"
                value={bonusBalance}
                onValueChange={setBonusBalance}
              />
            </div>
          </div>
          <div className="w-full flex justify-between items-center">
            <p className="items-center text-gray-400 self-start"></p>
            <div className="flex gap-2 self-end">
              <Button onPress={handleSave} color="primary">
                Сохранить
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
