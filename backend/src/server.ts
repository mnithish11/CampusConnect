import "dotenv/config";

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { randomBytes, createHash } from "crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const app = express();
const PORT = 5001;

// ==================================================
// 1. MIDDLEWARE
// ==================================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
  })
);

app.use(express.json({ limit: "20kb" }));

// ==================================================
// 2. DATABASE CONNECTION
// ==================================================

const connectionString =
  process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_DATABASE_URL
    : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    process.env.NODE_ENV === "production"
      ? "PRODUCTION_DATABASE_URL is missing."
      : "DATABASE_URL is missing from backend/.env"
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

// ==================================================
// 3. GMAIL CONFIGURATION
// ==================================================

if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
  throw new Error(
    "SMTP_USER or SMTP_APP_PASSWORD is missing from backend/.env"
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Gmail connection failed:", error.message);
  } else {
    console.log("Gmail is ready to send emails!");
  }
});

// ==================================================
// 4. HELPER FUNCTIONS
// ==================================================

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => {
    return entities[character] ?? character;
  });
}

// ==================================================
// 5. HOME ROUTE
// ==================================================

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Welcome to the CampusConnect API!",
    status: "running",
  });
});

// ==================================================
// 6. HEALTH CHECK
// ==================================================

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "CampusConnect backend is working!",
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// 7. DATABASE TEST
// ==================================================

app.get("/api/db-test", async (_req, res) => {
  try {
    const totalUsers = await prisma.user.count();

    res.json({
      success: true,
      message: "Connected to PostgreSQL successfully!",
      totalUsers,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to connect to the database.",
    });
  }
});

// ==================================================
// 8. GET USERS
// ==================================================

app.get("/api/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
});

// ==================================================
// 9. CREATE DEVELOPMENT USER
// ==================================================

app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        university: "Not provided",
        passwordHash: await bcrypt.hash(
          randomBytes(32).toString("hex"),
          12
        ),
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Development user created successfully!",
      user,
    });
  } catch (error) {
    console.error("Error creating development user:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create user. The email may already exist.",
    });
  }
});

// ==================================================
// 10. STUDENT SIGNUP
// ==================================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { fullName, email, university, password } = req.body;

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof university !== "string" ||
      !university.trim() ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required signup details.",
      });
      return;
    }

    if (fullName.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: "Full name must not exceed 100 characters.",
      });
      return;
    }

    if (university.trim().length > 150) {
      res.status(400).json({
        success: false,
        message: "University name must not exceed 150 characters.",
      });
      return;
    }

    if (password.length < 8 || password.length > 128) {
      res.status(400).json({
        success: false,
        message: "Password must contain between 8 and 128 characters.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name: fullName.trim(),
        email: normalizedEmail,
        university: university.trim(),
        passwordHash,
        emailVerified: false,
        emailVerificationTokenHash: tokenHash,
        verificationTokenExpiry: tokenExpiry,
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        createdAt: true,
      },
    });

    const verificationUrl =
      `http://localhost:5173/verify-email?token=${verificationToken}`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Verify your CampusConnect account",
        text: `
Hello ${user.name},

Welcome to CampusConnect!

Verify your email using this link:

${verificationUrl}

This link expires in 30 minutes.
        `,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#222">
            <h1>Welcome to CampusConnect!</h1>
            <p>Hello ${escapeHtml(user.name)},</p>
            <p>Verify your email address to continue.</p>
            <p style="margin:30px 0">
              <a href="${verificationUrl}"
                style="background:#f4d83f;color:#111;padding:14px 24px;text-decoration:none;border:2px solid #111;border-radius:8px;font-weight:bold;display:inline-block">
                Verify My Email
              </a>
            </p>
            <p>This link expires in 30 minutes.</p>
            <p>— The CampusConnect Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Verification email failed:", emailError);

      await prisma.user.delete({
        where: { id: user.id },
      });

      res.status(502).json({
        success: false,
        message: "Unable to send verification email. Please try again.",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Account created! Check your email to verify your account.",
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create your account. Please try again.",
    });
  }
});

// ==================================================
// 11. RESEND VERIFICATION EMAIL
// ==================================================

