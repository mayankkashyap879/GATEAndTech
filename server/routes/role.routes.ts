import type { Express, Request, Response } from 'express';
import { fromZodError } from 'zod-validation-error';
import { insertRoleSchema } from '@shared/schema';
import * as roleStorage from '../storage/role.storage';
import { requireAuth, requireRole } from '../auth';
import { defineAbilitiesFor, serializeAbilities } from '../casl/abilities';
import type { User } from '@shared/schema';

export function roleRoutes(app: Express): void {
  // ============================================================================
  // USER ABILITIES ROUTE
  // ============================================================================

  /**
   * GET /api/abilities
   * Get current user's abilities/permissions
   */
  app.get('/api/abilities', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      
      // Load user's permissions from database
      const permissions = await roleStorage.getUserPermissionsByRole(user.role);
      const userWithPermissions = { ...user, permissions };
      
      // Serialize abilities for frontend
      const abilities = serializeAbilities(userWithPermissions);
      
      res.json({ 
        abilities,
        permissions: permissions.map(p => ({
          action: p.action,
          subject: p.subject,
          description: p.description
        }))
      });
    } catch (error) {
      console.error('Error fetching abilities:', error);
      res.status(500).json({ message: 'Failed to fetch abilities' });
    }
  });

  // ============================================================================
  // ROLE MANAGEMENT ROUTES
  // ============================================================================

  /**
   * GET /api/roles
   * Get all roles (admin only)
   */
  app.get('/api/roles', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const roles = await roleStorage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  /**
   * GET /api/roles/:id
   * Get a specific role by ID (admin only)
   */
  app.get('/api/roles/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const role = await roleStorage.getRoleById(req.params.id);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      // Get permissions for this role
      const permissions = await roleStorage.getPermissionsByRoleId(role.id);
      
      res.json({ ...role, permissions });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({ message: 'Failed to fetch role' });
    }
  });

  /**
   * POST /api/roles
   * Create a new role (admin only)
   */
  app.post('/api/roles', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const validation = insertRoleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      const role = await roleStorage.createRole(validation.data);
      
      // Log the action
      const user = req.user as any;
      await roleStorage.createAuditLog({
        userId: user.id,
        action: 'role.create',
        resource: 'Role',
        resourceId: role.id,
        details: { name: role.name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json(role);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: 'Role with this name already exists' });
      }
      console.error('Error creating role:', error);
      res.status(500).json({ message: 'Failed to create role' });
    }
  });

  /**
   * PATCH /api/roles/:id
   * Update a role (admin only)
   */
  app.patch('/api/roles/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const existingRole = await roleStorage.getRoleById(req.params.id);
      if (!existingRole) {
        return res.status(404).json({ message: 'Role not found' });
      }

      // Prevent modification of system roles
      if (existingRole.isSystem) {
        return res.status(403).json({ message: 'Cannot modify system roles' });
      }

      const validation = insertRoleSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      // Ensure at least one field is being updated
      if (Object.keys(validation.data).length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }

      const role = await roleStorage.updateRole(req.params.id, validation.data);
      
      // Log the action
      const user = req.user as any;
      await roleStorage.createAuditLog({
        userId: user.id,
        action: 'role.update',
        resource: 'Role',
        resourceId: role!.id,
        details: { oldValues: existingRole, newValues: validation.data },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(role);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Role with this name already exists' });
      }
      console.error('Error updating role:', error);
      res.status(500).json({ message: 'Failed to update role' });
    }
  });

  /**
   * DELETE /api/roles/:id
   * Delete a role (admin only)
   */
  app.delete('/api/roles/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const role = await roleStorage.getRoleById(req.params.id);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      // Prevent deletion of system roles
      if (role.isSystem) {
        return res.status(403).json({ message: 'Cannot delete system roles' });
      }

      const deleted = await roleStorage.deleteRole(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Role not found' });
      }

      // Log the action
      const user = req.user as any;
      await roleStorage.createAuditLog({
        userId: user.id,
        action: 'role.delete',
        resource: 'Role',
        resourceId: role.id,
        details: { name: role.name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ message: 'Failed to delete role' });
    }
  });

  // ============================================================================
  // PERMISSION MANAGEMENT ROUTES
  // ============================================================================

  /**
   * GET /api/permissions
   * Get all permissions (admin only)
   */
  app.get('/api/permissions', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const permissions = await roleStorage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  });

  /**
   * POST /api/roles/:roleId/permissions/:permissionId
   * Assign a permission to a role (admin only)
   */
  app.post('/api/roles/:roleId/permissions/:permissionId', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const role = await roleStorage.getRoleById(req.params.roleId);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      const permission = await roleStorage.getPermissionById(req.params.permissionId);
      if (!permission) {
        return res.status(404).json({ message: 'Permission not found' });
      }

      await roleStorage.assignPermissionToRole(req.params.roleId, req.params.permissionId);
      
      // Log the action
      const user = req.user as any;
      await roleStorage.createAuditLog({
        userId: user.id,
        action: 'permission.assign',
        resource: 'Role',
        resourceId: role.id,
        details: { 
          roleId: role.id,
          roleName: role.name,
          permissionId: permission.id,
          permission: `${permission.action}:${permission.subject}`
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: 'Permission assigned successfully' });
    } catch (error) {
      console.error('Error assigning permission:', error);
      res.status(500).json({ message: 'Failed to assign permission' });
    }
  });

  /**
   * DELETE /api/roles/:roleId/permissions/:permissionId
   * Revoke a permission from a role (admin only)
   */
  app.delete('/api/roles/:roleId/permissions/:permissionId', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const role = await roleStorage.getRoleById(req.params.roleId);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      const permission = await roleStorage.getPermissionById(req.params.permissionId);
      if (!permission) {
        return res.status(404).json({ message: 'Permission not found' });
      }

      await roleStorage.revokePermissionFromRole(req.params.roleId, req.params.permissionId);
      
      // Log the action
      const user = req.user as any;
      await roleStorage.createAuditLog({
        userId: user.id,
        action: 'permission.revoke',
        resource: 'Role',
        resourceId: role.id,
        details: { 
          roleId: role.id,
          roleName: role.name,
          permissionId: permission.id,
          permission: `${permission.action}:${permission.subject}`
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: 'Permission revoked successfully' });
    } catch (error) {
      console.error('Error revoking permission:', error);
      res.status(500).json({ message: 'Failed to revoke permission' });
    }
  });

  // ============================================================================
  // AUDIT LOG ROUTES
  // ============================================================================

  /**
   * GET /api/audit-logs
   * Get audit logs (admin only)
   */
  app.get('/api/audit-logs', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const logs = await roleStorage.getAuditLogs(limit, offset);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  /**
   * GET /api/audit-logs/user/:userId
   * Get audit logs for a specific user (admin only)
   */
  app.get('/api/audit-logs/user/:userId', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await roleStorage.getAuditLogsByUserId(req.params.userId, limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });
}
