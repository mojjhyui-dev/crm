import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {AppShell} from "@/components/app-shell";
import {Input, Select} from "@/components/ui/primitives";
import type {OrganizationRow} from "@/lib/supabase/database";
import {createLead} from "../../actions";

export default async function NewLeadPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const supabase = await createClient();
  const [{data: {user}}, {data: memberships}] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("memberships").select("organization_id, role").limit(1),
  ]);
  if (!user) redirect(`/${locale}`);
  const membership = memberships?.[0];
  if (!membership) redirect(`/${locale}/onboarding`);
  const {data} = await supabase.from("organizations").select("*").eq("id", membership.organization_id).single();
  const organization = data as OrganizationRow | null;
  if (!organization) redirect(`/${locale}/onboarding`);

  return (
    <AppShell locale={locale as "ar" | "en"} organization={organization} page="new-lead" role={membership.role} userEmail={user.email ?? ""}>
      <div className="dashboard-content narrow-content">
          <div className="page-heading"><div><p className="eyebrow">{locale === "ar" ? "توزيع تلقائي ومتابعة فورية" : "AUTO-ASSIGNED · FOLLOW-UP REQUIRED"}</p><h1>{locale === "ar" ? "عميل محتمل جديد" : "New lead"}</h1></div></div>
          <p className="form-intro lead-intro">{locale === "ar" ? "سيُعيّن العميل تلقائيًا إلى مسؤول المبيعات الأقل انشغالًا، مع إنشاء مهمة متابعة خلال ساعة." : "The lead is assigned to the least-loaded salesperson, with a follow-up task due in one hour."}</p>
          <form action={createLead.bind(null, membership.organization_id, locale as "ar" | "en")} className="settings-form lead-form">
            <label htmlFor="full-name">{locale === "ar" ? "اسم العميل" : "Lead name"}</label>
            <Input id="full-name" name="fullName" autoComplete="name" minLength={2} maxLength={160} required />
            <div className="field-grid">
              <div className="field-stack"><label htmlFor="phone">{locale === "ar" ? "رقم الهاتف" : "Phone"}</label><Input id="phone" name="phone" type="tel" autoComplete="tel" dir="ltr" required /></div>
              <div className="field-stack"><label htmlFor="email">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</label><Input id="email" name="email" type="email" autoComplete="email" dir="ltr" /></div>
            </div>
            <div className="field-grid">
              <div className="field-stack"><label htmlFor="source">{locale === "ar" ? "مصدر العميل" : "Lead source"}</label><Select id="source" name="source" defaultValue=""><option value="">{locale === "ar" ? "اختر المصدر" : "Select a source"}</option><option value="website">{locale === "ar" ? "الموقع الإلكتروني" : "Website"}</option><option value="referral">{locale === "ar" ? "إحالة" : "Referral"}</option><option value="campaign">{locale === "ar" ? "حملة تسويقية" : "Campaign"}</option><option value="walk-in">{locale === "ar" ? "زيارة مباشرة" : "Walk-in"}</option></Select></div>
              <div className="field-stack"><label htmlFor="property-interest">{locale === "ar" ? "المنطقة أو المشروع" : "Area or property"}</label><Input id="property-interest" name="propertyInterest" maxLength={160} /></div>
            </div>
            <div className="form-actions"><Link className="secondary-button" href={`/${locale}/dashboard`}>{locale === "ar" ? "إلغاء" : "Cancel"}</Link><button className="primary-button" type="submit">{locale === "ar" ? "إضافة وجدولة المتابعة" : "Add and schedule follow-up"}</button></div>
          </form>
      </div>
    </AppShell>
  );
}