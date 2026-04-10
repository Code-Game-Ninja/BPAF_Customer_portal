import { supabase } from "@/lib/supabase/client";

export type KYCDocumentType =
  | "aadhaar"
  | "pan"
  | "gst"
  | "address_proof"
  | "passport"
  | "driving_license"
  | "voter_id"
  | "bank_statement"
  | "company_registration"
  | "other";

export type KYCStatus = "pending" | "verified" | "rejected" | "expired";

export interface KYCDocument {
  id: string;
  customer_id: string;
  document_type: string;
  document_number?: string;
  file_path: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  status: KYCStatus;
  rejection_reason?: string;
  created_at: string;
}

const BUCKET = "kyc-documents";

export const kycService = {
  /**
   * List all KYC documents for the current customer
   */
  async list(customerId: string): Promise<KYCDocument[]> {
    const { data, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as KYCDocument[];
  },

  /**
   * Upload a new KYC document.
   * Customers cannot set uploaded_by or status in the insert payload because
   * the database sets those to NULL and 'pending' via defaults/nullability.
   */
  async upload(
    customerId: string,
    file: File,
    docType: string,
    docNumber?: string
  ): Promise<KYCDocument> {
    const ext = file.name.split(".").pop();
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filePath = `${customerId}/${docType}_${timestamp}_${cleanFileName}`;

    // 1. Upload file to Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    // 2. Get Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    // 3. Insert record into database
    const payload = {
      customer_id: customerId,
      document_type: docType,
      document_number: docNumber,
      file_path: filePath,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      status: "pending",
    };

    const { data, error: dbError } = await supabase
      .from("kyc_documents")
      .insert(payload)
      .select()
      .single();

    if (dbError) {
      // Cleanup storage on DB failure
      await supabase.storage.from(BUCKET).remove([filePath]);
      throw dbError;
    }

    return data as KYCDocument;
  },

  /**
   * Delete a pending KYC document uploaded by mistake
   */
  async delete(documentId: string, filePath: string): Promise<void> {
    const { error: dbError } = await supabase
      .from("kyc_documents")
      .delete()
      .eq("id", documentId)
      .eq("status", "pending");

    if (dbError) throw dbError;

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([filePath]);

    if (storageError) {
      console.warn("Failed to delete storage file", storageError);
    }
  },

  /**
   * Generates a short-lived signed URL for a private KYC document
   */
  async getSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60); // 60 seconds

    if (error || !data) throw error || new Error("URL generation failed");
    return data.signedUrl;
  },
};
