'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ProviderProfile() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Provider Profile</CardTitle>
          <CardDescription>
            View and edit your provider profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Profile page - Coming soon in MVP
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
