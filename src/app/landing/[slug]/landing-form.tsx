'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function LandingForm({ slug, ctaText }: { slug: string; ctaText: string }) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    age: '',
    painPoint: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/campaign-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...form }),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      setSubmitted(true);
      setForm({
        fullName: '',
        phone: '',
        email: '',
        city: '',
        age: '',
        painPoint: '',
      });
    } catch {
      alert('कृपया दोबारा कोशिश करें।');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[2rem] border border-emerald-300 bg-emerald-50 p-8 text-center shadow-lg">
        <p className="text-3xl font-black text-emerald-700">धन्यवाद!</p>
        <p className="mt-3 text-lg font-medium text-emerald-900">
          आपकी जानकारी सुरक्षित रूप से दर्ज हो गई है। हमारी टीम आपसे जल्द संपर्क करेगी।
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-emerald-300 bg-white/95 p-6 shadow-2xl">
      <Input
        placeholder="पूरा नाम"
        value={form.fullName}
        onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
        required
        className="h-12 rounded-xl"
      />
      <Input
        placeholder="मोबाइल नंबर"
        value={form.phone}
        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        required
        className="h-12 rounded-xl"
      />
      <Input
        placeholder="ईमेल (वैकल्पिक)"
        value={form.email}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        className="h-12 rounded-xl"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="शहर"
          value={form.city}
          onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          className="h-12 rounded-xl"
        />
        <Input
          placeholder="उम्र"
          value={form.age}
          onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
          className="h-12 rounded-xl"
        />
      </div>
      <Textarea
        placeholder="आपको कहाँ-कहाँ दर्द है?"
        value={form.painPoint}
        onChange={(event) => setForm((current) => ({ ...current, painPoint: event.target.value }))}
        className="min-h-[110px] rounded-xl"
      />
      <Button type="submit" disabled={isSubmitting} className="h-14 w-full rounded-2xl herbal-gradient text-lg font-black">
        {isSubmitting ? 'भेजा जा रहा है...' : ctaText}
      </Button>
      <p className="text-center text-sm font-medium text-muted-foreground">
        आपकी जानकारी सीधे एडमिन CRM में सुरक्षित रूप से जाएगी।
      </p>
    </form>
  );
}
