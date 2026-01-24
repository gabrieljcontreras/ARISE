import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Models to try in order of preference
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemma-3-27b-it"
];

export async function POST(request: NextRequest) {
  try {
    const { task } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `You are a life gamification assistant. Analyze the following task/activity and determine how it should affect the user's stats. 
                  
The stats are:
- finances: { level, currentXP } - for money-related activities (saving, earning, investing)
- health: { level, currentXP, strength, speed, nutrition } - for health activities (exercise, eating healthy, sleep)
- intelligence: { level, currentXP } - for learning activities (reading, studying, courses)

Return ONLY a valid JSON object with the stat changes. Use positive numbers for boosts and negative for penalties. Only include stats that should change. XP changes should be between 5-25 points. Sub-stats (strength, speed, nutrition) are percentages 0-100.

Example response for "I had 1lb of salmon":
{"health": {"currentXP": 15, "nutrition": 10}, "message": "Great protein choice! +15 Health XP, +10% Nutrition"}

Example response for "I saved $100":
{"finances": {"currentXP": 20}, "message": "Smart saving! +20 Finance XP"}

Example response for "I read for 2 hours":
{"intelligence": {"currentXP": 25}, "message": "Knowledge is power! +25 Intelligence XP"}

Now analyze this task: "${task}"`;

    // Try each model until one works
    let lastError: Error | null = null;
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        try {
          const statChanges = JSON.parse(text);
          return NextResponse.json(statChanges);
        } catch {
          return NextResponse.json({ message: "Could not parse response", raw: text });
        }
      } catch (error) {
        lastError = error as Error;
        console.log(`Model ${modelName} failed, trying next...`);
        continue;
      }
    }

    // All models failed
    console.error('All Gemini models failed:', lastError);
    return NextResponse.json({ 
      error: 'Failed to analyze task - all models exhausted', 
      details: String(lastError) 
    }, { status: 500 });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ error: 'Failed to analyze task', details: String(error) }, { status: 500 });
  }
}
