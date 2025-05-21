'use client';

import { subtitle } from '@/components/primitives';
import { fetchApi } from '@/features/functions/api';
import { User } from '@/types/user';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { addToast, Avatar, Button, Form } from '@heroui/react';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import React, { useEffect, useRef, useState } from 'react';

export default function EditProfileForm() {
  const { data: sessionData, status, update } = useSession();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      if (sessionData.user) {
        setUser(sessionData?.user as User);
        setPreview(user?.avatar || null);
      }
    } else {
      setSession(null);
      setUser(null);
      setPreview(null);
    }
  }, [sessionData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл-изображение.');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!file || !session) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchApi(
      '/users/me/avatar',
      { method: 'POST', body: formData },
      session.access_token,
    );
    setPreview(res?.avatar);
    setUser(res);
    addToast({
      title: 'Данные сохранены',
      variant: 'flat',
      color: 'success',
    });

    update!({
      ...session,
      user: res as User,
      expires: session.expires,
    });
    clearSelection();
  };
  return (
    <>
      <Card className="p-4 w-full max-w-1/2">
        <CardHeader>
          <h2 className={subtitle()}>Выберите аватар</h2>
        </CardHeader>
        <CardBody className="flex flex-col justify-between">
          <Form className="">
            <div className="flex flex-col items-center gap-4">
              <Avatar
                src={preview == null ? user?.avatar : preview}
                alt="Превью аватара"
                className="h-60 w-60 aspect-square text-4xl"
                name={`${user?.first_name} ${user?.last_name}`}
              />

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              {!file && (
                <Button color="primary" onPress={() => fileInputRef.current?.click()}>
                  Изменить фотографию
                </Button>
              )}
              {file && (
                <div className="flex gap-2">
                  <Button variant="light" onPress={clearSelection} disabled={!file}>
                    Отменить
                  </Button>

                  <Button onPress={handleSave} color="primary" disabled={!file}>
                    Сохранить
                  </Button>
                </div>
              )}
            </div>
          </Form>
        </CardBody>
      </Card>
    </>
  );
}
