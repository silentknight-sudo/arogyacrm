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
  File,
  Share2,
  FileText,
  Mail,
  Globe,
} from 'lucide-react';
import { CreateLeadDialog } from './create-lead-dialog';

const leadSources = [
  {
    title: 'Add Manually',
    description: 'Enter lead details one by one.',
    icon: <PlusCircle className="h-6 w-6" />,
    action: 'dialog',
    disabled: false,
  },
  {
    title: 'Import from file',
    description: 'Upload a CSV or Excel file.',
    icon: <File className="h-6 w-6" />,
    action: 'button',
    disabled: false,
  },
  {
    title: 'From your Inbox',
    description: 'Forward emails to add leads.',
    icon: <Mail className="h-6 w-6" />,
    action: 'button',
    disabled: true,
  },
  {
    title: 'Social Media',
    description: 'Connect your social accounts.',
    icon: <Share2 className="h-6 w-6" />,
    action: 'button',
    disabled: true,
  },
  {
    title: 'Website Visitors',
    description: 'Track visitors and convert them.',
    icon: <Globe className="h-6 w-6" />,
    action: 'button',
    disabled: true,
  },
  {
    title: 'Webform',
    description: 'Embed a form on your site.',
    icon: <FileText className="h-6 w-6" />,
    action: 'button',
    disabled: true,
  },
];

const syncSources = [
    {
        title: 'Google Ads Sync',
        description: 'Sync leads from Google Ads.',
        icon: <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.62-4.38 1.62-3.8 0-6.89-3.1-6.89-7s3.09-7 6.89-7c2.08 0 3.47.8 4.3 1.65l2.58-2.58C18.44 1.56 15.7.48 12.48.48c-6.18 0-11.22 5.04-11.22 11.22s5.04 11.22 11.22 11.22c5.64 0 10.2-3.9 10.2-10.32 0-.76-.07-1.47-.18-2.18h-10z"/></svg>,
        disabled: true,
      },
      {
        title: 'Facebook Ads Sync',
        description: 'Sync leads from Facebook Ads.',
        icon: <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current"><title>Facebook</title><path d="M22.675 0h-21.35C.59 0 0 .59 0 1.325v21.35C0 23.41.59 24 1.325 24H12.82v-9.29h-3.128v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h5.713c.735 0 1.325-.59 1.325-1.325V1.325C24 .59 23.41 0 22.225 0z"/></svg>,
        disabled: true,
      },
      {
        title: 'LinkedIn Ads Sync',
        description: 'Sync leads from LinkedIn Ads.',
        icon: <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-current"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>,
        disabled: true,
      },
]

export function AddLeadOptions() {
  return (
    <>
      <Card>
          <CardHeader>
              <CardTitle>How do you bring in Leads?</CardTitle>
              <CardDescription>
                  There are lots of ways to identify prospective customers for your product or service.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leadSources.map((source) => (
                  <Card key={source.title} className="flex flex-col">
                      <CardHeader className="flex flex-row items-center gap-4">
                          <div className="text-primary bg-primary/10 p-3 rounded-full">
                            {source.icon}
                          </div>
                          <CardTitle className="text-base font-semibold">{source.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">{source.description}</p>
                      </CardContent>
                      <CardFooter>
                          {source.action === 'dialog' ? (
                              <CreateLeadDialog>
                                  <Button className="w-full">
                                      <PlusCircle className="mr-2 h-4 w-4" />
                                      Add Lead
                                  </Button>
                              </CreateLeadDialog>
                          ) : (
                              <Button className="w-full" variant="outline" disabled={source.disabled}>
                                  {source.icon}
                                  {source.title}
                              </Button>
                          )}
                      </CardFooter>
                  </Card>
                  ))}
              </div>
          </CardContent>
      </Card>
      <Card className="mt-6">
          <CardHeader>
              <CardTitle>Automated Sync</CardTitle>
              <CardDescription>
                  Connect your advertising platforms to automatically sync new leads.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {syncSources.map((source) => (
                  <Card key={source.title} className="flex flex-col">
                      <CardHeader className="flex flex-row items-center gap-4">
                          <div className="text-muted-foreground p-3 rounded-full bg-muted">
                            {source.icon}
                          </div>
                           <CardTitle className="text-base font-semibold">{source.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">{source.description}</p>
                      </CardContent>
                      <CardFooter>
                          <Button className="w-full" variant="outline" disabled={source.disabled}>
                              Configure Sync
                          </Button>
                      </CardFooter>
                  </Card>
              ))}
              </div>
          </CardContent>
      </Card>
    </>
  );
}
