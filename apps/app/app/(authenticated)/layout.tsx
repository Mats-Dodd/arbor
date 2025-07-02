import { env } from '@/env';
import { auth } from '@repo/auth/server';
import { NotificationsProvider } from '@repo/notifications/components/provider';
import { secure } from '@repo/security';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { PostHogIdentifier } from './components/posthog-identifier';
import { AppSidebar } from './components/app-sidebar';
import { 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger
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
        <AppSidebar />
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
      <Toaster />
    </NotificationsProvider>
  );
};

export default AppLayout;
