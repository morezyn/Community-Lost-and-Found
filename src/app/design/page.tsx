import { notFound } from "next/navigation";
import { AlertCircle, Bell, CheckCircle2, MapPin, Search } from "lucide-react";

import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypeBadge, StatusBadge, ClaimStatusBadge } from "@/components/reports/StatusBadge";

export default function DesignPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="bg-bg">
      <Section spacing="tight">
        <SectionHeading
          overline="Dev preview"
          title="FindIt design system"
          subtitle="Tokens, primitives, and patterns from DESIGN.md. This page is dev-only."
        />
      </Section>

      <Section tone="surface" spacing="default">
        <div className="space-y-8">
          <SectionHeading align="left" title="Buttons" subtitle="Pill-shaped actions (primary, dark, soft, outline, link)." />
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary action</Button>
            <Button variant="dark">Dark action</Button>
            <Button variant="soft">Soft action</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link button</Button>
            <Button size="lg">Large primary</Button>
            <Button variant="dark" size="lg">Large dark</Button>
            <Button size="icon" aria-label="Search"><Search /></Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-card p-6">
            <Button>Report an item</Button>
            <Button variant="dark">Browse reports</Button>
          </div>
        </div>
      </Section>

      <Section spacing="default">
        <div className="space-y-8">
          <SectionHeading align="left" title="Badges" subtitle="Report types, statuses, and claim states." />
          <div className="flex flex-wrap gap-2">
            <TypeBadge type="lost" />
            <TypeBadge type="found" />
            <TypeBadge type="incident" />
            <StatusBadge status="pending" />
            <StatusBadge status="approved" />
            <StatusBadge status="rejected" />
            <StatusBadge status="resolved" />
            <ClaimStatusBadge status="pending" />
            <ClaimStatusBadge status="approved" />
            <ClaimStatusBadge status="rejected" />
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>
      </Section>

      <Section tone="surface" spacing="default">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <SectionHeading align="left" title="Inputs & forms" subtitle="Rounded inputs with accent focus." />
            <div className="space-y-4 rounded-card border border-border bg-card p-6">
              <div className="space-y-1.5">
                <Label htmlFor="d-title">Title</Label>
                <Input id="d-title" placeholder="e.g. Black wallet near library" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-loc">Location</Label>
                <Input id="d-loc" placeholder="Where was it lost or found?" />
                <p className="text-xs text-ink-soft">Be as specific as you can.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bags">Bags & Wallets</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="keys">Keys</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-desc">Description</Label>
                <Textarea id="d-desc" placeholder="Describe the item and any identifying details…" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeading align="left" title="Cards & states" subtitle="Warm surfaces, minimal shadow." />
            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <TypeBadge type="found" />
                  <StatusBadge status="approved" />
                </div>
                <CardTitle className="pt-2 font-heading text-2xl">Blue backpack found at cafeteria</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-ink-soft">
                  <MapPin className="size-4" /> Main cafeteria, north entrance · 2 days ago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-ink-soft">Contains notebooks and a water bottle. Left on a chair near the counter.</p>
                <div className="flex gap-2">
                  <Button size="sm">This is mine</Button>
                  <Button size="sm" variant="soft">View details</Button>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-3">
              <Alert variant="success">
                <CheckCircle2 />
                <AlertTitle>Report approved</AlertTitle>
                <AlertDescription>Your report is now visible to the community.</AlertDescription>
              </Alert>
              <Alert variant="warning">
                <Bell />
                <AlertTitle>Awaiting review</AlertTitle>
                <AlertDescription>A moderator will review your report shortly.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Action needed</AlertTitle>
                <AlertDescription>Please add more details so others can identify the item.</AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </Section>

      <Section spacing="default">
        <div className="space-y-8">
          <SectionHeading align="left" title="Tabs & loading" subtitle="Segmented control and skeleton states." />
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="lost">Lost</TabsTrigger>
              <TabsTrigger value="found">Found</TabsTrigger>
              <TabsTrigger value="incident">Incident</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="rounded-card border border-border bg-card p-6 text-sm text-ink-soft">
              Segmented tab content area (All reports).
            </TabsContent>
            <TabsContent value="lost" className="rounded-card border border-border bg-card p-6 text-sm text-ink-soft">Lost items.</TabsContent>
            <TabsContent value="found" className="rounded-card border border-border bg-card p-6 text-sm text-ink-soft">Found items.</TabsContent>
            <TabsContent value="incident" className="rounded-card border border-border bg-card p-6 text-sm text-ink-soft">Community issues.</TabsContent>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3 rounded-card border border-border bg-card p-4">
                <Skeleton className="aspect-[4/3] w-full rounded-[16px]" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}