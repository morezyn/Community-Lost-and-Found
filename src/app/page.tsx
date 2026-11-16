import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, StaggerGroup } from "@/components/motion/Reveal";
import { LatestReports } from "@/components/reports/LatestReports";

const TYPE_CARDS = [
  {
    title: "Lost",
    body: "Post what went missing with photos and the last place you saw it.",
    className:
      "border-danger/25 bg-[#F6DDD6]/60 text-[#7A3327] dark:border-danger/30 dark:bg-danger/10 dark:text-[#F3C9BE]",
    dot: "bg-danger",
  },
  {
    title: "Found",
    body: "Turn something in and verify the owner before handing it over.",
    className:
      "border-success/25 bg-[#DCEBDD]/70 text-[#2F5A37] dark:border-success/30 dark:bg-success/10 dark:text-[#C9E3CE]",
    dot: "bg-success",
  },
  {
    title: "Incident",
    body: "Flag hazards, damage, or safety concerns so they actually get fixed.",
    className:
      "border-warning/30 bg-[#F5E6C4]/70 text-[#7A5510] dark:border-warning/30 dark:bg-warning/10 dark:text-[#F0DCAC]",
    dot: "bg-warning",
  },
];

const STEPS = [
  {
    icon: Search,
    title: "Report it",
    body: "Add a title, photos, location, and the date. Verified members can post in under a minute.",
  },
  {
    icon: MessageSquare,
    title: "Talk it out",
    body: "Comments update live, so questions and sightings are answered in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Resolve it",
    body: "Found items are released through a verified claim. Reports close when the item is returned.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-accent-brand/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-content px-6 py-16 text-center sm:py-24 lg:px-12">
          {/* Hero load sequence: each block fades up in order (ANIMATIONS.md 7.3). */}
          <div className="lg:animate-fade-up">
            <Badge className="mx-auto gap-1.5">
              <Sparkles className="size-3.5" />
              Community powered
            </Badge>
          </div>

          <h1
            className="lg:animate-fade-up mx-auto mt-5 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance text-ink sm:text-6xl"
            style={{ animationDelay: "100ms" }}
          >
            Lost something?{" "}
            <span className="text-accent-brand">Found something?</span>
          </h1>
          <p
            className="lg:animate-fade-up mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base"
            style={{ animationDelay: "200ms" }}
          >
            {APP_NAME} connects neighbours, students, and staff so lost belongings find
            their way home — and community concerns get seen by the people who can fix
            them.
          </p>

          <div
            className="lg:animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "300ms" }}
          >
            <Button size="lg" asChild>
              <Link href="/reports">
                Browse reports <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/reports/new">Report an item</Link>
            </Button>
          </div>

          <StaggerGroup
            baseDelay={400}
            className="mx-auto mt-12 grid max-w-4xl gap-3 text-left sm:grid-cols-3"
          >
            {TYPE_CARDS.map((card) => (
              <Reveal key={card.title}>
                <div className={`h-full rounded-card border p-4 ${card.className}`}>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span className={`size-2 rounded-full ${card.dot}`} />
                    {card.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed opacity-80">{card.body}</p>
                </div>
              </Reveal>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section className="mx-auto w-full max-w-content px-6 py-14 lg:px-12">
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink">
              Recently approved
            </h2>
            <p className="text-sm text-ink-soft">
              Fresh reports, reviewed by community moderators.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports">
              View all <ArrowRight />
            </Link>
          </Button>
        </Reveal>
        <LatestReports />
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="mx-auto w-full max-w-content px-6 py-14 lg:px-12">
          <Reveal className="mb-8 max-w-xl">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink">
              How it works
            </h2>
            <p className="text-sm text-ink-soft">
              Three steps from missing to found — with real-time updates along the way.
            </p>
          </Reveal>
          <StaggerGroup className="grid gap-4 md:grid-cols-3" step={70}>
            {STEPS.map((step, index) => (
              <Reveal key={step.title}>
                <div className="relative h-full rounded-card border border-border bg-card p-5">
                  <span className="absolute top-4 right-5 font-heading text-4xl font-bold text-ink-faint/25">
                    {index + 1}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent-brand">
                    <step.icon className="size-4" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section className="mx-auto w-full max-w-content px-6 py-14 lg:px-12">
        <Reveal>
          <div className="flex flex-col items-center gap-4 rounded-hero bg-ink px-6 py-10 text-center text-bg sm:py-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg/10 px-3 py-1 text-xs font-medium">
              <Bell className="size-3.5" /> Real-time notifications included
            </span>
            <h2 className="max-w-xl font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Every claim, comment, and approval lands in your inbox.
            </h2>
            <p className="max-w-lg text-sm text-bg/75">
              Create an account to report items, claim what&apos;s yours, and get notified
              the moment a moderator approves your post.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Create an account <BadgeCheck />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="text-bg hover:bg-bg/10 hover:text-bg"
              >
                <Link href="/login">I already have one</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
