'use client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
} from 'lucide-react';
import { CreateLeadDialog } from './create-lead-dialog';

export function AddLeadOptions() {
  return (
    <>
      <Card>
          <CardHeader>
              <CardTitle>How do you bring in Leads?</CardTitle>
              <CardDescription>
                  Manually add a new lead to get started. Other import options are coming soon.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card key='add-manually' className="flex flex-col">
                      <CardHeader className="flex flex-row items-center gap-4">
                          <div className="text-primary bg-primary/10 p-3 rounded-full">
                            <PlusCircle className="h-6 w-6" />
                          </div>
                          <CardTitle className="text-base font-semibold">Add Manually</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Enter lead details one by one.</p>
                      </CardContent>
                      <CardFooter>
                          <CreateLeadDialog>
                              <Button className="w-full">
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Add Lead
                              </Button>
                          </CreateLeadDialog>
                      </CardFooter>
                  </Card>
              </div>
          </CardContent>
      </Card>
    </>
  );
}
