"use client";

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import { listCategories, seedDefaultCategories } from "@/lib/firebase/categories";
import { REQUIRE_APPROVAL } from "@/lib/constants";
import { buildSearchTokens } from "@/lib/utils";
import type { AppUser, Category, ReportStatus, ReportType } from "@/types";

/**
 * Writes `config/app`, which the Firestore rules read to decide whether a
 * non-moderator's new report may skip the review queue. The admin UI calls this
 * so the deployed rules and the NEXT_PUBLIC_REQUIRE_APPROVAL hint agree.
 */
export async function ensureAppConfig(): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "config", "app"),
    { requireApproval: REQUIRE_APPROVAL },
    { merge: true },
  );
}

interface DemoReport {
  type: ReportType;
  title: string;
  description: string;
  categoryName: string;
  locationText: string;
  daysAgo: number;
  status: ReportStatus;
  verificationQuestion?: string;
  verificationAnswer?: string;
  imageSeed: string;
}

/**
 * Demo dataset for the presentation. Photos are stable picsum.photos URLs so
 * no image upload is needed; everything else matches the real schema.
 */
const DEMO_REPORTS: DemoReport[] = [
  {
    type: "found",
    title: "Found: black AirPods Pro case near the library entrance",
    description:
      "Found a black AirPods Pro charging case on the bench outside the main library. It has a small sticker on the back. Message me with the sticker detail to claim it.",
    categoryName: "Electronics",
    locationText: "Main Library entrance",
    daysAgo: 1,
    status: "approved",
    verificationQuestion: "What is printed on the sticker on the back?",
    verificationAnswer: "A yellow smiley face with the word SMILE",
    imageSeed: "airpods",
  },
  {
    type: "lost",
    title: "Lost my blue Jansport backpack in Room 204",
    description:
      "I left my navy blue Jansport backpack under the desk in Room 204 after the 3pm class. It contains my notebooks and a calculator. Please comment if you saw it.",
    categoryName: "Bags & Wallets",
    locationText: "Room 204, Engineering Building",
    daysAgo: 2,
    status: "approved",
    imageSeed: "backpack",
  },
  {
    type: "incident",
    title: "Broken street light outside Gate 2",
    description:
      "The street light right outside Gate 2 has been flickering for a week and is now completely dark. It gets very dark around 6pm and students walk through there.",
    categoryName: "Infrastructure",
    locationText: "Gate 2, along Rizal Avenue",
    daysAgo: 2,
    status: "approved",
    imageSeed: "streetlight",
  },
  {
    type: "lost",
    title: "Lost student ID card (2024-01234)",
    description:
      "Dropped my student ID somewhere between the cafeteria and the gym this morning. Name on the card is Alex Cruz. A reward for whoever finds it!",
    categoryName: "Documents & IDs",
    locationText: "Cafeteria to Gym walkway",
    daysAgo: 3,
    status: "approved",
    imageSeed: "idcard",
  },
  {
    type: "found",
    title: "Found: set of keys with a red carabiner",
    description:
      "Picked up a set of three keys on a red carabiner near the bike racks by the Science Building. Holding them at the student affairs office.",
    categoryName: "Keys",
    locationText: "Bike racks, Science Building",
    daysAgo: 4,
    status: "approved",
    verificationQuestion: "How many keys are on the ring, and what color is the tag?",
    verificationAnswer: "Three keys with a blue tag",
    imageSeed: "keys",
  },
  {
    type: "incident",
    title: "Overflowing trash bins at the covered court",
    description:
      "The bins next to the covered court have not been collected in days. There is litter spreading to the court and it smells bad after PE classes.",
    categoryName: "Sanitation",
    locationText: "Covered court, east side",
    daysAgo: 5,
    status: "approved",
    imageSeed: "trash",
  },
  {
    type: "found",
    title: "Found a grey hoodie in the gym locker room",
    description:
      "Someone left a grey hoodie on the bench in the men's locker room after the intramurals. I turned it in at the PE office front desk.",
    categoryName: "Clothing",
    locationText: "Gym locker room",
    daysAgo: 6,
    status: "resolved",
    imageSeed: "hoodie",
  },
  {
    type: "lost",
    title: "Lost a golden retriever named Sunny near the park",
    description:
      "Our golden retriever Sunny got out of the gate near the community park. She is friendly, wears a red collar with a bell, and answers to her name.",
    categoryName: "Pets",
    locationText: "Community park, Phase 2",
    daysAgo: 7,
    status: "resolved",
    imageSeed: "dog",
  },
  {
    type: "incident",
    title: "Loud construction noise during exam week",
    description:
      "Construction next to the exam hall started at 7am during finals week. It is very distracting and we were told quiet hours would be respected.",
    categoryName: "Noise",
    locationText: "Exam hall, north side",
    daysAgo: 9,
    status: "approved",
    imageSeed: "construction",
  },
  {
    type: "found",
    title: "Found: scientific calculator (Casio) in the lab",
    description:
      "A Casio fx-991 calculator was left in the chemistry lab after the morning session. It has a name written in marker on the back.",
    categoryName: "Electronics",
    locationText: "Chemistry Lab 3",
    daysAgo: 10,
    status: "approved",
    verificationQuestion: "Whose name is written on the back?",
    verificationAnswer: "J. Santos",
    imageSeed: "calculator",
  },
  {
    type: "lost",
    title: "Lost silver ring at the swimming pool",
    description:
      "I lost a thin silver ring with a small engraving near the bleachers at the swimming pool last Saturday. It has sentimental value.",
    categoryName: "Other",
    locationText: "Swimming pool bleachers",
    daysAgo: 12,
    status: "pending",
    imageSeed: "ring",
  },
  {
    type: "incident",
    title: "Suspicious person loitering near the parking lot",
    description:
      "A person was trying door handles of parked motorcycles near the east parking lot around 9pm. Reported to security but posting in case others saw something.",
    categoryName: "Safety",
    locationText: "East parking lot",
    daysAgo: 14,
    status: "approved",
    imageSeed: "parking",
  },
];

