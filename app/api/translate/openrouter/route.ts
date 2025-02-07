import { NextResponse } from 'next/server';
import { getModelConfig } from '@/config/models';

export async function POST(request: Request) {
  try {
    const { text, modelId = 'deepseek' } = await request.json();
    
    try {
      const modelConfig = getModelConfig(modelId);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL, // Optional
          'X-Title': 'Translation App' // Optional
        } as RequestInit['headers'],
        body: JSON.stringify({
          model: modelConfig.modelName,
          messages: [
            {
              role: 'system',
              content: 'You are a professional English to Hungarian translator. Only provide the translation without any explanation or additional text. Maintain any formatting, special characters, and technical terms.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: modelConfig.temperature,
          max_tokens: modelConfig.maxTokens,
          stream: false
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'OpenRouter API error');
      }

      const result = await response.json();
      
      return NextResponse.json({
        translation: result.choices[0].message.content.trim()
      });

    } catch (error) {
      return NextResponse.json(
        { error: (error as any).message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: (error as any).message },
      { status: 500 }
    );
  }
}
