import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { roles, permissions, rolePermissions, auditLogs, users } from '@shared/schema';
import type { InsertRole, Role, InsertPermission, Permission, InsertRolePermission, InsertAuditLog } from '@shared/schema';

/**
 * Role Storage Module
 * Handles CRUD operations for roles, permissions, and audit logs
 */

// ============ Role Operations ============

export async function createRole(data: InsertRole): Promise<Role> {
  const [role] = await db.insert(roles).values(data).returning();
  return role;
}

export async function getRoleById(id: string): Promise<Role | undefined> {
  const [role] = await db.select().from(roles).where(eq(roles.id, id));
  return role;
}

export async function getRoleByName(name: string): Promise<Role | undefined> {
  const [role] = await db.select().from(roles).where(eq(roles.name, name));
  return role;
}

export async function getAllRoles(): Promise<Role[]> {
  return db.select().from(roles);
}

export async function updateRole(id: string, data: Partial<InsertRole>): Promise<Role | undefined> {
  const [role] = await db.update(roles).set(data).where(eq(roles.id, id)).returning();
  return role;
}

export async function deleteRole(id: string): Promise<boolean> {
  // First delete all role-permission associations
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
  
  // Then delete the role
  const result = await db.delete(roles).where(eq(roles.id, id));
  return result.rowCount ? result.rowCount > 0 : false;
}

// ============ Permission Operations ============

export async function createPermission(data: InsertPermission): Promise<Permission> {
  const [permission] = await db.insert(permissions).values(data).returning();
  return permission;
}

export async function getPermissionById(id: string): Promise<Permission | undefined> {
  const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
  return permission;
}

export async function getPermissionByActionAndSubject(action: string, subject: string): Promise<Permission | undefined> {
  const [permission] = await db.select()
    .from(permissions)
    .where(and(
      eq(permissions.action, action),
      eq(permissions.subject, subject)
    ));
  return permission;
}

export async function getAllPermissions(): Promise<Permission[]> {
  return db.select().from(permissions);
}

export async function updatePermission(id: string, data: Partial<InsertPermission>): Promise<Permission | undefined> {
  const [permission] = await db.update(permissions).set(data).where(eq(permissions.id, id)).returning();
  return permission;
}

export async function deletePermission(id: string): Promise<boolean> {
  // First delete all role-permission associations
  await db.delete(rolePermissions).where(eq(rolePermissions.permissionId, id));
  
  // Then delete the permission
  const result = await db.delete(permissions).where(eq(permissions.id, id));
  return result.rowCount ? result.rowCount > 0 : false;
}

// ============ Role-Permission Assignment ============

export async function assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
  await db.insert(rolePermissions).values({
    roleId,
    permissionId
  }).onConflictDoNothing();
}

export async function revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
  await db.delete(rolePermissions)
    .where(and(
      eq(rolePermissions.roleId, roleId),
      eq(rolePermissions.permissionId, permissionId)
    ));
}

export async function getPermissionsByRoleId(roleId: string): Promise<Permission[]> {
  const result = await db
    .select({
      id: permissions.id,
      action: permissions.action,
      subject: permissions.subject,
      description: permissions.description,
      conditions: permissions.conditions,
      createdAt: permissions.createdAt,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  
  return result;
}

export async function getRolesByPermissionId(permissionId: string): Promise<Role[]> {
  const result = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      isSystem: roles.isSystem,
      createdAt: roles.createdAt,
      updatedAt: roles.updatedAt,
    })
    .from(rolePermissions)
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .where(eq(rolePermissions.permissionId, permissionId));
  
  return result;
}

/**
 * Get all permissions for a user based on their role
 * Returns the permissions from the user's role in the users table
 */
export async function getUserPermissionsByRole(userRole: string): Promise<Permission[]> {
  // First get the role by name
  const role = await getRoleByName(userRole);
  if (!role) {
    return [];
  }
  
  // Then get all permissions for that role
  return getPermissionsByRoleId(role.id);
}

// ============ Audit Log Operations ============

export async function createAuditLog(data: InsertAuditLog): Promise<void> {
  await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(limit: number = 100, offset: number = 0) {
  return db.select()
    .from(auditLogs)
    .orderBy(auditLogs.createdAt)
    .limit(limit)
    .offset(offset);
}

export async function getAuditLogsByUserId(userId: string, limit: number = 100) {
  return db.select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(auditLogs.createdAt)
    .limit(limit);
}

export async function getAuditLogsByResource(resource: string, resourceId: string, limit: number = 100) {
  return db.select()
    .from(auditLogs)
    .where(and(
      eq(auditLogs.resource, resource),
      eq(auditLogs.resourceId, resourceId)
    ))
    .orderBy(auditLogs.createdAt)
    .limit(limit);
}
