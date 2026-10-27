import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth/current";
import { NotificationsForm } from "@/components/forms/SettingsForms";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsSettingsPage() {
  const { business } = await requireBusiness();
  return (
    <section className="card p-6">
      <h2 className="font-semibold">Notifications and automation</h2>
      <p className="mb-5 mt-1 text-sm text-slate-500">Choose what we tell you about and what runs on its own.</p>
      <NotificationsForm settings={business.settings} />
    </section>
  );
}