app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "No account was found with this email address.",
      });
      return;
    }

    if (user.emailVerified) {
      res.json({
        success: true,
        message: "Your email is already verified. Please log in.",
      });
      return;
    }

    const verificationToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: tokenHash,
        verificationTokenExpiry: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const verificationUrl =
      `http://localhost:5173/verify-email?token=${verificationToken}`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Verify your CampusConnect account",
        text: `
Hello ${user.name},

Please verify your CampusConnect account using this link:

${verificationUrl}

This link expires in 30 minutes.
        `,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#222">
            <h1>Verify your CampusConnect account</h1>
            <p>Hello ${escapeHtml(user.name)},</p>
            <p>Click below to verify your email address.</p>
            <p style="margin:30px 0">
              <a href="${verificationUrl}"
                style="background:#f4d83f;color:#111;padding:14px 24px;text-decoration:none;border:2px solid #111;border-radius:8px;font-weight:bold;display:inline-block">
                Verify My Email
              </a>
            </p>
            <p>This link expires in 30 minutes.</p>
            <p>— The CampusConnect Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Resend verification email failed:", emailError);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationTokenHash: null,
          verificationTokenExpiry: null,
        },
      });

      res.status(502).json({
        success: false,
        message: "Unable to send the verification email. Please try again.",
      });
      return;
    }

    res.json({
      success: true,
      message: "A new verification email has been sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to resend the verification email.",
    });
  }
});

// ==================================================
// 12. VERIFY EMAIL
// ==================================================

app.get("/api/auth/verify-email", async (req, res) => {
  try {
    const token = req.query.token;

    if (typeof token !== "string" || !token) {
      res.status(400).json({
        success: false,
        message: "Verification token is missing.",
      });
      return;
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findUnique({
      where: { emailVerificationTokenHash: tokenHash },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "This verification link is invalid or has already been used.",
      });
      return;
    }

    if (
      !user.verificationTokenExpiry ||
      user.verificationTokenExpiry.getTime() < Date.now()
    ) {
      res.status(400).json({
        success: false,
        message: "This verification link has expired.",
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        verificationTokenExpiry: null,
      },
    });

    res.json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify your email.",
    });
  }
});

// ==================================================
// 13. STUDENT LOGIN
// ==================================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    if (password.length > 128) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
      return;
    }

    res.json({
      success: true,
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        university: user.university,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
});

// ==================================================
// 14. CREATE OR UPDATE STUDENT PROFILE
// ==================================================

app.post("/api/profiles", async (req, res) => {
  try {
    const {
      userId,
      degree,
      branch,
      year,
      country,
      bio,
      skills,
      interests,
    } = req.body;

    if (
      typeof userId !== "string" ||
      typeof degree !== "string" ||
      typeof branch !== "string" ||
      typeof year !== "string" ||
      typeof country !== "string" ||
      typeof bio !== "string" ||
      !Array.isArray(skills) ||
      !Array.isArray(interests)
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide valid profile information.",
      });
      return;
    }

    if (
      !degree.trim() ||
      !branch.trim() ||
      !year.trim() ||
      !country.trim() ||
      degree.length > 100 ||
      branch.length > 100 ||
      country.length > 100 ||
      bio.length > 300 ||
      skills.length > 30 ||
      interests.length > 30 ||
      !skills.every(
        (item: unknown) => typeof item === "string" && item.length <= 80
      ) ||
      !interests.every(
        (item: unknown) => typeof item === "string" && item.length <= 80
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Some profile fields are invalid.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Student account not found.",
      });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        message: "Please verify your email first.",
      });
      return;
    }

    const profile = await prisma.studentProfile.upsert({
      where: { userId },
      create: {
        userId,
        degree: degree.trim(),
        branch: branch.trim(),
        year: year.trim(),
        country: country.trim(),
        bio: bio.trim(),
        skills,
        interests,
      },
      update: {
        degree: degree.trim(),
        branch: branch.trim(),
        year: year.trim(),
        country: country.trim(),
        bio: bio.trim(),
        skills,
        interests,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Student profile saved successfully!",
      profile,
    });
  } catch (error) {
    console.error("Profile save error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to save your profile.",
    });
  }
});

