
import React, { useState } from 'react';
import { Reward } from '../types';
import { Trophy, Plus, Gift, Trash2, Heart, Star, Sparkles } from 'lucide-react';

interface RewardsProps {
  rewards: Reward[];
  currentDays: number;
  onAdd: (days: number, desc: string) => void;
  onDelete: (id: string) => void;
}

const Rewards: React.FC<RewardsProps> = ({ rewards, currentDays, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newDays, setNewDays] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const nextReward = rewards
    .filter(r => r.days_required > currentDays)
    .sort((a, b) => a.days_required - b.days_required)[0];

  const sortedRewards = [...rewards].sort((a, b) => a.days_required - b.days_required);

  const handleSave = () => {
    if (newDays && newDesc) {
      onAdd(Number(newDays), newDesc);
      setIsAdding(false);
      setNewDays('');
      setNewDesc('');
    }
  };

  return (
    <div className="mt-4 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="text-3xl font-black text-gray-800 flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-2xl shadow-sm rotate-3">
            <Trophy className="w-8 h-8 text-yellow-600 fill-yellow-200" />
          </div>
          Mimos do Ninho
        </h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-4 bg-pink-500 text-white rounded-[1.5rem] hover:scale-110 shadow-lg transition-all active:rotate-6 active:scale-95"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {nextReward && (
        <div className="mb-10 p-8 bg-gradient-to-br from-pink-500 to-rose-400 rounded-[3rem] shadow-[0_20px_40px_rgba(244,114,182,0.4)] relative overflow-hidden text-white border-4 border-white/30">
          <div className="absolute top-0 right-0 p-4 opacity-20 floating-heart"><Star className="w-24 h-24 fill-current" /></div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 opacity-90 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Próxima Conquista ✨
          </p>
          <div className="flex justify-between items-center relative z-10">
            <div className="max-w-[70%]">
              <p className="text-3xl font-black leading-tight drop-shadow-md">{nextReward.description}</p>
              <p className="text-sm font-bold mt-2 opacity-90 italic">Só faltam {nextReward.days_required - currentDays} dias!</p>
            </div>
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border-4 border-white/40 shadow-xl">
               <span className="font-black text-2xl">{Math.min(100, Math.round((currentDays / nextReward.days_required) * 100))}%</span>
            </div>
          </div>
          <div className="mt-6 h-3 bg-white/20 rounded-full overflow-hidden border border-white/10 shadow-inner">
             <div 
               className="h-full bg-white transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
               style={{ width: `${Math.min(100, (currentDays / nextReward.days_required) * 100)}%` }}
             ></div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-pink-900/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] p-12 w-full max-w-sm shadow-2xl border-[10px] border-pink-50 relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white p-6 rounded-full shadow-xl border-4 border-pink-50 text-pink-500">
               <Gift className="w-10 h-10" />
            </div>
            <h4 className="text-3xl font-black mb-8 text-gray-800 text-center font-cute mt-4">Criar Mimo 🎁</h4>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] ml-2 mb-2 block">Dias de Harmonia</label>
                <input 
                  type="number" 
                  placeholder="Ex: 7" 
                  className="w-full p-6 bg-pink-50 border-4 border-pink-100 rounded-[2rem] focus:outline-none focus:ring-8 ring-pink-100 font-black text-2xl text-pink-600 placeholder-pink-200 text-center"
                  value={newDays}
                  onChange={e => setNewDays(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] ml-2 mb-2 block">A Recompensa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Cinema com pipoca" 
                  className="w-full p-6 bg-pink-50 border-4 border-pink-100 rounded-[2rem] focus:outline-none focus:ring-8 ring-pink-100 font-bold text-gray-700 text-center"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-10">
              <button 
                onClick={handleSave}
                className="w-full bg-pink-500 text-white py-6 rounded-[2rem] font-black text-xl shadow-[0_10px_20px_rgba(244,114,182,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Salvar com Amor <Heart className="w-6 h-6 fill-white" />
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="w-full bg-gray-50 text-gray-400 py-4 rounded-2xl font-bold"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="text-center py-20 px-8 bg-white/50 rounded-[4rem] border-4 border-dashed border-pink-200 animate-pulse">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-pink-300" />
          </div>
          <p className="text-gray-800 text-xl font-black mb-3 font-cute">Ninho sem Mimos? 🥺</p>
          <p className="text-pink-400 font-bold mb-8 leading-relaxed">Combinem mimos para celebrar <br/>cada dia de carinho!</p>
          <button onClick={() => setIsAdding(true)} className="bg-pink-500 text-white px-10 py-5 rounded-full font-black text-lg shadow-xl transform hover:scale-110 active:scale-95 transition-all">
            Criar Primeiro Mimo ✨
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {sortedRewards.map(reward => (
            <div key={reward.id} className={`flex items-center justify-between p-6 rounded-[2.5rem] border-4 transition-all group relative overflow-hidden ${currentDays >= reward.days_required ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl' : 'bg-white/80 border-pink-50'}`}>
              <div className="flex items-center gap-6">
                <div className={`p-5 rounded-3xl shadow-lg transform transition-transform group-hover:rotate-6 ${currentDays >= reward.days_required ? 'bg-green-500 text-white scale-110' : 'bg-pink-100 text-pink-400'}`}>
                  {currentDays >= reward.days_required ? <Trophy className="w-7 h-7" /> : <Gift className="w-7 h-7" />}
                </div>
                <div>
                  <p className={`font-black text-xl mb-1 ${currentDays >= reward.days_required ? 'text-green-800' : 'text-gray-800'}`}>
                    {reward.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentDays >= reward.days_required ? 'bg-green-200 text-green-700' : 'bg-pink-50 text-pink-500'}`}>
                      {reward.days_required} dias
                    </div>
                    {currentDays >= reward.days_required && (
                      <span className="text-green-600 font-black text-xs uppercase flex items-center gap-1">🎉 Conquistado!</span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onDelete(reward.id)}
                className="opacity-0 group-hover:opacity-100 p-4 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
              >
                <Trash2 className="w-6 h-6" />
              </button>
              {currentDays >= reward.days_required && (
                 <div className="absolute -bottom-2 -right-2 opacity-10 rotate-12">
                   <Heart className="w-20 h-20 fill-green-500 text-green-500" />
                 </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rewards;
