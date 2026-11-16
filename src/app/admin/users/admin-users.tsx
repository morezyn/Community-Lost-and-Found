"use client";

import * as React from "react";
import { Loader2, UserCog, Users } from "lucide-react";
import { toast } from "sonner";

import { subscribeToUsers, updateUserDisabled, updateUserRole } from "@/lib/firebase/users";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { ROLE_META } from "@/lib/constants";
import { formatDate, initials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { EmptyState } from "@/components/layout/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppUser, Role } from "@/types";

export function AdminUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyUid, setBusyUid] = React.useState<string | null>(null);
  const [disableTarget, setDisableTarget] = React.useState<AppUser | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToUsers(
      (next) => {
        setUsers(next);
        setLoading(false);
      },
      (error) => {
        toast.error(describeFirebaseError(error, "Could not load members"));
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  async function handleRoleChange(user: AppUser, role: Role) {
    setBusyUid(user.uid);
    try {
      await updateUserRole(user.uid, role);
      toast.success(`${user.displayName} is now ${ROLE_META[role].label.toLowerCase()}`);
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not change the role"));
    } finally {
      setBusyUid(null);
    }
  }

  async function handleToggleDisabled(user: AppUser) {
    setBusyUid(user.uid);
    try {
      await updateUserDisabled(user.uid, !user.disabled);
      toast.success(user.disabled ? "Account re-enabled" : "Account disabled");
      setDisableTarget(null);
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not update the account"));
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <AdminNav />

      <PageHeader
        eyebrow="Admin"
        title="Members"
        description="Promote moderators, manage admins, and disable accounts that break the rules."
      />

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Accounts appear here the first time someone signs in."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = profile?.uid === user.uid;
                return (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarImage src={user.photoURL ?? undefined} alt="" />
                          <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {user.displayName}
                            {isSelf && (
                              <span className="ml-1.5 text-[11px] text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isSelf ? (
                        <Badge className={ROLE_META[user.role].badgeClass}>
                          {ROLE_META[user.role].label}
                        </Badge>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) => void handleRoleChange(user, value as Role)}
                          disabled={busyUid === user.uid}
                        >
                          <SelectTrigger className="h-8 w-[130px]" aria-label="Change role">
                            {busyUid === user.uid ? (
                              <Loader2 className="size-3.5 motion-essential animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Member</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!user.disabled}
                          onCheckedChange={() => setDisableTarget(user)}
                          disabled={isSelf || busyUid === user.uid}
                          aria-label={user.disabled ? "Enable account" : "Disable account"}
                        />
                        <span className="text-xs text-muted-foreground">
                          {user.disabled ? "Disabled" : "Active"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
        <UserCog className="mt-0.5 size-4 shrink-0" />
        <p>
          You cannot change your own role or disable your own account — this prevents an
          admin from locking themselves out. Role changes apply immediately and are
          enforced by Firestore security rules.
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(disableTarget)}
        onOpenChange={(open) => {
          if (!open) setDisableTarget(null);
        }}
        title={disableTarget?.disabled ? "Re-enable this account?" : "Disable this account?"}
        description={
          disableTarget?.disabled
            ? `${disableTarget?.displayName} will be able to sign in again.`
            : `${disableTarget?.displayName} will be signed out and blocked from posting.`
        }
        confirmLabel={disableTarget?.disabled ? "Re-enable" : "Disable"}
        destructive={!disableTarget?.disabled}
        loading={Boolean(disableTarget && busyUid === disableTarget.uid)}
        onConfirm={() => {
          if (disableTarget) void handleToggleDisabled(disableTarget);
        }}
      />
    </div>
  );
}

