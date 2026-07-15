import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Confessly",
  description: "Privacy Policy for Confessly anonymous confession platform.",
};

const sections = [
  {
    title: "Information We Collect",
    body: [
      "Confessly lets visitors submit anonymous confessions without creating an account. We collect the confession text you submit, the category you choose, an optional alias or nickname, optional uploaded image content, comments, reactions, and report actions.",
      "We do not ask users to submit their real name, email address, phone number, password, or Facebook account details when writing or reading confessions.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use submitted content to operate the anonymous confession feed, allow moderation, display approved confessions, support comments and reactions, and remove content that violates our safety standards.",
      "If a confession is approved by a moderator, Confessly may publish that confession to the connected Confessly Facebook Page so Facebook users can read, react, and comment on it.",
    ],
  },
  {
    title: "Facebook Integration",
    body: [
      "Confessly uses the Meta Graph API only for Page management features selected by the site administrator, such as publishing approved confessions to the Confessly Facebook Page and reading Page comments related to published confessions.",
      "Facebook access tokens are used only to connect the administrator's Facebook Page integration. Confessly does not sell Facebook data or use it for advertising.",
    ],
  },
  {
    title: "Data Sharing",
    body: [
      "Approved confessions, aliases, categories, images, comments, and reactions may be visible publicly on Confessly and, when enabled, on the Confessly Facebook Page.",
      "We do not sell personal information. We may disclose information if required by law, to protect users, or to prevent abuse of the service.",
    ],
  },
  {
    title: "Data Retention and Deletion",
    body: [
      "Confession and comment data may remain stored while the service is active. Moderators can reject, delete, or remove content from the public feed.",
      "If you want content removed, contact the Confessly Page administrator with enough information to identify the confession or comment.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use reasonable technical and organizational measures to protect stored content and administrator configuration. No internet service can guarantee absolute security.",
    ],
  },
  {
    title: "Children's Privacy",
    body: [
      "Confessly is not intended for children under 13. If we learn that a child under 13 submitted content, we will remove it when reasonably possible.",
    ],
  },
  {
    title: "Changes to This Policy",
    body: [
      "We may update this Privacy Policy when the service changes. The updated version will be posted on this page with a new effective date.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <section className="glass rounded-3xl border border-white/5 p-6 md:p-10 shadow-xl">
        <div className="flex flex-col gap-4 border-b border-white/5 pb-8">
          <Link href="/" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors">
            Confessly
          </Link>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Privacy Policy
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-slate-400">
              Effective date: July 15, 2026
            </p>
            <p className="text-base leading-relaxed text-slate-300">
              This Privacy Policy explains how Confessly collects, uses, shares, and protects information when people use our anonymous confession website and related Facebook Page integration.
            </p>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-white/5">
          {sections.map((section) => (
            <section key={section.title} className="py-7">
              <h2 className="text-xl font-bold text-white mb-3">{section.title}</h2>
              <div className="flex flex-col gap-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm md:text-base leading-relaxed text-slate-400">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
          <h2 className="text-lg font-bold text-white mb-2">Contact</h2>
          <p className="text-sm md:text-base leading-relaxed text-slate-400">
            For privacy questions or deletion requests, contact the Confessly administrator through the Confessly Facebook Page or the contact method published on the live Confessly site.
          </p>
        </section>
      </section>
    </div>
  );
}
