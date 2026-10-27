import { redirect } from "next/navigation";
export default function DashboardBillingRedirect() {
  redirect("/settings/billing");
}
