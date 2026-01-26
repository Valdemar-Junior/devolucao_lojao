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
    console.log('Recebendo requisição para buscar venda');

    const { numero_lancamento, filial } = await req.json();

    console.log('Dados recebidos:', { numero_lancamento, filial });

    if (!numero_lancamento || !filial) {
      console.error('Dados incompletos');
      return new Response(
        JSON.stringify({ error: 'Número de lançamento e filial são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fazer a chamada para o webhook do n8n
    console.log('Enviando requisição para n8n...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const n8nResponse = await fetch('https://n8n.lojaodosmoveis.shop/webhook/devolucao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numero_lancamento,
        filial,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    console.log('Resposta do n8n - Status:', n8nResponse.status);

    if (!n8nResponse.ok) {
      const errText = await n8nResponse.text();
      console.error('Erro na resposta do n8n:', n8nResponse.statusText, errText);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar venda no n8n', details: errText || n8nResponse.statusText }),
        {
          status: n8nResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await n8nResponse.json();
    console.log('Dados recebidos do n8n:', data);

    return new Response(
      JSON.stringify(data),
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
