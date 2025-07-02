import { env } from '@/env';
import { auth } from '@repo/auth/server';
import { NotificationsProvider } from '@repo/notifications/components/provider';
import { secure } from '@repo/security';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Home, Search } from 'lucide-react';
import { PostHogIdentifier } from './components/posthog-identifier';
import { 
  Sidebar, 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail
} from './components/sidebar';

type AppLayoutProperties = {
  readonly children: ReactNode;
};

const AppLayout = async ({ children }: AppLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(['CATEGORY:PREVIEW']);
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return redirect('/sign-in');
  }

  return (
    <NotificationsProvider userId={session.user.id}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5 transition-[gap] duration-300 ease-in-out group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                A
              </div>
              <span className="truncate font-semibold opacity-100 transition-opacity duration-300 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden">
                Arbor
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Home">
                      <Home className="h-4 w-4" />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Search">
                      <Search className="h-4 w-4" />
                      <span>Search</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center gap-4 border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-4">
            {children}
          </main>
        </SidebarInset>
        <PostHogIdentifier />
      </SidebarProvider>
    </NotificationsProvider>
  );
};

export default AppLayout;
