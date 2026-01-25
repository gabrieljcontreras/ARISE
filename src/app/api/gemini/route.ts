import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Models to try in order of preference
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemma-3-27b-it"
];

// Budget goal detection patterns
const BUDGET_PATTERNS = [
  /spend\s*(no more than|less than|under|at most|max(imum)?)\s*\$?(\d+)/i,
  /budget\s*\$?(\d+)/i,
  /limit\s*(my|the)?\s*\w*\s*to\s*\$?(\d+)/i,
  /\$?(\d+)\s*(or less|max|limit|budget)/i,
  /spend\s*\$?(\d+)\s*less/i,
  /cut\s*(back|down)\s*(\w+\s*)?\$?(\d+)/i,
  /save\s*\$?(\d+)\s*on/i,
  /reduce\s*(\w+\s*)?spending\s*(by)?\s*\$?(\d+)/i,
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  entertainment: ['entertainment', 'movies', 'games', 'gaming', 'streaming', 'netflix', 'spotify', 'fun', 'leisure'],
  food: ['food', 'eating', 'meals', 'eating out', 'takeout', 'delivery'],
  dining: ['dining', 'restaurants', 'dinner', 'lunch', 'brunch'],
  groceries: ['groceries', 'grocery', 'supermarket', 'food shopping'],
  shopping: ['shopping', 'clothes', 'amazon', 'online shopping', 'retail'],
  transportation: ['transportation', 'uber', 'lyft', 'gas', 'transit', 'commute'],
  subscriptions: ['subscriptions', 'subscription', 'monthly', 'recurring'],
  coffee: ['coffee', 'starbucks', 'cafe', 'caffeine'],
  alcohol: ['alcohol', 'drinks', 'bar', 'beer', 'wine', 'liquor'],
  travel: ['travel', 'vacation', 'trips', 'flights', 'hotels'],
};

const PERIOD_KEYWORDS: Record<string, string[]> = {
  day: ['today', 'daily', 'per day', 'a day', 'each day'],
  week: ['week', 'weekly', 'this week', 'per week', 'a week', 'next week'],
  month: ['month', 'monthly', 'this month', 'per month', 'a month', 'next month'],
};

