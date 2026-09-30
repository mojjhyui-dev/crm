import Link from "next/link";
import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {CalendarDays, Check, CircleAlert, Clock3, Plus, UserRound} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {completeTask} from "../actions";
import {AppShell} from "@/components/app-shell";
import {LeadImportDialog} from "@/components/lead-import-dialog";
import {RealtimeRefresh} from "@/components/realtime-refresh";
import {Badge, EmptyState, Table} from "@/components/ui/primitives";
import type {LeadRow, NotificationRow, OrganizationRow, TaskRow} from "@/lib/supabase/database";

function zonedDayStart(date: Date, timeZone: string) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => dateParts.find((value) => value.type === type)?.value ?? "0";
  const target = Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day")));
  let instant = target;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const localParts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(instant));
    const value = (type: string) => Number(localParts.find((item) => item.type === type)?.value ?? 0);
    const localAsUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
    instant = target - (localAsUtc - instant);
  }

  return new Date(instant);
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{notice?: string}>;
}) {
  const [{locale}, query, t, supabase] = await Promise.all([
    params,
    searchParams,
    getTranslations("dashboard"),
    createClient(),
  ]);
  const [{data: {user}}, {data: memberships}] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("memberships").select("organization_id, role").limit(1),
  ]);
  if (!user) redirect(`/${locale}`);
  const membership = memberships?.[0];
  if (!membership) redirect(`/${locale}/onboarding`);

  const {data: organization} = await supabase.from("organizations").select("*").eq("id", membership.organization_id).single();
  const org = organization as OrganizationRow | null;
  if (!org) redirect(`/${locale}/onboarding`);

  const todayStart = zonedDayStart(new Date(), org.timezone);
  const tomorrowStart = zonedDayStart(new Date(todayStart.getTime() + 36 * 60 * 60 * 1000), org.timezone);
  const [
    {data: leadRows},
    {data: taskRows},
    {count: openLeads},
    {count: todayTasks},
    {count: overdueTasks},
    {count: doneTasks},
    {data: notificationRows},
  ] = await Promise.all([
    supabase.from("leads").select("*").eq("organization_id", membership.organization_id).order("created_at", {ascending: false}).limit(8),
    supabase.from("tasks").select("*").eq("organization_id", membership.organization_id).order("due_at", {ascending: true}).limit(8),
    supabase.from("leads").select("id", {count: "exact", head: true}).eq("organization_id", membership.organization_id).neq("status", "won").neq("status", "lost"),
    supabase.from("tasks").select("id", {count: "exact", head: true}).eq("organization_id", membership.organization_id).is("completed_at", null).gte("due_at", todayStart.toISOString()).lt("due_at", tomorrowStart.toISOString()),
    supabase.from("tasks").select("id", {count: "exact", head: true}).eq("organization_id", membership.organization_id).is("completed_at", null).lt("due_at", new Date().toISOString()),
    supabase.from("tasks").select("id", {count: "exact", head: true}).eq("organization_id", membership.organization_id).not("completed_at", "is", null),
    supabase.from("notifications").select("*").eq("organization_id", membership.organization_id).eq("recipient_id", user.id).is("read_at", null).order("created_at", {ascending: false}).limit(5),
  ]);

  const leads = (leadRows ?? []) as LeadRow[];
  const tasks = (taskRows ?? []) as TaskRow[];
  const notifications = (notificationRows ?? []) as NotificationRow[];
  const now = new Date().getTime();
  const numberFormat = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US");
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: org.timezone});
  const statusText = (status: LeadRow["status"]) => t(status);
  return (
    <AppShell
      leadCount={openLeads ?? 0}
      locale={locale as "ar" | "en"}
      notifications={notifications}
      organization={org}
      page="overview"
      role={membership.role}
      todayTaskCount={todayTasks ?? 0}
      userEmail={user.email ?? ""}
    >
      <RealtimeRefresh organizationId={org.id} />
      <div className="dashboard-content">
          <div className="page-heading">
            <div><p className="eyebrow">{new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {weekday: "long", day: "numeric", month: "long", timeZone: org.timezone}).format(new Date())}</p><h1>{t("overview")}</h1></div>
            <div className="page-heading-actions">
              {(membership.role === "owner" || membership.role === "manager") && <LeadImportDialog locale={locale as "ar" | "en"} organizationId={org.id} />}
              <Link className="primary-button compact-button" href={`/${locale}/dashboard/new-lead`}><Plus size={17} />{locale === "ar" ? "إضافة عميل" : "Add lead"}</Link>
            </div>
          </div>

          {query.notice === "duplicate" && <p className="form-alert" role="status">{t("duplicateLead")}</p>}
          {query.notice === "created" && <p className="form-success" role="status">{t("leadCreated")}</p>}

          <div className="metrics-grid">
            <article className="metric-block"><div className="metric-label"><span>{t("openLeads")}</span><UserRound size={17} /></div><strong className="metric-value">{numberFormat.format(openLeads ?? 0)}</strong><span className="metric-footnote">{locale === "ar" ? "ضمن نطاق رؤيتك" : "In your current view"}</span></article>
            <article className="metric-block"><div className="metric-label"><span>{t("dueToday")}</span><CalendarDays size={17} /></div><strong className="metric-value">{numberFormat.format(todayTasks ?? 0)}</strong><span className="metric-footnote">{locale === "ar" ? "حسب توقيت المؤسسة" : "In organization time"}</span></article>
            <article className="metric-block metric-alert"><div className="metric-label"><span>{t("overdue")}</span><CircleAlert size={17} /></div><strong className="metric-value">{numberFormat.format(overdueTasks ?? 0)}</strong><span className="metric-footnote">{locale === "ar" ? "تحتاج انتباهًا" : "Need attention"}</span></article>
            <article className="metric-block"><div className="metric-label"><span>{t("completed")}</span><Check size={17} /></div><strong className="metric-value">{numberFormat.format(doneTasks ?? 0)}</strong><span className="metric-footnote">{locale === "ar" ? "كل المتابعات المكتملة" : "All completed follow-ups"}</span></article>
          </div>

          <section className="data-section" id="leads">
            <div className="section-heading"><div><h2>{t("recentLeads")}</h2><p>{locale === "ar" ? "آخر العملاء الذين وصلوا إلى فريقك" : "The latest leads routed to your team"}</p></div><Link className="text-link" href={`/${locale}/dashboard/new-lead`}>{locale === "ar" ? "إضافة عميل" : "Add lead"}<Plus size={15} /></Link></div>
            <Table className="data-table"><thead><tr><th>{locale === "ar" ? "العميل" : "Lead"}</th><th>{locale === "ar" ? "الاهتمام" : "Interest"}</th><th>{t("assignee")}</th><th>{t("status")}</th><th>{locale === "ar" ? "تاريخ الإضافة" : "Added"}</th></tr></thead><tbody>
              {leads.map((lead) => <tr key={lead.id}><td><strong>{lead.full_name}</strong><span className="table-secondary" dir="ltr">{lead.phone}</span></td><td>{lead.property_interest || "—"}</td><td>{lead.assigned_to === user.id ? (locale === "ar" ? "أنت" : "You") : (locale === "ar" ? "عضو الفريق" : "Team member")}</td><td><Badge className={`status-${lead.status}`} tone={lead.status === "new" || lead.status === "contacted" || lead.status === "won" ? "brand" : "neutral"}>{statusText(lead.status)}</Badge></td><td>{dateFormat.format(new Date(lead.created_at))}</td></tr>)}
              {leads.length === 0 && <tr><td className="data-empty-cell" colSpan={5}><EmptyState action={<Link className="primary-button compact-button" href={`/${locale}/dashboard/new-lead`}><Plus aria-hidden="true" size={16} />{t("addFirstLead")}</Link>} compact description={t("emptyLeadsDescription")} icon={UserRound} title={t("emptyLeadsTitle")} /></td></tr>}
            </tbody></Table>
          </section>

          <div className="lower-grid">
            <section className="data-section task-section" id="tasks">
              <div className="section-heading"><div><h2>{t("tasks")}</h2><p>{locale === "ar" ? "المواعيد القادمة والتصعيدات" : "Upcoming follow-ups and escalations"}</p></div><span className="section-total">{numberFormat.format(tasks.length)}</span></div>
              <div className="task-list">
                {tasks.map((task) => {
                  const overdue = !task.completed_at && new Date(task.due_at).getTime() < now;
                  return <article className="task-row" key={task.id}><span className={`task-status ${task.completed_at ? "task-done" : overdue ? "task-late" : ""}`}>{task.completed_at ? <Check size={14} /> : overdue ? <CircleAlert size={14} /> : <Clock3 size={14} />}</span><div className="task-copy"><strong>{locale === "ar" ? task.title_ar : task.title}</strong><span>{dateFormat.format(new Date(task.due_at))}{task.escalated_at ? ` · ${locale === "ar" ? "تم التصعيد" : "Escalated"}` : ""}</span></div>{!task.completed_at && <form action={completeTask.bind(null, org.id, task.id, locale as "ar" | "en")}><button className="task-complete" type="submit" aria-label={locale === "ar" ? "إكمال المتابعة" : "Complete follow-up"}><Check size={16} /></button></form>}</article>;
                })}
                {tasks.length === 0 && <EmptyState compact description={t("emptyTasksDescription")} icon={CalendarDays} title={t("emptyTasksTitle")} />}
              </div>
            </section>

            <section className="data-section pipeline-section" id="pipeline">
              <div className="section-heading"><div><h2>{t("pipeline")}</h2><p>{locale === "ar" ? "توزيع العملاء حسب المرحلة" : "Leads by current stage"}</p></div></div>
              <div className="pipeline-list">
                {(["new", "contacted", "qualified", "won", "lost"] as const).map((status) => {
                  const count = leads.filter((lead) => lead.status === status).length;
                  const width = leads.length ? Math.max(count / leads.length * 100, count ? 8 : 0) : 0;
                  return <div className="pipeline-row" key={status}><div className="pipeline-label"><span>{t(status)}</span><strong>{numberFormat.format(count)}</strong></div><div className="pipeline-track"><span className={`pipeline-fill fill-${status}`} style={{width: `${width}%`}} /></div></div>;
                })}
              </div>
              <div className="pipeline-footnote"><span>{locale === "ar" ? "العملة" : "Currency"}</span><strong>{org.currency}</strong><span>{locale === "ar" ? "أيام العطلة" : "Weekend"}</span><strong>{org.weekend_days.map((day) => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {weekday: "short"}).format(new Date(Date.UTC(2024, 0, 7 + day)))).join("، ")}</strong></div>
            </section>
          </div>
        </div>
    </AppShell>
  );
}