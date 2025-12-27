
export interface User {
  id: string;
  email: string;
  couple_id: string | null;
  avatar_url: string;
}

export interface Couple {
  id: string;
  invite_code: string;
  current_start_date: string;
  expires_at: string | null;
  is_lifetime: boolean;
  referral_count: number;
  high_scores: number[];
  partner_names: string[];
  theme: 'pink' | 'lavender' | 'mint' | 'sunset';
  couple_photo?: string;
  pix_key?: string;
  is_paid: boolean;
}

export interface Reward {
  id: string;
  couple_id: string;
  days_required: number;
  description: string;
  achieved: boolean;
}

export interface PaymentResponse {
  id: string;
  qr_code: string;
  qr_code_base64: string;
  status: string;
  payment_url: string;
}
