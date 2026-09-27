"use client"

import { as, type DemoMap } from "@/components/docs/demo-utils"
import { NotFound, type NotFoundProps } from "@/registry/new-york/not-found/not-found"

const blank = (value?: string) => (value && value.trim() ? value : undefined)

export const notFoundDemos: DemoMap = {
  "not-found": ({ values }) => {
    const props = as<NotFoundProps>(values)
    return (
      <div className="relative h-full w-full self-stretch justify-self-stretch overflow-hidden rounded-[inherit] [container-type:size]">
        <NotFound
          {...props}
          code={blank(props.code)}
          title={blank(props.title)}
          description={blank(props.description)}
          path={blank(props.path)}
          background={blank(props.background)}
          color={blank(props.color)}
          muted={blank(props.muted)}
          primaryAction={{ label: "Back home", onClick: () => {} }}
          secondaryAction={{ label: "Browse docs", onClick: () => {} }}
          className="h-full"
        />
      </div>
    )
  },
}
