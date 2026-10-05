import type { Metadata } from "next"
import Link from "next/link"
import { DocPage, P, Section } from "@/components/docs/doc-page"

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What tweenly collects, why, and your choices. Short and plain.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <DocPage
      title="Privacy policy"
      description="tweenly is an open-source component library. We collect as little as possible. Updated October 5, 2026."
    >
      <Section title="What we collect">
        <ul className="space-y-3 text-[14.5px] leading-7 text-muted-foreground">
          <li>
            <strong className="text-foreground">Anonymous usage analytics.</strong> Page views and a few actions (for example,
            copying an install command), through cookieless Vercel Web Analytics. You can turn this off on the{" "}
            <Link href="/cookies" className="font-medium text-foreground underline underline-offset-4">cookie policy</Link> page.
          </li>
          <li>
            <strong className="text-foreground">Your email, if you subscribe.</strong> Used only to send release notes. Every
            email has an unsubscribe link.
          </li>
          <li>
            <strong className="text-foreground">Feedback you send.</strong> Your message, rating, the page you were on and,
            only if you add it, your email so we can reply.
          </li>
          <li>
            <strong className="text-foreground">Server logs.</strong> Our host, Vercel, keeps standard request logs (such as IP
            address and browser) for security and reliability.
          </li>
        </ul>
      </Section>

      <Section title="What we don't do">
        <P>We don&apos;t sell or rent data, show ads, build advertising profiles, or track you across other websites.</P>
      </Section>

      <Section title="Where data goes">
        <P>
          The site is hosted on Vercel. Newsletter signups and feedback are forwarded to the email and messaging tools we use
          to read them. Components you install run in your own app and send nothing to us.
        </P>
      </Section>

      <Section title="Your rights">
        <P>
          You can ask us to show, correct or delete your email or feedback at any time. Email{" "}
          <a href="mailto:imanjunad@gmail.com" className="font-medium text-foreground underline underline-offset-4">imanjunad@gmail.com</a>{" "}
          and we will reply within 7 days.
        </P>
      </Section>
    </DocPage>
  )
}
