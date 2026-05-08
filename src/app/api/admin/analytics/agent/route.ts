import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 1. Fetch graph data for context securely from the Python Backend
        const graphResponse = await fetch(`${backendUrl}/api/admin-graph/analytics`, {
            method: 'GET',
            headers: {
                ...(authHeader ? { Authorization: authHeader } : {}),
                'Content-Type': 'application/json'
            }
        });
        
        if (!graphResponse.ok) {
           return NextResponse.json({ error: `Could not fetch platform context. Status: ${graphResponse.status}` }, { status: graphResponse.status });
        }
        
        const contextData = await graphResponse.json();
        
        const systemPrompt = `You are MessageIQ Intelligence Agent, a highly capable administrative AI for the Master Admin dashboard. 
Here is the LIVE platform data context injected dynamically: 
${JSON.stringify(contextData)}

You must answer the Master Admin's questions clearly, concisely, and accurately based entirely on this context. 
If asked about numbers, do the math based on this JSON context.`;
        
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY; 
        
        // Simulating the agent interaction if an API key is missing to prevent breaking the UI flow.
        // If they provided the key, we make the real call.
        if (!anthropicApiKey) {
            console.warn('Missing ANTHROPIC_API_KEY environment variable. Returning mock response for demo purposes.');
            return NextResponse.json({ 
                reply: `(Mock Mode: Missing API Key) I received your question: "${message}". In a real environment with ANTHROPIC_API_KEY set, I would analyze the ${contextData.stats.totalResellers} resellers and ${contextData.stats.totalDirectBusinesses} direct businesses to answer you.` 
            });
        }
        
        // 2. Call Anthropic
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514', // Exact model required by prompt
                max_tokens: 1000,
                system: systemPrompt,
                messages: [{ role: 'user', content: message }]
            })
        });
        
        if (!response.ok) {
            const err = await response.json();
            console.error('Anthropic Error:', err);
            return NextResponse.json({ error: `Anthropic API Error: ${err.error?.message || 'Unknown error'}` }, { status: response.status });
        }
        
        const anthropicData = await response.json();
        return NextResponse.json({ reply: anthropicData.content[0].text });
        
    } catch (error) {
        console.error('Agent route error:', error);
        return NextResponse.json({ error: 'Agent failed to process request' }, { status: 500 });
    }
}
