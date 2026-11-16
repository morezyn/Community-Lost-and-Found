"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  BellOff,
  CheckCheck,
  Inbox,
  Loader2,
  MailCheck,
  PackageSearch,
  Pencil,
  RefreshCw,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { profileSchema, type ProfileValues } from "@/lib/validators";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { resendVerificationEmail, updateUserProfile } from "@/lib/firebase/auth";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/firebase/notifications";
import { subscribeToReportsByAuthor } from "@/lib/firebase/reports";
import {
  subscribeToClaimsForAuthor,
  subscribeToMyClaims,
} from "@/lib/firebase/claims";
import { ROLE_META } from "@/lib/constants";
import { cn, formatDate, initials, timeAgo } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { ReportCard } from "@/components/reports/ReportCard";
import { ClaimStatusBadge, StatusBadge } from "@/components/reports/StatusBadge";
import { ClaimReviewCard } from "@/components/claims/ClaimReviewCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Claim, Report } from "@/types";

export function ProfilePage() {
  const { profile, firebaseUser, emailVerified, loading, refreshProfile, refreshVerification } =
    useAuth();
  const [tab, setTab] = React.useState("reports");
  const [checkingVerification, setCheckingVerification] = React.useState(false);

  React.useEffect(() => {
    if (window.location.hash === "#notifications") setTab("notifications");
    if (window.location.hash === "#claims") setTab("claims");
  }, []);

  const [reports, setReports] = React.useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = React.useState(true);
  const [myClaims, setMyClaims] = React.useState<Claim[]>([]);
  const [authorClaims, setAuthorClaims] = React.useState<Claim[]>([]);
  const { notifications, unreadCount } = useNotifications();

  React.useEffect(() => {
    if (!profile) return;
    setReportsLoading(true);
    const unsubReports = subscribeToReportsByAuthor(
      profile.uid,
      (next) => {
        setReports(next);
        setReportsLoading(false);
      },
      () => setReportsLoading(false),
    );
    const unsubMine = subscribeToMyClaims(profile.uid, setMyClaims);
    const unsubAuthor = subscribeToClaimsForAuthor(profile.uid, setAuthorClaims);

    return () => {
      unsubReports();
      unsubMine();
      unsubAuthor();
    };
  }, [profile]);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: "", photoURL: "" },
  });

  React.useEffect(() => {
    if (profile) {
      profileForm.reset({
        displayName: profile.displayName,
        photoURL: profile.photoURL ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.displayName, profile?.photoURL]);

  if (loading || !profile || !firebaseUser) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const roleMeta = ROLE_META[profile.role];
  const pendingAuthorClaims = authorClaims.filter((claim) => claim.status === "pending");

  async function onSaveProfile(values: ProfileValues) {
    if (!firebaseUser) return;
    try {
      await updateUserProfile(firebaseUser, {
        displayName: values.displayName,
        photoURL: values.photoURL.trim() || null,
      });
      await refreshProfile();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not update your profile"));
    }
  }

  async function handleResendVerification() {
    if (!firebaseUser) return;
    try {
      await resendVerificationEmail(firebaseUser);
      toast.success("Verification email sent");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not send the verification email"));
    }
  }

  async function handleRefreshVerification() {
    setCheckingVerification(true);
    try {
      const verified = await refreshVerification();
      if (verified) {
        toast.success("Email verified — you can now use all features.");
      } else {
        toast.message("Email not verified yet. Check your inbox and try again.");
      }
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not check verification status"));
    } finally {
      setCheckingVerification(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead(profile!.uid);
      toast.success("Notifications marked as read");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not update notifications"));
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Manage your details, review your reports, claims, and notifications."
      />

      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
        <Avatar className="size-16">
          <AvatarImage src={profile.photoURL ?? undefined} alt={profile.displayName} />
          <AvatarFallback className="text-lg">{initials(profile.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{profile.displayName}</h2>
            <Badge className={roleMeta.badgeClass}>{roleMeta.label}</Badge>
            {emailVerified ? (
              <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                <MailCheck /> Verified
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                Email unverified
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <p className="text-xs text-muted-foreground">
            Member since {formatDate(profile.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              <PackageSearch /> Browse
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/reports/new">New report</Link>
          </Button>
        </div>
      </section>

      {!emailVerified && (
        <Alert variant="warning">
          <MailCheck />
          <AlertTitle>Verify your email to unlock all features</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            Posting reports and comments requires a verified email. You can still submit
            found-item responses and claims. After verifying, refresh your status here.
            <Button size="sm" variant="outline" onClick={handleResendVerification}>
              Resend email
            </Button>
            <Button
              size="sm"
              onClick={handleRefreshVerification}
              disabled={checkingVerification}
            >
              {checkingVerification ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              I&apos;ve verified
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="reports">
            <PackageSearch /> My reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="claims">
            <ShieldCheck /> Claims &amp; responses
            {pendingAuthorClaims.length > 0 && (
              <span
                key={pendingAuthorClaims.length}
                className="ml-1 animate-badge-pop rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground"
              >
                {pendingAuthorClaims.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell /> Notifications
            {unreadCount > 0 && (
              <span
                key={unreadCount}
                className="ml-1 animate-badge-pop rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground"
              >
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="pt-4">
          {reportsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="You haven't posted yet"
              description="Report a lost item, a found item, or a community concern to get started."
              action={
                <Button asChild size="sm">
                  <Link href="/reports/new">Create your first report</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} showStatus />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-8 pt-4">
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Responses on your reports</h2>
              <p className="text-sm text-muted-foreground">
                People who think they found your lost item, and owners claiming one you
                picked up. Approving resolves the report.
              </p>
            </div>
            {authorClaims.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No responses on your reports"
                description="When someone finds a lost item you posted, or claims one you picked up, it appears here."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {authorClaims.map((claim) => (
                  <div key={claim.id} className="space-y-1.5">
                    <Link
                      href={`/reports/${claim.reportId}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {claim.reportTitle}
                    </Link>
                    <ClaimReviewCard
                      claim={claim}
                      canReview={claim.status === "pending"}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Your claims &amp; responses</h2>
              <p className="text-sm text-muted-foreground">
                Items you asked to claim, and lost items you reported finding.
              </p>
            </div>
            {myClaims.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Nothing submitted yet"
                description="Found an item? Open the post and choose “This is mine”. Found someone's lost item? Choose “I found this”."
                className="py-8"
              />
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {myClaims.map((claim) => (
                  <li
                    key={claim.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/reports/${claim.reportId}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {claim.reportTitle}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Submitted {timeAgo(claim.createdAt)}
                      </p>
                    </div>
                    <ClaimStatusBadge status={claim.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-3 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Notifications</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck /> Mark all read
            </Button>
          </div>
          {notifications.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title="No notifications yet"
              description="Approvals, claims, and comments on your reports will show up here."
              className="py-8"
            />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {notifications.map((notification, index) => (
                <li
                  key={notification.id}
                  className={cn(
                    "flex animate-slide-down items-start gap-3 px-4 py-3",
                    !notification.read && "bg-primary/[0.03]",
                  )}
                  style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      notification.read ? "bg-border" : "bg-primary",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={notification.link}
                      onClick={() => void markNotificationRead(notification.id)}
                      className="text-sm hover:underline"
                    >
                      {notification.message}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => void markNotificationRead(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="settings" className="pt-4">
          <div className="max-w-xl space-y-6 rounded-xl border bg-card p-5 shadow-sm">
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  aria-invalid={Boolean(profileForm.formState.errors.displayName)}
                  {...profileForm.register("displayName")}
                />
                {profileForm.formState.errors.displayName && (
                  <FieldError>
                    {profileForm.formState.errors.displayName.message}
                  </FieldError>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="photoURL">Avatar URL</Label>
                <Input
                  id="photoURL"
                  placeholder="https://…"
                  aria-invalid={Boolean(profileForm.formState.errors.photoURL)}
                  {...profileForm.register("photoURL")}
                />
                {profileForm.formState.errors.photoURL ? (
                  <FieldError>
                    {profileForm.formState.errors.photoURL.message}
                  </FieldError>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Paste a public image URL, or leave blank to use your initials.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={profile.email} disabled readOnly />
                <p className="text-xs text-muted-foreground">
                  Email changes are not supported in this build.
                </p>
              </div>

              <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                {profileForm.formState.isSubmitting && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </form>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Email verification</p>
                <p className="text-xs text-muted-foreground">
                  {emailVerified
                    ? "Your email is verified. All user features are available."
                    : "Verify your email to post reports and comments. After verifying, refresh your status to unlock all features."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={emailVerified}
                >
                  <MailCheck /> Resend email
                </Button>
                {!emailVerified && (
                  <Button
                    size="sm"
                    onClick={handleRefreshVerification}
                    disabled={checkingVerification}
                  >
                    {checkingVerification ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                    Refresh status
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-xs text-muted-foreground">
                  Roles are managed by administrators.
                </p>
              </div>
              <Badge className={roleMeta.badgeClass}>{roleMeta.label}</Badge>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ProfileStatusHint({ status }: { status: Report["status"] }) {
  return <StatusBadge status={status} />;
}

export function EditProfileShortcut() {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/profile#settings">
        <Pencil /> Edit profile
      </Link>
    </Button>
  );
}
