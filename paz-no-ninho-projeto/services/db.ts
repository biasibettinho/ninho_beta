
import { createClient } from '@supabase/supabase-js';
import { User, Couple, Reward, PaymentResponse } from '../types';

/**
 * 🚀 CONFIGURAÇÃO CORRIGIDA
 * Conectado ao projeto: czvowbxipooudzkkixjm
 */
const SUPABASE_URL = 'https://czvowbxipooudzkkixjm.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dm93YnhpcG9vdWR6a2tpeGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDA3NTQsImV4cCI6MjA4MjM3Njc1NH0.yIkJ1f2QtqUuwsKLWHUtPQZkZyUPUEAEa3fwOK0HMVk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const dbService = {
  async login(email: string): Promise<User | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            email, 
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` 
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        return newUser;
      }

      if (error) throw error;
      return user;
    } catch (e: any) {
      console.error("Erro no dbService.login:", e);
      throw new Error(e.message || "Falha na conexão com o banco de dados.");
    }
  },

  async generatePayment(buyerEmail: string): Promise<PaymentResponse> {
    // Note: Certifique-se de que a Edge Function 'mercadopago-checkout' existe no seu Supabase
    const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
      body: { 
        email: buyerEmail,
        amount: 2.75,
        description: "Ativação Paz no Ninho 💖"
      }
    });

    if (error) {
      console.error("Erro ao chamar Edge Function:", error);
      throw new Error("Erro na comunicação com o servidor de pagamento. Verifique se a Edge Function 'mercadopago-checkout' está implantada.");
    }
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data as PaymentResponse;
  },

  async checkPaymentStatus(paymentId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('check-payment', {
        body: { paymentId }
      });
      if (error) return 'pending';
      return data.status;
    } catch (e) {
      return 'pending';
    }
  },

  async createCouple(userId: string): Promise<Couple> {
    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert([{ 
        invite_code, 
        is_paid: true, 
        current_start_date: new Date().toISOString(),
        theme: 'pink',
        high_scores: []
      }])
      .select()
      .single();

    if (coupleError) throw coupleError;

    await supabase
      .from('users')
      .update({ couple_id: couple!.id })
      .eq('id', userId);

    return couple!;
  },

  async getCouple(coupleId: string): Promise<Couple | null> {
    const { data } = await supabase
      .from('couples')
      .select('*')
      .eq('id', coupleId)
      .single();
    return data;
  },

  async updateCouple(coupleId: string, updates: Partial<Couple>) {
    await supabase.from('couples').update(updates).eq('id', coupleId);
  },

  async joinCouple(userId: string, code: string): Promise<Couple | null> {
    const { data: couple } = await supabase
      .from('couples')
      .select('*')
      .eq('invite_code', code)
      .single();

    if (couple) {
      await supabase.from('users').update({ couple_id: couple.id }).eq('id', userId);
      return couple;
    }
    return null;
  },

  async resetCounter(coupleId: string, currentDays: number): Promise<Couple> {
    const { data: couple } = await supabase.from('couples').select('high_scores').eq('id', coupleId).single();
    const currentScores = couple?.high_scores || [];
    const newScores = [...currentScores, currentDays].sort((a, b) => b - a).slice(0, 3);
    
    const { data: updated } = await supabase
      .from('couples')
      .update({ 
        current_start_date: new Date().toISOString(), 
        high_scores: newScores 
      })
      .eq('id', coupleId)
      .select()
      .single();
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
