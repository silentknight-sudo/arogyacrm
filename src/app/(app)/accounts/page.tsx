import { Button } from '@/components/ui/button';
import { File, PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { accounts } from '@/lib/data';

export default function AccountsPage() {
  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
                <p className="text-muted-foreground">
                    Manage your customer accounts.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline">
                    <File className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Account
                </Button>
            </div>
        </div>
        <DataTable columns={columns} data={accounts} />
    </div>
  );
}
