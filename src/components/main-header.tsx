'use client';

import Link from 'next/link';
import {
  Search,
  Building,
  Menu,
  ChevronDown,
  LogOut,
  Settings
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useApp } from '@/context/app-context';
import type { Teamspace } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MainSidebar } from './main-sidebar';

export function MainHeader() {
  const { currentUser, currentTeamspace, setCurrentTeamspace, availableTeamspaces, logout } = useApp();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] p-0">
          <MainSidebar />
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search leads, contacts, products..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-4">
        {currentTeamspace && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden md:inline">{currentTeamspace.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Switch Teamspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={currentTeamspace.id} onValueChange={(id) => setCurrentTeamspace(availableTeamspaces.find(ts => ts.id === id) as Teamspace)}>
                {availableTeamspaces.map((ts) => (
                  <DropdownMenuRadioItem key={ts.id} value={ts.id}>{ts.name}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                <AvatarFallback>{currentUser?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
                <p>{currentUser?.displayName}</p>
                <p className="text-xs text-muted-foreground font-normal">{currentUser?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
