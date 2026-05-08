import "server-only";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: {
    allowedHosts: ["localhost:*", "127.0.0.1:*"],
    fallback: process.env.BETTER_AUTH_URL
  },
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
    }
  }
});
