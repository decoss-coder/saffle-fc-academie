import { InfoBanner } from "@/components/info-banner";

export function FinanceReadOnlyBanner() {
  return (
    <InfoBanner title="Consultation seule">
      Vous pouvez consulter ces informations mais seul le trésorier peut les
      modifier.
    </InfoBanner>
  );
}
