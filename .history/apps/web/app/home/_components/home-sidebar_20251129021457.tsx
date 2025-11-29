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
      <SidebarHeader className="flex items-center h-12 flex-shrink-0 p-0">
        <div className={cn('w-full flex items-center', {
          'justify-center': !open,
          'px-2': open,
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
      </SidebarHeader>

      <SidebarContent className="overflow-hidden gap-0 pt-2">
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
