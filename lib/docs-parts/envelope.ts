import { classNameProp, num, type ComponentDoc, type PropDoc } from "@/lib/docs-types"

const FILE = "registry/new-york/envelope/envelope.tsx"
const DEPS = ["gsap", "@gsap/react", "motion", "lucide-react"]

const look: PropDoc[] = [
  { name: "variant", type: '"classic" | "airmail" | "minimal" | "glass"', default: "classic", description: "Kraft paper with a wax seal, airmail stripes with a stamp and postmark, flat theme-aware, or frosted glass over a glow.", control: { type: "select", options: ["classic", "airmail", "minimal", "glass"] } },
  { name: "color", type: "string", description: "Envelope color. Defaults to the variant's color.", control: { type: "color" } },
  { name: "paper", type: "string", description: "Letter paper color. Defaults to the variant's paper.", control: { type: "color" } },
  { name: "ink", type: "string", description: "Letter text color. Defaults to the variant's ink.", control: { type: "color" } },
  { name: "seal", type: "string", description: "Wax seal, stamp or dot color. Defaults to the variant's seal.", control: { type: "color" } },
  { name: "accent", type: "string", default: "#ff4d12", description: "Accent for buttons, focus, glow and the minimal seal.", control: { type: "color" } },
]

const sizing: PropDoc[] = [
  { name: "duration", type: "number", default: 1, description: "Speed multiplier for the choreography; 2 plays it twice as slow.", control: num(0.5, 2.5, 0.1, "x") },
  { name: "width", type: "number", default: 420, description: "Envelope width in px. Shrinks to fit its container.", control: num(300, 520, 10, "px") },
  { name: "radius", type: "number", default: 14, description: "Envelope corner radius in px.", control: num(0, 28, 1, "px") },
]

export const envelopeDocs: ComponentDoc[] = [
  {
    slug: "envelope",
    name: "Envelope",
    exportName: "EnvelopeComposer",
    description: "A send-a-message form as a letter: it folds into the envelope, the flap closes, a seal stamps on and the envelope flies off.",
    category: "Forms",
    file: FILE,
    dependencies: DEPS,
    staticProps: [`onSend={async (values) => { await fetch("/api/contact", { method: "POST", body: JSON.stringify(values) }) }}`],
    isNew: true,
    props: [
      ...look,
      { name: "sealLabel", type: "string", description: "Initial or monogram on the seal or stamp. Defaults to the sender's initial, else \"T\".", control: { type: "text" } },
      { name: "onSend", type: "(values: EnvelopeValues) => Promise<void> | void", description: "Called with the trimmed { name, email, subject, message }. The envelope waits for the promise; a rejection reopens it and shakes the letter." },
      { name: "fields", type: "{ name?: boolean; email?: boolean; subject?: boolean }", default: "{ name: true, email: true, subject: false }", description: "Which fields to show. The message is always shown; name is required when shown, email is validated when filled." },
      { name: "placeholders", type: "Partial<Record<EnvelopeField, string>>", description: "Placeholder per field (name, email, subject, message)." },
      { name: "labels", type: "Partial<Record<EnvelopeField, string>>", default: "{ name: \"From\", email: \"Email\", subject: \"Subject\", message: \"Message\" }", description: "Label per field." },
      { name: "messageMaxLength", type: "number", default: 500, description: "Maximum message length, shown as a live counter.", control: num(80, 1000, 20) },
      { name: "sendLabel", type: "string", default: "Send", description: "Send button text.", control: { type: "text" } },
      { name: "againLabel", type: "string", default: "Write another", description: "Button text in the success state.", control: { type: "text" } },
      { name: "successTitle", type: "string | ((values: EnvelopeValues) => string)", description: "Success heading, or a function of the sent values. Defaults to \"Sent. Thanks, {first name}.\"", control: { type: "text" } },
      { name: "successMessage", type: "string | ((values: EnvelopeValues) => string)", default: "Your letter is on its way. We'll write back soon.", description: "Success body, or a function of the sent values.", control: { type: "text" } },
      { name: "errorMessage", type: "string", default: "Couldn't send. Try again.", description: "Shown when onSend rejects. An Error's message is used when present." },
      { name: "flyDirection", type: '"up-right" | "up" | "right"', default: "up-right", description: "Where the sealed envelope flies off to.", control: { type: "select", options: ["up-right", "up", "right"] } },
      { name: "resetAfter", type: "number | false", default: false, description: "Bring a fresh envelope back after this many ms, or wait for \"Write another\"." },
      ...sizing,
      classNameProp,
    ],
  },
  {
    slug: "envelope-reveal",
    name: "Envelope Reveal",
    exportName: "Envelope",
    description: "A sealed envelope that opens on click, hover or scroll: the seal pops, the flap swings open and the letter slides out and unfolds.",
    category: "Cards",
    file: FILE,
    dependencies: DEPS,
    children: `<p>You're invited.</p>`,
    isNew: true,
    props: [
      { name: "children", type: "ReactNode", description: "Content of the letter, e.g. an invitation or a thank-you note." },
      ...look,
      { name: "sealLabel", type: "string", default: "T", description: "Initial or monogram on the seal or stamp.", demo: "M&J", control: { type: "text" } },
      { name: "trigger", type: '"click" | "hover" | "inView" | "manual"', default: "click", description: "What opens the envelope. \"manual\" only follows the open prop.", control: { type: "select", options: ["click", "hover", "inView", "manual"] } },
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "defaultOpen", type: "boolean", default: false, description: "Initial open state when uncontrolled.", control: { type: "boolean" } },
      { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the envelope asks to open or close." },
      { name: "label", type: "string", default: "Open envelope", description: "Accessible label for the open/close button." },
      { name: "letterClassName", type: "string", description: "Classes for the letter paper." },
      ...sizing,
      classNameProp,
    ],
  },
]
