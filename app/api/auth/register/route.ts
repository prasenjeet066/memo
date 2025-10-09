import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/security/auth/db/provider';
import { User } from '@/lib/units/models/User';
import { RateLimiterSystem } from '@/lib/security/auth/rate-limiter';
import { ValidationUtils } from '@/lib/utils/validation';
import crypto from 'crypto';

const rateLimiter = new RateLimiterSystem();

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = rateLimiter.checkRequest(clientIp, 'register');

    if (!isAllowed) {
      return NextResponse.json(
        { 
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: 900 // 15 minutes in seconds
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    let { email, password, username, fullName, dob } = body;

    // Sanitize inputs
    email = ValidationUtils.sanitizeInput(email?.toLowerCase() || '');
    username = ValidationUtils.sanitizeInput(username?.toLowerCase() || '');
    fullName = ValidationUtils.sanitizeInput(fullName || '');

    // Validate email
    const emailValidation = ValidationUtils.validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate username
    const usernameValidation = ValidationUtils.validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = ValidationUtils.validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Validate full name
    const fullNameValidation = ValidationUtils.validateFullName(fullName);
    if (!fullNameValidation.valid) {
      return NextResponse.json(
        { error: fullNameValidation.error },
        { status: 400 }
      );
    }

    // Validate DOB
    const dobValidation = ValidationUtils.validateDOB(dob);
    if (!dobValidation.valid) {
      return NextResponse.json(
        { error: dobValidation.error },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { user_handler: username },
      ],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return NextResponse.json(
        { error: `A user with this ${field} already exists` },
        { status: 409 }
      );
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = new User({
      email,
      password,
      user_handler: username,
      user_full_name: fullName,
      user_dob: dob,
      user_role: ['REG'],
      emailVerificationToken,
      emailVerificationExpires,
      is_email_verified: false,
    });

    await user.save();

    // TODO: Send verification email
    // await sendVerificationEmail(email, emailVerificationToken);

    return NextResponse.json(
      {
        message: 'User registered successfully. Please check your email to verify your account.',
        userId: user._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: 'Invalid data provided' },
          { status: 400 }
        );
      }
      if (error.name === 'MongoServerError' && (error as any).code === 11000) {
        return NextResponse.json(
          { error: 'User with this email or username already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}