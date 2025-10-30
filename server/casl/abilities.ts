import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import type { User, Permission, Role } from '@shared/schema';

// Define the app actions and subjects
export type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'manage' | 'assign' | 'revoke' | 'export' | 'moderate';
export type Subject = 'Question' | 'Test' | 'Topic' | 'User' | 'Role' | 'Permission' | 'Analytics' | 'Discussion' | 'TestSeries' | 'Payment' | 'AuditLog' | 'Badge' | 'Coupon' | 'Comment' | 'all';

export type AppAbility = MongoAbility<[Action, Subject]>;

interface UserWithPermissions extends User {
  permissions?: Permission[];
}

/**
 * Define abilities for a user based on their role and permissions
 */
export function defineAbilitiesFor(user: UserWithPermissions): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (!user) {
    // Anonymous users have no permissions
    return build();
  }

  // If user has custom permissions loaded, use them
  if (user.permissions && user.permissions.length > 0) {
    user.permissions.forEach((permission) => {
      const action = permission.action as Action;
      const subject = permission.subject as Subject;
      
      if (permission.conditions) {
        // Apply with conditions
        can(action, subject, permission.conditions as any);
      } else {
        // Apply without conditions
        can(action, subject);
      }
    });
  } else {
    // Fallback to role-based permissions (legacy support)
    switch (user.role) {
      case 'admin':
        // Admins can do everything
        can('manage', 'all');
        break;

      case 'moderator':
        // Moderators can manage questions and tests
        can(['create', 'read', 'update', 'delete', 'publish'], 'Question');
        can(['create', 'read', 'update', 'delete', 'publish'], 'Test');
        can(['create', 'read', 'update', 'delete'], 'Topic');
        can(['create', 'read', 'update', 'delete', 'moderate'], 'Discussion');
        can('read', 'Analytics');
        can('read', 'TestSeries');
        can('read', 'User');
        break;

      case 'student':
        // Students can read content and participate in discussions
        can('read', ['Question', 'Test', 'Topic', 'TestSeries', 'Discussion', 'Analytics']);
        can(['create', 'update'], 'Discussion');
        // Students can read users (for viewing profiles)
        can('read', 'User');
        break;

      default:
        // No permissions for unknown roles
        break;
    }
  }

  return build();
}

/**
 * Helper to check if a user can perform an action
 */
export function canUser(user: UserWithPermissions, action: Action, subject: Subject): boolean {
  const ability = defineAbilitiesFor(user);
  return ability.can(action, subject);
}

/**
 * Serialize ability rules for client-side use
 */
export function serializeAbilities(user: UserWithPermissions) {
  const ability = defineAbilitiesFor(user);
  return ability.rules;
}
