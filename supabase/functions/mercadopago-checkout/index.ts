
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, amount, description } = await req.json()
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    
    if (!MP_ACCESS_TOKEN) throw new Error("Token MP não configurado.")

    // Log para debug (aparece no console do Supabase)
    console.log(`Gerando Pix para: ${email}, valor: ${amount}`)

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: Number(amount),
        description: description,
        payment_method_id: 'pix',
        // Alguns tokens de produção exigem que o payer tenha e-mail válido
        payer: {
          email: email || 'test_user_123@testuser.com',
          first_name: 'Usuario',
          last_name: 'PazNoNinho'
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Erro MP:", data)
      return new Response(JSON.stringify({ error: data.message || "Erro no Mercado Pago" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

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