// Quest detection patterns - expanded to catch intent phrases
const QUEST_PATTERNS = [
  /add\s*(a\s*)?(daily\s*)?quest/i,
  /create\s*(a\s*)?(daily\s*)?quest/i,
  /new\s*(daily\s*)?quest/i,
  /set\s*(a\s*)?(daily\s*)?quest/i,
  /add\s*(a\s*)?goal/i,
  /add\s*(a\s*)?task/i,
  /remind\s*me\s*to/i,
  /i\s*want\s*to/i,
  /i\s*plan\s*to/i,
  /i\s*need\s*to/i,
  /i\s*should/i,
  /i\s*will/i,
  /i('m|\s*am)\s*going\s*to/i,
  /i\s*have\s*to/i,
  /i\s*gotta/i,
  /i('d|\s*would)\s*like\s*to/i,
  /my\s*goal\s*is\s*to/i,
  /today\s*i('ll|\s*will)/i,
];

function detectQuestCreation(text: string, questType: 'financial' | 'health'): {
  isQuest: boolean;
  questText?: string;
  xp?: number;
} | null {
  const lowerText = text.toLowerCase();
  
  // Check if this looks like a quest creation request
  const hasQuestIntent = QUEST_PATTERNS.some(pattern => pattern.test(lowerText));
  
  if (!hasQuestIntent) return null;

  // Extract the quest description - remove the "add quest" prefix
  let questText = text
    .replace(/add\s*(a\s*)?(daily\s*)?quest\s*(to\s*)?/i, '')
    .replace(/create\s*(a\s*)?(daily\s*)?quest\s*(to\s*)?/i, '')
    .replace(/new\s*(daily\s*)?quest\s*(to\s*)?/i, '')
    .replace(/set\s*(a\s*)?(daily\s*)?quest\s*(to\s*)?/i, '')
    .replace(/add\s*(a\s*)?goal\s*(to\s*)?/i, '')
    .replace(/add\s*(a\s*)?task\s*(to\s*)?/i, '')
    .replace(/remind\s*me\s*to\s*/i, '')
    .replace(/i\s*want\s*to\s*/i, '')
    .trim();

  // Capitalize first letter
  if (questText) {
    questText = questText.charAt(0).toUpperCase() + questText.slice(1);
  }

  // Default XP based on quest type
  const xp = questType === 'financial' ? 15 : 20;

  return {
    isQuest: true,
    questText: questText || 'Complete daily task',
    xp
  };
}

function detectBudgetGoal(text: string): { 
  isBudgetGoal: boolean; 
  amount?: number; 
  category?: string; 
  period?: string;
  goalType?: 'limit' | 'reduction';
} | null {
  const lowerText = text.toLowerCase();
  
  // Check if this looks like a budget goal
  const budgetKeywords = ['spend', 'budget', 'limit', 'save', 'cut', 'reduce', 'no more than', 'less than'];
  const hasBudgetIntent = budgetKeywords.some(kw => lowerText.includes(kw));
  
  if (!hasBudgetIntent) return null;

  // Extract amount
  let amount: number | undefined;
  for (const pattern of BUDGET_PATTERNS) {
    const match = lowerText.match(pattern);
    if (match) {
      // Find the number in the match
      const numMatch = match[0].match(/\$?(\d+)/);
      if (numMatch) {
        amount = parseInt(numMatch[1], 10);
        break;
      }
    }
  }

  if (!amount) {
    // Try simple number extraction
    const simpleMatch = lowerText.match(/\$(\d+)/);
    if (simpleMatch) {
      amount = parseInt(simpleMatch[1], 10);
    }
  }

  if (!amount) return null;

  // Detect category
  let category: string | undefined;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      category = cat;
      break;
    }
  }

  // Detect period
  let period: string = 'week'; // default to week
  for (const [p, keywords] of Object.entries(PERIOD_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      period = p;
      break;
    }
  }

  // Detect goal type
  const isReduction = /less|reduce|cut|save\s*\$?\d+\s*on/i.test(lowerText);
  const goalType = isReduction ? 'reduction' : 'limit';

  return {
    isBudgetGoal: true,
    amount,
    category,
    period,
    goalType
  };
}

export async function POST(request: NextRequest) {
  try {
    const { task, questType = 'health' } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Check if this is a quest creation request FIRST
    const questCreation = detectQuestCreation(task, questType);
    
    if (questCreation && questCreation.isQuest) {
      // Use Gemini to format the quest nicely
      let formattedQuestText = questCreation.questText || 'Complete daily task';
      let xpReward = questCreation.xp || 15;
      
      try {
        const formatPrompt = `Format this into a clean, concise daily quest title (3-7 words max). Make it action-oriented and motivating.

User input: "${task}"
Quest type: ${questType}

Examples of good quest titles:
- "Run 5 kilometers"
- "Review monthly budget"
- "Drink 8 glasses of water"
- "Track all expenses today"
- "Complete 30 min workout"
- "Meal prep for the week"

Also estimate XP reward (10-30) based on difficulty/effort required.

Return ONLY valid JSON in this exact format:
{"title": "Your quest title here", "xp": 15}`;

        const model = genAI.getGenerativeModel({ model: MODELS[0] });
        const result = await model.generateContent(formatPrompt);
        let responseText = result.response.text().trim();
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const parsed = JSON.parse(responseText);
        if (parsed.title) {
          formattedQuestText = parsed.title;
        }
        if (parsed.xp && typeof parsed.xp === 'number') {
          xpReward = Math.min(30, Math.max(10, parsed.xp));
        }
      } catch (error) {
        console.log('Quest formatting fallback:', error);
        // Keep the basic parsed text if Gemini fails
      }
      
      return NextResponse.json({
        dailyQuest: {
          created: true,
          id: `quest_${Date.now()}`,
          text: formattedQuestText,
          xp: xpReward,
          category: questType
        },
        message: `✅ Quest added: "${formattedQuestText}" (+${xpReward} XP when completed)`
      });
    }

    // Check if this is a budget goal request
    const budgetGoal = detectBudgetGoal(task);
    
    if (budgetGoal && budgetGoal.isBudgetGoal && budgetGoal.amount) {
      // Handle budget goal creation
      let category = budgetGoal.category;
      
      // If category not detected, use Gemini to determine it
      if (!category) {
        try {
          const categoryPrompt = `What spending category best describes this budget goal? "${task}"
          
Choose ONLY from: entertainment, food, dining, groceries, shopping, transportation, subscriptions, coffee, alcohol, travel, other

Return ONLY the category name, nothing else.`;
          
          const model = genAI.getGenerativeModel({ model: MODELS[0] });
          const result = await model.generateContent(categoryPrompt);
          category = result.response.text().trim().toLowerCase();
          
          // Validate it's a valid category
          const validCategories = ['entertainment', 'food', 'dining', 'groceries', 'shopping', 'transportation', 'subscriptions', 'coffee', 'alcohol', 'travel', 'other'];
          if (!validCategories.includes(category)) {
            category = 'other';
          }
        } catch {
          category = 'other';
        }
      }

      // Create the budget goal via API
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const goalResponse = await fetch(`${baseUrl}/api/budget-goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalType: budgetGoal.goalType,
            category,
            amount: budgetGoal.amount,
            period: budgetGoal.period,
            originalInput: task,
            motivationMessage: `You've committed to ${budgetGoal.goalType === 'limit' ? 'limiting' : 'reducing'} ${category} spending to $${budgetGoal.amount} per ${budgetGoal.period}. You've got this! 💪`
          })
        });

        const goalData = await goalResponse.json();

        if (goalData.success) {
          const periodText = budgetGoal.period === 'day' ? 'today' : `this ${budgetGoal.period}`;
          return NextResponse.json({
            budgetGoal: {
              created: true,
              ...goalData.goal
            },
            message: `🎯 Budget goal set! I'll track your ${category} spending and alert you when you're getting close to your $${budgetGoal.amount} limit ${periodText}. ${budgetGoal.goalType === 'reduction' ? "Let's beat your previous spending!" : "Stay disciplined!"}`
          });
        }
      } catch (error) {
        console.error('Failed to create budget goal:', error);
      }

      // Fallback response if API call fails
      return NextResponse.json({
        budgetGoal: {
          created: false,
          category,
          amount: budgetGoal.amount,
          period: budgetGoal.period,
          goalType: budgetGoal.goalType
        },
        message: `I understand you want to ${budgetGoal.goalType === 'limit' ? 'limit' : 'reduce'} ${category} spending to $${budgetGoal.amount} per ${budgetGoal.period}. I'll help you track this! 📊`
      });
    }

    // Check if this is a help/advice/question request (NOT an activity log)
    const helpPatterns = [
      /how\s+(can|do|should)\s+i/i,
      /what\s+(should|can|do)\s+i/i,
      /can\s+you\s+(help|tell|explain|suggest|recommend|give)/i,
      /i\s+need\s+(help|advice|tips|suggestions)/i,
      /any\s+(tips|advice|suggestions|recommendations)/i,
      /what('s|\s+is)\s+the\s+best\s+(way|method|approach)/i,
      /how\s+to\s+/i,
      /ways\s+to\s+/i,
      /help\s+me\s+(with|to|understand)/i,
      /i('m|\s+am)\s+(struggling|having\s+trouble|confused|unsure|not\s+sure)/i,
      /what\s+are\s+some/i,
      /could\s+you\s+(help|explain|suggest|recommend)/i,
      /i\s+don('t|'t)\s+know\s+how/i,
      /where\s+do\s+i\s+start/i,
      /give\s+me\s+(some|a few)?\s*(tips|advice|ideas)/i,
      /\?\s*$/,  // Ends with a question mark
    ];
    
    const lowerTask = task.toLowerCase();
    const isHelpRequest = helpPatterns.some(pattern => pattern.test(task));
    
    // Additional check: questions about improvement topics
    const improvementTopics = [
      'save money', 'saving', 'budget', 'invest', 'debt', 'spending',
      'lose weight', 'get fit', 'exercise', 'workout', 'nutrition', 'diet',
      'eat healthy', 'sleep better', 'motivation', 'discipline', 'habits',
      'improve', 'better', 'healthier', 'stronger', 'faster'
    ];
    const mentionsImprovementTopic = improvementTopics.some(topic => lowerTask.includes(topic));
    
    // If it's a help request (not logging an activity they DID)
    const pastTenseIndicators = ['i did', 'i ran', 'i ate', 'i saved', 'i worked', 'i completed', 'i finished', 'just did', 'just finished', 'today i'];
    const isPastActivity = pastTenseIndicators.some(indicator => lowerTask.includes(indicator));
    
    if (isHelpRequest && !isPastActivity) {
      // This is a help/advice request - give a thoughtful response
      const helpPrompt = `Answer this question concisely:

"${task}"

Rules:
- Give a SHORT, direct answer (3-5 sentences max)
- One key tip or insight, not a list
- Be friendly but brief
- No fluff, no intros like "Great question!"
- One emoji max at the end if it fits naturally

Just answer directly.`;

      // Try each model until one works
      let lastError: Error | null = null;
      for (const modelName of MODELS) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(helpPrompt);
          const helpResponse = result.response.text().trim();
          
          if (helpResponse) {
            return NextResponse.json({
              message: helpResponse,
              isAdvice: true
            });
          }
        } catch (error) {
          lastError = error as Error;
          console.log(`Help request - Model ${modelName} failed, trying next...`);
          continue;
        }
      }
      
      // All models failed - log the error and return fallback
      console.error('All models failed for help request:', lastError);
      return NextResponse.json({
        message: "I'd love to help! Could you tell me a bit more about what you're looking to improve? I can offer tips on budgeting, saving, workouts, nutrition, and building healthy habits. 💪",
        isAdvice: true
      });
    }

    // Regular task analysis (existing logic)
    const prompt = `You are a life gamification assistant. Analyze the following task/activity and determine how it should affect the user's stats.

IMPORTANT: Scale XP rewards based on THREE factors:
1. DURATION - How long the activity took
2. INTENSITY/EFFORT - Physical or mental exertion required  
3. COMPLEXITY/DIFFICULTY - How challenging the activity is

=== HEALTH ACTIVITY SCALING ===

DURATION BASE XP:
- Quick (5-15 min): 5-10 XP
- Short (15-30 min): 10-20 XP
- Medium (30-60 min): 20-35 XP
- Long (1-2 hours): 35-50 XP
- Very Long (2+ hours): 50-80 XP

INTENSITY MULTIPLIER:
- Light (walking, stretching, yoga): 1.0x
- Moderate (jogging, swimming, cycling): 1.3x
- High (running, weight lifting, sports): 1.6x
- Intense (HIIT, CrossFit, sprints, heavy lifting): 2.0x
- Extreme (marathon, competition, max effort): 2.5x

HEALTH SUB-STATS (1-15 scale based on activity type & intensity):
- strength: weightlifting, pushups, resistance training, climbing
- speed: running, sprinting, cycling, cardio, HIIT
- nutrition: meal prep, healthy eating, tracking macros, cooking

HEALTH EXAMPLES:
- "Walked for 20 minutes" = 12 base × 1.0 = 12 XP, speed: 2, strength: 1
- "Jogged for 30 minutes" = 20 base × 1.3 = 26 XP, speed: 5, strength: 2
- "Ran 5 miles" = 35 base × 1.6 = 56 XP, speed: 8, strength: 3
- "Did 50 pushups" = 15 base × 1.6 = 24 XP, strength: 6, speed: 1
- "Heavy deadlifts for 45 min" = 30 base × 2.0 = 60 XP, strength: 12, speed: 2
- "1 hour CrossFit class" = 35 base × 2.0 = 70 XP, strength: 10, speed: 8
- "Did yoga for 30 min" = 20 base × 1.0 = 20 XP, strength: 3, speed: 1
- "Meal prepped healthy lunches" = 25 XP, nutrition: 8
- "Ate a salad for lunch" = 10 XP, nutrition: 4
- "Tracked all my macros today" = 15 XP, nutrition: 5
- "Drank 8 glasses of water" = 10 XP, nutrition: 3
- "Ran a marathon" = 80 base × 2.5 = 200 XP, speed: 15, strength: 8

=== FINANCIAL ACTIVITY SCALING ===
- Basic (checking balance, small savings): 10-20 XP
- Moderate (budgeting, expense tracking): 20-35 XP
- Advanced (investing, tax planning): 35-60 XP
- Expert (portfolio rebalancing, complex investments): 60-100 XP

=== INTELLIGENCE ACTIVITY SCALING ===
- Easy subjects (basic skills, casual reading): 1.0x
- Moderate (intermediate topics, focused study): 1.3x
- Challenging (advanced subjects, complex skills): 1.6x
- Expert (PhD-level, highly technical): 2.0-2.5x

The stats are:
- finances: { level, currentXP } - for money-related activities
- health: { level, currentXP, strength, speed, nutrition } - for health activities
- intelligence: { level, currentXP } - for learning activities

=== ACTIVITY TRACKING DATA ===
For HEALTH activities, you MUST also include an "activityData" object with these fields:
- For WORKOUTS (strength, cardio, exercise): include { type: "workout", workoutType: "Strength|Cardio|HIIT|Yoga|Other", duration: <minutes>, description: "<short description>" }
- For NUTRITION activities: include { type: "nutrition", meal: "Breakfast|Lunch|Dinner|Snacks", calories: <estimated calories>, protein: <estimated grams> }
- For SLEEP activities: include { type: "sleep", hours: <number>, quality: "poor|fair|good|excellent" }

For FINANCIAL activities, include "activityData" object with:
- { type: "savings", amount: <dollar amount saved> }
- { type: "investment", amount: <dollar amount>, growth: <percentage> }
- { type: "budget", category: "<category>", amount: <spent amount> }
- { type: "debt", amount: <amount paid toward debt> }

Return ONLY a valid JSON object with the stat changes. Use positive numbers for boosts. Only include stats that should change.

Example response for "I ran for 30 minutes":
{"health": {"currentXP": 30, "speed": 6, "strength": 2}, "activityData": {"type": "workout", "workoutType": "Cardio", "duration": 30, "description": "Running"}, "message": "Great cardio session! +30 Health XP 🏃"}

Example response for "I did heavy squats and bench press for an hour":
{"health": {"currentXP": 65, "strength": 12, "speed": 2}, "activityData": {"type": "workout", "workoutType": "Strength", "duration": 60, "description": "Heavy squats and bench press"}, "message": "Beast mode! Heavy lifting pays off! +65 Health XP 💪"}

Example response for "I ate 1500 calories with 80g protein today":
{"health": {"currentXP": 15, "nutrition": 6}, "activityData": {"type": "nutrition", "meal": "Daily Total", "calories": 1500, "protein": 80}, "message": "Great nutrition tracking! +15 Health XP 🥗"}

Example response for "I ate a healthy breakfast with eggs and vegetables":
{"health": {"currentXP": 12, "nutrition": 5}, "activityData": {"type": "nutrition", "meal": "Breakfast", "calories": 450, "protein": 25}, "message": "Fueling your body right! +12 Health XP 🥗"}

Example response for "I saved $200 this week":
{"finances": {"currentXP": 35}, "activityData": {"type": "savings", "amount": 200}, "message": "Great saving habit! +35 Finance XP 💰"}

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
