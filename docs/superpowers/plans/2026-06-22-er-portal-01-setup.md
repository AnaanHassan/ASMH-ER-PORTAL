# ER Portal — Part 1: Project Setup, Database & Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js project with Prisma/SQLite, seed the ER beds, and implement doctor authentication with NextAuth.js.

**Architecture:** Next.js App Router with SQLite via Prisma. NextAuth.js credentials provider for username/password login. Bcrypt for password hashing. Tailwind CSS for styling.

**Tech Stack:** Next.js 14+, Prisma, SQLite, NextAuth.js, bcrypt, Tailwind CSS

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `er-portal/package.json`
- Create: `er-portal/tsconfig.json`
- Create: `er-portal/tailwind.config.ts`
- Create: `er-portal/src/app/layout.tsx`
- Create: `er-portal/src/app/page.tsx`

- [ ] **Step 1: Create Next.js project**

```bash
cd "/Users/anaan/Desktop/AMSH ER"
npx create-next-app@latest er-portal --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

Accept defaults when prompted.

- [ ] **Step 2: Verify it runs**

```bash
cd "/Users/anaan/Desktop/AMSH ER/er-portal"
npm run dev
```

Expected: Dev server starts on http://localhost:3000, shows Next.js default page.

- [ ] **Step 3: Clean up default page**

Replace `src/app/page.tsx` with:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">AMSH ER Portal</h1>
    </main>
  );
}
```

Remove all default CSS from `src/app/globals.css` except the Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/anaan/Desktop/AMSH ER"
git init
echo "node_modules/\n.next/\n*.db\n.env\n.env.local\n.superpowers/" > .gitignore
git add .
git commit -m "feat: scaffold Next.js project with Tailwind"
```

---

### Task 2: Prisma + SQLite Schema

**Files:**
- Create: `er-portal/prisma/schema.prisma`
- Create: `er-portal/src/lib/db.ts`

- [ ] **Step 1: Install Prisma**

```bash
cd "/Users/anaan/Desktop/AMSH ER/er-portal"
npm install prisma --save-dev
npm install @prisma/client
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 2: Write the schema**

