
import { createClient } from '@supabase/supabase-js';
import { User, Couple, Reward, PaymentResponse } from '../types';

const SUPABASE_URL = 'https://czvowbxipooudzkkixjm.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dm93YnhpcG9vdWR6a2tpeGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDA3NTQsImV4cCI6MjA4MjM3Njc1NH0.yIkJ1f2QtqUuwsKLWHUtPQZkZyUPUEAEa3fwOK0HMVk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const dbService = {
  async login(email: string): Promise<User | null> {
    try {
      const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
      return user; // Retorna null se não encontrar, sem criar nada ainda.
    } catch (e: any) { return null; }
  },

  async ensureUser(email: string): Promise<User> {
    const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();
    if (existingUser) return existingUser;

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ email, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` }])
      .select().single();
    if (error) throw error;
    return newUser;
  },

  async generatePayment(buyerEmail: string, plan: 'monthly' | 'lifetime'): Promise<PaymentResponse> {
    const amount = plan === 'monthly' ? 2.75 : 11.45;
    const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
      body: { 
        email: buyerEmail,
        amount: amount,
        description: `Plano ${plan === 'monthly' ? 'Mensal' : 'Vitalício'} Paz no Ninho 💖`
      }
    });
    if (error || data.error) throw new Error(data?.error || "Erro ao gerar Pix.");
    return data as PaymentResponse;
  },

  async checkPaymentStatus(paymentId: string): Promise<string> {
    const { data } = await supabase.functions.invoke('check-payment', { body: { paymentId } });
    return data?.status || 'pending';
  },

  async createCouple(userId: string, plan: 'monthly' | 'lifetime', referrerCode?: string): Promise<Couple> {
    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const isLifetime = plan === 'lifetime';
    
    let expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (referrerCode ? 35 : 30));

    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert([{ 
        invite_code, 
        is_paid: true,
        is_lifetime: isLifetime,
        expires_at: isLifetime ? null : expirationDate.toISOString(),
        current_start_date: new Date().toISOString(),
        theme: 'pink',
        high_scores: []
      }])
      .select().single();

    if (coupleError) throw coupleError;

    if (referrerCode) {
      const { data: padrinhos } = await supabase.from('couples').select('*').eq('invite_code', referrerCode.toUpperCase()).single();
      if (padrinhos && padrinhos.expires_at) {
        let newExp = new Date(padrinhos.expires_at);
        newExp.setDate(newExp.getDate() + 5);
        await supabase.from('couples').update({ 
          expires_at: newExp.toISOString(),
          referral_count: (padrinhos.referral_count || 0) + 1 
        }).eq('id', padrinhos.id);
      }
    }

    await supabase.from('users').update({ couple_id: couple!.id }).eq('id', userId);
    return couple!;
  },

  async getCouple(coupleId: string): Promise<Couple | null> {
    const { data } = await supabase.from('couples').select('*').eq('id', coupleId).single();
    return data;
  },

  async updateCouple(coupleId: string, updates: Partial<Couple>) {
    await supabase.from('couples').update(updates).eq('id', coupleId);
  },

  async joinCouple(userId: string, code: string): Promise<Couple | null> {
    const { data: couple } = await supabase.from('couples').select('*').eq('invite_code', code).single();
    if (couple) {
      await supabase.from('users').update({ couple_id: couple.id }).eq('id', userId);
      return couple;
    }
    return null;
  },

  async resetCounter(coupleId: string, currentDays: number): Promise<Couple> {
    const { data: couple } = await supabase.from('couples').select('high_scores').eq('id', coupleId).single();
    const newScores = [...(couple?.high_scores || []), currentDays].sort((a, b) => b - a).slice(0, 3);
    const { data: updated } = await supabase.from('couples').update({ current_start_date: new Date().toISOString(), high_scores: newScores }).eq('id', coupleId).select().single();
    return updated!;
  },

  async getRewards(coupleId: string): Promise<Reward[]> {
    const { data } = await supabase.from('rewards').select('*').eq('couple_id', coupleId).order('days_required', { ascending: true });
    return data || [];
  },

  async addReward(reward: any): Promise<Reward> {
    const { data } = await supabase.from('rewards').insert([reward]).select().single();
    return data!;
  },

  async deleteReward(id: string) {
    await supabase.from('rewards').delete().eq('id', id);
  }
};
