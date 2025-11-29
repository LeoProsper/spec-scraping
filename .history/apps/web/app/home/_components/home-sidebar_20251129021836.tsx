'use client';

import type { JwtPayload } from '@supabase/supabase-js';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarNavigation,
  useSidebar,
} from '@kit/ui/shadcn-sidebar';
import { cn } from '@kit/ui/utils';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { navigationConfig } from '~/config/navigation.config';
import { Tables } from '~/lib/database.types';
import { ScoutSidebarContent } from './scout-sidebar-content';
import { ListsSidebarWrapper } from './lists-sidebar-wrapper';

export function HomeSidebar(props: {
  account?: Tables<'accounts'>;
  user: JwtPayload;
}) {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible={'icon'}>
      <SidebarContent className="overflow-hidden">
        <div className={cn('flex items-center flex-shrink-0', {
          'justify-center h-8': !open,
          'px-2 h-12': open,
        })}>
          <span 
            className="font-bold" 
            style={{ 
              fontWeight: 700,
              fontSize: '1rem',
              transition: 'opacity 200ms ease-in-out 300ms'
            }}
          >
            {open ? '{ spec64 }' : '{ }'}
          </span>
        </div>

        <SidebarNavigation config={navigationConfig} />
        
        {/* Scout: Chat AI + Histórico de Buscas */}
        <ScoutSidebarContent />

        {/* Listas: Gestão de Listas Comerciais */}
        <ListsSidebarWrapper />
      </SidebarContent>

      <SidebarFooter>
        <ProfileAccountDropdownContainer
          user={props.user}
          account={props.account}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
