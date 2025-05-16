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

export default function Leaderboard({ fid }: Props) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  const fetchWalletLinks = async (): Promise<Record<string, number>> => {
    try {
      const res = await fetch("/api/link-wallet");
      const links = await res.json();
      return Object.fromEntries(links.map((l: any) => [l.wallet.toLowerCase(), l.fid]));
    } catch {
      return {};
    }
  };

  const fetchUsername = async (fid: number): Promise<string | null> => {
    try {
      const res = await fetch(`/api/user/${fid}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.username ? `@${data.username}` : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const walletMap = await fetchWalletLinks();

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

            const owner = rawOwner as string;
            const stake = Number(rawStake) / 1e18;

            let username: string | null = null;
            const linkedFid = walletMap[owner.toLowerCase()];
            if (linkedFid) {
              username = await fetchUsername(linkedFid);
            }

            return {
              name,
              owner: username || owner,
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
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 bg-zinc-900 rounded shadow-md text-white w-full max-w-sm mx-auto border border-purple-500">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">🏆 Leaderboard</h2>
      <ul className="space-y-4">
        {data.map(({ name, owner, stake }) => (
          <li key={name} className="bg-zinc-800 p-4 rounded">
            <h3 className="text-lg font-semibold">🌍 {name}</h3>
            <p className="text-sm text-purple-300">Owner: {owner === "0x0000000000000000000000000000000000000000" ? "Unclaimed" : owner}</p>
            <p className="text-sm text-purple-400">Total Staked: {stake} MON</p>
          </li>
        ))}
      </ul>
    </div>
  );
}