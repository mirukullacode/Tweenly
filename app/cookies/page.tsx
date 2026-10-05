import type { Metadata } from "next"
import Link from "next/link"
import { DocPage, InlineCode, P, Section } from "@/components/docs/doc-page"
import { ConsentControls } from "@/components/site/cookie-consent"

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Exactly what tweenly stores in your browser, why, and how to turn analytics off.",
  alternates: { canonical: "/cookies" },
}

const STORAGE = [
  { key: "tweenly_consent", kind: "Cookie", purpose: "Remembers whether you accepted or declined analytics.", lasts: "1 year" },
  { key: "theme", kind: "Local storage", purpose: "Your light or dark mode choice.", lasts: "Until you clear it" },
  { key: "tweenly:tour", kind: "Local storage", purpose: "Whether you have seen the guided tour.", lasts: "Until you clear it" },
  { key: "tweenly:nav", kind: "Local storage", purpose: "Which sidebar categories you opened or closed.", lasts: "Until you clear it" },
  { key: "tweenly:lib", kind: "Local storage", purpose: "Your Motion or GSAP sidebar filter.", lasts: "Until you clear it" },
  { key: "tweenly:recent", kind: "Local storage", purpose: "Recently viewed components, shown in search.", lasts: "Until you clear it" },
  { key: "tweenly:star-prompt", kind: "Local storage", purpose: "So the GitHub star prompt appears only once.", lasts: "Until you clear it" },
  { key: "tweenly:stars:*", kind: "Session storage", purpose: "Caches the GitHub star count for 30 minutes.", lasts: "Until you close the tab" },
]

export default function CookiesPage() {
  return (
    <DocPage
      title="Cookie policy"
      description="tweenly sets one cookie, keeps a few preferences in your browser, and uses anonymous analytics you can turn off. Updated October 5, 2026."
    >
      <Section title="Your choice">
        <ConsentControls />
      </Section>

      <Section title="Analytics">
        <P>
          We use Vercel Web Analytics to count page views and a few actions, such as copying an install command. It does not
          use cookies, does not store anything on your device, and does not identify you or follow you across websites. Data
          is aggregated. If you choose <strong className="text-foreground">Decline</strong> or turn analytics off above,
          nothing is sent.
        </P>
      </Section>

      <Section title="What we store in your browser">
        <P>These are needed for the site to remember your preferences. None of them are used for advertising.</P>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-inset text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Purpose</th>
                <th className="px-4 py-2.5 font-medium">Kept for</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {STORAGE.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{row.key}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.kind}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.purpose}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.lasts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Third parties">
        <P>
          The star count is fetched by your browser from the public GitHub API, so GitHub receives a standard request from
          you. Buttons like <InlineCode>Open in v0</InlineCode> and links to GitHub take you to those sites, where their own
          policies apply. Fonts are served from this site, not from Google.
        </P>
      </Section>

      <Section title="Clearing your data">
        <P>
          Clear site data in your browser settings to remove everything above. See the{" "}
          <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4">privacy policy</Link> for
          what happens to the email or feedback you send us, and email{" "}
          <a href="mailto:imanjunad@gmail.com" className="font-medium text-foreground underline underline-offset-4">imanjunad@gmail.com</a>{" "}
          with any questions.
        </P>
      </Section>
    </DocPage>
  )
}
