export function resolveClubTab(
  tab: string | undefined,
  allowed: string[],
  defaultTab: string,
) {
  if (tab && allowed.includes(tab)) return tab;
  return defaultTab;
}
