'use client';

import { Link } from '@heroui/link';
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@heroui/navbar';
import { link as linkStyles } from '@heroui/theme';
import clsx from 'clsx';
import NextLink from 'next/link';

import { ThemeSwitch } from '@/components/theme-switch';
import { siteConfig } from '@/config/site';
import { User } from '@/types/user';
import {
  Avatar,
  Badge,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
  Spacer,
} from '@heroui/react';
import { Session } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export const Navbar = () => {
  const { data: sessionData, update } = useSession();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState({ balance_rub: '0.00', balance_bonus: '0.00' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionData) {
      console.log();
      setSession(sessionData);

      if (sessionData.user) {
        setUser(sessionData?.user as User);
      }
      setIsLoading(false);
    } else {
      setSession(null);
      setUser(null);
    }
  }, [sessionData]);

  return (
    <HeroUINavbar maxWidth="full" className="wrapper" position="sticky">
      <NavbarContent justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            <Image height={50} src="https://media.tenor.com/f6yMDSj-1rwAAAAC/слоназажало.gif" />
            <p className="font-bold text-inherit">LegacyGames</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: 'foreground' }),
                  'data-[active=true]:text-primary data-[active=true]:font-medium',
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        {sessionData && (
          <NavbarItem className="hidden sm:flex gap-2">
            {sessionData?.user.balance_rub + '₽'}
            <Spacer x={1} />
            {sessionData?.user.balance_bonus + '❀'}
            <Spacer x={2} />
          </NavbarItem>
        )}
        <ThemeSwitch />
        <Spacer x={1} />
        {!isLoading ? (
          <>
            <NavbarItem>
              {user !== null ? (
                <Dropdown placement="bottom-end">
                  <Badge
                    content={
                      sessionData?.user.vip_active ? (
                        <Image
                          src="https://i.pinimg.com/474x/f3/ec/fb/f3ecfb45cf3578f3e85db3f78b7a63fc.jpg?nii=t"
                          alt="Корона"
                          width={26}
                          height={30}
                          className="rounded-full border border-white shadow-md"
                        />
                      ) : null
                    }
                    placement="top-left"
                    shape="rectangle"
                    className="bg-transparent p-0"
                    style={{ transform: 'translate(-20px, -12px)' }}
                  >
                    <DropdownTrigger>
                      <Avatar
                        showFallback
                        isBordered
                        as="button"
                        className="transition-transform"
                        name={`${user?.first_name} ${user?.last_name}`}
                        src={user?.avatar}
                      />
                    </DropdownTrigger>
                  </Badge>

                  <DropdownMenu aria-label="Profile Actions" variant="flat">
                    <DropdownItem href="/profile/edit" key="profile-item" className="h-14 gap-2">
                      <p className="font-semibold">Профиль</p>
                      <p className="font-semibold">{user?.email ?? user?.phone}</p>
                    </DropdownItem>
                    <DropdownItem onClick={() => signOut()} key="logout-item" color="danger">
                      Выйти
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              ) : (
                <NextLink
                  className={clsx(
                    linkStyles({ color: 'foreground' }),
                    'data-[active=true]:text-primary data-[active=true]:font-medium',
                  )}
                  color="foreground"
                  href="/profile/login"
                >
                  Войти
                </NextLink>
              )}
            </NavbarItem>{' '}
          </>
        ) : (
          <>
            {user !== null ? (
              <></>
            ) : (
              <NextLink
                className={clsx(
                  linkStyles({ color: 'foreground' }),
                  'data-[active=true]:text-primary data-[active=true]:font-medium',
                )}
                color="foreground"
                href="/profile/login"
              >
                Войти
              </NextLink>
            )}
          </>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarItem>
          {user ? (
            <Badge
              content={
                <Image
                  src="https://i.pinimg.com/474x/f3/ec/fb/f3ecfb45cf3578f3e85db3f78b7a63fc.jpg?nii=t"
                  alt="Корона"
                  width={24}
                  height={24}
                  className="rounded-full border border-white shadow-md"
                />
              }
              placement="top-right"
              shape="circle"
              className="z-10"
            >
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    showFallback
                    isBordered
                    as="button"
                    className="transition-transform"
                    name={`${user?.first_name} ${user?.last_name}`}
                    src={user?.avatar}
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat">
                  <DropdownItem href="/profile/edit" key="profile-item" className="h-14 gap-2">
                    <p className="font-semibold">Профиль</p>
                    <p className="font-semibold">{user?.email ?? user?.phone}</p>
                  </DropdownItem>
                  <DropdownItem key="system-item">Мб кнопка</DropdownItem>
                  <DropdownItem key="configurations-item">Не кнопка</DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      signOut();
                    }}
                    key="logout-item"
                    color="danger"
                  >
                    Выйти
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </Badge>
          ) : (
            <NextLink
              className={clsx(
                linkStyles({ color: 'foreground' }),
                'data-[active=true]:text-primary data-[active=true]:font-medium',
              )}
              color="foreground"
              href="/profile/login"
            >
              Войти
            </NextLink>
          )}
        </NavbarItem>
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {/* {searchInput} */}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={
                  index === 2
                    ? 'primary'
                    : index === siteConfig.navMenuItems.length - 1
                      ? 'danger'
                      : 'foreground'
                }
                href="#"
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
