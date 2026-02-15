import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { campaigns } from '@/lib/data';

export default function CampaignsPage() {
  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                <p className="text-muted-foreground">
                    Manage your marketing campaigns.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Campaign
                </Button>
            </div>
        </div>
        <DataTable columns={columns} data={campaigns} />
    </div>
  );
}
