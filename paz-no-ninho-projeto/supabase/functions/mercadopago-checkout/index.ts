
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Fix: Declare Deno namespace/variable to resolve type errors in non-Deno configured projects
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Trata o preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, amount, description } = await req.json()
    
    // Pega o token que você salvou nos Secrets do Supabase
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    
    if (!MP_ACCESS_TOKEN) {
      throw new Error("Erro: MP_ACCESS_TOKEN não configurado no Supabase.")
    }

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: 'Usuario',
          last_name: 'PazNoNinho'
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.message || "Erro no Mercado Pago" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Retorna exatamente o que o frontend espera
    const result = {
      id: data.id.toString(),
      qr_code: data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
      status: data.status,
    }

    return new Response(JSON.stringify(result), {
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
