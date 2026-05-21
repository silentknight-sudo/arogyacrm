'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CampaignFormField } from '@/types';

type LandingFormProps = {
  slug: string;
  ctaText: string;
  campaignId?: string;
  teamspaceId?: string;
  previewMode?: boolean;
  formTitle?: string;
  formSubtitle?: string;
  formFields?: CampaignFormField[];
  primaryColor?: string;
};

export function LandingForm({
  slug,
  ctaText,
  campaignId,
  teamspaceId,
  previewMode = false,
  formTitle,
  formSubtitle,
  formFields = [],
  primaryColor = '#184f24',
}: LandingFormProps) {
  const initialState = useMemo(
    () => formFields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {}),
    [formFields]
  );
  const [form, setForm] = useState<Record<string, string>>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (previewMode) {
      alert('यह केवल प्रीव्यू पेज है। लाइव लीड कैप्चर के लिए CRM से असली कैंपेन लिंक बनाइए।');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/campaign-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          campaignId,
          teamspaceId,
          fullName: form.fullName || '',
          phone: form.phone || '',
          email: form.email || '',
          city: form.city || '',
          age: form.age || '',
          painPoint: form.painPoint || '',
          customFields: form,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Submission failed');
      }

      setSubmitted(true);
      setForm(initialState);
    } catch (error: any) {
      alert(error?.message || 'कृपया दोबारा कोशिश करें।');
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

  const renderField = (field: CampaignFormField) => {
    if (field.type === 'textarea') {
      return (
        <Textarea
          placeholder={field.placeholder || field.label}
          value={form[field.name] || ''}
          onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
          required={field.required}
          className="min-h-[110px] rounded-xl"
        />
      );
    }

    if (field.type === 'select') {
      return (
        <Select
          value={form[field.name] || ''}
          onValueChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
        >
          <SelectTrigger className="h-12 rounded-xl">
            <SelectValue placeholder={field.placeholder || field.label} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={field.type}
        placeholder={field.placeholder || field.label}
        value={form[field.name] || ''}
        onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
        required={field.required}
        className="h-12 rounded-xl"
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-emerald-300 bg-white/95 p-6 shadow-2xl">
      <div className="space-y-1">
        <p className="text-2xl font-black" style={{ color: primaryColor }}>{formTitle || 'अभी जानकारी भरें'}</p>
        <p className="text-sm font-medium text-muted-foreground">
          {formSubtitle || 'हमारी टीम जल्द आपसे संपर्क करेगी।'}
        </p>
      </div>
      {formFields.map((field) => (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-black text-slate-700">
            {field.label}{field.required ? ' *' : ''}
          </label>
          {renderField(field)}
        </div>
      ))}
      <Button type="submit" disabled={isSubmitting} className="h-14 w-full rounded-2xl text-lg font-black text-white" style={{ backgroundColor: primaryColor }}>
        {isSubmitting ? 'भेजा जा रहा है...' : ctaText}
      </Button>
      <p className="text-center text-sm font-medium text-muted-foreground">
        {previewMode
          ? 'यह केवल प्रीव्यू है। लाइव कैंपेन बनने पर जानकारी सीधे एडमिन CRM में जाएगी।'
          : 'आपकी जानकारी सीधे एडमिन CRM में सुरक्षित रूप से जाएगी।'}
      </p>
    </form>
  );
}
