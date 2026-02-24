'use client';

import { useApp, type Theme } from '@/context/app-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Monitor, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
    const { theme, setTheme } = useApp();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your application settings.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application. Select your preferred theme.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup 
                        value={theme} 
                        onValueChange={(value) => setTheme(value as Theme)} 
                        className="grid max-w-md grid-cols-1 gap-4 pt-2 sm:grid-cols-3 sm:gap-8"
                    >
                        <div>
                            <Label className="cursor-pointer">
                                <RadioGroupItem value="light" className="sr-only" />
                                <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent [&[data-state=checked]]:border-primary">
                                    <div className="flex flex-col items-center justify-center space-y-2 rounded-sm bg-[#ecedef] p-4">
                                        <Sun className="h-6 w-6 text-slate-800" />
                                        <span className="font-medium text-slate-800">Light</span>
                                    </div>
                                </div>
                            </Label>
                        </div>
                         <div>
                            <Label className="cursor-pointer">
                                <RadioGroupItem value="dark" className="sr-only" />
                                <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent [&[data-state=checked]]:border-primary">
                                    <div className="flex flex-col items-center justify-center space-y-2 rounded-sm bg-slate-950 p-4">
                                        <Moon className="h-6 w-6 text-slate-400" />
                                        <span className="font-medium text-slate-400">Dark</span>
                                    </div>
                                </div>
                            </Label>
                        </div>
                        <div>
                            <Label className="cursor-pointer">
                                <RadioGroupItem value="system" className="sr-only" />
                                <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent [&[data-state=checked]]:border-primary">
                                    <div className="flex flex-col items-center justify-center space-y-2 rounded-sm bg-muted/40 p-4">
                                        <Monitor className="h-6 w-6 text-muted-foreground" />
                                        <span className="font-medium text-muted-foreground">System</span>
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>
        </div>
    );
}
