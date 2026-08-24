import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === 'superadmin' && password === 'Rtm#WebAdmin2026!') {
      return NextResponse.json({
        success: true,
        user: {
          username: 'superadmin',
          role: 'Super Administrator',
          name: 'RTM Administrator',
        },
        token: 'rtm_admin_jwt_session_token_2026',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Username atau password superadmin tidak valid.' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Bad Request' },
      { status: 400 }
    );
  }
}
