"use client";

import { useEffect, useState } from "react";
import { abi } from "~/lib/abi";
import { stakingContractAddress } from "~/lib/constants";
import { readContract } from "@wagmi/core";
import { config } from "~/components/providers/WagmiProvider";

const territories = [
  { id: 0, name: "Moyaki Isles", icon: "/moyaki.png" },
  { id: 1, name: "Chogwood", icon: "/chogwood.png" },
  { id: 2, name: "Monad Keep", icon: "/monad-keep.png" },
  { id: 3, name: "Molandak Plains", icon: "/molandak.png" },
];

type LeaderboardEntry = {
  name: string;
  owner: string; // agora é o nome da guilda
  stake: number;
};

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const result = await Promise.all(
        territories.map(async ({ id, name }) => {
          try {
            const guildName = await readContract(config, {
              address: stakingContractAddress,
              abi,
              functionName: "getTerritoryOwner",
              args: [id],
            });
            
            const rawStake = await readContract(config, {
              address: stakingContractAddress,
              abi,
              functionName: "getGuildStake",
              args: [guildName as string, id],
            });

            const stake = Number(rawStake) / 1e18;
            const owner = guildName as string;

            return { name, owner, stake };
          } catch (err) {
            console.error(`Erro ao carregar dados do território ${name}:`, err);
            return {
              name,
              owner: "Erro",
              stake: 0,
            };
          }
        })
      );

      setData(result);
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 bg-zinc-900 rounded shadow-md text-white w-full max-w-sm mx-auto border border-purple-500">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">🏆 Leaderboard</h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-purple-400"></div>
        </div>
      ) : (
        <ul className="space-y-4">
          {data.map(({ name, owner, stake }) => {
            const territory = territories.find(t => t.name === name);
            return (
              <li key={name} className="bg-zinc-800 p-4 rounded">
                {territory && (
                  <img
                    src={territory.icon}
                    alt={name}
                    className="inline-block w-8 h-8 mr-2 align-middle rounded"
                  />
                )}
                <h3 className="text-lg font-semibold inline align-middle">{name}</h3>
                <p className="text-sm text-purple-300">Guild: {owner || "Unclaimed"}</p>
                <p className="text-sm text-purple-400">Total Staked: {stake} MON</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}