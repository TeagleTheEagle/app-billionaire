import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth/current";
import { TemplatesForm } from "@/components/forms/SettingsForms";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesSettingsPage() {
  const { business } = await requireBusiness();
  return (
    <section className="card p-6">
      <h2 className="font-semibold">Messaging templates and tone</h2>
      <p className="mb-5 mt-1 text-sm text-slate-500">The AI follows your tone. Templates are used when AI is unavailable and as the base for confirmations.</p>
      <TemplatesForm settings={business.settings} />
    </section>
  );
}
