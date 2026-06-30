export const BUDGET_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  submitted: "Soumis au bureau",
  approved: "Approuvé (SG + Président + TG)",
  active: "En exécution",
  closed: "Clôturé",
};

export const BUDGET_LINE_TYPES = [
  { value: "recette", label: "Recette" },
  { value: "depense", label: "Dépense" },
] as const;

export const RECETTE_CATEGORIES = [
  { value: "cotisations_eleves", label: "Cotisations élèves" },
  { value: "cotisations_comite", label: "Cotisations comité directeur" },
  { value: "subventions", label: "Subventions" },
  { value: "dons", label: "Dons & mécénat" },
  { value: "evenements", label: "Événements / tournois" },
  { value: "autre_recette", label: "Autre recette" },
] as const;

export const DEPENSE_CATEGORIES = [
  { value: "materiel", label: "Matériel & équipement" },
  { value: "transport", label: "Transport" },
  { value: "terrain", label: "Terrain & entretien" },
  { value: "salaires", label: "Indemnités & primes" },
  { value: "administratif", label: "Frais administratifs" },
  { value: "medical", label: "Médical & assurance" },
  { value: "autre_depense", label: "Autre dépense" },
] as const;

export const RECEIPT_TYPES = [
  { value: "cotisation_eleves", label: "Cotisation élèves" },
  { value: "cotisation_comite", label: "Cotisation comité directeur" },
  { value: "subvention", label: "Subvention" },
  { value: "don", label: "Don" },
  { value: "autre", label: "Autre" },
] as const;

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  recorded: "Enregistrée",
  pending_approval: "Hors budget — en attente",
  approved: "Hors budget — approuvée",
  rejected: "Refusée",
};

export const SIGNOFF_ROLE_LABELS: Record<string, string> = {
  secretary_general: "Secrétaire général",
  president: "Président",
  treasurer: "Trésorier général (TG)",
};

export const COMMITTEE_ROLES = [
  "president",
  "board",
  "treasurer",
  "communication",
  "logistics",
  "admin",
] as const;

export function sumPlanned(lines: { line_type: string; amount_planned: number }[]) {
  let recettes = 0;
  let depenses = 0;
  for (const line of lines) {
    const amt = Number(line.amount_planned);
    if (line.line_type === "recette") recettes += amt;
    else depenses += amt;
  }
  return { recettes, depenses, solde: recettes - depenses };
}
