/**
 * Google Fit Data Aggregation Endpoint
 * GET /api/google-fit
 * Fetches and aggregates health data from Google Fit
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getStepsData,
  getHeartRateData,
  getSleepData,
  getWorkoutSessions,
  refreshGoogleToken,
  calculateStepsXP,
  calculateSleepXP,
  calculateWorkoutXP,
  GoogleFitData,
} from '@/lib/googleFit';

// Mock database function - replace with actual MongoDB query
async function getUserGoogleTokens(userId: string) {
  // TODO: Implement actual database query
  // const user = await User.findById(userId);
  // return user?.googleFit;

  // For now, return mock data
  return {
    accessToken: process.env.GOOGLE_FIT_TEST_TOKEN,
    refreshToken: process.env.GOOGLE_FIT_REFRESH_TOKEN,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  };
}

// Mock save function - replace with actual MongoDB update
async function updateUserGoogleFitData(userId: string, data: any) {
  // TODO: Implement actual database update
  // const user = await User.findByIdAndUpdate(userId, { healthMetrics: data }, { new: true });
  // return user;
  return { success: true };
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or headers
    const userId = request.nextUrl.searchParams.get('userId') || 'current-user';
    const authHeader = request.headers.get('authorization');

    // For development without auth, allow access. In production, require proper auth
    if (!userId && !authHeader) {
      return NextResponse.json(
        { error: 'User ID or authorization required' },
        { status: 401 }
      );
    }

    // Fetch user's Google Fit tokens
    const tokens = await getUserGoogleTokens(userId || 'current-user');

    if (!tokens?.accessToken) {
      // Return a demo response if no token (for development/testing)
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          steps: [
            { date: new Date().toISOString().split('T')[0], steps: 8234 },
            { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], steps: 12500 },
          ],
          heartRate: [
            { timestamp: Date.now(), bpm: 72 },
            { timestamp: Date.now() - 3600000, bpm: 68 },
          ],
          sleep: [
            { startTime: Date.now() - 86400000, endTime: Date.now() - 86400000 + 28800000, durationMinutes: 480, sleepStage: 'LIGHT' },
          ],
          workouts: [],
          lastSyncedAt: new Date().toISOString(),
          xp: { steps: 25, sleep: 40, workouts: 0, total: 65 },
          metrics: {
            totalSteps: 20734,
            avgDailySteps: 10367,
            avgHeartRate: 70,
            totalSleepHours: 8,
            avgDailySleepHours: 8,
            workoutCount: 0,
          },
          dataRange: { days: 7, startDate: new Date(Date.now() - 604800000).toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] },
          message: 'Demo data - connect Google Fit to see real data',
        });
      }

      return NextResponse.json(
        { error: 'Google Fit not connected. Please authorize first.' },
        { status: 403 }
      );
    }

    let accessToken = tokens.accessToken;

    // Check if token is expired and refresh if needed
    if (tokens.expiresAt && new Date(tokens.expiresAt) < new Date()) {
      if (tokens.refreshToken) {
        try {
          accessToken = await refreshGoogleToken(tokens.refreshToken);
          // TODO: Update refreshed token in database
        } catch (error) {
          console.error('Token refresh failed:', error);
          return NextResponse.json(
            { error: 'Failed to refresh Google Fit token. Please re-authorize.' },
            { status: 401 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Token expired and no refresh token available' },
          { status: 401 }
        );
      }
    }

    // Determine time range (default: last 7 days)
    const daysParam = request.nextUrl.searchParams.get('days');
    const days = Math.min(parseInt(daysParam || '7'), 90); // Max 90 days
    const endTime = Date.now();
    const startTime = endTime - days * 24 * 60 * 60 * 1000;

    // Fetch all health data in parallel
    const [stepsData, heartRateData, sleepData, workoutSessions] = await Promise.all([
      getStepsData(accessToken, startTime, endTime),
      getHeartRateData(accessToken, startTime, endTime),
      getSleepData(accessToken, startTime, endTime),
      getWorkoutSessions(accessToken, startTime, endTime),
    ]);

    // Calculate XP from activity
    const stepsXP = stepsData.reduce((sum, day) => sum + calculateStepsXP(day.steps), 0);
    const sleepXP = calculateSleepXP(sleepData);
    const workoutXP = calculateWorkoutXP(workoutSessions);
    const totalXP = stepsXP + sleepXP + workoutXP;

    // Calculate metrics
    const totalSteps = stepsData.reduce((sum, day) => sum + day.steps, 0);
    const avgDailySteps = Math.round(totalSteps / (days || 1));
    
    const avgHeartRate = heartRateData.length > 0
      ? Math.round(heartRateData.reduce((sum, point) => sum + point.bpm, 0) / heartRateData.length)
      : 0;

    const totalSleepMinutes = sleepData.reduce((sum, seg) => sum + seg.durationMinutes, 0);
    const totalSleepHours = Math.round((totalSleepMinutes / 60) * 10) / 10;
    const avgDailySleepHours = Math.round((totalSleepHours / (days || 1)) * 10) / 10;

    // Build response
    const response: GoogleFitData & {
      xp: {
        steps: number;
        sleep: number;
        workouts: number;
        total: number;
      };
      metrics: {
        totalSteps: number;
        avgDailySteps: number;
        avgHeartRate: number;
        totalSleepHours: number;
        avgDailySleepHours: number;
        workoutCount: number;
      };
      dataRange: {
        days: number;
        startDate: string;
        endDate: string;
      };
    } = {
      steps: stepsData,
      heartRate: heartRateData,
      sleep: sleepData,
      workouts: workoutSessions,
      lastSyncedAt: new Date().toISOString(),
      xp: {
        steps: stepsXP,
        sleep: sleepXP,
        workouts: workoutXP,
        total: totalXP,
      },
      metrics: {
        totalSteps,
        avgDailySteps,
        avgHeartRate,
        totalSleepHours,
        avgDailySleepHours,
        workoutCount: workoutSessions.length,
      },
      dataRange: {
        days,
        startDate: new Date(startTime).toISOString().split('T')[0],
        endDate: new Date(endTime).toISOString().split('T')[0],
      },
    };

    // Save metrics to database for later reference
    try {
      await updateUserGoogleFitData(userId || 'current-user', response);
    } catch (dbError) {
      console.error('Failed to save metrics to database:', dbError);
      // Don't fail the response if database save fails
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Google Fit data fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Google Fit data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
