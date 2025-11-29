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
      <SidebarHeader className={'h-16 justify-center flex-shrink-0'}>
        <div className={'flex items-center justify-center min-h-[40px]'}>
          <span 
            className="font-bold" 
            style={{ 
              fontWeight: 700,
              fontSize: open ? '1.75rem' : '1.125rem',
              opacity: open ? 1 : 1,
              transition: 'font-size 300ms ease-in-out, opacity 200ms ease-in-out 300ms'
            }}
          >
            {open ? '{ spec64 }' : '{ }'}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
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
