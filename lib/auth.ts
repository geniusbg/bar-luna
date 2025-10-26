import { prisma } from './prisma';
import crypto from 'crypto';

// Hash password with salt
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Get user by email
export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });
}

// Login user (verify credentials)
export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    throw new Error('Account is disabled');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Return user data (without password hash)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
  };
}

// Create new user (for admins)
export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  createdBy?: string;
}) {
  const passwordHash = await hashPassword(data.password);

  return await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role as any,
      createdBy: data.createdBy,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

// Check role permissions (higher number = more permissions)
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    STAFF: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Check if user can delete another user based on roles
export function canDeleteUser(currentUserRole: string, targetUserRole: string): boolean {
  // Only SUPER_ADMIN can delete ADMIN or SUPER_ADMIN
  if (targetUserRole === 'ADMIN' || targetUserRole === 'SUPER_ADMIN') {
    return currentUserRole === 'SUPER_ADMIN';
  }
  // Admin can delete STAFF
  if (targetUserRole === 'STAFF') {
    return currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';
  }
  return false;
}

// Check if user can edit another user
export function canEditUser(currentUserRole: string, targetUserRole: string): boolean {
  // Only SUPER_ADMIN can edit SUPER_ADMIN
  if (targetUserRole === 'SUPER_ADMIN') {
    return currentUserRole === 'SUPER_ADMIN';
  }
  // Can edit lower roles or same level
  const roleHierarchy: Record<string, number> = {
    STAFF: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };
  return roleHierarchy[currentUserRole] >= roleHierarchy[targetUserRole];
}

// Check if user can view admin panel
export function canViewAdmin(userRole: string): boolean {
  return ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
}

