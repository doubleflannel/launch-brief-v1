/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GOOGLE_SA_KEY: process.env.GOOGLE_SA_KEY,
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_TO: process.env.EMAIL_TO,
  },
}

module.exports = nextConfig