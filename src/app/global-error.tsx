'use client';

import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  console.error('GLOBAL_APP_ERROR:', error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-[2rem] border border-primary/10 bg-card p-10 text-center shadow-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-primary">Application error</h1>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              A critical rendering error occurred. Please refresh the page.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
