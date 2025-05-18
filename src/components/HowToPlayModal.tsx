import React from "react";

interface HowToPlayModalProps {
  onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-purple-800">How to Play Pool War</h2>
        <ol className="list-decimal list-inside text-gray-800 space-y-2 mb-4">
          <li>Connect your wallet and log in with Farcaster.</li>
          <li>Join a guild to participate in the game.</li>
          <li>Choose a pool and deposit tokens to support your guild.</li>
          <li>Help your guild conquer territories and climb the leaderboard!</li>
          <li>Check the leaderboard to track the progress of all guilds.</li>
        </ol>
        <p className="text-gray-600">Good luck and have fun!</p>
      </div>
    </div>
  );
};

export default HowToPlayModal; 