import { classNameProp, num, type ComponentDoc } from "@/lib/docs-types"

export const tocDocs: ComponentDoc[] = [
  {
    slug: "table-of-contents",
    name: "Table of Contents",
    exportName: "TableOfContents",
    description: "Scroll-synced \"On This Page\" sidebar with a plane that flies along the heading trail, a sliding rail, or a spotlight list.",
    category: "Navigation",
    file: "registry/new-york/table-of-contents/table-of-contents.tsx",
    dependencies: ["motion", "lucide-react"],
    staticProps: ["items={items}"],
    isNew: true,
    props: [
      { name: "items", type: "{ id: string; title: string; level?: 1 | 2 | 3 }[]", required: true, description: "Headings to list, in document order. `id` must match the heading element's id." },
      {
        name: "variant",
        type: `"trail" | "rail" | "spotlight"`,
        default: "trail",
        description: "Visual style: a path with a travelling plane, a sliding rail highlight, or glowing dashes.",
        control: { type: "select", options: ["trail", "rail", "spotlight"] },
      },
      { name: "title", type: "string", default: "On This Page", description: "Header label.", control: { type: "text" } },
      { name: "activeId", type: "string", description: "Controlled active heading id. When omitted, the active heading is tracked from scroll." },
      { name: "container", type: "HTMLElement | null", description: "Scroll container whose headings are observed. Defaults to the window and document." },
      { name: "offset", type: "number", default: 96, description: "Distance from the top of the viewport or container at which a heading becomes active, in px.", control: num(0, 300, 4, "px") },
      { name: "accentColor", type: "string", default: "currentColor", description: "Color of the active marker, line and glow (any CSS color).", control: { type: "color" } },
      { name: "onNavigate", type: "(id: string) => void", description: "Called with the heading id when an entry is clicked." },
      { name: "smoothScroll", type: "boolean", default: true, description: "Smoothly scroll to the heading on click. When false, jumps instantly.", control: { type: "boolean" } },
      classNameProp,
    ],
  },
]
