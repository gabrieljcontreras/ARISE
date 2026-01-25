/**
 * Google Fit API Client
 * Integration for health data (steps, heart rate, sleep, workouts)
 */

const GOOGLE_FIT_BASE_URL = 'https://www.googleapis.com/fitness/v1/users/me';

export interface GoogleFitToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface StepsData {
  date: string;
  steps: number;
}

export interface HeartRatePoint {
  timestamp: number;
  bpm: number;
}

export interface SleepSegment {
  startTime: number;
  endTime: number;
  durationMinutes: number;
  sleepStage: 'AWAKE' | 'LIGHT' | 'DEEP' | 'REM';
}

export interface WorkoutSession {
  id: string;
  name: string;
  description: string;
  startTimeMillis: number;
  endTimeMillis: number;
  durationMillis: number;
  activityType: number;
  calories?: number;
}

export interface GoogleFitData {
  steps: StepsData[];
  heartRate: HeartRatePoint[];
  sleep: SleepSegment[];
  workouts: WorkoutSession[];
  lastSyncedAt: string;
}

/**
 * Helper to refresh expired Google tokens
 */
export async function refreshGoogleToken(refreshToken: string): Promise<string> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    throw error;
  }
}

/**
 * Fetch daily step count data
 */
export async function getStepsData(
  accessToken: string,
  startTime: number,
  endTime: number
): Promise<StepsData[]> {
  try {
    const response = await fetch(`${GOOGLE_FIT_BASE_URL}/dataset:aggregate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          {
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
          },
        ],
        bucketByTime: { durationMillis: 86400000 }, // Daily buckets
        startTimeMillis: startTime,
        endTimeMillis: endTime,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.statusText}`);
    }

    const data = await response.json();
    const stepsData: StepsData[] = [];

    if (data.bucket) {
      data.bucket.forEach((bucket: any) => {
        const steps = bucket.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;
        const dateTime = new Date(parseInt(bucket.startTimeMillis));
        stepsData.push({
          date: dateTime.toISOString().split('T')[0],
          steps,
        });
      });
    }

    return stepsData;
  } catch (error) {
    console.error('Error fetching steps data:', error);
    return [];
  }
}

/**
 * Fetch heart rate data
 */
export async function getHeartRateData(
  accessToken: string,
  startTime: number,
  endTime: number
): Promise<HeartRatePoint[]> {
  try {
    const response = await fetch(`${GOOGLE_FIT_BASE_URL}/dataset:aggregate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          {
            dataTypeName: 'com.google.heart_rate.bpm',
            dataSourceId: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
          },
        ],
        bucketByTime: { durationMillis: 3600000 }, // Hourly buckets
        startTimeMillis: startTime,
        endTimeMillis: endTime,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.statusText}`);
    }

    const data = await response.json();
    const heartRateData: HeartRatePoint[] = [];

    if (data.bucket) {
      data.bucket.forEach((bucket: any) => {
        const bpm = bucket.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0;
        const timestamp = parseInt(bucket.startTimeMillis);

        if (bpm > 0) {
          heartRateData.push({ timestamp, bpm: Math.round(bpm) });
        }
      });
    }

    return heartRateData;
  } catch (error) {
    console.error('Error fetching heart rate data:', error);
    return [];
  }
}

/**
 * Fetch sleep data
 */
export async function getSleepData(
  accessToken: string,
  startTime: number,
  endTime: number
): Promise<SleepSegment[]> {
  try {
    const response = await fetch(`${GOOGLE_FIT_BASE_URL}/dataset:aggregate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          {
            dataTypeName: 'com.google.sleep.segment',
            dataSourceId: 'derived:com.google.sleep.segment:com.google.android.gms:sleep_segment',
          },
        ],
        bucketByTime: { durationMillis: 86400000 }, // Daily buckets
        startTimeMillis: startTime,
        endTimeMillis: endTime,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.statusText}`);
    }

    const data = await response.json();
    const sleepData: SleepSegment[] = [];

    if (data.bucket) {
      data.bucket.forEach((bucket: any) => {
        bucket.dataset?.[0]?.point?.forEach((point: any) => {
          const startTime = parseInt(point.startTimeNanos) / 1000000;
          const endTime = parseInt(point.endTimeNanos) / 1000000;
          const durationMinutes = (endTime - startTime) / 60000;
          const sleepStage = point.value?.[0]?.intVal || 1; // 1=AWAKE, 2=LIGHT, 3=DEEP, 4=REM

          const stageMap: Record<number, 'AWAKE' | 'LIGHT' | 'DEEP' | 'REM'> = {
            1: 'AWAKE',
            2: 'LIGHT',
            3: 'DEEP',
            4: 'REM',
          };

          sleepData.push({
            startTime,
            endTime,
            durationMinutes,
            sleepStage: stageMap[sleepStage] || 'LIGHT',
          });
        });
      });
    }

    return sleepData;
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    return [];
  }
}

