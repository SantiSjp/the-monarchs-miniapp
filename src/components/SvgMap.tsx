"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MapModal from "./MapModal";

const territories = [
  { id: 0, name: "Moyaki Isles", top: "23%", left: "15%", icon: "/moyaki.png" },
  { id: 1, name: "Chogwood", top: "26%", left: "58%", icon: "/chogwood.png" },
  { id: 2, name: "Monad Keep", top: "50%", left: "64%", icon: "/monad-keep.png" },
  { id: 3, name: "Molandak Plains", top: "60%", left: "25%", icon: "/molandak.png" },
];

type Props = {
  fid?: number;
};


export default function SvgMap({ fid }: Props) {
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(null);

  return (
    <div className="flex flex-col items-center justify-start p-4 text-white min-h-0">
      <div className="relative w-full max-w-3xl">
        {/* Mapa base */}
        <img
          src="/map.png"
          alt="Mapa"
          className="w-full h-auto block rounded shadow-md"
          style={{ aspectRatio: "2/3" }}
        />

        {/* Ícones dos territórios com animação */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {territories.map((territory) => (
        <motion.div
        key={territory.id}
        className="absolute flex flex-col items-center pointer-events-none"
        style={{
          top: territory.top,
          left: territory.left
        }}
        whileHover={{
          scale: 1.25,          
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
            <img
            src={territory.icon}
            alt={territory.name}
            className="w-20 sm:w-20 pointer-events-auto cursor-pointer"
            onClick={() => setSelected({ id: territory.id, name: territory.name })}
            />
            <span className="mt-1 text-sm text-purple-900 font-medium text-center">
            {territory.name}
            </span>
        </motion.div>
        ))}

        </div>
      </div>

      {selected && (
        <MapModal
          open={true}
          onClose={() => setSelected(null)}
          id={selected.id}
          name={selected.name}
          fid={fid}
        />
      )}
    </div>
  );
}
