'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, Sparkles } from 'lucide-react';
import type { Lead } from '@/types';
import { generateLeadSummary } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export function AiSummary({ lead }: { lead: Lead }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary(null);
    const response = await generateLeadSummary(lead);
    if (response.success && response.data) {
      setSummary(response.data.summary);
    } else {
      toast({
        variant: "destructive",
        title: "AI Summary Failed",
        description: response.error,
      });
    }
    setIsLoading(false);
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary"/>
                AI Interaction Summary
            </CardTitle>
            <CardDescription>
                Get a quick summary of this lead's history.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            )}
            {summary && !isLoading && (
                 <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg border">
                    {summary}
                </div>
            )}
            {!summary && !isLoading && (
                 <div className="text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg border">
                    Click the button below to generate an AI summary.
                </div>
            )}
            <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full mt-4">
                <Sparkles className="mr-2"/>
                {isLoading ? 'Generating...' : 'Generate Summary'}
            </Button>
        </CardContent>
    </Card>
  );
}
