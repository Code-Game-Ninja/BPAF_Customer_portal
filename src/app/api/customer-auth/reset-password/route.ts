/**
 * POST /api/customer-auth/reset-password
 *
 * Resets a customer portal password and emails the new one.
 * Body: { email }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { generatePassword } from "@/lib/utils";
import { sendPasswordReset } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find the Firebase Auth user
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch {
      return NextResponse.json({ error: "No account found" }, { status: 404 });
    }

    // Verify this is a customer
    const portalSnap = await adminDb
      .collection("customer_portal_users")
      .doc(userRecord.uid)
      .get();

    if (!portalSnap.exists) {
      return NextResponse.json({ error: "No portal account found" }, { status: 404 });
    }

    const portalData = portalSnap.data()!;
    const newPassword = generatePassword(10);

    // Update password in Firebase Auth
    await adminAuth.updateUser(userRecord.uid, { password: newPassword });

    // Update Firestore record
    await adminDb.collection("customer_portal_users").doc(userRecord.uid).update({
      first_login: false,
      updated_at: new Date().toISOString(),
    });

    // Send email
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    try {
      await sendPasswordReset(email, portalData.name, newPassword, portalUrl);
    } catch (emailErr) {
      console.error("[reset-password] Email send failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset and sent to ${email}`,
    });
  } catch (err) {
    console.error("[customer-auth/reset-password] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
