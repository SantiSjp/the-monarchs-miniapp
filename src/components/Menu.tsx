type Props = {
    currentView: "conquest" | "leaderboard" | "guild";
    onSelect: (view: "conquest" | "leaderboard" | "guild") => void;
    hasGuild: boolean;
  };
  
  export default function Menu({ currentView, onSelect, hasGuild }: Props) {
    return (
      <nav className="flex gap-6 bg-zinc-900 px-6 py-3 rounded-xl border border-purple-800 shadow-md">
        <button
          onClick={() => hasGuild && onSelect("conquest")}
          disabled={!hasGuild}
          title={!hasGuild ? "Entre em uma guilda para acessar" : undefined}
          className={`text-lg font-medium transition-colors ${
            currentView === "conquest"
              ? "text-purple-400 underline underline-offset-4"
              : !hasGuild
                ? "text-zinc-500 cursor-not-allowed"
                : "text-white hover:text-purple-300"
          }`}
        >
          Conquest
        </button>
  
        <button
          onClick={() => hasGuild && onSelect("leaderboard")}
          disabled={!hasGuild}
          title={!hasGuild ? "Entre em uma guilda para acessar" : undefined}
          className={`text-lg font-medium transition-colors ${
            currentView === "leaderboard"
              ? "text-purple-400 underline underline-offset-4"
              : !hasGuild
                ? "text-zinc-500 cursor-not-allowed"
                : "text-white hover:text-purple-300"
          }`}
        >
          Leaderboard
        </button>

        <button
          onClick={() => onSelect("guild")}
          className={`text-lg font-medium transition-colors ${
            currentView === "guild"
              ? "text-purple-400 underline underline-offset-4"
              : "text-white hover:text-purple-300"
          }`}
        >
          Guild
        </button>
      </nav>
    );
  }
  