"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { stakingContractAddress } from "~/lib/constants";
import { abi } from "~/lib/abi";
import { writeContract, readContract } from "@wagmi/core";
import { config } from "~/components/providers/WagmiProvider";

const guilds = [
  {
    name: "House of Moyaki",
    id: "House of Moyaki",
    description: "Masters of the deep waters and swift strikes.",
    icon: "/moyaki.png",
  },
  {
    name: "House of Chog",
    id: "House of Chog",
    description: "Resilient defenders of the emerald forest.",
    icon: "/chogwood.png",
  },
  {
    name: "House of Molandak",
    id: "House of Molandak",
    description: "Strategists of the great plains and storm riders.",
    icon: "/molandak.png",
  },
];

export default function Guild({ onJoinGuild }: { onJoinGuild?: () => void }) {
  const { address } = useAccount();
  const [selected, setSelected] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const checkGuild = async () => {
      if (!address) return;
      try {
        const currentGuild = await readContract(config, {
          address: stakingContractAddress,
          abi,
          functionName: "userGuild",
          args: [address],
        });
        if (currentGuild && currentGuild !== "") {
          setSelected(currentGuild as string);
          setJoined(true);
        }
      } catch (err) {
        console.error("Error checking guild membership:", err);
      }
    };
    checkGuild();
  }, [address]);

  const handleJoin = async (guildId: string) => {
    if (!address || !walletClient) return;

    setLoading(true);
    try {
      await writeContract(config, {
        address: stakingContractAddress,
        abi,
        functionName: "joinGuild",
        args: [guildId],
        account: address,
      });
      setSelected(guildId);
      setJoined(true);
      if (onJoinGuild) onJoinGuild();
    } catch (err) {
      console.error("Failed to join guild:", err);
    } finally {
      setLoading(false);
    }
  };

  const visibleGuilds = joined && selected
    ? guilds.filter(g => g.id === selected)
    : guilds;

  return (
    <div className="p-8 max-w-xl mx-auto text-white">
      <h1 className="text-3xl font-bold text-center text-purple-300 mb-8">
        {joined ? "Your Guild" : "First, choose your Guild!"}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleGuilds.map((guild) => (
          <button
            key={guild.id}
            onClick={() => handleJoin(guild.id)}
            disabled={joined || loading}
            className={`bg-zinc-800 hover:bg-zinc-700 transition rounded p-4 border-2 ${
              selected === guild.id ? "border-purple-500" : "border-zinc-700"
            }`}
          >
            <img
              src={guild.icon}
              alt={guild.name}
              className="w-16 h-16 mb-4 mx-auto rounded"
            />
            <h2 className="text-xl font-semibold text-center mb-2">{guild.name}</h2>
            <p className="text-sm text-zinc-400 text-center">{guild.description}</p>
          </button>
        ))}
      </div>
      {joined && selected && (
        <p className="mt-6 text-center text-green-400">
          You have joined <strong>{selected}</strong>! Welcome.
        </p>
      )}
    </div>
  );
}