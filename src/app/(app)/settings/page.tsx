'use client';

import { useApp, type Theme } from '@/context/app-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Monitor, Moon, Sun } from 'lucide-react';

const themeTiles = [
  { name: 'Default Arogya Bio Theme', value: 'light', gradient: 'from-[#1f3b2f] via-[#45624f] to-[#d3b66b]' },
  { name: 'Sunset', value: 'light', gradient: 'from-[#f8b195] via-[#f67280] to-[#6c5b7b]' },
  { name: 'Midnight', value: 'dark', gradient: 'from-[#101827] via-[#1f2a44] to-[#536976]' },
  { name: 'Rose', value: 'light', gradient: 'from-[#ff9a9e] via-[#fad0c4] to-[#fbc2eb]' },
  { name: 'Forest', value: 'light', gradient: 'from-[#134e5e] via-[#71b280] to-[#a8e063]' },
  { name: 'Jshine', value: 'system', gradient: 'from-[#12c2e9] via-[#c471ed] to-[#f64f59]' },
  { name: 'Ocean', value: 'light', gradient: 'from-[#2193b0] via-[#6dd5ed] to-[#b2fefa]' },
  { name: 'Midnight City', value: 'dark', gradient: 'from-[#232526] via-[#414345] to-[#0f2027]' },
] as const;

export default function SettingsPage() {
    const { theme, setTheme } = useApp();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-primary">Theme Settings</h1>
                <p className="text-muted-foreground font-medium">Choose the dashboard theme color.</p>
            </div>
            <Card className="rounded-[2rem] border-primary/10">
                <CardHeader>
                    <CardTitle className="text-2xl font-black">Choose Theme Color</CardTitle>
                    <CardDescription>Reference CRM themes mapped to your available light, dark, and system appearance modes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup 
                        value={theme} 
                        onValueChange={(value) => setTheme(value as Theme)} 
                        className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-2 xl:grid-cols-4"
                    >
                        {themeTiles.map((tile) => {
                            const Icon = tile.value === 'dark' ? Moon : tile.value === 'system' ? Monitor : Sun;
                            const selected = theme === tile.value;
                            return (
                                <Label key={tile.name} className="cursor-pointer">
                                    <RadioGroupItem value={tile.value} className="sr-only" />
                                    <div className={`relative flex h-40 items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${tile.gradient} p-5 text-white shadow-lg transition-all hover:scale-[1.02] ${selected ? 'ring-4 ring-primary ring-offset-2' : ''}`}>
                                        <div className="absolute inset-0 bg-black/10" />
                                        {selected && (
                                            <div className="absolute right-4 top-4 rounded-full bg-white/20 p-2 backdrop-blur">
                                                <Check className="h-4 w-4" />
                                            </div>
                                        )}
                                        <div className="relative text-center">
                                            <Icon className="mx-auto mb-3 h-7 w-7" />
                                            <p className="text-xl font-black">{tile.name}</p>
                                        </div>
                                    </div>
                                </Label>
                            );
                        })}
                    </RadioGroup>
                </CardContent>
            </Card>
        </div>
    );
}