// ==================================================
// 15. GET CURRENT STUDENT PROFILE
// ==================================================

app.get("/api/profiles/me", async (req, res) => {
  try {
    const userId = req.header("x-user-id");

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
      return;
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
      return;
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Profile retrieval error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve your profile.",
    });
  }
});

// ==================================================
// 16. GET ALL STUDENT PROFILES
// ==================================================

app.get("/api/profiles", async (_req, res) => {
  try {
    const profiles = await prisma.studentProfile.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            university: true,
          },
        },
      },
    });

    res.json({
      success: true,
      totalProfiles: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error("Error fetching student profiles:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve student profiles.",
    });
  }
});

// ==================================================
// 17. SEND CONNECTION REQUEST
// POST /api/connections
// ==================================================

app.post("/api/connections", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (
      typeof senderId !== "string" ||
      typeof receiverId !== "string" ||
      !senderId.trim() ||
      !receiverId.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Sender ID and receiver ID are required.",
      });
      return;
    }

    const cleanSenderId = senderId.trim();
    const cleanReceiverId = receiverId.trim();

    if (cleanSenderId === cleanReceiverId) {
      res.status(400).json({
        success: false,
        message: "You cannot connect with yourself.",
      });
      return;
    }

    // Look up each account separately to help identify missing users.
    const sender = await prisma.user.findUnique({
      where: { id: cleanSenderId },
      select: {
        id: true,
        name: true,
        emailVerified: true,
      },
    });

    const receiver = await prisma.user.findUnique({
      where: { id: cleanReceiverId },
      select: {
        id: true,
        name: true,
        emailVerified: true,
      },
    });

    console.log("========== CONNECTION DEBUG ==========");
    console.log("Requested sender ID:", cleanSenderId);
    console.log("Requested receiver ID:", cleanReceiverId);
    console.log("Sender found:", sender);
    console.log("Receiver found:", receiver);
    console.log("======================================");

    if (!sender || !receiver) {
      res.status(404).json({
        success: false,
        message: "One or both student accounts were not found.",
        debug: {
          senderFound: Boolean(sender),
          receiverFound: Boolean(receiver),
        },
      });
      return;
    }

    if (!sender.emailVerified || !receiver.emailVerified) {
      res.status(403).json({
        success: false,
        message: "Both students must verify their email addresses.",
      });
      return;
    }

    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          {
            senderId: cleanSenderId,
            receiverId: cleanReceiverId,
          },
          {
            senderId: cleanReceiverId,
            receiverId: cleanSenderId,
          },
        ],
      },
    });

    if (existingConnection) {
      const message =
        existingConnection.status === "ACCEPTED"
          ? "You are already connected with this student."
          : existingConnection.status === "PENDING"
            ? "A connection request already exists between these students."
            : "A previous connection request exists between these students.";

      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    const connection = await prisma.connection.create({
      data: {
        senderId: cleanSenderId,
        receiverId: cleanReceiverId,
        status: "PENDING",
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Connection request sent successfully!",
      connection,
    });
  } catch (error) {
    console.error("Send connection request error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to send the connection request.",
    });
  }
});

// ==================================================
// 18. GET OUTGOING CONNECTION REQUESTS
// GET /api/connections/sent?userId=USER_ID
// ==================================================

app.get("/api/connections/sent", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (typeof userId !== "string" || !userId.trim()) {
      res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
      return;
    }

    const requests = await prisma.connection.findMany({
      where: {
        senderId: userId.trim(),
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      totalRequests: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Fetch outgoing connection requests error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch outgoing connection requests.",
    });
  }
});

// ==================================================
// 19. GET INCOMING CONNECTION REQUESTS
// GET /api/connections/requests?userId=USER_ID
// ==================================================

