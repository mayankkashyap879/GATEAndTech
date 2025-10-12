import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Shield, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  action: string;
  subject: string;
  description: string | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function RoleManagement() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
  });

  // Fetch all permissions
  const { data: allPermissions, isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ['/api/permissions'],
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/audit-logs'],
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest('POST', '/api/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
      setIsCreateDialogOpen(false);
      toast({ title: 'Role created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create role', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string } }) => {
      return apiRequest('PATCH', `/api/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      toast({ title: 'Role updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update role', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
      toast({ title: 'Role deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete role', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Assign permission mutation
  const assignPermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      return apiRequest('POST', `/api/roles/${roleId}/permissions/${permissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
      toast({ title: 'Permission assigned successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to assign permission', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Revoke permission mutation
  const revokePermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      return apiRequest('DELETE', `/api/roles/${roleId}/permissions/${permissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
      toast({ title: 'Permission revoked successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to revoke permission', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleCreateRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRoleMutation.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    });
  };

  const handleUpdateRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRole) return;
    const formData = new FormData(e.currentTarget);
    updateRoleMutation.mutate({
      id: selectedRole.id,
      data: {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
      },
    });
  };

  const handleTogglePermission = (roleId: string, permissionId: string, hasPermission: boolean) => {
    if (hasPermission) {
      revokePermissionMutation.mutate({ roleId, permissionId });
    } else {
      assignPermissionMutation.mutate({ roleId, permissionId });
    }
  };

  const groupPermissionsBySubject = (permissions: Permission[]) => {
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.subject]) {
        acc[perm.subject] = [];
      }
      acc[perm.subject].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Role & Permission Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions for your application</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-role">
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-role">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Create a new role for your application</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRole}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Content Manager"
                    required
                    data-testid="input-role-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what this role can do..."
                    data-testid="input-role-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createRoleMutation.isPending} data-testid="button-submit-role">
                  {createRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Role
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList data-testid="tabs-role-management">
          <TabsTrigger value="roles" data-testid="tab-roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions" data-testid="tab-permissions">Permissions</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles?.map((role) => (
              <Card key={role.id} data-testid={`card-role-${role.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="secondary" data-testid={`badge-system-${role.id}`}>
                            <Lock className="h-3 w-3 mr-1" />
                            System
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{role.description || 'No description'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRole(role);
                        setIsPermissionsDialogOpen(true);
                      }}
                      data-testid={`button-manage-permissions-${role.id}`}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Permissions
                    </Button>
                    {!role.isSystem && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role);
                            setIsEditDialogOpen(true);
                          }}
                          data-testid={`button-edit-role-${role.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
                              deleteRoleMutation.mutate(role.id);
                            }
                          }}
                          data-testid={`button-delete-role-${role.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Permissions</CardTitle>
              <CardDescription>All permissions available in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {allPermissions && Object.entries(groupPermissionsBySubject(allPermissions)).map(([subject, perms]) => (
                  <div key={subject} className="mb-6">
                    <h3 className="font-semibold text-lg mb-3" data-testid={`text-subject-${subject}`}>{subject}</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      {perms.map((perm) => (
                        <Card key={perm.id} data-testid={`card-permission-${perm.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <Badge variant="outline" data-testid={`badge-action-${perm.id}`}>{perm.action}</Badge>
                                <p className="text-sm text-muted-foreground mt-2">
                                  {perm.description || `${perm.action} ${perm.subject}`}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Recent role and permission changes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {auditLogsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg" data-testid={`audit-log-${log.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" data-testid={`badge-action-${log.id}`}>{log.action}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mt-2">
                            Resource: <span className="font-medium">{log.resource}</span>
                            {log.resourceId && ` (${log.resourceId})`}
                          </p>
                          {log.details && (
                            <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No audit logs found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-role">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRole}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedRole?.name}
                  required
                  data-testid="input-edit-role-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedRole?.description || ''}
                  data-testid="input-edit-role-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateRoleMutation.isPending} data-testid="button-update-role">
                {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="dialog-manage-permissions">
          <DialogHeader>
            <DialogTitle>Manage Permissions - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              {selectedRole?.isSystem 
                ? "System roles are read-only and cannot be modified" 
                : "Assign or revoke permissions for this role"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {allPermissions && Object.entries(groupPermissionsBySubject(allPermissions)).map(([subject, perms]) => (
              <div key={subject} className="mb-6">
                <h3 className="font-semibold mb-3">{subject}</h3>
                <div className="space-y-2">
                  {perms.map((perm) => {
                    const hasPermission = selectedRole?.permissions?.some(p => p.id === perm.id);
                    return (
                      <div key={perm.id} className="flex items-center space-x-2" data-testid={`permission-item-${perm.id}`}>
                        <Checkbox
                          id={`perm-${perm.id}`}
                          checked={hasPermission}
                          disabled={selectedRole?.isSystem}
                          onCheckedChange={() => handleTogglePermission(selectedRole!.id, perm.id, hasPermission || false)}
                          data-testid={`checkbox-permission-${perm.id}`}
                        />
                        <label
                          htmlFor={`perm-${perm.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                        >
                          <Badge variant="outline" className="mr-2">{perm.action}</Badge>
                          {perm.description || `${perm.action} ${perm.subject}`}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
