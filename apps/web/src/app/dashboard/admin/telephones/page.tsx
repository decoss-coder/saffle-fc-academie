import { redirect } from "next/navigation";

export default async function LegacyTelephonesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const query = params.tab ? `?tab=${params.tab}` : "";
  redirect(`/dashboard/admin/agents${query}`);
}
