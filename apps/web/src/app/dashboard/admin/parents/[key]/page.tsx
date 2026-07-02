import { redirect } from "next/navigation";

export default async function LegacyAdminParentDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  redirect(`/dashboard/parents/${key}`);
}
