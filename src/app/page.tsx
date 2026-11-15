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
import { LatestReports } from "@/components/reports/LatestReports";

const TYPE_CARDS = [
  {
    title: "Lost",
    body: "Post what went missing with photos and the last place you saw it.",
    className:
      "border-rose-200 bg-rose-50/60 text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-100",
    dot: "bg-rose-500",
  },
  {
    title: "Found",
    body: "Turn something in and verify the owner before handing it over.",
    className:
      "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    title: "Incident",
    body: "Flag hazards, damage, or safety concerns so they actually get fixed.",
    className:
      "border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
    dot: "bg-amber-500",
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
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <Badge className="mx-auto gap-1.5 bg-primary/10 px-3 py-1 text-primary ring-primary/20">
            <Sparkles className="size-3.5" />
            Community powered
          </Badge>

          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Lost something?{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
              Found something?
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {APP_NAME} connects neighbours, students, and staff so lost belongings find
            their way home — and community concerns get seen by the people who can fix
            them.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/reports">
                Browse reports <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/reports/new">Report an item</Link>
            </Button>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
            {TYPE_CARDS.map((card) => (
              <div key={card.title} className={`rounded-xl border p-4 ${card.className}`}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className={`size-2 rounded-full ${card.dot}`} />
                  {card.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed opacity-80">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Recently approved</h2>
            <p className="text-sm text-muted-foreground">
              Fresh reports, reviewed by community moderators.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        <LatestReports />
      </section>

      <section className="border-y bg-card/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="mb-8 max-w-xl">
            <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
            <p className="text-sm text-muted-foreground">
              Three steps from missing to found — with real-time updates along the way.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative rounded-xl border bg-card p-5 shadow-sm">
                <span className="absolute top-4 right-5 text-4xl font-bold text-muted-foreground/15">
                  {index + 1}
                </span>
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-4" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-fuchsia-600 px-6 py-10 text-center text-primary-foreground shadow-lg sm:py-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Bell className="size-3.5" /> Real-time notifications included
          </span>
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Every claim, comment, and approval lands in your inbox.
          </h2>
          <p className="max-w-lg text-sm text-white/80">
            Create an account to report items, claim what&apos;s yours, and get notified
            the moment a moderator approves your post.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                Create an account <BadgeCheck />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            >
              <Link href="/login">I already have one</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