function demoImage(seed: string): string {
  return `https://picsum.photos/seed/findit-${seed}/900/700`;
}

/**
 * Seeds categories (if needed) and 12 demo reports authored by the admin.
 * Admin-only by rules (status "approved" is written directly).
 */
export async function seedDemoData(author: AppUser): Promise<{ reports: number }> {
  await ensureAppConfig();
  await seedDefaultCategories();
  const categories = await listCategories();
  const byName = new Map(categories.map((category) => [category.name.toLowerCase(), category]));
  const fallback = categories[0];

  const db = getFirebaseDb();
  const batch = writeBatch(db);

  let count = 0;
  for (const demo of DEMO_REPORTS) {
    const category: Category | undefined = byName.get(demo.categoryName.toLowerCase()) ?? fallback;
    if (!category) break;

    const createdAt = Timestamp.fromDate(
      new Date(Date.now() - demo.daysAgo * 24 * 60 * 60 * 1000),
    );
    const reportRef = doc(collection(db, "reports"));
    const image = demoImage(demo.imageSeed);

    batch.set(reportRef, {
      type: demo.type,
      title: demo.title,
      description: demo.description,
      categoryId: category.id,
      categoryName: category.name,
      locationText: demo.locationText,
      coordinates: null,
      eventDate: createdAt,
      images: [image],
      imagePaths: [],
      status: demo.status,
      rejectionReason: null,
      verificationQuestion: demo.verificationQuestion ?? null,
      authorId: author.uid,
      authorName: author.displayName,
      authorPhotoURL: author.photoURL,
      commentCount: 0,
      searchTokens: buildSearchTokens(
        demo.title,
        demo.description,
        demo.locationText,
        category.name,
      ),
      createdAt,
      updatedAt: serverTimestamp(),
      resolvedAt: demo.status === "resolved" ? createdAt : null,
    });

    if (demo.verificationAnswer) {
      batch.set(doc(db, "reports", reportRef.id, "private", "details"), {
        verificationAnswer: demo.verificationAnswer,
        updatedAt: serverTimestamp(),
      });
    }

    count += 1;
  }

  await batch.commit();

  // Small delay-free reminder: notifications are intentionally not seeded.
  await addDoc(collection(db, "notifications"), {
    userId: author.uid,
    type: "report_approved",
    message: `Demo data ready: ${count} reports were added.`,
    link: "/admin",
    read: false,
    createdAt: serverTimestamp(),
  });

  return { reports: count };
}