/**
 * Fetch workout sessions
 */
export async function getWorkoutSessions(
  accessToken: string,
  startTime: number,
  endTime: number
): Promise<WorkoutSession[]> {
  try {
    const startTimeISO = new Date(startTime).toISOString();
    const endTimeISO = new Date(endTime).toISOString();

    const response = await fetch(
      `${GOOGLE_FIT_BASE_URL}/sessions?startTime=${startTimeISO}&endTime=${endTimeISO}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Fit API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.session || [];
  } catch (error) {
    console.error('Error fetching workout sessions:', error);
    return [];
  }
}

/**
 * Activity type mapping for XP calculations
 */
export const ACTIVITY_TYPE_MAP: Record<number, { name: string; xpMultiplier: number }> = {
  1: { name: 'In vehicle', xpMultiplier: 0 },
  2: { name: 'Biking', xpMultiplier: 1.5 },
  3: { name: 'On foot', xpMultiplier: 1.0 },
  4: { name: 'Still', xpMultiplier: 0 },
  5: { name: 'Unknown', xpMultiplier: 0.5 },
  6: { name: 'Walking', xpMultiplier: 1.0 },
  7: { name: 'Running', xpMultiplier: 2.0 },
  8: { name: 'Climbing stairs', xpMultiplier: 2.5 },
  9: { name: 'Elliptical', xpMultiplier: 1.8 },
  10: { name: 'Soccer', xpMultiplier: 2.2 },
  11: { name: 'Basketball', xpMultiplier: 2.2 },
  12: { name: 'Badminton', xpMultiplier: 2.0 },
  13: { name: 'Tennis', xpMultiplier: 2.0 },
  14: { name: 'American football', xpMultiplier: 2.5 },
  15: { name: 'Baseball', xpMultiplier: 1.5 },
  16: { name: 'Volleyball', xpMultiplier: 2.0 },
  17: { name: 'Martial arts', xpMultiplier: 2.5 },
  18: { name: 'Weight training', xpMultiplier: 1.8 },
  19: { name: 'Yoga', xpMultiplier: 1.2 },
  20: { name: 'Pilates', xpMultiplier: 1.2 },
  21: { name: 'Swimming', xpMultiplier: 2.0 },
  22: { name: 'Gymnastics', xpMultiplier: 2.0 },
  23: { name: 'Dancing', xpMultiplier: 1.5 },
  24: { name: 'Ice skating', xpMultiplier: 1.8 },
  25: { name: 'Roller skating', xpMultiplier: 1.5 },
};

/**
 * Calculate XP from steps
 */
export function calculateStepsXP(steps: number): number {
  if (steps < 5000) return 0;
  if (steps < 10000) return 10;
  if (steps < 15000) return 25;
  if (steps < 20000) return 50;
  return 50 + Math.floor((steps - 20000) / 5000) * 10;
}

/**
 * Calculate XP from sleep
 */
export function calculateSleepXP(sleepSegments: SleepSegment[]): number {
  const totalMinutes = sleepSegments.reduce((sum, seg) => sum + seg.durationMinutes, 0);
  const hours = totalMinutes / 60;

  if (hours < 6) return 0;
  if (hours < 7) return 10;
  if (hours < 8) return 25;
  if (hours < 9) return 40;
  if (hours <= 10) return 50;
  return 40; // Oversleep penalty
}

/**
 * Calculate XP from workouts
 */
export function calculateWorkoutXP(sessions: WorkoutSession[]): number {
  let totalXP = 0;

  sessions.forEach((session) => {
    const durationMinutes = session.durationMillis / 60000;
    const activity = ACTIVITY_TYPE_MAP[session.activityType] || { name: 'Unknown', xpMultiplier: 1 };
    
    // Base XP: 1 per minute, multiplied by activity intensity
    const baseXP = Math.floor(durationMinutes * activity.xpMultiplier);
    totalXP += baseXP;
  });

  return totalXP;
}
