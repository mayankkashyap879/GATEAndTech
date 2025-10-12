import { Request, Response, NextFunction } from 'express';
import { defineAbilitiesFor, Action, Subject } from '../casl/abilities';
import { getUserPermissionsByRole } from '../storage/role.storage';
import type { User } from '@shared/schema';

/**
 * Middleware to check if user has a specific permission using CASL
 * @param action - The action to check (create, read, update, delete, etc.)
 * @param subject - The subject/resource to check (Question, Test, User, etc.)
 */
export function can(action: Action, subject: Subject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = req.user as User;

      // Load user's permissions from the database
      const permissions = await getUserPermissionsByRole(user.role);

      // Create ability with loaded permissions
      const userWithPermissions = { ...user, permissions };
      const ability = defineAbilitiesFor(userWithPermissions);

      // Check if user can perform the action
      if (ability.can(action, subject)) {
        return next();
      }

      // User doesn't have permission
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `${action}:${subject}`
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

/**
 * Middleware to check if user has ANY of the specified permissions
 * @param checks - Array of [action, subject] tuples
 */
export function canAny(checks: Array<[Action, Subject]>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = req.user as User;
      const permissions = await getUserPermissionsByRole(user.role);
      const userWithPermissions = { ...user, permissions };
      const ability = defineAbilitiesFor(userWithPermissions);

      // Check if user has any of the permissions
      const hasAnyPermission = checks.some(([action, subject]) => 
        ability.can(action, subject)
      );

      if (hasAnyPermission) {
        return next();
      }

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: checks.map(([action, subject]) => `${action}:${subject}`)
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

/**
 * Middleware to check if user has ALL of the specified permissions
 * @param checks - Array of [action, subject] tuples
 */
export function canAll(checks: Array<[Action, Subject]>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = req.user as User;
      const permissions = await getUserPermissionsByRole(user.role);
      const userWithPermissions = { ...user, permissions };
      const ability = defineAbilitiesFor(userWithPermissions);

      // Check if user has all permissions
      const hasAllPermissions = checks.every(([action, subject]) => 
        ability.can(action, subject)
      );

      if (hasAllPermissions) {
        return next();
      }

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: checks.map(([action, subject]) => `${action}:${subject}`)
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

/**
 * Attach user abilities to the request object for use in route handlers
 * This allows checking permissions within the handler logic
 */
export async function attachAbilities(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.isAuthenticated()) {
      const user = req.user as User;
      const permissions = await getUserPermissionsByRole(user.role);
      const userWithPermissions = { ...user, permissions };
      const ability = defineAbilitiesFor(userWithPermissions);
      
      // Attach ability to request for use in handlers
      (req as any).ability = ability;
    }
    next();
  } catch (error) {
    console.error('Error attaching abilities:', error);
    next(); // Continue even if there's an error
  }
}
