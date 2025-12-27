// Siga as instruções no painel do Supabase para fazer o deploy desta função.
// Ela gerencia a comunicação segura entre seu app e o PicPay.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Fix: Declare Deno namespace/variable to resolve type errors in non-Deno configured projects
declare const Deno: any;

const PICPAY_TOKEN = Deno.env.get('PICPAY_TOKEN') // Defina isso no painel do Supabase
const SELLER_TOKEN = Deno.env.get('PICPAY_SELLER_TOKEN')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { buyer, value, referenceId } = await req.json()

    // Payload para a API do PicPay
    const picPayPayload = {
      referenceId,
      callbackUrl: "https://seu-projeto.supabase.co/functions/v1/picpay-webhook",
      returnUrl: "https://seu-app.vercel.app/payment-complete",
      value,
      expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24h expiração
      buyer: {
        firstName: buyer.name.split(' ')[0],
        lastName: buyer.name.split(' ').slice(1).join(' ') || 'Partner',
        document: buyer.document,
        email: buyer.email
      }
    }

    const response = await fetch('https://appws.picpay.com/ecommerce/public/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-picpay-token': PICPAY_TOKEN || '',
      },
      body: JSON.stringify(picPayPayload)
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
