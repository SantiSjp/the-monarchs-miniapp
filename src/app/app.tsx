"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import FarcasterLogin from "~/components/FarcasterLogin";
import Menu from "~/components/Menu";
import Leaderboard from "~/components/Leaderboard";

// PoolWar precisa ser dynamic por causa do Frame SDK
const PoolWar = dynamic(() => import("~/components/PoolWar"), {
  ssr: false,
});

export default function App() {
  const [view, setView] = useState<"conquest" | "leaderboard">("conquest");
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-white text-center mt-10">Carregando...</div>;
  }

  if (!session?.user?.fid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <img src="/monarchs.png" alt="Logo" height={500} width={500} />
        <FarcasterLogin />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Menu currentView={view} onSelect={setView} />

      {view === "conquest" && <PoolWar fid={session?.user?.fid || 0} />}
      {view === "leaderboard" && <Leaderboard fid={session?.user?.fid || 0} />}
    </div>
  );
}
