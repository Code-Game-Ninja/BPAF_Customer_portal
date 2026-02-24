/**
 * POST /api/customer-auth/create
 *
 * Called from the admin portal when a customer is created.
 * 1. Creates a Firebase Auth user with email + auto-generated password
 * 2. Stores portal credentials in Firestore `customer_portal_users` collection
 * 3. Sends login credentials to the customer via email (Nodemailer)
 *
 * Body: { customerId, name, email, phone }
 * Auth: Requires admin API key (shared secret between portals)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { generatePassword } from "@/lib/utils";
import { sendCustomerCredentials } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Validate API key (shared secret between admin and customer portals)
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.PORTAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, name, email, phone } = body;

    if (!customerId || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, name, email" },
        { status: 400 }
      );
    }

    // Check if portal user already exists for this customer
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    const existingSnap = await adminDb
      .collection("customer_portal_users")
      .where("customer_id", "==", customerId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: "Portal account already exists for this customer", existing: true },
        { status: 409 }
      );
    }

    // Generate a random password
    const plainPassword = generatePassword(10);

    // Create Firebase Auth user with custom claim role=customer
    let firebaseUid: string;
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password: plainPassword,
        displayName: name,
        disabled: false,
      });
      firebaseUid = userRecord.uid;

      // Set custom claim so Firestore rules can identify customers and their assigned ID
      await adminAuth.setCustomUserClaims(firebaseUid, { 
        role: "customer",
        customer_id: customerId 
      });
    } catch (authErr: unknown) {
      // If user already exists in Auth, use the existing UID
      if (
        typeof authErr === "object" &&
        authErr !== null &&
        "code" in authErr &&
        (authErr as { code: string }).code === "auth/email-already-exists"
      ) {
        const existing = await adminAuth.getUserByEmail(email);
        firebaseUid = existing.uid;
        // Update password for re-sends
        await adminAuth.updateUser(firebaseUid, { password: plainPassword });
        await adminAuth.setCustomUserClaims(firebaseUid, { 
          role: "customer",
          customer_id: customerId 
        });
      } else {
        throw authErr;
      }
    }

    // Store portal user mapping in Firestore
    const now = new Date().toISOString();
    await adminDb.collection("customer_portal_users").doc(firebaseUid).set({
      customer_id: customerId,
      firebase_uid: firebaseUid,
      name,
      email,
      phone: phone || "",
      is_active: true,
      first_login: false,
      created_at: now,
      updated_at: now,
    });

    // Send credentials email
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    let emailSent = false;
    try {
      await sendCustomerCredentials(email, name, plainPassword, portalUrl);
      emailSent = true;
    } catch (emailErr) {
      console.error("[customer-auth] Email send failed:", emailErr);
      // We don't fail the request, but we report it in the response
    }

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? `Portal account created and credentials sent to ${email}`
        : `Portal account created, but failed to send credentials email to ${email}.`,
      firebase_uid: firebaseUid,
      email_sent: emailSent
    });
  } catch (err) {
    console.error("[customer-auth/create] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
