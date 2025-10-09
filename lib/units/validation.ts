export class ValidationUtils {
  static validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (email.length > 254) {
      return { valid: false, error: 'Email is too long' };
    }

    return { valid: true };
  }

  static validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username) {
      return { valid: false, error: 'Username is required' };
    }

    if (username.length < 3 || username.length > 30) {
      return { valid: false, error: 'Username must be between 3 and 30 characters' };
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return {
        valid: false,
        error: 'Username can only contain letters, numbers, hyphens, and underscores',
      };
    }

    return { valid: true };
  }

  static validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password) {
      return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password is too long' };
    }

    // Check for at least one uppercase, one lowercase, one number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      };
    }

    return { valid: true };
  }

  static validateFullName(fullName: string): { valid: boolean; error?: string } {
    if (!fullName || fullName.trim().length === 0) {
      return { valid: false, error: 'Full name is required' };
    }

    if (fullName.length > 100) {
      return { valid: false, error: 'Full name is too long' };
    }

    return { valid: true };
  }

  static validateDOB(dob: string): { valid: boolean; error?: string } {
    if (!dob) {
      return { valid: false, error: 'Date of birth is required' };
    }

    const date = new Date(dob);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }

    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();

    if (age < 13) {
      return { valid: false, error: 'You must be at least 13 years old to register' };
    }

    if (age > 120) {
      return { valid: false, error: 'Invalid date of birth' };
    }

    return { valid: true };
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}
