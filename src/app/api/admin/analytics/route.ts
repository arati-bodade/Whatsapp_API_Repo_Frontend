import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    
    // Fall back to 8000 for local Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
        const response = await fetch(`${backendUrl}/api/admin-graph/analytics`, {
            method: 'GET',
            headers: {
                ...(authHeader ? { Authorization: authHeader } : {}),
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
           return NextResponse.json({ error: `Backend returned ${response.status}` }, { status: response.status });
        }
        
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching admin analytics:', error);
        return NextResponse.json({ error: 'Internal server error while fetching graph data' }, { status: 500 });
    }
}
