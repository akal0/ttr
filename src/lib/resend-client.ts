import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

interface AddToMailingListParams {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string; // Track where the email came from
}

export async function addToMailingList({
  email,
  firstName,
  lastName,
  source,
}: AddToMailingListParams) {
  if (!email) {
    console.warn("Missing email");
    return { success: false, error: "Missing email" };
  }

  try {
    const contactData: any = {
      email,
      unsubscribed: false,
    };

    // Add firstName and lastName if provided
    if (firstName) contactData.firstName = firstName;
    if (lastName) contactData.lastName = lastName;

    console.log("Creating Resend contact:", { email, firstName, lastName, source });

    const { data, error } = await resend.contacts.create(contactData);

    if (error) {
      // Check if contact already exists
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("Contact already exists")
      ) {
        console.log(`Contact already exists: ${email}`);
        return { success: true, exists: true };
      }
      console.error("Failed to add contact to Resend:", error);
      return { success: false, error };
    }

    console.log(`✅ Added ${email} to mailing list (source: ${source})`, data);

    // If audience ID is provided, add contact to audience
    if (process.env.RESEND_AUDIENCE_ID && data?.id) {
      try {
        await resend.contacts.update({
          id: data.id,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        });
        console.log(`✅ Added contact to audience: ${process.env.RESEND_AUDIENCE_ID}`);
      } catch (audienceError) {
        console.error("Failed to add to audience:", audienceError);
      }
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error adding contact to mailing list:", err);
    return { success: false, error: err };
  }
}
