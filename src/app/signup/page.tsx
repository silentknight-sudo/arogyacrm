'use client';

import Link from "next/link";

// This page has been disabled as per the new admin-only user creation flow.
export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="text-center">
            <h1 className="text-2xl font-bold">Signup Disabled</h1>
            <p className="text-muted-foreground">User creation is now managed by administrators.</p>
            <Link href="/login" className="underline mt-4 inline-block">
              Return to Login
            </Link>
        </div>
    </div>
  );
}
