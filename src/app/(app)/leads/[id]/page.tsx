'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

/**
 * @fileOverview The Lead Detail view has been decommissioned in favor of 
 * the high-density table interface. Users are redirected back to the pipeline.
 */
export default function LeadDetailRedirect() {
  useEffect(() => {
    redirect('/leads');
  }, []);
  return null;
}
