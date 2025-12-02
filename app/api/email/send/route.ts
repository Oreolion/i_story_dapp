import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import WelcomeEmail from "@/components/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, type } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let emailComponent;
    let subject = "";

    // Switch logic to handle different email types
    switch (type) {
      case "welcome":
        emailComponent = WelcomeEmail({ username: username || "Storyteller" });
        subject = "Welcome to IStory";
        break;
      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: "IStory <onboarding@resend.dev>", // Change this to your domain in production
      to: [email], // In dev, this must be YOUR email unless you verified a domain
      subject: subject,
      react: emailComponent,
    });

    if (data.error) {
        return NextResponse.json({ error: data.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.data?.id });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}