Replace `er-portal/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Doctor {
  id           String    @id @default(cuid())
  name         String
  username     String    @unique
  passwordHash String
  role         String    @default("DOCTOR") // DOCTOR or ADMIN
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now())
  patients     Patient[] @relation("AttendingDoctor")
  dischargedPatients Patient[] @relation("DischargeDoctor")
}

model Bed {
  id           String    @id @default(cuid())
  name         String    @unique
  zone         String    // RESUS, RECEIVING, TRAUMA, GENERAL, TRIAGE
  room         String?
  displayOrder Int
  color        String
  patients     Patient[]
}

model Patient {
  id                String   @id @default(cuid())
  name              String
  age               Int?
  gender            String?
  nidPassport       String?
  hospitalNumber    String?
  bedId             String?
  bed               Bed?     @relation(fields: [bedId], references: [id])
  arrivalDateTime   DateTime?
  referredBy        String?
  attendingDoctorId String?
  attendingDoctor   Doctor?  @relation("AttendingDoctor", fields: [attendingDoctorId], references: [id])

  // Demographics
  underlyingConditions String?
  regularMedications   String?
  allergyHistory       String?  @default("NKDA")
  lastMeal             String?
  lmp                  String?

  // Presenting Complaint
  chiefComplaints              String?
  historyOfPresentingIllness   String?

  // ABCDE Assessment
  airwaySpeech     String?
  spo2Percent      Float?
  spo2PerLiter     String?
  rr               Int?
  chestFindings    String?
  pr               Int?
  bp               String?
  heartSounds      String?
  grbs             Float?
  gcsE             Int?
  gcsV             Int?
  gcsM             Int?
  pupilDiameterR   String?
  pupilDiameterL   String?
  pupilReactionR   String?
  pupilReactionL   String?
  cornealReflexR   String?
  cornealReflexL   String?
  ulRight          String?
  ulLeft           String?
  llRight          String?
  llLeft           String?
  tempC            Float?
  abdomenLogRoll   String?
  dre              String?
  bedsideUsg       String?

  // Physical Examination
  physicalExamGC       String?
  physicalExamFindings String?

  // Investigations
  invCBC            Boolean @default(false)
  invLFT            Boolean @default(false)
  invRFT            Boolean @default(false)
  invElectrolytes   Boolean @default(false)
  invCardiacMarkers Boolean @default(false)
  invCRP            Boolean @default(false)
  invDengue         Boolean @default(false)
  invRBS            Boolean @default(false)
  invBHCG           Boolean @default(false)
  invUrineRoutine   Boolean @default(false)
  invUrineCulture   Boolean @default(false)
  invECG            Boolean @default(false)
  invXray           Boolean @default(false)
  invUSG            Boolean @default(false)
  invDoppler        Boolean @default(false)
  invCT             Boolean @default(false)
  invMRI            Boolean @default(false)
  invOthers         String?

  // Treatment & Course
  workingDiagnosis    String?
  initialTreatment    String?
  courseOfManagement   String?
  referralsOutcomes   String?

  // Disposition
  dispositionType     String?  // DISCHARGED_ER, ADMITTED, REFERRED, DISCHARGED_REFERRED
  dischargeDatetime   DateTime?

  // Discharge Vitals
  dcGC       String?
  dcHR       Int?
  dcRR       Int?
  dcBP       String?
  dcSpo2     String?
  dcTemp     Float?
  dcChest    String?
  dcCVS      String?
  dcAbdomen  String?
  dcCNS      String?

  // Discharge Instructions
  dcMedications        String?
  dcAdvice             String?
  dcFollowUp           String?
  dcDoctorId           String?
  dcDoctor             Doctor?  @relation("DischargeDoctor", fields: [dcDoctorId], references: [id])
  dcExplainedToName    String?
  dcExplainedToRelation String?

  // Discharge Checklist (YES, NO, NA)
  clMedications    String?
  clPrescription   String?
  clLabReports     String?
  clXrayEcg        String?
  clCtMriUsg       String?
  clMedCerts       String?
  clOldDocs        String?

  dcReceivedByName   String?
  dcAttendingNurse   String?

  // Status
  status    String   @default("ACTIVE") // ACTIVE, DISCHARGED, ADMITTED, REFERRED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 3: Generate Prisma client and apply migration**

```bash
cd "/Users/anaan/Desktop/AMSH ER/er-portal"
npx prisma migrate dev --name init
```

Expected: Migration created, SQLite database file created at `prisma/dev.db`.

- [ ] **Step 4: Create Prisma client singleton**

Create `er-portal/src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema with Doctor, Bed, Patient models"
```

---

### Task 3: Seed ER Beds + Admin Account

**Files:**
- Create: `er-portal/prisma/seed.ts`
- Modify: `er-portal/package.json` (add seed script)

- [ ] **Step 1: Install bcrypt**

```bash
cd "/Users/anaan/Desktop/AMSH ER/er-portal"
npm install bcryptjs
npm install --save-dev @types/bcryptjs tsx
```

- [ ] **Step 2: Create seed file**

Create `er-portal/prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed beds
  const beds = [
    { name: "RESUS", zone: "RESUS", room: null, displayOrder: 1, color: "#DC2626" },
    { name: "Bed 2 (Receiving)", zone: "RECEIVING", room: null, displayOrder: 2, color: "#E8A0A0" },
    { name: "TRAUMA (R3)", zone: "TRAUMA", room: "R3", displayOrder: 3, color: "#F5D0D0" },
    { name: "Bed 3 (R3)", zone: "GENERAL", room: "R3", displayOrder: 4, color: "#FEF9E7" },
    { name: "Bed 4 (R1)", zone: "GENERAL", room: "R1", displayOrder: 5, color: "#FEF9E7" },
    { name: "Bed 5 (R1)", zone: "GENERAL", room: "R1", displayOrder: 6, color: "#FEF9E7" },
    { name: "Bed 6 (R2)", zone: "GENERAL", room: "R2", displayOrder: 7, color: "#FEF9E7" },
    { name: "Bed 7 (R2)", zone: "GENERAL", room: "R2", displayOrder: 8, color: "#FEF9E7" },
    { name: "Triage Chair", zone: "TRIAGE", room: null, displayOrder: 9, color: "#EAF2F8" },
  ];

  for (const bed of beds) {
    await prisma.bed.upsert({
      where: { name: bed.name },
      update: bed,
      create: bed,
    });
  }

  // Seed admin account
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.doctor.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin",
      username: "admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  console.log("Seeded 9 beds and admin account");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 3: Add seed config to package.json**

