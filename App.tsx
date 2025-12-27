
import React, { useState, useEffect, useRef } from 'react';
import { User, Couple, Reward, PaymentResponse } from './types';
import { dbService } from './services/db';
import { Heart, Share2, LogOut, History, ShieldAlert, Sparkles, Trophy, Camera, Palette, CheckCircle, CreditCard, Settings, Gift, Copy, Check, ExternalLink, Loader2, PartyPopper, AlertCircle, Zap, Calendar, Crown, Users, Clock } from 'lucide-react';
import Counter from './components/Counter';
import Rewards from './components/Rewards';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rewards' | 'settings'>('dashboard');
  
  const [emailInput, setEmailInput] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [referrerCodeInput, setReferrerCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('monthly');
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [motivation, setMotivation] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const email = localStorage.getItem('paz_no_ninho_user_email');
      if (email) try { await handleLogin(email); } catch { setIsLoading(false); }
      else setIsLoading(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (couple) {
      document.documentElement.className = `theme-${couple.theme}`;
      document.body.className = `theme-${couple.theme}`;
    }
  }, [couple]);

  useEffect(() => {
    let interval: any;
    if (paymentData && !couple && !paymentSuccess) {
      interval = setInterval(async () => {
        try {
          const status = await dbService.checkPaymentStatus(paymentData.id);
          if (status === 'approved') {
            setPaymentSuccess(true);
            clearInterval(interval);
            
            const validatedUser = await dbService.ensureUser(user?.email || emailInput);
            setUser(validatedUser);
            localStorage.setItem('paz_no_ninho_user_email', validatedUser.email);
            
            const newC = await dbService.createCouple(validatedUser.id, selectedPlan, referrerCodeInput);
            setCouple(newC);
            setTimeout(() => { setShowPayment(false); setPaymentData(null); }, 3000);
          }
        } catch (e) { console.error(e); }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentData, couple, paymentSuccess, user, emailInput]);

  const handleLogin = async (email: string) => {
    if (!email.includes('@')) return alert("E-mail inválido.");
    setIsLoading(true);
    try {
      const loggedUser = await dbService.login(email);
      if (!loggedUser) {
        setIsNewUser(true);
        setUser(null);
      } else {
        setUser(loggedUser);
        localStorage.setItem('paz_no_ninho_user_email', email);
        if (loggedUser.couple_id) {
          const coupleData = await dbService.getCouple(loggedUser.couple_id);
          if (coupleData) {
            setCouple(coupleData);
            setRewards(await dbService.getRewards(coupleData.id));
          }
        }
      }
    } catch (e: any) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const startPaymentFlow = async () => {
    if (!emailInput && !user?.email) return alert("E-mail não identificado.");
    setIsGeneratingPayment(true);
    try {
      const res = await dbService.generatePayment(user?.email || emailInput, selectedPlan);
      setPaymentData(res);
    } catch (e: any) { alert(e.message || "Erro ao gerar cobrança. Verifique sua conexão."); }
    finally { setIsGeneratingPayment(false); }
  };

  const handleReset = async () => {
    if (!couple) return;
    const diff = new Date().getTime() - new Date(couple.current_start_date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const updated = await dbService.resetCounter(couple.id, days);
    setCouple(updated);
    setShowReset(false);
    setMotivation('Um recomeço com mais amor! 🕊️');
    setTimeout(() => setMotivation(''), 5000);
  };

  const calculateRemainingDays = () => {
    if (!couple || couple.is_lifetime || !couple.expires_at) return null;
    const diff = new Date(couple.expires_at).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative">
        <Heart className="w-16 h-16 text-pink-400 fill-pink-300 animate-bounce" />
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
      </div>
      <p className="mt-4 text-pink-500 font-black text-xl animate-pulse font-cute">Preparando o Ninho...</p>
    </div>
  );

  if (!user || !couple) {
    if (!user && !isNewUser) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md soft-ui-card p-12 text-center border-4 border-pink-100 animate-in zoom-in duration-500">
            <div className="relative inline-block mb-8">
              <Heart className="w-20 h-20 text-pink-500 fill-pink-500 pulse-heart" />
              <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="text-white w-8 h-8" /></div>
            </div>
            <h1 className="text-5xl font-black text-gray-800 mb-2 font-cute tracking-tight">Paz no Ninho</h1>
            <p className="text-pink-600 font-black mb-10 uppercase tracking-[0.3em] text-[10px] bg-pink-50 py-2 rounded-full">Onde o amor floresce diariamente</p>
            <input 
              type="email" placeholder="seuemail@ninho.com" 
              className="w-full p-6 bg-pink-50 border-4 border-pink-100 rounded-[2.5rem] mb-6 text-center font-black text-lg text-gray-700 outline-none focus:ring-8 ring-pink-50 transition-all"
              value={emailInput} onChange={e => setEmailInput(e.target.value)}
            />
            <button 
              onClick={() => handleLogin(emailInput)} 
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xl py-6 rounded-[2.5rem] shadow-[0_15px_30px_rgba(244,114,182,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Entrar no Ninho 🕊️
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="w-full max-w-md soft-ui-card p-10 text-center border-4 border-blue-100 shadow-2xl relative">
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-8 border-white">
            <Sparkles className="w-12 h-12 text-white animate-spin-slow" />
          </div>
          <h2 className="text-4xl font-black mb-1 text-gray-800 font-cute">Seu Refúgio ✨</h2>
          <p className="text-gray-400 font-bold mb-10 text-sm">{emailInput}</p>
          
          <button onClick={() => setShowPayment(true)} className="w-full bg-gradient-to-br from-pink-500 to-rose-500 text-white font-black text-2xl py-8 rounded-[3rem] mb-8 shadow-xl hover:scale-105 transition-all border-b-8 border-rose-700">
            CRIAR NOSSO NINHO
          </button>

          <div className="relative mb-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-dashed border-blue-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-blue-300 font-black uppercase tracking-widest">Já tem um parceiro?</span></div>
          </div>

          <input 
            type="text" placeholder="CÓDIGO SECRETO" 
            className="w-full p-5 bg-blue-50 border-4 border-blue-100 rounded-[2rem] mb-5 text-center font-black tracking-[0.4em] uppercase text-blue-600 outline-none focus:ring-8 ring-blue-50"
            value={inviteInput} onChange={e => setInviteInput(e.target.value)}
          />
          <button onClick={async () => {
            try {
              const validatedUser = await dbService.ensureUser(emailInput);
              setUser(validatedUser);
              localStorage.setItem('paz_no_ninho_user_email', validatedUser.email);
              
              const c = await dbService.joinCouple(validatedUser.id, inviteInput.toUpperCase());
              if(c) window.location.reload();
              else alert('Código não encontrado! 🥺');
            } catch (e) { alert("Erro ao conectar ao ninho."); }
          }} className="w-full bg-gray-800 text-white font-black py-6 rounded-[2.5rem] hover:bg-black transition-all shadow-lg mb-6">CONECTAR AGORA</button>
          
          <button onClick={() => { setIsNewUser(false); setUser(null); setEmailInput(''); }} className="text-gray-400 font-black text-xs uppercase tracking-widest hover:text-pink-500 transition-colors">
             Não é você? Sair
          </button>
        </div>

        {showPayment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[500] flex items-center justify-center p-6 overflow-y-auto">
            <div className="bg-white rounded-[4rem] p-8 w-full max-w-sm text-center border-[12px] border-pink-50 shadow-2xl relative">
              <button onClick={() => { setShowPayment(false); setPaymentData(null); }} className="absolute top-4 right-8 text-gray-300 font-black text-2xl">×</button>
              
              {paymentSuccess ? (
                <div className="py-12">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-8 border-green-100 animate-bounce">
                    <PartyPopper className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="text-3xl font-black text-gray-800 mb-4">Uhuuu! 🎉</h4>
                  <p className="text-green-600 font-bold text-lg">Pagamento confirmado! <br/>O ninho é todo seu.</p>
                </div>
              ) : !paymentData ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto shadow-lg"><Crown className="w-10 h-10 text-yellow-600" /></div>
                  <h4 className="text-3xl font-black text-gray-800">Escolha o Acesso 💎</h4>
                  
                  <div className="space-y-4">
                    <div 
                      onClick={() => setSelectedPlan('monthly')}
                      className={`p-6 rounded-[2.5rem] border-4 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'border-pink-500 bg-pink-50 scale-105' : 'border-gray-100 grayscale opacity-60'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <p className="font-black text-gray-800">Mensal</p>
                          <p className="text-xs text-gray-500 font-bold">R$ 2,75 / mês</p>
                        </div>
                        <Calendar className="text-pink-500" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedPlan('lifetime')}
                      className={`p-6 rounded-[2.5rem] border-4 cursor-pointer transition-all ${selectedPlan === 'lifetime' ? 'border-yellow-500 bg-yellow-50 scale-105' : 'border-gray-100 grayscale opacity-60'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <p className="font-black text-gray-800">Vitalício 🔥</p>
                          <p className="text-xs text-gray-500 font-bold">R$ 11,45 único</p>
                        </div>
                        <Crown className="text-yellow-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-3xl border-2 border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center justify-center gap-2"><Users className="w-3 h-3" /> Tem indicação?</p>
                    <input 
                      type="text" placeholder="CÓDIGO DO AMIGO" 
                      className="w-full bg-white p-3 rounded-2xl text-center font-black uppercase text-blue-500 border-2 border-blue-100"
                      value={referrerCodeInput} onChange={e => setReferrerCodeInput(e.target.value.toUpperCase())}
                    />
                    <p className="text-[8px] mt-2 font-bold text-blue-400">Ganha +5 dias se escolher Mensal!</p>
                  </div>

                  <button 
                    disabled={isGeneratingPayment}
                    onClick={startPaymentFlow}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xl py-6 rounded-[2.5rem] shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isGeneratingPayment ? <Loader2 className="w-7 h-7 animate-spin" /> : <>Gerar Pix <Zap className="fill-white" /></>}
                  </button>
                </div>
              ) : (
                <div className="animate-in slide-in-from-bottom-6">
                  <div className="flex justify-center mb-6">
                     <div className="p-4 bg-white border-8 border-pink-50 rounded-[3rem] shadow-xl">
                        <div className="w-56 h-56 bg-gray-50 flex items-center justify-center rounded-3xl overflow-hidden border-4 border-dashed border-gray-100">
                          {paymentData.qr_code_base64 && <img src={`data:image/png;base64,${paymentData.qr_code_base64}`} className="w-full h-full p-2" alt="Pix" />}
                        </div>
                     </div>
                  </div>
                  <h4 className="text-2xl font-black text-gray-800 mb-2">Escaneie o Pix 🚀</h4>
                  <div className="flex items-center justify-center gap-2 text-pink-500 font-black text-[10px] uppercase tracking-widest mb-6 animate-pulse">
                     <div className="w-2 h-2 bg-pink-500 rounded-full"></div> Aguardando confirmação...
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(paymentData.qr_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center justify-center gap-3 w-full bg-pink-50 text-pink-600 py-6 rounded-3xl font-black border-2 border-pink-100 transition-all active:scale-95 mb-4"
                  >
                    {copied ? <Check /> : <Copy className="w-5 h-5" />}
                    {copied ? "COPIADO!" : "COPIAR PIX"}
                  </button>
                  <button onClick={() => setPaymentData(null)} className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-pink-500 transition-colors">Voltar e Mudar Plano</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const remainingDays = calculateRemainingDays();

  return (
    <div className="min-h-screen pb-40 px-4 pt-8 max-w-lg mx-auto overflow-x-hidden">
      <header className="flex justify-between items-center mb-10 px-4 bg-white/80 p-4 rounded-[3rem] border-4 border-white shadow-xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-500 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-16 h-16 rounded-3xl border-4 border-pink-50 shadow-lg bg-gray-100 overflow-hidden rotate-3 group-hover:rotate-0 transition-transform">
              <img src={couple.couple_photo || user.avatar_url} className="w-full h-full object-cover" alt="Couple" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-pink-500 text-white p-2 rounded-2xl shadow-xl border-2 border-white"><Camera className="w-4 h-4" /></div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if(f) {
                const r = new FileReader();
                r.onloadend = async () => {
                   const b64 = r.result as string;
                   await dbService.updateCouple(couple.id, { couple_photo: b64 });
                   setCouple({...couple, couple_photo: b64});
                };
                r.readAsDataURL(f);
              }
            }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 font-cute tracking-tight">Nosso Ninho</h1>
            <div className="flex gap-2">
              <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1 ${couple.is_lifetime ? 'bg-yellow-400 text-yellow-900' : 'bg-green-500 text-white'}`}>
                {couple.is_lifetime ? <Crown className="w-2 h-2" /> : <Zap className="w-2 h-2" />}
                {couple.is_lifetime ? 'Vitalício' : 'Ativo'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem('paz_no_ninho_user_email'); window.location.reload(); }} className="p-3 text-pink-200 hover:text-red-500 transition-colors"><LogOut className="w-6 h-6" /></button>
      </header>

      {!couple.is_lifetime && remainingDays !== null && (
        <div className={`mb-8 p-6 rounded-[2.5rem] border-4 shadow-xl flex items-center justify-between transition-all ${remainingDays < 5 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-green-50 border-green-200 text-green-700'}`}>
          <div className="flex items-center gap-4">
             <div className={`p-4 rounded-2xl shadow-inner relative flex items-center justify-center ${remainingDays < 5 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                <Calendar className="w-6 h-6 absolute" />
                <Clock className={`w-10 h-10 opacity-40 ${remainingDays < 5 ? 'animate-spin' : 'animate-spin-slow'}`} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Acesso Premium</p>
               <p className="text-2xl font-black leading-none">{remainingDays} Dias Restantes</p>
             </div>
          </div>
          <button onClick={() => setShowPayment(true)} className="p-3 bg-white/50 rounded-2xl border-2 border-white text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">Renovar</button>
        </div>
      )}

      {motivation && (
        <div className="fixed top-8 left-4 right-4 z-[400] bg-white p-6 rounded-[3rem] shadow-2xl border-8 border-pink-50 flex items-center gap-4 animate-in slide-in-from-top-full duration-700">
          <PartyPopper className="w-10 h-10 text-pink-500" />
          <p className="font-black text-gray-800 text-lg">{motivation}</p>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
          <Counter startDate={couple.current_start_date} />
          
          <div className="soft-ui-card p-10 border-4 border-indigo-50 shadow-lg group">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3"><Trophy className="w-6 h-6 text-yellow-400" /> Hall da Fama da Paz</h3>
            <div className="grid grid-cols-1 gap-4">
              {couple.high_scores?.length ? couple.high_scores.map((s, i) => (
                <div key={i} className={`flex justify-between items-center p-6 rounded-3xl border-4 transition-all hover:scale-[1.02] ${i === 0 ? 'bg-yellow-50 border-yellow-100' : 'bg-white border-gray-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${i === 0 ? 'bg-yellow-400 text-white rotate-6' : 'bg-indigo-50 text-indigo-300'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <span className="font-black text-gray-800 text-lg">{s} Dias</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recorde #{i+1}</p>
                    </div>
                  </div>
                  <Sparkles className={`w-6 h-6 ${i === 0 ? 'text-yellow-400 animate-pulse' : 'text-gray-200'}`} />
                </div>
              )) : <p className="text-center text-gray-300 py-10 italic font-black text-sm">Nenhum recorde ainda. Comecem hoje! 🌱</p>}
            </div>
          </div>

          <div className="soft-ui-card p-8 bg-gradient-to-br from-indigo-500 to-blue-600 border-4 border-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex justify-between items-center text-white">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 opacity-80">Convide um casal amigo</p>
                <p className="text-4xl font-black tracking-[0.2em] drop-shadow-lg">{couple.invite_code}</p>
                <p className="text-[9px] mt-2 font-black bg-white/20 inline-block px-3 py-1 rounded-full">+5 dias grátis para ambos! 🎁</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(couple.invite_code); alert('Copiado! Envie para seus amigos casais! 🚀'); }} className="bg-white p-6 rounded-[2rem] shadow-xl text-blue-600 hover:scale-110 active:rotate-12 transition-all">
                <Share2 className="w-8 h-8 stroke-[3]" />
              </button>
            </div>
          </div>

          <button onClick={() => setShowReset(true)} className="w-full text-pink-300 hover:text-red-500 transition-colors py-10 text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4 group">
            <ShieldAlert className="w-5 h-5 group-hover:scale-125 transition-transform" /> ZERAR HARMONIA
          </button>
        </div>
      )}

      {activeTab === 'rewards' && (
        <Rewards rewards={rewards} currentDays={Math.floor((new Date().getTime() - new Date(couple.current_start_date).getTime()) / (1000 * 60 * 60 * 24))} onAdd={async (d, desc) => {
          const r = await dbService.addReward({ couple_id: couple.id, days_required: d, description: desc });
          setRewards([...rewards, r]);
        }} onDelete={async (id) => {
          await dbService.deleteReward(id);
          setRewards(rewards.filter(r => r.id !== id));
        }} />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="soft-ui-card p-10 border-8 border-pink-50 shadow-2xl">
            <h3 className="text-xl font-black mb-10 flex items-center gap-4 text-pink-600 font-cute"><Palette className="w-8 h-8" /> Visual do Ninho</h3>
            <div className="grid grid-cols-2 gap-6 mb-12">
              {['pink', 'lavender', 'mint', 'sunset'].map(t => (
                <button key={t} onClick={async () => { 
                  await dbService.updateCouple(couple.id, { theme: t as any }); 
                  setCouple({...couple, theme: t as any}); 
                }} className={`p-8 rounded-[2.5rem] font-black text-sm capitalize border-4 transition-all shadow-lg ${couple.theme === t ? 'border-pink-500 bg-pink-50 text-pink-600 scale-105' : 'border-transparent bg-gray-50 text-gray-300 opacity-60'}`}>
                  <div className={`w-full h-3 rounded-full mb-3 bg-current opacity-20`}></div>
                  {t}
                </button>
              ))}
            </div>
            <h3 className="text-xl font-black mb-6 flex items-center gap-4 text-green-600 font-cute"><CreditCard className="w-8 h-8" /> Nosso PIX Comum</h3>
            <div className="flex gap-4">
              <input 
                type="text" placeholder="Chave Pix..." 
                className="flex-1 p-6 bg-gray-50 border-4 border-gray-100 rounded-[2rem] outline-none font-black text-gray-700 focus:ring-8 ring-green-50"
                value={couple.pix_key || ''} onChange={e => setCouple({...couple, pix_key: e.target.value})}
              />
              <button onClick={async () => {
                await dbService.updateCouple(couple.id, { pix_key: couple.pix_key });
                setMotivation('Pix Atualizado! 💸');
                setTimeout(() => setMotivation(''), 3000);
              }} className="bg-green-500 text-white px-8 rounded-[2rem] font-black shadow-lg">SALVAR</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-24 bg-white/90 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex items-center justify-around px-4 border-4 border-white z-[300]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'dashboard' ? 'text-pink-500 scale-125' : 'text-gray-300'}`}>
           <Heart className={`w-8 h-8 ${activeTab === 'dashboard' ? 'fill-pink-500' : ''}`} />
           <span className="text-[9px] font-black mt-1 uppercase tracking-[0.2em]">Ninho</span>
        </button>
        <button onClick={() => setActiveTab('rewards')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'rewards' ? 'text-pink-500 scale-125' : 'text-gray-300'}`}>
           <div className="relative">
             <Gift className={`w-8 h-8 ${activeTab === 'rewards' ? 'fill-pink-500' : ''}`} />
             {rewards.filter(r => r.days_required <= Math.floor((new Date().getTime() - new Date(couple.current_start_date).getTime()) / (1000 * 60 * 60 * 24))).length > 0 && 
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>}
           </div>
           <span className="text-[9px] font-black mt-1 uppercase tracking-[0.2em]">Mimos</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'settings' ? 'text-pink-500 scale-125' : 'text-gray-300'}`}>
           <Settings className={`w-8 h-8 ${activeTab === 'settings' ? 'fill-pink-500' : ''}`} />
           <span className="text-[9px] font-black mt-1 uppercase tracking-[0.2em]">Ajustes</span>
        </button>
      </nav>

      {showReset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[600] flex items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] p-12 w-full max-w-sm text-center border-[12px] border-red-50 animate-in zoom-in">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-inner"><ShieldAlert className="w-12 h-12 text-red-500" /></div>
            <h4 className="text-3xl font-black mb-6 font-cute">Houve uma briguinha? 🥺</h4>
            <p className="text-gray-500 font-bold mb-12 leading-relaxed text-lg">Zerar o contador é um novo começo. Que tal um abraço de 20 segundos antes de confirmar?</p>
            <div className="space-y-4">
              <button onClick={handleReset} className="w-full bg-red-500 text-white font-black py-7 rounded-[2.5rem] shadow-2xl hover:bg-red-600 transition-all text-xl">SIM, RECOMEÇAR</button>
              <button onClick={() => setShowReset(false)} className="w-full bg-pink-50 text-pink-500 font-black py-5 rounded-[2.5rem] text-sm tracking-widest uppercase">NÃO, ESTAMOS BEM! 💖</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
