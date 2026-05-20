import { adminDb } from '@/firebase/admin';
import { Badge } from '@/components/ui/badge';
import { LandingForm } from './landing-form';

export const dynamic = 'force-dynamic';

const previewCampaign = {
  headline: 'जोड़ों के दर्द से छुटकारा पाएं!',
  subheadline: '100% आयुर्वेदिक गाउटहेल्थ ऑयल के साथ राहत, लचीलापन और बेहतर जीवन।',
  ctaText: 'अभी ऑर्डर करें',
  originalPrice: 2499,
  currentPrice: 1999,
  benefits: [
    'जोड़ों और हड्डियों की देखभाल',
    'दर्द और सूजन में राहत',
    'लचीलापन बढ़ाने में सहायक',
    '100% आयुर्वेदिक फ़ॉर्मूला',
  ],
};

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  let campaign: any = null;
  let previewMode = false;

  if (slug === 'your-slug') {
    campaign = previewCampaign;
    previewMode = true;
  } else {
    try {
      const campaignSnap = await adminDb.collectionGroup('campaigns').where('slug', '==', slug).limit(1).get();
      if (!campaignSnap.empty) {
        campaign = campaignSnap.docs[0].data() as any;
      }
    } catch (error) {
      previewMode = true;
      campaign = previewCampaign;
    }
  }

  if (!campaign) {
    previewMode = true;
    campaign = previewCampaign;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f6fbe9_0%,#fff7ea_50%,#eef7e7_100%)] text-[#173d1f]">
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {previewMode && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900 shadow-sm">
            This is a landing page preview. Create a campaign from the CRM to generate a real landing slug and live lead capture.
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="rounded-[2.5rem] border border-emerald-200 bg-white/70 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-700">Arogya Bio</p>
                <h1 className="mt-3 text-5xl font-black leading-tight text-[#184f24] lg:text-7xl">
                  {campaign.headline || 'जोड़ों के दर्द से छुटकारा पाएं!'}
                </h1>
                <p className="mt-4 max-w-2xl text-xl font-medium text-[#36543e]">
                  {campaign.subheadline || 'प्राकृतिक राहत, सुरक्षित उपचार और बेहतर जीवन के लिए आयुर्वेदिक समाधान।'}
                </p>
              </div>
              <Badge className="rounded-full bg-red-500 px-4 py-2 text-base font-black text-white">
                20% OFF
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] bg-[#1d5a2b] p-6 text-white shadow-xl">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">विशेष ऑफर</p>
                <div className="mt-4 flex items-end gap-4">
                  <p className="text-2xl font-black line-through text-white/50">₹{campaign.originalPrice || 2499}</p>
                  <p className="text-5xl font-black">₹{campaign.currentPrice || 1999}</p>
                </div>
                <p className="mt-4 text-lg font-medium">100% आयुर्वेदिक हर्बल फ़ॉर्मूला</p>
              </div>
              <div className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-xl">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">मुख्य फायदे</p>
                <ul className="mt-4 space-y-3 text-lg font-semibold">
                  {(campaign.benefits || []).map((benefit: string) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                'कंधे, कमर, घुटने और टखनों के दर्द में सहायक',
                'तेज अवशोषण और सुरक्षित उपयोग',
                'पुरुष और महिला दोनों के लिए उपयोगी',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-emerald-200 bg-white/80 p-4 text-base font-bold shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="sticky top-6 space-y-6">
            <LandingForm slug={slug} ctaText={campaign.ctaText || 'अभी ऑर्डर करें'} />
            <div className="rounded-[2rem] border border-emerald-200 bg-white/90 p-6 shadow-xl">
              <p className="text-lg font-black text-[#184f24]">कैश ऑन डिलीवरी उपलब्ध</p>
              <p className="mt-3 text-base font-medium text-[#36543e]">
                फ़ॉर्म भरते ही आपकी जानकारी हमारी एडमिन टीम के CRM में जाएगी और जल्दी संपर्क किया जाएगा।
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
