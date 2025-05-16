type Props = {
    currentView: "conquest" | "leaderboard";
    onSelect: (view: "conquest" | "leaderboard") => void;
  };
  
  export default function Menu({ currentView, onSelect }: Props) {
    return (
      <nav className="flex gap-6 bg-zinc-900 px-6 py-3 rounded-xl border border-purple-800 shadow-md">
        <button
          onClick={() => onSelect("conquest")}
          className={`text-lg font-medium transition-colors ${
            currentView === "conquest"
              ? "text-purple-400 underline underline-offset-4"
              : "text-white hover:text-purple-300"
          }`}
        >
          Conquest
        </button>
  
        <button
          onClick={() => onSelect("leaderboard")}
          className={`text-lg font-medium transition-colors ${
            currentView === "leaderboard"
              ? "text-purple-400 underline underline-offset-4"
              : "text-white hover:text-purple-300"
          }`}
        >
          Leaderboard
        </button>
      </nav>
    );
  }
  