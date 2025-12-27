
import React, { useState, useEffect, useRef } from 'react';
import { User, Couple, Reward, PaymentResponse } from './types';
import { dbService } from './services/db';
import { Heart, Share2, LogOut, History, ShieldAlert, Sparkles, Trophy, Camera, Palette, CheckCircle, CreditCard, Settings, Gift, Copy, Check, ExternalLink, Loader2, PartyPopper, AlertCircle } from 'lucide-react';
import Counter from './components/Counter';
import Rewards from './components/Rewards';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rewards' | 'settings'>('dashboard');
  
  const [emailInput, setEmailInput] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [pixInput, setPixInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Payment States
  const [showPayment, setShowPayment] = useState(false);
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
      if (email) {
        try {
          await handleLogin(email);
        } catch (e) {
          localStorage.removeItem('paz_no_ninho_user_email');
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (couple) document.body.className = `theme-${couple.theme}`;
  }, [couple]);

  // Monitoramento do pagamento
  useEffect(() => {
    let interval: any;
    if (paymentData && !couple && !paymentSuccess) {
      interval = setInterval(async () => {
        try {
          const status = await dbService.checkPaymentStatus(paymentData.id);
          if (status === 'approved') {
            setPaymentSuccess(true);
            clearInterval(interval);
            handleCreateNest();
          }
        } catch (e) {
          console.error("Erro ao verificar status:", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentData, couple, paymentSuccess]);

  const handleLogin = async (email: string) => {
    if (!email || !email.includes('@')) {
      alert("Por favor, insira um e-mail válido.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const loggedUser = await dbService.login(email);
      
      if (!loggedUser) {
        throw new Error("Não foi possível carregar os dados do usuário.");
      }

      setUser(loggedUser);
      localStorage.setItem('paz_no_ninho_user_email', email);
      
      if (loggedUser.couple_id) {
        const coupleData = await dbService.getCouple(loggedUser.couple_id);
        if (coupleData) {
          setCouple(coupleData);
          setPixInput(coupleData.pix_key || '');
          const rewardList = await dbService.getRewards(coupleData.id);
          setRewards(rewardList);
        }
      }
    } catch (e: any) {
      console.error("Erro ao logar:", e);
      setErrorMsg(e.message || "Erro desconhecido ao entrar no ninho.");
    } finally {
      setIsLoading(false);
    }
  };

  const startPaymentFlow = async () => {
    setIsGeneratingPayment(true);
    setErrorMsg(null);
    try {
      const res = await dbService.generatePayment(user?.email || "");
      if (res && (res.qr_code || res.qr_code_base64)) {
        setPaymentData(res);
      } else {
        throw new Error("Resposta do servidor de pagamento inválida.");
      }
    } catch (e: any) {
      console.error("Erro Pix:", e);
      setErrorMsg(e.message || "Erro ao gerar Pix.");
      alert(e.message);
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handleCreateNest = async () => {
    if (!user) return;
    try {
      const newCouple = await dbService.createCouple(user.id);
      setCouple(newCouple);
      setShowPayment(false);
      setPaymentData(null);
      setMotivation('Ninho ativado com sucesso! 💖✨');
      setTimeout(() => setMotivation(''), 5000);
    } catch (e) {
      console.error("Erro ao criar ninho:", e);
      alert("Erro ao criar ninho. Verifique as permissões do banco de dados.");
    }
  };

  const handleReset = async () => {
    if (!couple) return;
    const currentDays = Math.floor((new Date().getTime() - new Date(couple.current_start_date).getTime()) / (1000 * 60 * 60 * 24));
    try {
      const updated = await dbService.resetCounter(couple.id, currentDays);
      setCouple(updated);
      setShowReset(false);
      setMotivation('Um recomeço cheio de ternura! 🤍');
      setTimeout(() => setMotivation(''), 6000);
    } catch (e) {
      alert("Erro ao resetar contador.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('paz_no_ninho_user_email');
    window.location.reload();
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50">
      <Heart className="w-16 h-16 text-pink-400 fill-pink-300 animate-bounce" />
      <p className="mt-4 text-pink-400 font-bold animate-pulse">Entrando no Ninho...</p>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md soft-ui-card p-12 text-center border-4 border-pink-100 animate-in zoom-in duration-500">
        <Heart className="w-16 h-16 text-pink-500 fill-pink-500 mx-auto mb-8 pulse-heart" />
        <h1 className="text-4xl font-bold text-gray-800 mb-2 font-cute">Paz no Ninho</h1>
        <p className="text-pink-600 font-medium mb-10 uppercase tracking-widest text-xs">A harmonia mora aqui</p>
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-left leading-tight">{errorMsg}</p>
          </div>
        )}

        <input 
          type="email" placeholder="Seu e-mail..." 
          className="w-full p-6 bg-pink-50 border-2 border-pink-100 rounded-[2rem] mb-6 text-center font-bold text-gray-700 outline-none focus:ring-4 ring-pink-100"
          value={emailInput} onChange={e => setEmailInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin(emailInput)}
        />
        <button 
          onClick={() => handleLogin(emailInput)} 
          className="w-full bg-pink-500 text-white font-bold py-6 rounded-[2rem] shadow-xl hover:bg-pink-600 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Entrar no Ninho 🕊️
        </button>
      </div>
    </div>
  );

  if (!couple) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md soft-ui-card p-10 text-center border-4 border-blue-50 animate-in fade-in duration-500">
        <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-8 text-gray-800">Seu Refúgio ✨</h2>
        <button onClick={() => setShowPayment(true)} className="w-full bg-pink-500 text-white font-black py-6 rounded-[2rem] mb-6 shadow-lg hover:scale-105 transition-transform">
          Criar Nosso Ninho
        </button>
        <div className="py-4 text-gray-300 font-black uppercase text-[10px] tracking-[0.3em]">Ou vincule-se ao seu parceiro</div>
        <input 
          type="text" placeholder="CÓDIGO DO PARCEIRO" 
          className="w-full p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl mb-5 text-center font-black tracking-widest uppercase text-blue-600 outline-none focus:ring-4 ring-blue-50"
          value={inviteInput} onChange={e => setInviteInput(e.target.value)}
        />
        <button onClick={async () => {
          const c = await dbService.joinCouple(user.id, inviteInput.toUpperCase());
          if(c) await handleLogin(user.email);
          else alert('Código não encontrado! 🥺');
        }} className="w-full bg-gray-800 text-white font-bold py-5 rounded-[2rem] hover:bg-black transition-colors">Entrar Agora</button>
        <button onClick={handleLogout} className="mt-8 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-red-400">Trocar E-mail</button>
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] p-8 w-full max-w-sm text-center border-8 border-pink-50 animate-in zoom-in duration-300">
            {paymentSuccess ? (
              <div className="py-12 animate-in zoom-in">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PartyPopper className="w-12 h-12 text-green-500" />
                </div>
                <h4 className="text-2xl font-black text-gray-800 mb-2">Confirmado!</h4>
                <p className="text-gray-500 text-sm font-medium">Seu ninho está pronto...</p>
              </div>
            ) : !paymentData ? (
              <>
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="w-10 h-10 text-blue-500" />
                </div>
                <h4 className="text-2xl font-black text-gray-800 mb-4">Ativação do Ninho 💎</h4>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">
                  Contribuição única de <b>R$ 2,75</b> para manter seu ninho ativo.
                </p>
                <button 
                  disabled={isGeneratingPayment}
                  onClick={startPaymentFlow}
                  className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {isGeneratingPayment ? <Loader2 className="w-6 h-6 animate-spin" /> : "Gerar Pix de R$ 2,75"}
                </button>
                <button onClick={() => setShowPayment(false)} className="mt-6 text-gray-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-center mb-6">
                   <div className="p-4 bg-white border-4 border-blue-100 rounded-[2.5rem] shadow-inner">
                      <div className="w-48 h-48 bg-gray-50 flex items-center justify-center rounded-2xl overflow-hidden border-2 border-gray-100">
                        {paymentData.qr_code_base64 ? (
                          <img src={`data:image/png;base64,${paymentData.qr_code_base64}`} className="w-full h-full" alt="QR Code Pix" />
                        ) : (
                          <div className="p-4 text-xs text-red-500 font-bold">QR Code gerado. Use o botão abaixo.</div>
                        )}
                      </div>
                   </div>
                </div>
                <h4 className="text-xl font-black text-gray-800 mb-2">Pague com Pix 🚀</h4>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-6">Aguardando confirmação...</p>
                
                <div className="space-y-3 mb-8">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(paymentData.qr_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-700 py-4 rounded-2xl font-black border border-blue-100 transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado!" : "Pix Copia e Cola"}
                  </button>
                </div>
                <button onClick={() => { setPaymentData(null); setShowPayment(false); }} className="text-gray-300 font-bold text-[10px] uppercase tracking-widest">Sair</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-32 px-4 pt-8 max-w-lg mx-auto">
      <header className="flex justify-between items-center mb-10 px-4 bg-white/60 p-4 rounded-[2.5rem] border-2 border-white shadow-sm backdrop-blur-md animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img src={couple.couple_photo || user.avatar_url} className="w-14 h-14 rounded-full border-4 border-white shadow-xl object-cover" alt="Couple" />
            <div className="absolute -bottom-1 -right-1 bg-pink-500 text-white p-1.5 rounded-full shadow-lg"><Camera className="w-3 h-3" /></div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if(f) {
                const r = new FileReader();
                r.onloadend = async () => {
                   const b64 = r.result as string;
                   try {
                     await dbService.updateCouple(couple.id, { couple_photo: b64 });
                     setCouple({...couple, couple_photo: b64});
                   } catch (err) { alert("Erro ao salvar foto."); }
                };
                r.readAsDataURL(f);
              }
            }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 font-cute">Nosso Ninho</h1>
            <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
              Ativado <CheckCircle className="w-2 h-2" />
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className="p-3 text-pink-200 hover:text-red-500 transition-colors"><LogOut className="w-6 h-6" /></button>
      </header>

      {motivation && (
        <div className="fixed top-8 left-4 right-4 z-[400] bg-white p-6 rounded-[2.5rem] shadow-2xl border-4 border-pink-100 flex items-center gap-4 animate-in slide-in-from-top-full duration-500">
          <Sparkles className="w-8 h-8 text-pink-500" />
          <p className="font-black text-gray-700 text-sm">{motivation}</p>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <Counter startDate={couple.current_start_date} />
          <div className="soft-ui-card p-8 border-2 border-indigo-50">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><History className="w-5 h-5" /> Galeria da Paz</h3>
            <div className="space-y-4">
              {couple.high_scores?.length ? couple.high_scores.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 font-black text-[10px]">#{i+1}</div>
                    <span className="font-bold text-gray-600 text-sm">Dias Seguidos</span>
                  </div>
                  <span className="font-black text-indigo-500 text-xl">{s}</span>
                </div>
              )) : <p className="text-center text-gray-300 py-6 italic font-medium text-xs">A paz começa agora... 🌱</p>}
            </div>
          </div>
          <div className="soft-ui-card p-6 bg-blue-50/30 border-2 border-blue-50 flex justify-between items-center">
            <div>
              <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">Código de Vínculo</p>
              <p className="text-xl font-black text-blue-900 tracking-widest">{couple.invite_code}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(couple.invite_code); alert('Código copiado! 🚀'); }} className="bg-white p-4 rounded-2xl shadow-sm text-blue-400 hover:scale-110 transition-transform active:rotate-12"><Share2 className="w-5 h-5" /></button>
          </div>
          <button onClick={() => setShowReset(true)} className="w-full text-pink-200 hover:text-red-400 transition-colors py-8 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3">
            <ShieldAlert className="w-4 h-4" /> Zerar Progresso
          </button>
        </div>
      )}

      {activeTab === 'rewards' && (
        <Rewards rewards={rewards} currentDays={Math.floor((new Date().getTime() - new Date(couple.current_start_date).getTime()) / (1000 * 60 * 60 * 24))} onAdd={async (d, desc) => {
          try {
            const r = await dbService.addReward({ couple_id: couple.id, days_required: d, description: desc });
            setRewards([...rewards, r]);
          } catch (err) { alert("Erro ao adicionar."); }
        }} onDelete={async (id) => {
          try {
            await dbService.deleteReward(id);
            setRewards(rewards.filter(r => r.id !== id));
          } catch (err) { alert("Erro ao deletar."); }
        }} />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="soft-ui-card p-10 border-4 border-pink-50">
            <h3 className="text-lg font-black mb-8 flex items-center gap-3 text-pink-600"><Palette className="w-6 h-6" /> Estilo</h3>
            <div className="grid grid-cols-2 gap-4 mb-10">
              {['pink', 'lavender', 'mint', 'sunset'].map(t => (
                <button key={t} onClick={() => { dbService.updateCouple(couple.id, { theme: t as any }); setCouple({...couple, theme: t as any}); }} className={`p-6 rounded-[2rem] font-black text-sm capitalize border-4 transition-all ${couple.theme === t ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-transparent bg-gray-50 text-gray-400'}`}>{t}</button>
              ))}
            </div>
            <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-green-600"><CreditCard className="w-6 h-6" /> PIX do Casal</h3>
            <div className="flex gap-3">
              <input 
                type="text" placeholder="Chave Pix..." 
                className="flex-1 p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm"
                value={pixInput} onChange={e => setPixInput(e.target.value)}
              />
              <button onClick={async () => {
                try {
                  await dbService.updateCouple(couple.id, { pix_key: pixInput });
                  setCouple({...couple, pix_key: pixInput});
                  setMotivation('Pix atualizado! 💸');
                  setTimeout(() => setMotivation(''), 3000);
                } catch (err) { alert("Erro ao salvar."); }
              }} className="bg-pink-500 text-white px-6 rounded-2xl font-black text-xs">Salvar</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-22 bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-xl flex items-center justify-around px-2 border-2 border-white z-[300]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'dashboard' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
           <Heart className={`w-7 h-7 ${activeTab === 'dashboard' ? 'fill-pink-500' : ''}`} />
           <span className="text-[9px] font-black mt-1 uppercase tracking-widest">Ninho</span>
        </button>
        <button onClick={() => setActiveTab('rewards')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'rewards' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
           <Gift className={`w-7 h-7 ${activeTab === 'rewards' ? 'fill-pink-500' : ''}`} />
           <span className="text-[9px] font-black mt-1 uppercase tracking-widest">Mimos</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'settings' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
           <Settings className={`w-7 h-7 ${activeTab === 'settings' ? 'fill-pink-500' : ''}`} />
           <span className="text-[9px] font-black mt-1 uppercase tracking-widest">Ajustes</span>
        </button>
      </nav>

      {showReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[600] flex items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] p-12 w-full max-w-sm text-center border-[10px] border-pink-50 animate-in zoom-in">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h4 className="text-2xl font-black mb-4 font-cute">Briguinha? 🥺</h4>
            <p className="text-gray-500 font-bold mb-10 leading-relaxed text-sm">Zerar o contador é um novo começo. Que tal um abraço antes?</p>
            <button onClick={handleReset} className="w-full bg-red-500 text-white font-black py-6 rounded-[2rem] shadow-xl mb-4 hover:bg-red-600 transition-colors">Sim, Recomeçar</button>
            <button onClick={() => setShowReset(false)} className="w-full bg-pink-50 text-pink-500 font-black py-5 rounded-[2rem]">Não, estamos bem! 💖</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
