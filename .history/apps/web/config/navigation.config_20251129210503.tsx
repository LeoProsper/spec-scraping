import { Home, Target, MessageSquare, List, LayoutGrid, TrendingUp } from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: '',
    children: [
      {
        label: 'common:routes.home',
        path: pathsConfig.app.home,
        Icon: <Home className={iconClasses} />,
        end: true,
      },
      {
        label: 'CRM Master',
        path: '/home/crm',
        Icon: <LayoutGrid className={iconClasses} />,
      },
      {
        label: 'Chat AI',
        path: '/home/scout/chat',
        Icon: <MessageSquare className={iconClasses} />,
      },
      {
        label: 'Buscador de Oportunidades',
        path: '/home/opportunities',
        Icon: <TrendingUp className={iconClasses} />,
      },
      {
        label: 'Listas',
        path: '/home/lists',
        Icon: <List className={iconClasses} />,
      },
    ],
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const navigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
});
