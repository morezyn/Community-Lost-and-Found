import { CheckCircle2, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: "Report in seconds",
    body: "Lost items, found items, and community incidents with photos and location.",
  },
  {
    icon: MessagesSquare,
    title: "Comment live",
    body: "Conversations update in real time, right on the report.",
  },
  {
    icon: ShieldCheck,
    title: "Verified claims",
    body: "Found items are released only after a verification check.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-16">
      <aside className="hidden flex-col justify-between gap-10 rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-fuchsia-600 p-8 text-primary-foreground shadow-lg lg:flex lg:min-h-[560px]">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3.5" />
            Community lost &amp; found
          </div>
          <h2 className="text-2xl font-semibold leading-snug">
            {APP_NAME} keeps the whole campus in the loop.
          </h2>
          <p className="text-sm text-white/80">
            One place for lost belongings, found items, and the small issues that
            make a community feel cared for.
          </p>
        </div>

        <ul className="space-y-4">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <item.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-white/75">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="flex items-center gap-2 text-xs text-white/70">
          <CheckCircle2 className="size-3.5" />
          Roles for members, moderators, and admins
        </p>
      </aside>

      <div className="flex justify-center">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
