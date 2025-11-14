'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ProviderSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Provider Settings</CardTitle>
          <CardDescription>
            Manage your provider account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings page - Coming soon in MVP
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
