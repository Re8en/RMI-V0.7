// Supabase Edge Function: gemini-proxy
// Proxies Gemini API calls server-side to keep the API key secret.

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY not configured as secret' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { message, systemInstruction } = await req.json();

        if (!message) {
            return new Response(
                JSON.stringify({ error: 'Missing message field' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Call Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const geminiBody = {
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: systemInstruction
                ? { parts: [{ text: systemInstruction }] }
                : undefined,
        };

        const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        });

        if (!geminiRes.ok) {
            const errBody = await geminiRes.text();
            console.error('Gemini API error:', geminiRes.status, errBody);
            return new Response(
                JSON.stringify({ error: 'Gemini API error', status: geminiRes.status, details: errBody }),
                { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '...';

        return new Response(
            JSON.stringify({ text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('Edge function error:', err);
        return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
