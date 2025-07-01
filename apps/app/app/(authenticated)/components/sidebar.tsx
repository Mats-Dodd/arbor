'use client';

import { useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@repo/design-system/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/design-system/components/ui/tooltip';
import { cn } from '@repo/design-system/lib/utils';
import { NotificationsTrigger } from '@repo/notifications/components/trigger';
import {
  CalendarFold,
  Layers,
  FolderOpen,
  Scroll,
  SendIcon,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import NoteTree from './note-tree';

type GlobalSidebarProperties = {
  readonly children: ReactNode;
};

const data = {
  navMain: [
    {
      title: 'Notes',
      url: '#',
      icon: Scroll,
      id: 'notes',
    },
    {
      title: 'Logbook',
      url: '#',
      icon: CalendarFold,
      id: 'logbook',
    },
    {
      title: 'Pile',
      url: '#',
      icon: Layers,
      id: 'pile',
    },
  ],
  navSecondary: [
    {
      title: 'Open Collection',
      url: '#',
      icon: FolderOpen,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: SendIcon,
    },
  ],
};

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const sidebar = useSidebar();
  const [selectedView, setSelectedView] = useState('notes');

  return (
    <>
      <Sidebar variant="inset">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-1 p-2">
            {data.navMain.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedView === item.id ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedView(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </SidebarHeader>
 
        <SidebarContent className="px-0">
          {selectedView === 'notes' && (
            <div className="h-full overflow-auto">
              <NoteTree />
            </div>
          )}
          {selectedView === 'logbook' && (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">Logbook view coming soon</p>
            </div>
          )}
          {selectedView === 'pile' && (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">Pile view coming soon</p>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-1">
              {data.navSecondary.map((item) => (
                <Tooltip key={item.title}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href="#">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Settings
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <div className="h-4 w-4">
                  <NotificationsTrigger />
                </div>
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
};
