"use client";

import { useEffect, useState } from "react";
import { abi } from "~/lib/abi";
import { stakingContractAddress } from "~/lib/constants";
import { readContract } from "@wagmi/core";
import { config } from "~/components/providers/WagmiProvider";

const territories = [
  { id: 0, name: "Moyaki Isles" },
  { id: 1, name: "Chogwood" },
  { id: 2, name: "Monad Keep" },
  { id: 3, name: "Molandak Plains" },
];

type Props = {
  fid?: number;
};

type LeaderboardEntry = {
  name: string;
  owner: string;
  stake: number;
};

type WalletLink = {
  wallet: string;
  fid: number;
  username: string;
};

async function fetchWalletUser(wallet: string): Promise<WalletLink | undefined> {
  try {
    const res = await fetch(`/api/link-wallet?wallet=${encodeURIComponent(wallet)}`);
    
    if (!res.ok) {
      console.error("Server responded with error:", res.status);
      return undefined;
    }

    const data = await res.json();
    return data.data as WalletLink || undefined;
  } catch (error) {
    console.error("Error fetching wallet user:", error);
    return undefined;
  }
}

export default function Leaderboard({ fid }: Props) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const walletUserCache: Record<string, WalletLink | undefined> = {};

    const fetchData = async () => {
      const result = await Promise.all(
        territories.map(async ({ id, name }) => {
          try {
            const [rawOwner, rawStake] = await Promise.all([
              readContract(config, {
                address: stakingContractAddress,
                abi,
                functionName: "getTerritoryOwner",
                args: [id],
              }),
              readContract(config, {
                address: stakingContractAddress,
                abi,
                functionName: "getTotalStake",
                args: [id],
              }),
            ]);

            const owner = (rawOwner as string).toLowerCase();
            const stake = Number(rawStake) / 1e18;

            let linkedFid: WalletLink | undefined = undefined;
            if (owner !== "0x0000000000000000000000000000000000000000") {
              if (walletUserCache[owner] === undefined) {
                walletUserCache[owner] = await fetchWalletUser(owner);
              }
              linkedFid = walletUserCache[owner];
            }

            return {
              name,
              owner: linkedFid?.username || owner,
              stake,
            };
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
          {data.map(({ name, owner, stake }) => (
            <li key={name} className="bg-zinc-800 p-4 rounded">
              <h3 className="text-lg font-semibold">🌍 {name}</h3>
              <p className="text-sm text-purple-300">Owner: {owner === "0x0000000000000000000000000000000000000000" ? "Unclaimed" : owner}</p>
              <p className="text-sm text-purple-400">Total Staked: {stake} MON</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}