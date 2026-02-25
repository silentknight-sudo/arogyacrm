'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';

export const FileInput = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-center rounded-lg border border-dashed border-input px-6 py-10 text-center text-sm",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <UploadCloud className="h-8 w-8" />
        <span>{children}</span>
      </div>
    </div>
  );
});

FileInput.displayName = 'FileInput';