app.get("/api/connections/requests", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (typeof userId !== "string" || !userId.trim()) {
      res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
      return;
    }

    const requests = await prisma.connection.findMany({
      where: {
        receiverId: userId.trim(),
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            university: true,
            profile: {
              select: {
                degree: true,
                branch: true,
                year: true,
                country: true,
                bio: true,
                skills: true,
                interests: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      totalRequests: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Fetch connection requests error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch connection requests.",
    });
  }
});

// ==================================================
// 20. ACCEPT CONNECTION REQUEST
// PATCH /api/connections/:id/accept
// ==================================================

app.patch("/api/connections/:id/accept", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    const userId = String(req.body?.userId ?? "").trim();

    if (!id || !userId) {
      res.status(400).json({
        success: false,
        message: "Connection ID and user ID are required.",
      });
      return;
    }

    const connection = await prisma.connection.findUnique({
      where: { id },
    });

    if (!connection) {
      res.status(404).json({
        success: false,
        message: "Connection request not found.",
      });
      return;
    }

    // Normalize both IDs before comparing them.
    const receiverId = String(connection.receiverId).trim();

    if (receiverId !== userId) {
      console.log("Connection receiver ID:", JSON.stringify(receiverId));
      console.log("Request user ID:", JSON.stringify(userId));

      res.status(403).json({
        success: false,
        message: "Only the recipient can accept this request.",
      });
      return;
    }

    if (connection.status !== "PENDING") {
      res.status(409).json({
        success: false,
        message: "This request is no longer pending.",
      });
      return;
    }

    const updatedConnection = await prisma.connection.update({
      where: { id },
      data: { status: "ACCEPTED" },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Connection request accepted successfully.",
      connection: updatedConnection,
    });
  } catch (error) {
    console.error("Accept connection error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to accept connection request.",
    });
  }
});

// ==================================================
// 21. REJECT CONNECTION REQUEST
// PATCH /api/connections/:id/reject
// ==================================================

app.patch("/api/connections/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (
      typeof id !== "string" ||
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Connection ID and user ID are required.",
      });
      return;
    }

    const connection = await prisma.connection.findUnique({
      where: { id },
    });

    if (!connection) {
      res.status(404).json({
        success: false,
        message: "Connection request not found.",
      });
      return;
    }

    if (connection.receiverId !== userId.trim()) {
      res.status(403).json({
        success: false,
        message: "Only the recipient can reject this request.",
      });
      return;
    }

    if (connection.status !== "PENDING") {
      res.status(409).json({
        success: false,
        message: "This request is no longer pending.",
      });
      return;
    }

    const updatedConnection = await prisma.connection.update({
      where: { id },
      data: { status: "REJECTED" },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Connection request rejected.",
      connection: updatedConnection,
    });
  } catch (error) {
    console.error("Reject connection request error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to reject the connection request.",
    });
  }
});

// ==================================================
// 22. GET ACCEPTED CONNECTIONS
// GET /api/connections?userId=USER_ID
// ==================================================

app.get("/api/connections", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (typeof userId !== "string" || !userId.trim()) {
      res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
      return;
    }

    const cleanUserId = userId.trim();

    const connections = await prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: cleanUserId },
          { receiverId: cleanUserId },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            university: true,
            profile: {
              select: {
                degree: true,
                branch: true,
                year: true,
                country: true,
                bio: true,
                skills: true,
                interests: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            university: true,
            profile: {
              select: {
                degree: true,
                branch: true,
                year: true,
                country: true,
                bio: true,
                skills: true,
                interests: true,
              },
            },
          },
        },
      },
    });

    const students = connections.map((connection) => ({
      connectionId: connection.id,
      connectedAt: connection.updatedAt,
      student:
        connection.senderId === cleanUserId
          ? connection.receiver
          : connection.sender,
    }));

    res.json({
      success: true,
      totalConnections: students.length,
      connections: students,
    });
  } catch (error) {
    console.error("Fetch accepted connections error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch accepted connections.",
    });
  }
});

// ==================================================
// 23. START SERVER
// ==================================================

const server = app.listen(PORT, () => {
  console.log(`CampusConnect backend running at http://localhost:${PORT}`);
});

// ==================================================
// 24. GRACEFUL SHUTDOWN
// ==================================================

async function shutdown() {
  console.log("\nShutting down CampusConnect backend...");

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("Database disconnected.");
      process.exit(0);
    } catch (error) {
      console.error("Error disconnecting database:", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);