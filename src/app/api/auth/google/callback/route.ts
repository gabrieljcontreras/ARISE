/**
 * Google OAuth Callback Handler
 * POST /api/auth/google
 * Handles OAuth code exchange for Google Fit access
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { error: 'No state parameter provided' },
        { status: 400 }
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 500 }
      );
    }

    const tokens = await tokenResponse.json();

    // TODO: Store tokens in database with user ID from state
    // Save to user's googleFit field:
    // {
    //   accessToken: tokens.access_token,
    //   refreshToken: tokens.refresh_token,
    //   expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    //   connectedAt: new Date(),
    //   lastSyncedAt: null
    // }

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      new URL(`/dashboard?googleFitConnected=true`, request.url)
    );
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      {
        error: 'OAuth callback failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to initiate OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const scopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.sleep.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`,
      response_type: 'code',
      scope: scopes.join(' '),
      state: userId,
      access_type: 'offline',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('OAuth init error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate OAuth',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
