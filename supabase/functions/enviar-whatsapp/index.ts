const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Recebendo requisição para enviar WhatsApp');
    
    const requestData = await req.json();
    
    console.log('Dados da solicitação:', {
      filial: requestData.filial,
      solicitante: requestData.solicitante,
      tipo_solicitacao: requestData.tipo_solicitacao,
      numero_lancamento: requestData.numero_lancamento,
      itens_count: requestData.itens_selecionados?.length || 0,
    });

    // Fazer a chamada para o webhook do n8n
    console.log('Enviando para n8n/Evolution...');
    const n8nResponse = await fetch('https://n8n.joylar.shop/webhook-test/enviar_zap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('Resposta do n8n - Status:', n8nResponse.status);

    if (!n8nResponse.ok) {
      console.error('Erro na resposta do n8n:', n8nResponse.statusText);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar mensagem para WhatsApp' }),
        { 
          status: n8nResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Tentar ler a resposta se houver
    let responseData = { success: true };
    try {
      const text = await n8nResponse.text();
      if (text) {
        responseData = JSON.parse(text);
      }
    } catch (e) {
      console.log('Resposta sem corpo ou não-JSON (normal para alguns webhooks)');
    }

    console.log('Mensagem enviada com sucesso');

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
