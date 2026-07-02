import { redirect } from "next/navigation";

export default function LegacyAdminParentsPage() {
  redirect("/dashboard/parents");
}
