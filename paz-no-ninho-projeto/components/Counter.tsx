
import { Clock, Heart, Timer } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CounterProps {
  startDate: string;
}

const Counter: React.FC<CounterProps> = ({ startDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };
    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [startDate]);

  return (
    <div className="w-full soft-ui-card p-6 md:p-10 bg-white/70 relative border-4 border-white/50 flex flex-col items-center overflow-hidden">
      {/* Elementos Decorativos de Dopamina */}
      <div className="absolute top-3 right-4 text-pink-300 floating-heart"><Heart className="fill-current w-6 h-6" /></div>
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-pink-100/50 animate-spin-slow">
        <Timer className="w-24 h-24 stroke-[1]" />
      </div>
      
      <div className="relative">
        <div className="bg-pink-50 p-4 rounded-full mb-6 border-2 border-pink-100 shadow-inner relative z-10">
          <Clock className="w-8 h-8 text-pink-500 animate-spin-slow" />
        </div>
        <div className="absolute inset-0 bg-pink-400/20 blur-xl rounded-full animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 w-full max-w-[400px] relative z-10">
        <TimeUnit value={timeLeft.days} label="Dias" color="text-pink-600" />
        <TimeUnit value={timeLeft.hours} label="Horas" color="text-pink-500" />
        <TimeUnit value={timeLeft.minutes} label="Mins" color="text-pink-400" />
        <TimeUnit value={timeLeft.seconds} label="Segs" color="text-pink-300" />
      </div>
      
      <div className="mt-8 flex items-center gap-2 px-6 py-2 bg-pink-50/50 rounded-full border border-pink-100 relative z-10">
        <Heart className="w-4 h-4 text-pink-500 fill-pink-500 pulse-heart" /> 
        <p className="text-pink-700 font-bold text-xs md:text-sm uppercase tracking-widest">Ninho em Harmonia</p>
        <Heart className="w-4 h-4 text-pink-500 fill-pink-500 pulse-heart" />
      </div>
    </div>
  );
};

const TimeUnit = ({ value, label, color }: { value: number, label: string, color: string }) => (
  <div className="flex flex-col items-center min-w-0">
    <div className={`text-[10vw] sm:text-6xl font-black ${color} leading-none tracking-tighter drop-shadow-sm`}>
      {value.toString().padStart(2, '0')}
    </div>
    <div className="text-[10px] sm:text-xs font-black text-pink-700/60 uppercase tracking-widest mt-1">{label}</div>
  </div>
);

export default Counter;
