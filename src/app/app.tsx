"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { config } from "~/components/providers/WagmiProvider";
import { stakingContractAddress } from "~/lib/constants";
import { abi } from "~/lib/abi";
import FarcasterLogin from "~/components/FarcasterLogin";
import Menu from "~/components/Menu";
import Leaderboard from "~/components/Leaderboard";
import Guild from "~/components/Guild";

// PoolWar precisa ser dynamic por causa do Frame SDK
const PoolWar = dynamic(() => import("~/components/PoolWar"), {
  ssr: false,
});

export default function App() {
  const [view, setView] = useState<"conquest" | "leaderboard" | "guild">("conquest");
  const { data: session, status } = useSession();
  const { address } = useAccount();
  const [hasGuild, setHasGuild] = useState<boolean>(false);

  useEffect(() => {
    const checkGuild = async () => {
      if (!address) {
        setHasGuild(false);
        return;
      }
      try {
        const currentGuild = await readContract(config, {
          address: stakingContractAddress,
          abi,
          functionName: "userGuild",
          args: [address],
        });
        const userHasGuild = !!currentGuild && currentGuild !== "";
        setHasGuild(userHasGuild);
        if (!userHasGuild) {
          setView((prev) => prev !== "guild" ? "guild" : prev);
        }
      } catch (err) {
        setHasGuild(false);
        setView((prev) => prev !== "guild" ? "guild" : prev);
      }
    };
    checkGuild();
  }, [address]);

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
      <Menu currentView={view} onSelect={setView} hasGuild={hasGuild} />

      {view === "conquest" && <PoolWar fid={session?.user?.fid || 0} />}
      {view === "leaderboard" && <Leaderboard />}
      {view === "guild" && <Guild onJoinGuild={() => setHasGuild(true)} />}
    </div>
  );
}
