// ===== API ROUTE: app/api/auth/register/route.ts =====
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/security/auth/db/provider';
import { User } from '@/lib/units/models/User';
import { RateLimiterSystem } from '@/lib/security/auth/rate-limiter';

const rateLimiter = new RateLimiterSystem();

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = rateLimiter.checkRequest(clientIp, 'register');
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, username, fullName, dob } = body;

    // Validation
    if (!email || !password || !username || !fullName || !dob) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { user_handler: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      user_handler: username.toLowerCase(),
      user_full_name: fullName,
      user_dob: dob,
      user_role: ['REG']
    });

    await user.save();

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
