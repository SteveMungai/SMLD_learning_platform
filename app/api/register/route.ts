import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { JOIN_PROBLEM, lookupJoinCode } from "@/lib/joinCodes";

export async function POST(req: Request) {
  try {
    const { name, email, password, code } = await req.json();

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const emailNormalized = String(email).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { Email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // A join code is optional. If one is given it must work, so nobody ends up with an account that
    // silently failed to join the cohort they were invited to.
    const joinCode = typeof code === "string" ? code.trim() : "";
    let cohort: { CohortID: string; CohortName: string } | null = null;
    if (joinCode) {
      const found = await lookupJoinCode(joinCode);
      if (!found.ok) return NextResponse.json({ message: JOIN_PROBLEM }, { status: 400 });
      cohort = found.cohort;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);


    // Role defaults to STUDENT per schema; change here if self-registration
    const user = await prisma.user.create({
      data: {
        FullName: String(name).trim(),
        Email: emailNormalized,
        Password: hashedPassword,
        // Created together with the account, so it either all happens or none of it does.
        ...(cohort ? { cohortMemberships: { create: { CohortID: cohort.CohortID, Status: "ACTIVE" as const } } } : {}),
      },
      select: {
        UserID: true,
        FullName: true,
        Email: true,
        Role: true,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully.", user, cohort: cohort?.CohortName ?? null },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}