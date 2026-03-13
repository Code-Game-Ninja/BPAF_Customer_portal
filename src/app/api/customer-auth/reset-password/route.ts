/**
 * POST /api/customer-auth/reset-password
 *
 * Resets a customer portal password and emails the new one.
 * Body: { email }
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generatePassword } from "@/lib/utils";
import { sendPasswordReset } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Verify this is a valid portal customer
    const { data: portalData, error: portalError } = await supabaseAdmin
      .from("customer_portal_users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (portalError || !portalData) {
      return NextResponse.json({ error: "No portal account found" }, { status: 404 });
    }

    const newPassword = generatePassword(10);

    // Update password in Supabase Auth
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      portalData.auth_user_id,
      { password: newPassword }
    );
    
    if (updateAuthError) {
      throw updateAuthError;
    }

    // Update DB record
    const { error: dbUpdateError } = await supabaseAdmin
      .from("customer_portal_users")
      .update({
        portal_password: newPassword,
        first_login: false,
        updated_at: new Date().toISOString(),
      })
      .eq("auth_user_id", portalData.auth_user_id);
      
    if (dbUpdateError) {
       throw dbUpdateError;
    }

    // Send email
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    try {
      await sendPasswordReset(normalizedEmail, portalData.name, newPassword, portalUrl);
    } catch (emailErr) {
      console.error("[reset-password] Email send failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset and sent to ${normalizedEmail}`,
    });
  } catch (err) {
    console.error("[customer-auth/reset-password] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
