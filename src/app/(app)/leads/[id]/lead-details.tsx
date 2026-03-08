'use client';

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
  Converted: 'default',
};

export function LeadDetails({ lead }: { lead: Lead }) {
    const assignedCount = Array.isArray(lead?.assignedToIds) ? lead.assignedToIds.length : 0;

    return (
        <Card className="premium-card">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {lead?.email && (
                    <div className="flex items-center gap-3">
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${lead.email}`} className="text-primary hover:underline break-all font-medium">
                            {lead.email}
                        </a>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{lead?.phone || 'No phone provided'}</span>
                </div>
                {lead?.age && (
                    <div className="flex items-center gap-3">
                        <Cake className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.age} years old</span>
                    </div>
                )}
                 {lead?.demographicData?.industry && <div className="flex items-center gap-3">
                    <Handshake className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.demographicData.industry}</span>
                </div>}
                {lead?.demographicData?.country && <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.demographicData.country}</span>
                </div>}
                {lead?.productAsked && (
                    <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-primary">Product: {lead.productAsked}</span>
                    </div>
                )}
                 <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate font-medium">Assigned to {assignedCount} user(s)</span>
                </div>
                {lead?.source && (
                    <div className="flex items-center gap-3">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        <span>Source: {lead.source}</span>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">AI Score: {lead?.score ?? 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <CaseUpper className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={statusVariantMap[lead?.status || 'New']} className="capitalize font-bold shadow-sm">{lead?.status || 'New'}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
