'use client';

import Link from 'next/link';
import {
  Search,
  Building,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { useApp } from '@/context/app-context';
import type { Teamspace } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MainSidebar } from './main-sidebar';
import { Skeleton } from './ui/skeleton';

export function MainHeader() {
  const { currentUser, currentTeamspace, setCurrentTeamspace, availableTeamspaces, logout, isUserLoading, areTeamspacesLoading } = useApp();

  return (
    <header className="glass-header h-16 flex items-center gap-4 px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden">
            <Menu className="h-5 w-5 text-primary" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 border-none">
          <SheetHeader>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
          </SheetHeader>
          <MainSidebar className="flex h-full w-full" />
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <div className="relative group max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            placeholder="Search prospect or deal..."
            className="w-full bg-muted/40 border-none rounded-2xl pl-10 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {areTeamspacesLoading ? <Skeleton className="h-10 w-32 rounded-xl" /> : currentTeamspace && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden md:flex items-center gap-2 rounded-xl border-white/10 shadow-sm bg-card/50">
                <Building className="h-4 w-4 text-primary" />
                <span className="font-semibold">{currentTeamspace.name}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel className="text-xs uppercase tracking-widest opacity-50">Switch Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={currentTeamspace.id} onValueChange={(id) => setCurrentTeamspace(availableTeamspaces.find(ts => ts.id === id) as Teamspace)}>
                {availableTeamspaces.map((ts) => (
                  <DropdownMenuRadioItem key={ts.id} value={ts.id} className="rounded-lg">{ts.name}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-primary/10 hover:ring-primary/30 transition-all">
              {isUserLoading ? <Skeleton className="h-10 w-10 rounded-full" /> : (
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{currentUser?.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
            <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-foreground leading-none">{currentUser?.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
             <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2.5">
              <Link href="/profile">
                <User className="mr-3 h-4 w-4 text-primary" />
                <span className="font-semibold">My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2.5">
              <Link href="/settings">
                <Settings className="mr-3 h-4 w-4 text-primary" />
                <span className="font-semibold">Preferences</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="rounded-xl cursor-pointer py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-semibold">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}