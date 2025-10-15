// app/api/auth/register/route.ts (Updated with DAL)

import { NextRequest, NextResponse } from 'next/server';
import { UserDAL } from '@/lib/dal/user.dal';
import { RateLimiterSystem } from '@/lib/security/auth/rate-limiter';
import { ValidationUtils } from '@/lib/utils/validation';
import { RegisterUserDTO } from '@/lib/dtos/user.dto';
import { UserMapper } from '@/lib/mappers/user.mapper';

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
          retryAfter: 900, // 15 minutes in seconds
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

    // Check if user already exists using DAL
    const existingUser = await UserDAL.existsByEmailOrUsername(email, username);

    if (existingUser) {
      // Determine which field conflicts
      const emailUser = await UserDAL.findByEmail(email);
      const field = emailUser ? 'email' : 'username';
      
      return NextResponse.json(
        { error: `A user with this ${field} already exists` },
        { status: 409 }
      );
    }

    // Create user DTO
    const registerDTO: RegisterUserDTO = {
      email,
      password,
      username,
      fullName,
      dob,
    };

    // Create new user using DAL
    const user = await UserDAL.createUser(registerDTO);

    // Convert to base DTO for response
    const userResponse = UserMapper.toBaseDTO(user);

    // TODO: Send verification email
    // await sendVerificationEmail(email, user.emailVerificationToken);

    return NextResponse.json(
      {
        message:
          'User registered successfully. Please check your email to verify your account.',
        user: userResponse,
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
          { error: 'User with this email or username already exists' + error.message},
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