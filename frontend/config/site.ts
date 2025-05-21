export type SiteConfig = typeof siteConfig;

interface siteConfigType {
  name: string;
  description: string;
  navItems: {
    label: string;
    href: string;
  }[];
  navMenuItems: {
    label: string;
    href: string;
  }[];
  links: {
    docs: string;
    github: string;
  };
}

export const siteConfig: siteConfigType = {
  name: 'LegacyGames',
  description: 'Лотерея LegacyGame',
  navItems: [
    {
      label: 'Главная',
      href: '/',
    },
    {
      label: 'Игры',
      href: '/games',
    },
    {
      label: 'Достижения',
      href: '/achievements',
    },
    {
      label: 'Вип',
      href: '/vip',
    },
    {
      label: 'Сувениры',
      href: '/souvenirs',
    },
  ],
  navMenuItems: [
    {
      label: 'Главная',
      href: '/',
    },
    {
      label: 'Игры',
      href: '/games',
    },
    {
      label: 'Достижения',
      href: '/achievements',
    },
    {
      label: 'Вип',
      href: '/vip',
    },
    {
      label: 'Сувениры',
      href: '/souvenirs',
    },
  ],
  links: {
    docs: 'https://xunapu.com/docs',
    github: '',
  },
};
