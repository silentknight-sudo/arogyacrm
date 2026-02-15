import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          {title} - Coming Soon
        </h3>
        <p className="text-sm text-muted-foreground">
          This module is under construction. Check back later for updates.
        </p>
      </div>
    </div>
  );
}
