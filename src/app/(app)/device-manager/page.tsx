'use client';

import { useMemo, useState, useTransition } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { Eye, Loader2, MonitorSmartphone, ShieldCheck, ShieldOff, Search } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/types';
import { getProfessionalEmployeeId, getRoleLabel } from '@/lib/user-labels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updateMemberAccess } from './actions';

export default function DeviceManagerPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pendingUserId, setPendingUserId] = useState('');
  const [selectedDeviceUser, setSelectedDeviceUser] = useState<UserProfile | null>(null);
  const [isPending, startTransition] = useTransition();

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser) return null;
    if (currentUser.role === 'admin') return query(collection(firestore, 'users'));
    if (currentUser.role === 'sales_team_lead') {
      return query(
        collection(firestore, 'users'),
        where('createdBy', '==', currentUser.id),
        where('role', '==', 'sales_executive')
      );
    }
    if (!currentTeamspace?.id) return null;
    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (users || []).filter((user) => {
      const matchesSearch = !term || [user.displayName, user.email, user.phone, getProfessionalEmployeeId(user)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const approvedCount = (users || []).filter((user) => user.accessStatus !== 'blocked').length;
  const blockedCount = (users || []).filter((user) => user.accessStatus === 'blocked').length;

  const deviceStats = [
    { label: 'Total Devices', value: users?.length || 0, icon: MonitorSmartphone, tone: 'bg-primary/10 text-primary' },
    { label: 'Approved', value: approvedCount, icon: ShieldCheck, tone: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Blocked', value: blockedCount, icon: ShieldOff, tone: 'bg-orange-500/10 text-orange-600' },
  ];

  const handleAccessChange = (targetUser: UserProfile, accessStatus: 'approved' | 'blocked') => {
    if (!currentUser) return;
    setPendingUserId(targetUser.id);
    startTransition(async () => {
      const result = await updateMemberAccess({
        targetUserId: targetUser.id,
        adminId: currentUser.id,
        accessStatus,
      });

      if (result.success) {
        toast({
          title: accessStatus === 'blocked' ? 'Member Blocked' : 'Member Approved',
          description: accessStatus === 'blocked'
            ? `${targetUser.displayName} cannot login until approved.`
            : `${targetUser.displayName} can login again.`,
        });
      } else {
        toast({ variant: 'destructive', title: 'Access Update Failed', description: result.error });
      }
      setPendingUserId('');
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <Dialog open={Boolean(selectedDeviceUser)} onOpenChange={(open) => !open && setSelectedDeviceUser(null)}>
        <DialogContent className="rounded-[2rem] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary">Device Login Details</DialogTitle>
            <DialogDescription>
              Device access and login status for {selectedDeviceUser?.displayName || 'this employee'}.
            </DialogDescription>
          </DialogHeader>
          {selectedDeviceUser && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border bg-muted/20 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Employee</p>
                <p className="mt-2 text-lg font-black text-primary">{selectedDeviceUser.displayName}</p>
                <p className="text-sm font-semibold text-muted-foreground">{selectedDeviceUser.email}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Access Status</p>
                <div className="mt-3">
                  {selectedDeviceUser.accessStatus === 'blocked' ? (
                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Blocked</Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Approved</Badge>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border bg-background p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Role</p>
                <p className="mt-2 font-black text-primary">{getRoleLabel(selectedDeviceUser.role)}</p>
              </div>
              <div className="rounded-2xl border bg-background p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Employee ID</p>
                <p className="mt-2 font-mono text-sm font-black text-primary">{getProfessionalEmployeeId(selectedDeviceUser)}</p>
              </div>
              <div className="rounded-2xl border bg-background p-5 md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Login History</p>
                <p className="mt-3 text-sm font-semibold text-muted-foreground">
                  Detailed login device, location, login time, and logout time history has not been recorded for this account yet. Access approval/blocking is active from this manager.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-primary">Device Manager</h1>
        <p className="text-muted-foreground font-medium">Monitor and manage employee device access.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {deviceStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-[2rem] border-primary/10 shadow-sm">
              <CardContent className="flex items-center gap-5 p-6">
                <div className={`rounded-2xl p-4 ${stat.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-black text-primary">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-[2rem] border-primary/10">
        <CardHeader className="gap-4">
          <CardTitle className="text-2xl font-black">Employee Device Access</CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[280px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, contact, employee id, or email" className="h-12 rounded-2xl pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="sales_team_lead">Team Lead</SelectItem>
                <SelectItem value="sales_executive">Telecaller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-black">#</th>
                  <th className="px-4 py-3 text-left font-black">Employee</th>
                  <th className="px-4 py-3 text-left font-black">Role</th>
                  <th className="px-4 py-3 text-left font-black">Contact</th>
                  <th className="px-4 py-3 text-left font-black">Employee ID</th>
                  <th className="px-4 py-3 text-left font-black">Status</th>
                  <th className="px-4 py-3 text-left font-black">View Device</th>
                  <th className="px-4 py-3 text-left font-black">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>Loading devices...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>No employees found.</td></tr>
                ) : filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3 font-bold">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-black text-primary">{user.displayName}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3"><Badge>{getRoleLabel(user.role)}</Badge></td>
                    <td className="px-4 py-3 font-semibold">{user.phone || 'not provided'}</td>
                    <td className="px-4 py-3 font-mono text-xs font-black">{getProfessionalEmployeeId(user)}</td>
                    <td className="px-4 py-3">
                      {user.accessStatus === 'blocked' ? (
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Blocked</Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Approved</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setSelectedDeviceUser(user)}
                      >
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        View Device
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      {user.accessStatus === 'blocked' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-emerald-200 text-emerald-700"
                          disabled={isPending && pendingUserId === user.id}
                          onClick={() => handleAccessChange(user, 'approved')}
                        >
                          {isPending && pendingUserId === user.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                          Approve
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-orange-200 text-orange-700"
                          disabled={(isPending && pendingUserId === user.id) || currentUser?.id === user.id}
                          onClick={() => handleAccessChange(user, 'blocked')}
                        >
                          {isPending && pendingUserId === user.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                          Block
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
