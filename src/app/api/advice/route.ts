import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure this is correctly set
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Change model as needed
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API Error:', await response.text());
      return NextResponse.json({ error: 'Failed to fetch advice' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ response: data.choices[0].message.content });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
