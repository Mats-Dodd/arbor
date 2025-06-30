'use client';

import { useAnalytics } from '@repo/analytics/posthog/client';
import { useSession } from '@repo/auth/client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export const PostHogIdentifier = () => {
  const { data: session } = useSession();
  const identified = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = useAnalytics();

  useEffect(() => {
    // Track pageviews
    if (pathname && analytics) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      analytics.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, analytics]);

  useEffect(() => {
    if (!session?.user || identified.current) {
      return;
    }

    analytics.identify(session.user.id, {
      email: session.user.email,
      createdAt: session.user.createdAt,
      avatar: session.user.image,
    });

    identified.current = true;
  }, [session?.user, analytics]);

  return null;
};
