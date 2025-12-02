export const emailService = {
  sendWelcomeEmail: async (email: string, username: string) => {
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "welcome",
          email,
          username,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      return await response.json();
    } catch (error) {
      console.error("Email Service Error:", error);
      // We don't throw here to prevent breaking the UI flow if email fails
      return null;
    }
  },
};