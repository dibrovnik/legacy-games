'use client';
import React from 'react';
import {
  Tabs,
  Tab,
  Input,
  Link,
  Button,
  Card,
  CardBody,
  Form,
  ScrollShadow,
  addToast,
} from '@heroui/react';
import { fetchApi } from '@/features/functions/api';
import { signIn, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function LoginCard({ state = 'login' }: { state?: string }) {
  const [selected, setSelected] = React.useState(state);

  const session = useSession();
  console.log(session);

  const onSubmitReg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));

    await fetchApi('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(() => {
        addToast({
          title: 'Успешная регистрация',
          description: 'Вы успешно зарегистрировались, теперь вы можете войти в свой аккаунт',
          variant: 'flat',
          color: 'success',
        });
        setSelected('login');
      })
      .catch((err) => {
        addToast({
          title: 'Ошибка регистрации',
          description: 'Ошибка регистрации, попробуйте еще раз',
          variant: 'flat',
          color: 'danger',
        });
      });
  };

  const onSubmitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));

    const res = await signIn('credentials', {
      redirect: false,
      login: data.login,
      password: data.password,
    });

    if (res && !res.error) {
      addToast({
        title: 'Успешный вход',
        description: 'Вы успешно вошли в свой аккаунт',
        variant: 'flat',
        color: 'success',
      });

      redirect('/');
    } else {
      addToast({
        title: 'Ошибка входа',
        description: 'Неверный логин или пароль, попробуйте еще раз',
        variant: 'flat',
        color: 'danger',
      });
    }
  };

  return (
    <Card className="max-w-[340px] w-full max-h-[500px] h-[500px]">
      <CardBody>
        <ScrollShadow hideScrollBar className="w-full h-full">
          <Tabs
            fullWidth
            aria-label="Вкладки формы"
            selectedKey={selected}
            size="md"
            onSelectionChange={(key) => setSelected(key as string)}
          >
            <Tab key="login" title="Вход" className="max-h-[430px] h-full">
              <Form className="flex flex-col gap-4 h-full w-full" onSubmit={onSubmitLogin}>
                <Input
                  isRequired
                  label="Логин"
                  placeholder="Введите вашу почту или телефон"
                  type="text"
                  name="login"
                />
                <Input
                  isRequired
                  label="Пароль"
                  placeholder="Введите ваш пароль"
                  type="password"
                  name="password"
                />
                <div className="flex gap-2 justify-end mt-auto w-full">
                  <Button fullWidth color="primary" type="submit">
                    Войти
                  </Button>
                </div>
                <p className="text-center text-small">
                  Нужно создать аккаунт?{' '}
                  <Link size="sm" onPress={() => setSelected('sign-up')}>
                    Зарегистрироваться
                  </Link>
                </p>
              </Form>
            </Tab>
            <Tab key="sign-up" title="Регистрация" className="h-full w-full">
              <Form className="flex flex-col gap-4 h-full" onSubmit={onSubmitReg}>
                <Input
                  isRequired
                  label="Имя"
                  placeholder="Введите ваше имя"
                  type="text"
                  name="first_name"
                />
                <Input
                  isRequired
                  label="Фамилия"
                  placeholder="Введите вашу фамилию"
                  type="text"
                  name="last_name"
                />
                <Input
                  isRequired
                  label="Электронная почта"
                  placeholder="Введите вашу почту"
                  type="email"
                  name="email"
                />
                <Input
                  label="Телефон"
                  placeholder="Введите ваш номер телефона"
                  type="phone"
                  name="phone"
                />
                <Input
                  isRequired
                  label="Пароль"
                  placeholder="Введите ваш пароль"
                  type="password"
                  name="password"
                />
                <div className="flex gap-2 justify-end mt-auto w-full">
                  <Button fullWidth color="primary" type="submit">
                    Зарегистрироваться
                  </Button>
                </div>
                <p className="text-center text-small w-full">
                  Уже есть аккаунт?{' '}
                  <Link size="sm" onPress={() => setSelected('login')}>
                    Войти
                  </Link>
                </p>
              </Form>
            </Tab>
          </Tabs>
        </ScrollShadow>
      </CardBody>
    </Card>
  );
}
