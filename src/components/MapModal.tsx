"use client";

import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { truncateAddress } from "~/lib/truncateAddress";
import { abi } from "~/lib/abi";
import { stakingContractAddress } from "~/lib/constants";
import { readContract, getBalance } from "@wagmi/core";
import { config } from "~/components/providers/WagmiProvider";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, Contract } from "ethers";
import { Button } from "./ui/Button";

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

type Props = {
  open: boolean;
  onClose: () => void;
  id: number;
  name: string;
  fid?: number;
};

async function getUsername(fid: number) {
  const res = await fetch(`/api/user?fid=${fid}`);
  if (!res.ok) return null;
  const data = await res.json();
  console.log("data ", data.username);
  return data.username ? `@${data.username}` : null;
}

export default function MapModal({ open, onClose, id, name, fid }: Props) {
  const { address, isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [totalStake, setTotalStake] = useState<bigint>(0n);
  const [userStake, setUserStake] = useState<bigint>(0n);
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const [stakeAmount, setStakeAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "waiting" | "success" | "error">("idle");
  const [confirmAction, setConfirmAction] = useState<"stake" | "unstake" | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const { isSuccess, isError, isLoading } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  console.log("fid ", Number(fid));

  const registerWallet = async () => {
    if (!fid || !address) return;
    console.log("username 2", username);
    try {
      await fetch("/api/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, fid, username }),
      });
    } catch (err) {
      console.error("Erro ao registrar wallet com fid:", err);
    }
  };

  useEffect(() => {
    if (isLoading) setStatus("waiting");
    else if (isSuccess) {
      setStatus("success");
      refresh();
    } else if (isError) setStatus("error");
  }, [isLoading, isSuccess, isError]);

  const refresh = async () => {
    try {
      const [total] = await Promise.all([
        readContract(config, {
          address: stakingContractAddress,
          abi,
          functionName: "getTotalStake",
          args: [id],
        }),
      ]);
      setTotalStake(BigInt(total as string));

      if (isConnected && address) {
        const [stake, balance] = await Promise.all([
          readContract(config, {
            address: stakingContractAddress,
            abi,
            functionName: "getStake",
            args: [address, id],
          }),
          getBalance(config, { address }),
        ]);
        setUserStake(BigInt(stake as string));
        setUserBalance(BigInt(balance.value));
      }
    } catch (err) {
      console.error("Erro ao buscar dados do território ou saldo:", err);
    }
  };

  useEffect(() => {
    if (open) refresh();
  }, [open, id, txHash, isConnected, address]);

  const stake = () => {
    if (!stakeAmount || isNaN(Number(stakeAmount)) || Number(stakeAmount) <= 0) return;
    setStatus("sending");
    const contract = new Contract(stakingContractAddress, abi);
    const data = contract.interface.encodeFunctionData("stake", [id]) as `0x${string}`;

    sendTransaction(
      {
        to: stakingContractAddress,
        value: parseEther(stakeAmount),
        data,
      },
      {
        onSuccess: async (hash) => {
          setTxHash(hash);
          setStakeAmount("");
          const username = await getUsername(Number(fid));
          setUsername(username);
          registerWallet();
        },
        onError: () => setStatus("error"),
      }
    );
  };

  const unstake = () => {
    setStatus("sending");
    const contract = new Contract(stakingContractAddress, abi);
    const data = contract.interface.encodeFunctionData("unstake", [id]) as `0x${string}`;

    sendTransaction(
      {
        to: stakingContractAddress,
        data,
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
        onError: () => setStatus("error"),
      }
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="bg-zinc-900 p-6 rounded-lg text-white w-full max-w-sm shadow-xl border border-purple-500">
            <Dialog.Title className="text-lg font-bold mb-2">🌍 {name}</Dialog.Title>

            <p className="text-sm mb-1">Total Staked: {Number(totalStake) / 1e18} MON</p>
            <p className="text-sm mb-1 text-purple-300">Your Balance: {Number(userBalance) / 1e18} MON</p>
            <p className="text-sm mb-1 text-purple-400">Your Stake: {Number(userStake) / 1e18} MON</p>

            <input
              type="number"
              min="0"
              placeholder="Valor em MON"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full p-2 rounded bg-zinc-800 text-white border border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
            />

            <Button onClick={() => setConfirmAction("stake")}
              disabled={status === "waiting" || !stakeAmount}
              className="w-full flex items-center justify-center">
              {status === "sending" && confirmAction === "stake" && <Spinner />} Stake {stakeAmount || "MON"}
            </Button>

            {userStake > 0n && (
              <Button
                onClick={() => setConfirmAction("unstake")}
                disabled={status === "waiting"}
                className="w-full mt-2 bg-transparent border border-purple-400 text-purple-300 hover:bg-purple-900 flex items-center justify-center"
              >
                {status === "sending" && confirmAction === "unstake" && <Spinner />} Unstake
              </Button>
            )}

            {txHash && (
              <div className="text-xs mt-3 text-zinc-400 text-center">
                TX: <a href={`https://testnet.monadexplorer.com/tx/${txHash}`} target="_blank" className="underline text-blue-400">
                  {truncateAddress(txHash)}
                </a>
              </div>
            )}

            {status === "waiting" && <p className="text-white text-sm mt-2 text-center">⏳ Aguardando confirmação...</p>}
            {status === "success" && <p className="text-green-400 text-sm mt-2 text-center">✅ Transação confirmada!</p>}
            {status === "error" && <p className="text-red-400 text-sm mt-2 text-center">❌ Erro ao enviar transação.</p>}
          </Dialog.Panel>
        </div>
      </Dialog>

      {confirmAction && (
        <Dialog open={true} onClose={() => setConfirmAction(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center">
            <Dialog.Panel className="bg-zinc-800 p-6 rounded-lg text-white w-full max-w-xs border border-purple-500">
              <Dialog.Title className="text-lg font-semibold mb-4">
                Confirmar {confirmAction === "stake" ? "Stake" : "Unstake"}
              </Dialog.Title>
              <p className="text-sm text-zinc-300 mb-4 text-center">
                Tem certeza que deseja {confirmAction === "stake" ? `fazer stake de ${stakeAmount} MON` : "realizar unstake?"}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setConfirmAction(null);
                    confirmAction === "stake" ? stake() : unstake();
                  }}
                  className="w-full"
                >
                  Confirmar
                </Button>
                <Button
                  onClick={() => setConfirmAction(null)}
                  className="w-full bg-zinc-700 hover:bg-zinc-600"
                >
                  Cancelar
                </Button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </>
  );
}