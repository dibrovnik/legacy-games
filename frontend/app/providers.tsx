'use client';

import type { ThemeProviderProps } from 'next-themes';

import { SessionProvider } from 'next-auth/react';
import * as React from 'react';
import { HeroUIProvider } from '@heroui/system';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ToastProvider } from '@heroui/react';

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>['push']>[1]>;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <SessionProvider>
      <HeroUIProvider locale="ru-RU" navigate={router.push}>
        <ToastProvider
          toastProps={{
            radius: 'md',
            variant: 'flat',
            timeout: 5000,
            hideIcon: true,

            classNames: {
              closeButton: 'opacity-100 absolute right-4 top-1/2 -translate-y-1/2',
            },
          }}
        />
        <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
