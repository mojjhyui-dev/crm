import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {createClient} from "@/lib/supabase/server";
import {AppShell} from "@/components/app-shell";
import {WebhookSecretPanel} from "@/components/webhook-secret-panel";
import {Input, Select} from "@/components/ui/primitives";
import type {OrganizationRow} from "@/lib/supabase/database";
import {saveOrganizationSettings} from "../actions";

export default async function OrganizationSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string; notice?: string}>;
}) {
  const [{locale}, query, t, messages, supabase] = await Promise.all([
    params,
    searchParams,
    getTranslations("organization"),
    getTranslations("messages"),
    createClient(),
  ]);
  const [{data: {user}}, {data: memberships}] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("memberships").select("organization_id, role").limit(1),
  ]);
  if (!user) redirect(`/${locale}`);
  const membership = memberships?.[0];
  if (!membership) redirect(`/${locale}/onboarding`);
  if (membership.role === "sales") redirect(`/${locale}/dashboard`);

  const {data} = await supabase.from("organizations").select("*").eq("id", membership.organization_id).single();
  const organization = data as OrganizationRow | null;
  if (!organization) redirect(`/${locale}/dashboard`);

  return (
    <AppShell locale={locale as "ar" | "en"} organization={organization} page="settings" role={membership.role} userEmail={user.email ?? ""}>
      <div className="dashboard-content narrow-content">
          <div className="page-heading"><div><p className="eyebrow">{locale === "ar" ? "مساحة العمل" : "WORKSPACE"}</p><h1>{t("settings")}</h1></div></div>
          <section className="settings-section">
            <div className="section-heading"><div><h2>{locale === "ar" ? "الإعدادات الإقليمية" : "Regional settings"}</h2><p>{locale === "ar" ? "تُستخدم هذه القيم لتوقيت التنبيهات وعرض بيانات المبيعات." : "Used for reminder timing and sales data display."}</p></div></div>
            {query.error === "settings" && <p className="form-alert" role="alert">{messages("genericError")}</p>}
            {query.notice === "saved" && <p className="form-success" role="status">{locale === "ar" ? "تم حفظ الإعدادات." : "Settings saved."}</p>}
            <form action={saveOrganizationSettings.bind(null, organization.id, locale as "ar" | "en")} className="settings-form">
              <label htmlFor="org-name">{t("name")}</label><Input id="org-name" name="name" defaultValue={organization.name} minLength={2} maxLength={120} required />
              <div className="field-grid">
                <div className="field-stack"><label htmlFor="timezone">{t("timezone")}</label><Select id="timezone" name="timezone" defaultValue={organization.timezone}><option value="Africa/Cairo">{t("egypt")} · Africa/Cairo</option><option value="Asia/Riyadh">{t("saudi")} · Asia/Riyadh</option></Select></div>
                <div className="field-stack"><label htmlFor="currency">{t("currency")}</label><Select id="currency" name="currency" defaultValue={organization.currency}><option value="EGP">EGP · {t("egypt")}</option><option value="SAR">SAR · {t("saudi")}</option></Select></div>
              </div>
              <div className="field-grid">
                <div className="field-stack"><label htmlFor="language">{t("language")}</label><Select id="language" name="language" defaultValue={organization.language}><option value="ar">{t("arabic")}</option><option value="en">{t("english")}</option></Select></div>
                <div className="field-stack"><span className="field-label">{locale === "ar" ? "أيام العطلة الأسبوعية" : "Weekend days"}</span><div className="weekend-options">{(locale === "ar" ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((day, index) => <label className="weekend-option" key={day}><input type="checkbox" name="weekendDays" value={index} defaultChecked={organization.weekend_days.includes(index)} /><span>{day}</span></label>)}</div></div>
              </div>
              <div className="field-grid">
                <div className="field-stack"><label htmlFor="start">{locale === "ar" ? "بداية العمل" : "Working hours start"}</label><input id="start" name="start" type="time" defaultValue={organization.working_hours.start} required /></div>
                <div className="field-stack"><label htmlFor="end">{locale === "ar" ? "نهاية العمل" : "Working hours end"}</label><input id="end" name="end" type="time" defaultValue={organization.working_hours.end} required /></div>
              </div>
              <button className="primary-button settings-save" type="submit">{t("save")}</button>
            </form>
          </section>
            <WebhookSecretPanel organizationId={organization.id} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"} />
      </div>
    </AppShell>
  );
}