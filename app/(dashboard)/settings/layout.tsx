import { SettingsTabs } from "@/components/dashboard/SettingsTabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
