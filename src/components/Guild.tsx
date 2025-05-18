"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { writeContract, readContract, waitForTransactionReceipt } from "@wagmi/core";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { config } from "~/components/providers/WagmiProvider";
import { stakingContractAddress, NFTContractAddress } from "~/lib/constants";
import { abi } from "~/lib/abi";
import { abi as monarchsAbi } from "~/lib/abiMonarchs";
import React from "react";

const guilds = [
  {
    name: "House of Moyaki",
    id: "House of Moyaki",
    description: "Masters of the deep waters and swift strikes.",
    icon: "/house_of_moyaki.png",
  },
  {
    name: "House of Chog",
    id: "House of Chog",
    description: "Resilient defenders of the emerald forest.",
    icon: "/house_of_chog.png",
  },
  {
    name: "House of Molandak",
    id: "House of Molandak",
    description: "Strategists of the great plains and storm riders.",
    icon: "/house_of_molandak.png",
  },
];

const mintFunctionByGuild: Record<string, string> = {
  "House of Moyaki": "mintMoyaki",
  "House of Chog": "mintChog",
  "House of Molandak": "mintMolandak",
};

function Modal({ open, onClose, onConfirm, title, description, confirmText = "Confirm", cancelText = "Cancel" }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-zinc-900 p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-2 text-purple-300">{title}</h2>
        <p className="mb-4 text-zinc-300">{description}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600 text-zinc-200">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 text-white font-semibold">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default function Guild({ onJoinGuild }: { onJoinGuild?: () => void }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentGuildIndex, setCurrentGuildIndex] = useState(0);
  const [mintStatus, setMintStatus] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [pendingGuildId, setPendingGuildId] = useState<string | null>(null);
  const [hasMinted, setHasMinted] = useState(false);
  const [loadingGuildCheck, setLoadingGuildCheck] = useState(true);

  // Função para checar se já mintou
  const checkMinted = async (userAddress?: string) => {
    const addr = userAddress || address;
    if (!addr) return;
    try {
      const ownedTokens = await readContract(config, {
        address: NFTContractAddress,
        abi: monarchsAbi,
        functionName: "getOwnedTokenIds",
        args: [addr],
      });
      setHasMinted(Array.isArray(ownedTokens) && ownedTokens.length > 0);
    } catch (err) {
      setHasMinted(false);
    }
  };

  useEffect(() => {
    const checkGuild = async () => {
      if (!address) {
        setLoadingGuildCheck(false);
        return;
      }
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
      } finally {
        setLoadingGuildCheck(false);
      }
    };
    checkGuild();
  }, [address]);

  useEffect(() => {
    checkMinted();
  }, [address, mintStatus]);

  const handleOpenJoinModal = (guildId: string) => {
    setPendingGuildId(guildId);
    setShowJoinModal(true);
  };

  const handleConfirmJoin = async () => {
    if (!pendingGuildId) return;
    setShowJoinModal(false);
    await handleJoin(pendingGuildId, false);
    setShowMintModal(true);
  };

  const handleConfirmMint = async () => {
    console.log("Botão de Mintar NFT clicado, pendingGuildId:", pendingGuildId);
    if (!pendingGuildId) return;
    setShowMintModal(false);
    await handleJoin(pendingGuildId, true);
    setPendingGuildId(null);
  };

  const handleJoin = async (guildId: string, mintNFT = true) => {
    if (!address || !walletClient) {
      return;
    }
    setLoading(true);
    setMintStatus(null);
    setMintError(null);
    try {
      if (!mintNFT) {
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
        return;
      }
      setMintStatus("Minting NFT...");
      const mintFunction = mintFunctionByGuild[guildId];
      if (!mintFunction) throw new Error("Mint function not found for the selected guild.");
      const tx = await writeContract(config, {
        address: NFTContractAddress,
        abi: monarchsAbi,
        functionName: mintFunction,
        args: [address],
        account: address,
      });
      await waitForTransactionReceipt(config, { hash: tx });
      await checkMinted();
      setMintStatus("✅ NFT minted successfully!");
    } catch (err: any) {
      setMintError(err?.message || "Error minting the NFT.");
    } finally {
      setLoading(false);
    }
  };

  const visibleGuilds = joined && selected
    ? guilds.filter(g => g.id === selected)
    : [guilds[currentGuildIndex]];

  const goLeft = () => setCurrentGuildIndex((prev) => (prev === 0 ? guilds.length - 1 : prev - 1));
  const goRight = () => setCurrentGuildIndex((prev) => (prev === guilds.length - 1 ? 0 : prev + 1));

  return (
    loadingGuildCheck ? (
      <div className="flex items-center justify-center h-64">
        <span className="text-purple-300 animate-pulse text-xl font-semibold">Loading your guild...</span>
      </div>
    ) : (
      <div className="p-8 max-w-xl mx-auto text-white">
        <Modal
          open={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onConfirm={handleConfirmJoin}
          title="Join the Guild?"
          description={`Are you sure you want to join the guild \"${pendingGuildId ?? ''}\"? This action cannot be undone.`}
          confirmText="Join"
          cancelText="Cancel"
        />
        <Modal
          open={showMintModal}
          onClose={() => setShowMintModal(false)}
          onConfirm={handleConfirmMint}
          title="Mint Guild NFT?"
          description={`Do you want to mint the NFT for the guild \"${pendingGuildId ?? ''}\" now?`}
          confirmText="Mint NFT"
          cancelText="Not now"
        />
        <h1 className="text-3xl font-bold text-center text-purple-300 mb-8">
          {joined ? "Your Guild" : "First, choose your Guild!"}
        </h1>
        {mintStatus && (
          <p className="mt-4 text-center text-blue-400 animate-pulse">{mintStatus}</p>
        )}
        {mintError && (
          <p className="mt-4 text-center text-red-500 font-semibold">{mintError}</p>
        )}
        {!joined && (
          <p className="text-center text-zinc-300 mb-4">Click a guild to select and join!</p>
        )}
        <div className="flex items-center justify-center gap-4">
          {!joined && (
            <button onClick={goLeft} className="p-2 text-purple-300 hover:text-purple-500">
              <FaChevronLeft size={32} />
            </button>
          )}
          <div className="flex-1">
            {visibleGuilds.map((guild) => (
              <button
                key={guild.id}
                onClick={() => handleOpenJoinModal(guild.id)}
                disabled={joined || loading}
                className={`bg-zinc-800 hover:bg-zinc-700 transition rounded p-4 border-2 w-full ${
                  selected === guild.id ? "border-purple-500" : "border-zinc-700"
                }`}
              >
                <img
                  src={guild.icon}
                  alt={guild.name}
                  className="w-15 h-15 mb-4 mx-auto rounded"
                />
                <h2 className="text-xl font-semibold text-center mb-2">{guild.name}</h2>
                <p className="text-sm text-zinc-400 text-center">{guild.description}</p>
              </button>
            ))}
          </div>
          {!joined && (
            <button onClick={goRight} className="p-2 text-purple-300 hover:text-purple-500">
              <FaChevronRight size={32} />
            </button>
          )}
        </div>
        {joined && selected && !hasMinted && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                setPendingGuildId(selected);
                setShowMintModal(true);
              }}
              className="px-6 py-2 bg-purple-600 rounded hover:bg-purple-700 text-white font-semibold shadow"
            >
              Mint Guild NFT
            </button>
          </div>
        )}
        {joined && selected && (
          <p className="mt-6 text-center text-green-400">
            You have joined <strong>{selected}</strong>! Welcome.
          </p>
        )}
      </div>
    )
  );
}
