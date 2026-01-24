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

IMPORTANT: Scale XP rewards based on THREE factors:
1. DURATION - How long the activity took
2. INTENSITY/EFFORT - Physical or mental exertion required
3. COMPLEXITY/DIFFICULTY - How challenging the subject matter or activity is

XP SCALING GUIDE:
Base XP by duration:
- Quick tasks (5-30 min): 5-15 base XP
- Medium tasks (30 min - 2 hours): 15-30 base XP  
- Long tasks (2-4 hours): 30-50 base XP
- Very long tasks (4+ hours): 50-75 base XP

Then multiply by complexity modifier:
- Easy/Basic (algebra 1, light jog, basic cooking): 1.0x
- Moderate (calculus, weight training, intermediate recipes): 1.3x
- Challenging (organic chemistry, HIIT, gourmet cooking): 1.6x
- Advanced (quantum physics, marathon training, professional skills): 2.0x
- Expert (PhD-level research, Olympic training, mastery-level skills): 2.5x

EXAMPLES:
- "Studied algebra 1 for 2 hours" = 25 base × 1.0 = 25 XP
- "Studied quantum physics for 2 hours" = 25 base × 2.0 = 50 XP
- "Jogged for 30 min" = 20 base × 1.0 = 20 XP
- "Did CrossFit for 30 min" = 20 base × 1.5 = 30 XP
- "Read a novel for 1 hour" = 15 base × 1.0 = 15 XP
- "Read academic papers for 1 hour" = 15 base × 1.8 = 27 XP

The stats are:
- finances: { level, currentXP } - for money-related activities. Scale by amount AND complexity (investing > saving > budgeting).
- health: { level, currentXP, strength, speed, nutrition } - for health activities. Scale by duration AND intensity.
- intelligence: { level, currentXP } - for learning activities. Scale by time AND subject difficulty.

Return ONLY a valid JSON object with the stat changes. Use positive numbers for boosts and negative for penalties. Only include stats that should change. Sub-stats (strength, speed, nutrition) changes should be between 1-15 based on intensity.

Example response for "I studied algebra for 2 hours":
{"intelligence": {"currentXP": 25}, "message": "Solid math practice! +25 Intelligence XP"}

Example response for "I studied quantum physics for 2 hours":
{"intelligence": {"currentXP": 50}, "message": "Quantum physics is seriously challenging! +50 Intelligence XP"}

Example response for "I went for a light jog for 30 minutes":
{"health": {"currentXP": 20, "speed": 4, "strength": 2}, "message": "Nice easy run! +20 Health XP"}

Example response for "I did intense HIIT training for 30 minutes":
{"health": {"currentXP": 35, "speed": 6, "strength": 8}, "message": "HIIT is brutal! Great work! +35 Health XP"}

Example response for "I saved $100":
{"finances": {"currentXP": 20}, "message": "Smart saving! +20 Finance XP"}

Example response for "I invested $100 in index funds":
{"finances": {"currentXP": 35}, "message": "Investing takes knowledge! +35 Finance XP"}

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
