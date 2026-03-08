import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types";
import { AtSign, Globe, Star, Flag, CaseUpper, Handshake, Phone, Cake, Package, Users } from 'lucide-react';

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Qualified: 'default',
  New: 'outline',
  Contacted: 'secondary',
  Lost: 'destructive',
  Unqualified: 'destructive',
};

export function LeadDetails({ lead }: { lead: Lead }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {lead.email && (
                    <div className="flex items-center gap-3">
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${lead.email}`} className="text-primary hover:underline break-all">
                            {lead.email}
                        </a>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.phone}</span>
                </div>
                {lead.age && (
                    <div className="flex items-center gap-3">
                        <Cake className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.age} years old</span>
                    </div>
                )}
                 {lead.demographicData?.industry && <div className="flex items-center gap-3">
                    <Handshake className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.demographicData.industry}</span>
                </div>}
                {lead.demographicData?.country && <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.demographicData.country}</span>
                </div>}
                {lead.productAsked && (
                    <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>Product Asked: {lead.productAsked}</span>
                    </div>
                )}
                 <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">Assigned to {lead.assignedToIds?.length || 0} user(s)</span>
                </div>
                {lead.source && (
                    <div className="flex items-center gap-3">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        <span>Source: {lead.source}</span>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span>AI Score: {lead.score ?? 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <CaseUpper className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                        <span>Status:</span>
                        <Badge variant={statusVariantMap[lead.status] || 'secondary'} className="capitalize">{lead.status}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
