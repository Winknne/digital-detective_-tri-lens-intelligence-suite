
import React from 'react';
import { Suspect } from '../types';

interface SuspectCardProps {
  suspect: Suspect;
  onInterrogate: (id: string) => void;
  isAccusing?: boolean;
}

const SuspectCard: React.FC<SuspectCardProps> = ({ suspect, onInterrogate, isAccusing = false }) => {
  return (
    <div className="group relative bg-stone-900 border border-stone-800 rounded-xl overflow-hidden hover:border-amber-700/50 transition-all duration-300 shadow-xl">
      <div className="aspect-[4/5] overflow-hidden">
        <img 
          src={suspect.image} 
          alt={suspect.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-xl font-bold text-white mb-1 serif">{suspect.name}</h3>
        <p className="text-amber-500 text-sm font-semibold mb-2 uppercase tracking-wider">{suspect.role}</p>
        <p className="text-stone-400 text-sm line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
          {suspect.description}
        </p>
        
        <button
          onClick={() => onInterrogate(suspect.id)}
          className={`mt-4 w-full py-2 px-4 rounded-lg font-bold transition-colors ${
            isAccusing 
              ? 'bg-red-900/40 text-red-200 border border-red-800/50 hover:bg-red-800' 
              : 'bg-stone-800 text-stone-200 border border-stone-700 hover:bg-amber-700 hover:text-white'
          }`}
        >
          {isAccusing ? 'Accuse Suspect' : 'Interrogate'}
        </button>
      </div>
    </div>
  );
};

export default SuspectCard;
