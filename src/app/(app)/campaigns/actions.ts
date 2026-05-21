'use server';

import { adminDb, serverTimestamp, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}

const CreateCampaignSchema = z.object({
    name: z.string().min(2, 'Campaign name must be at least 2 characters.'),
    type: z.string().min(2, 'Campaign type is required.'),
    status: z.enum(['Planned', 'Active', 'Completed', 'Paused', 'Cancelled']),
    budget: z.coerce.number().min(0, 'Budget must be a positive number.'),
    budgetInterval: z.enum(['Daily', 'Weekly']),
    ownerId: z.string().min(1, 'Owner ID is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
    description: z.string().optional(),
    landingPageEnabled: z.boolean().optional(),
    landingPageStatus: z.enum(['draft', 'live']).optional(),
    locale: z.enum(['hi', 'en']).optional(),
    templateKey: z.string().optional(),
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    ctaText: z.string().optional(),
    productName: z.string().optional(),
    currentPrice: z.coerce.number().optional(),
    originalPrice: z.coerce.number().optional(),
    benefits: z.array(z.string()).optional(),
    heroImageUrl: z.string().optional(),
    productImageUrl: z.string().optional(),
    secondaryImageUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    trustPoints: z.array(z.string()).optional(),
    testimonials: z.array(z.string()).optional(),
    formTitle: z.string().optional(),
    formSubtitle: z.string().optional(),
    formFields: z.array(z.object({
        id: z.string(),
        name: z.string(),
        label: z.string(),
        type: z.enum(['text', 'textarea', 'tel', 'email', 'number', 'select']),
        placeholder: z.string().optional(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
    })).optional(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
type CreateCampaignResult = { success: boolean; error?: string; campaignId?: string };

export async function createCampaign(values: CreateCampaignInput): Promise<CreateCampaignResult> {
    try {
        const validatedInput = CreateCampaignSchema.parse(values);

        const newCampaignRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('campaigns').doc();
        const newCampaignId = newCampaignRef.id;
        const slug = `${slugify(validatedInput.name)}-${newCampaignId.slice(0, 6)}`;
        
        const newCampaignData = {
            id: newCampaignId,
            ...validatedInput,
            budget: Number(validatedInput.budget),
            slug,
            landingPath: `/landing/${slug}`,
            landingPageEnabled: validatedInput.landingPageEnabled ?? true,
            landingPageStatus: validatedInput.landingPageEnabled === false
                ? 'draft'
                : (validatedInput.landingPageStatus || 'live'),
            locale: validatedInput.locale || 'hi',
            templateKey: validatedInput.templateKey || 'joint-pain-hi',
            headline: validatedInput.headline || 'जोड़ों के दर्द से छुटकारा पाएं!',
            subheadline: validatedInput.subheadline || '100% आयुर्वेदिक देखभाल के साथ राहत, लचीलापन और बेहतर जीवन।',
            ctaText: validatedInput.ctaText || 'अभी ऑर्डर करें',
            productName: validatedInput.productName || 'Arogya Bio Gouthealth Oil',
            currentPrice: Number(validatedInput.currentPrice ?? 1999),
            originalPrice: Number(validatedInput.originalPrice ?? 2499),
            benefits: validatedInput.benefits || [
                'जोड़ों और हड्डियों की देखभाल',
                'दर्द और सूजन में राहत',
                'लचीलापन बढ़ाने में सहायक',
                '100% आयुर्वेदिक फ़ॉर्मूला',
            ],
            heroImageUrl: validatedInput.heroImageUrl || '',
            productImageUrl: validatedInput.productImageUrl || '',
            secondaryImageUrl: validatedInput.secondaryImageUrl || '',
            primaryColor: validatedInput.primaryColor || '#184f24',
            accentColor: validatedInput.accentColor || '#f59e0b',
            trustPoints: validatedInput.trustPoints || [
                '100% आयुर्वेदिक',
                'कोई साइड इफेक्ट नहीं',
                'Cash on Delivery',
            ],
            testimonials: validatedInput.testimonials || [
                'दर्द में राहत मिली और चलना आसान हुआ।',
                'घरेलू आयुर्वेदिक समाधान जैसा भरोसा।',
                'परिवार में सभी के लिए उपयोगी अनुभव।',
            ],
            formTitle: validatedInput.formTitle || 'अभी जानकारी भरें',
            formSubtitle: validatedInput.formSubtitle || 'हमारी टीम जल्द आपसे संपर्क करेगी।',
            formFields: validatedInput.formFields || [
                { id: 'fullName', name: 'fullName', label: 'पूरा नाम', type: 'text', placeholder: 'पूरा नाम', required: true },
                { id: 'phone', name: 'phone', label: 'मोबाइल नंबर', type: 'tel', placeholder: 'मोबाइल नंबर', required: true },
                { id: 'city', name: 'city', label: 'शहर', type: 'text', placeholder: 'शहर', required: false },
                { id: 'painPoint', name: 'painPoint', label: 'आपको कहाँ-कहाँ दर्द है?', type: 'textarea', placeholder: 'अपने दर्द के बारे में लिखें', required: false },
            ],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newCampaignRef.set(newCampaignData);
        
        revalidatePath('/campaigns');

        return { success: true, campaignId: newCampaignId };

    } catch (error: any) {
        const errorMessage = handleAdminSDKError(error);
        return { success: false, error: `Failed to create campaign: ${errorMessage}` };
    }
}

const DeleteCampaignSchema = z.object({
    teamspaceId: z.string().min(1),
    campaignId: z.string().min(1),
});

export async function deleteCampaign(values: z.infer<typeof DeleteCampaignSchema>) {
    try {
        const { teamspaceId, campaignId } = DeleteCampaignSchema.parse(values);
        const campaignRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('campaigns').doc(campaignId);
        const leadsSnap = await campaignRef.collection('landingLeads').get();
        const batch = adminDb.batch();

        leadsSnap.docs.forEach((doc) => batch.delete(doc.ref));
        batch.delete(campaignRef);
        await batch.commit();

        revalidatePath('/campaigns');
        revalidatePath(`/campaigns/${campaignId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: handleAdminSDKError(error) };
    }
}

const ImportCampaignLeadSchema = z.object({
    teamspaceId: z.string().min(1),
    campaignId: z.string().min(1),
    campaignLeadId: z.string().min(1),
});

export async function importCampaignLeadToProspects(values: z.infer<typeof ImportCampaignLeadSchema>) {
    try {
        const { teamspaceId, campaignId, campaignLeadId } = ImportCampaignLeadSchema.parse(values);

        const campaignLeadRef = adminDb
            .collection('teamspaces')
            .doc(teamspaceId)
            .collection('campaigns')
            .doc(campaignId)
            .collection('landingLeads')
            .doc(campaignLeadId);

        const campaignLeadSnap = await campaignLeadRef.get();
        if (!campaignLeadSnap.exists) {
            throw new Error('Campaign lead not found.');
        }

        const campaignLead = campaignLeadSnap.data() as any;
        if (campaignLead.importedToProspects) {
            return { success: true, leadId: campaignLead.importedLeadId };
        }

        const teamspaceSnap = await adminDb.collection('teamspaces').doc(teamspaceId).get();
        if (!teamspaceSnap.exists) {
            throw new Error('Teamspace not found.');
        }

        const ownerId = teamspaceSnap.data()?.ownerId || '';
        const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc();

        await leadRef.set({
            id: leadRef.id,
            fullName: campaignLead.fullName,
            email: campaignLead.email || '',
            phone: campaignLead.phone,
            status: 'new',
            source: 'Campaign Landing',
            assignedToIds: ownerId ? [ownerId] : [],
            teamspaceId,
            reassigned: false,
            campaignId,
            campaignLeadId,
            demographicData: campaignLead.customFields || {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        await campaignLeadRef.update({
            importedToProspects: true,
            importedLeadId: leadRef.id,
            updatedAt: serverTimestamp(),
        });

        revalidatePath('/campaigns');
        revalidatePath(`/campaigns/${campaignId}`);
        revalidatePath('/leads');
        return { success: true, leadId: leadRef.id };
    } catch (error: any) {
        return { success: false, error: handleAdminSDKError(error) };
    }
}
