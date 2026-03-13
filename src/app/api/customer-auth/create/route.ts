/**
 * POST /api/customer-auth/create
 *
 * Called from the admin portal when a customer is created.
 * 1. Creates a Supabase Auth user with email + auto-generated password
 * 2. Stores portal credentials in `customer_portal_users` table
 * 3. Sends login credentials to the customer via email (Nodemailer)
 *
 * Body: { customerId, name, email, phone }
 * Auth: Requires admin API key (shared secret between portals)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generatePassword } from "@/lib/utils";
import { sendCustomerCredentials } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.PORTAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, name, email, phone } = body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!customerId || !name || !normalizedEmail) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, name, email" },
        { status: 400 }
      );
    }

    // Check if portal user already exists for this customer
    const { data: existingSnap } = await supabaseAdmin
      .from("customer_portal_users")
      .select("*")
      .eq("customer_id", customerId)
      .limit(1)
      .single();

    if (existingSnap) {
      return NextResponse.json(
        { error: "Portal account already exists for this customer", existing: true },
        { status: 409 }
      );
    }

    // Generate a random password
    const plainPassword = generatePassword(10);

    // Create Auth user
    let authUserResponse = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: plainPassword,
      email_confirm: true,
      user_metadata: { name, role: "customer", customer_id: customerId },
    });

    let authUserId: string;

    if (authUserResponse.error) {
      if (authUserResponse.error.message.includes("already exists") || authUserResponse.error.code === "user_already_exists") {
        const listRes = await supabaseAdmin.auth.admin.listUsers();
        const existing = listRes.data.users.find(
          (u) => (u.email || "").toLowerCase() === normalizedEmail
        );
        if (!existing) {
          throw new Error("User exists but could not be found in list");
        }
        authUserId = existing.id;
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: plainPassword,
          user_metadata: { name, role: "customer", customer_id: customerId }
        });
      } else {
        throw authUserResponse.error;
      }
    } else {
       authUserId = authUserResponse.data.user.id;
    }

    // Store portal user mapping
    const { error: insertError } = await supabaseAdmin.from("customer_portal_users").insert({
      customer_id: customerId,
      auth_user_id: authUserId,
      name,
      email: normalizedEmail,
      phone: phone || "",
      portal_password: plainPassword,
      is_active: true,
      first_login: false,
    });
    
    if (insertError) {
      throw insertError;
    }

    // Send credentials email
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    let emailSent = false;
    try {
      await sendCustomerCredentials(normalizedEmail, name, plainPassword, portalUrl);
      emailSent = true;
    } catch (emailErr) {
      console.error("[customer-auth] Email send failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? `Portal account created and credentials sent to ${normalizedEmail}`
        : `Portal account created, but failed to send credentials email to ${normalizedEmail}.`,
      auth_user_id: authUserId,
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
