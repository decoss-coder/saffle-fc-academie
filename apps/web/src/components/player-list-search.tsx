type PlayerListSearchProps = {
  activeTeam: string;
  defaultQuery?: string;
};

export function PlayerListSearch({
  activeTeam,
  defaultQuery = "",
}: PlayerListSearchProps) {
  return (
    <form
      method="get"
      className="flex w-full items-center gap-2 sm:w-auto sm:min-w-[240px] sm:max-w-xs"
    >
      <input type="hidden" name="groupe" value={activeTeam} />
      <label htmlFor="player-search" className="sr-only">
        Rechercher un joueur
      </label>
      <input
        id="player-search"
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder="Rechercher nom ou matricule…"
        className="w-full rounded-full border border-green-200 bg-white px-4 py-2.5 text-sm text-green-950 outline-none ring-green-600 focus:ring-2"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-green-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
      >
        OK
      </button>
    </form>
  );
}
