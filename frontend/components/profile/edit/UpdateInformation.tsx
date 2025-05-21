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

export default function UpdateInformationPage() {
  const { data: sessionData, status, update } = useSession();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [firstName, setFirstName] = useState(user?.first_name);
  const [lastName, setLastName] = useState(user?.last_name);
  const [email, setEmail] = useState(user?.email);
  const [phone, setPhone] = useState(user?.phone);

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      if (sessionData.user) {
        setUser(sessionData?.user as User);
        setFirstName(sessionData?.user.first_name);
        setLastName(sessionData?.user.last_name);
        setEmail(sessionData?.user.email);
        setPhone(sessionData?.user.phone);
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
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
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
        <CardHeader className={subtitle()}> Мои данные</CardHeader>
        <CardBody className="flex justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                className="flex-1"
                label="Имя"
                labelPlacement="outside"
                placeholder="Ваше имя"
                type="text"
                value={firstName}
                onValueChange={setFirstName}
              />
              <Input
                className="flex-1"
                label="Фамилия"
                labelPlacement="outside"
                placeholder="Ваша фамилия"
                type="text"
                value={lastName}
                onValueChange={setLastName}
              />
            </div>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                label="Email"
                labelPlacement="outside"
                placeholder="you@example.com"
                type="email"
                value={email} // ← обязательно
                onValueChange={setEmail} // ← обязательно
              />

              <Input
                className="flex-1"
                label="Телефон"
                labelPlacement="outside"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                maxLength={12}
                value={phone}
                onValueChange={(value) => setPhone(value.replace(/[^\d+]/g, '').slice(0, 12))}
              />
            </div>
          </div>

          <div className="w-full flex justify-between items-center">
            <p className="items-center text-gray-400 self-start"> id: {user?.id}</p>
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
