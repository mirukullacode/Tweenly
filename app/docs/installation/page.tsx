import type { Metadata } from "next"
import { CodeBlock } from "@/components/docs/code-block"
import { DocPage, InlineCode, P, Section, Step, Steps } from "@/components/docs/doc-page"
import { siteConfig } from "@/lib/docs"

export const metadata: Metadata = { title: "Installation" }

export default function InstallationPage() {
  const url = siteConfig.url

  return (
    <DocPage
      title="Installation"
      description="motioncn components install like any shadcn component. They drop into your project as source files you can read and edit."
    >
      <Section title="With the shadcn CLI">
        <Steps>
          <Step title="Set up shadcn">
            <P>
              Skip this if your project already has a <InlineCode>components.json</InlineCode>.
            </P>
            <CodeBlock code="npx shadcn@latest init" lineNumbers={false} />
          </Step>
          <Step title="Add a component">
            <P>Point the CLI at the component&apos;s registry URL. Dependencies are installed for you.</P>
            <CodeBlock code={`npx shadcn@latest add ${url}/r/fade-in.json`} lineNumbers={false} />
          </Step>
          <Step title="Use it">
            <CodeBlock
              code={`import { FadeIn } from "@/components/fade-in"

export default function Page() {
  return (
    <FadeIn direction="up" blur={8}>
      <h1>Hello, world</h1>
    </FadeIn>
  )
}`}
            />
          </Step>
        </Steps>
      </Section>

      <Section title="Namespaced registry">
        <P>
          Register motioncn once in <InlineCode>components.json</InlineCode> and add components by name.
        </P>
        <CodeBlock
          code={`{
  "registries": {
    "@motioncn": "${url}/r/{name}.json"
  }
}`}
        />
        <CodeBlock code="npx shadcn@latest add @motioncn/fade-in @motioncn/marquee" lineNumbers={false} />
      </Section>

      <Section title="Manual">
        <P>
          Install the component&apos;s dependencies, then copy the code from its Source tab into{" "}
          <InlineCode>components/</InlineCode>. Most components only need Motion. Fill Button and
          Sticky Cards use GSAP.
        </P>
        <CodeBlock code="npm install motion" lineNumbers={false} />
        <P>
          Components import <InlineCode>cn</InlineCode> from <InlineCode>@/lib/utils</InlineCode>, which
          shadcn projects already include.
        </P>
      </Section>

      <Section title="Reduced motion">
        <P>
          Every component checks <InlineCode>prefers-reduced-motion</InlineCode>. When it is set,
          movement, blur and scale are removed and only a short opacity fade (or the final state) remains.
          You don&apos;t need to do anything extra.
        </P>
      </Section>
    </DocPage>
  )
}
