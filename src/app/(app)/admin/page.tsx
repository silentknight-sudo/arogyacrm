'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResetDataButton } from './reset-data-button';

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Global settings and administrative tools for your CRM.
                </p>
            </div>
            
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                    <CardDescription>
                        These are high-impact, potentially destructive actions. Proceed with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-destructive/50 p-4">
                        <div>
                            <h3 className="font-semibold">Reset All Application Data</h3>
                            <p className="text-sm text-muted-foreground">
                                This will delete all leads, deals, contacts, products, and other data. Users and teamspaces will be preserved.
                            </p>
                        </div>
                        <ResetDataButton />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
