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
  primaryColor: '#184f24',
  accentColor: '#f59e0b',
  benefits: [
    'जोड़ों और हड्डियों की देखभाल',
    'दर्द और सूजन में राहत',
    'लचीलापन बढ़ाने में सहायक',
    '100% आयुर्वेदिक फ़ॉर्मूला',
  ],
  trustPoints: ['100% आयुर्वेदिक', 'कोई साइड इफेक्ट नहीं', 'Cash on Delivery'],
  testimonials: [
    'दर्द में राहत मिली और चलना आसान हुआ।',
    'घरेलू आयुर्वेदिक समाधान जैसा भरोसा।',
    'परिवार में सभी के लिए उपयोगी अनुभव।',
  ],
  formTitle: 'अभी जानकारी भरें',
  formSubtitle: 'हमारी टीम जल्द आपसे संपर्क करेगी।',
  formFields: [
    { id: 'fullName', name: 'fullName', label: 'पूरा नाम', type: 'text', placeholder: 'पूरा नाम', required: true },
    { id: 'phone', name: 'phone', label: 'मोबाइल नंबर', type: 'tel', placeholder: 'मोबाइल नंबर', required: true },
    { id: 'city', name: 'city', label: 'शहर', type: 'text', placeholder: 'शहर', required: false },
    { id: 'painPoint', name: 'painPoint', label: 'आपको कहाँ-कहाँ दर्द है?', type: 'textarea', placeholder: 'अपने दर्द के बारे में लिखें', required: false },
  ],
};

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  let campaign: any = null;
  let previewMode = false;
  let campaignId = '';
  let teamspaceId = '';

  if (slug === 'your-slug') {
    campaign = previewCampaign;
    previewMode = true;
  } else {
    try {
      const campaignSnap = await adminDb.collectionGroup('campaigns').where('slug', '==', slug).limit(1).get();
      if (!campaignSnap.empty) {
        campaignId = campaignSnap.docs[0].id;
        campaign = campaignSnap.docs[0].data() as any;
        teamspaceId = campaign.teamspaceId || '';
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
    <main
      className="min-h-screen text-[#173d1f]"
      style={{
        background: `linear-gradient(135deg, ${campaign.primaryColor || '#184f24'}14 0%, #fffaf1 45%, ${campaign.accentColor || '#f59e0b'}12 100%)`,
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {previewMode && slug === 'your-slug' && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900 shadow-sm">
            यह एक प्रीव्यू पेज है। लाइव लीड कैप्चर के लिए CRM से असली कैंपेन लिंक बनाइए।
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="rounded-[2.5rem] border border-emerald-200 bg-white/80 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: campaign.primaryColor || '#184f24' }}>Arogya Bio</p>
                <h1 className="mt-3 text-5xl font-black leading-tight lg:text-7xl" style={{ color: campaign.primaryColor || '#184f24' }}>
                  {campaign.headline || 'जोड़ों के दर्द से छुटकारा पाएं!'}
                </h1>
                <p className="mt-4 max-w-2xl text-xl font-medium text-[#36543e]">
                  {campaign.subheadline || 'प्राकृतिक राहत, सुरक्षित उपचार और बेहतर जीवन के लिए आयुर्वेदिक समाधान।'}
                </p>
              </div>
              <Badge className="rounded-full px-4 py-2 text-base font-black text-white" style={{ backgroundColor: campaign.accentColor || '#f59e0b' }}>
                20% OFF
              </Badge>
            </div>

            {(campaign.heroImageUrl || campaign.productImageUrl) && (
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                {[campaign.heroImageUrl, campaign.productImageUrl].filter(Boolean).map((image: string) => (
                  <div key={image} className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-xl">
                    <img src={image} alt={campaign.productName || 'Campaign image'} className="h-[320px] w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] p-6 text-white shadow-xl" style={{ backgroundColor: campaign.primaryColor || '#1d5a2b' }}>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">विशेष ऑफर</p>
                <div className="mt-4 flex items-end gap-4">
                  <p className="text-2xl font-black line-through text-white/50">₹{campaign.originalPrice || 2499}</p>
                  <p className="text-5xl font-black">₹{campaign.currentPrice || 1999}</p>
                </div>
                <p className="mt-4 text-lg font-medium">{campaign.productName || '100% आयुर्वेदिक हर्बल फ़ॉर्मूला'}</p>
              </div>
              <div className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-xl">
                <p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: campaign.primaryColor || '#184f24' }}>मुख्य फायदे</p>
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
              {(campaign.trustPoints || [
                'कंधे, कमर, घुटने और टखनों के दर्द में सहायक',
                'तेज अवशोषण और सुरक्षित उपयोग',
                'पुरुष और महिला दोनों के लिए उपयोगी',
              ]).map((item: string) => (
                <div key={item} className="rounded-2xl border border-emerald-200 bg-white/80 p-4 text-base font-bold shadow-sm">
                  {item}
                </div>
              ))}
            </div>

            {!!campaign.testimonials?.length && (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {campaign.testimonials.map((item: string) => (
                  <div key={item} className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: campaign.primaryColor || '#184f24' }}>Trusted Review</p>
                    <p className="mt-3 text-base font-semibold text-slate-700">“{item}”</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sticky top-6 space-y-6">
            <LandingForm
              slug={slug}
              ctaText={campaign.ctaText || 'अभी ऑर्डर करें'}
              campaignId={campaignId}
              teamspaceId={teamspaceId}
              previewMode={previewMode}
              formTitle={campaign.formTitle}
              formSubtitle={campaign.formSubtitle}
              formFields={campaign.formFields || previewCampaign.formFields}
              primaryColor={campaign.primaryColor}
            />
            <div className="rounded-[2rem] border border-emerald-200 bg-white/90 p-6 shadow-xl">
              <p className="text-lg font-black" style={{ color: campaign.primaryColor || '#184f24' }}>कैश ऑन डिलीवरी उपलब्ध</p>
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