Add to `er-portal/package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4: Run the seed**

```bash
cd "/Users/anaan/Desktop/AMSH ER/er-portal"
npx prisma db seed
```

Expected: "Seeded 9 beds and admin account"

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: seed ER beds and admin account"
```

---

### Task 4: NextAuth.js Authentication

**Files:**
- Create: `er-portal/src/lib/auth.ts`
- Create: `er-portal/src/app/api/auth/[...nextauth]/route.ts`
- Create: `er-portal/src/app/login/page.tsx`
- Create: `er-portal/src/components/AuthProvider.tsx`
- Create: `er-portal/src/middleware.ts`
- Modify: `er-portal/src/app/layout.tsx`

- [ ] **Step 1: Install NextAuth**

```bash
cd "/Users/anaan/Desktop/AMSH ER/er-portal"
npm install next-auth
```

- [ ] **Step 2: Create .env.local**

Create `er-portal/.env.local`:

```
NEXTAUTH_SECRET=amsh-er-portal-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 3: Create auth config**

Create `er-portal/src/lib/auth.ts`:

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const doctor = await prisma.doctor.findUnique({
          where: { username: credentials.username },
        });

        if (!doctor || !doctor.active) return null;

        const valid = await bcrypt.compare(credentials.password, doctor.passwordHash);
        if (!valid) return null;

        return {
          id: doctor.id,
          name: doctor.name,
          email: doctor.username,
          role: doctor.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
```

- [ ] **Step 4: Create NextAuth route handler**

Create `er-portal/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 5: Create AuthProvider**

Create `er-portal/src/components/AuthProvider.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 6: Update layout.tsx to wrap with AuthProvider**

Replace `er-portal/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AMSH ER Portal",
  description: "Emergency Room Management - Dr. Abdul Samad Memorial Hospital",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create login page**

Create `er-portal/src/app/login/page.tsx`:

```tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username or password");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            Dr. Abdul Samad Memorial Hospital
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Emergency & Trauma Department
          </p>
          <h2 className="text-lg font-semibold text-blue-800 mt-4">
            ER Portal Login
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 text-white py-2 rounded-md hover:bg-blue-900 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create middleware for auth protection**

Create `er-portal/src/middleware.ts`:

```typescript
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 9: Test login flow**

```bash
cd "/Users/anaan/Desktop/AMSH ER/er-portal"
npm run dev
```

1. Open http://localhost:3000 — should redirect to /login
2. Log in with username `admin`, password `admin123`
3. Should redirect to `/` showing "AMSH ER Portal"

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add NextAuth.js authentication with login page"
```

---

### Task 5: API Routes for Beds and Doctors

**Files:**
- Create: `er-portal/src/app/api/beds/route.ts`
- Create: `er-portal/src/app/api/doctors/route.ts`

- [ ] **Step 1: Create beds API**

Create `er-portal/src/app/api/beds/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const beds = await prisma.bed.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      patients: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          age: true,
          gender: true,
          chiefComplaints: true,
          arrivalDateTime: true,
          dispositionType: true,
          attendingDoctor: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(beds);
}
```

- [ ] **Step 2: Create doctors API**

Create `er-portal/src/app/api/doctors/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doctors = await prisma.doctor.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(doctors);
}
```

- [ ] **Step 3: Test APIs**

```bash
# After logging in via the browser (to get a session cookie), test:
curl http://localhost:3000/api/beds
curl http://localhost:3000/api/doctors
```

Expected: JSON arrays with 9 beds and 1 doctor.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add beds and doctors API routes"
```
