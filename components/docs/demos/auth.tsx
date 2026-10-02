"use client"

import { as, type DemoMap } from "@/components/docs/demo-utils"
import { AuthSection, type AuthSectionProps } from "@/registry/new-york/auth/auth"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const authDemos: DemoMap = {
  auth: ({ values }) => {
    const props = as<AuthSectionProps>(values)
    const variant = props.variant ?? "split"
    return (
      <div className="mc-scroll h-full w-full self-stretch overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col items-center justify-center gap-4">
          <AuthSection
            // Remount when the starting mode or layout changes so the playground reflects it
            key={`${variant}-${props.defaultMode ?? "sign-up"}`}
            {...props}
            onSubmit={async (v) => {
              await wait(900)
              if (v.email.toLowerCase().includes("fail")) throw new Error("We couldn't sign you in with that email.")
            }}
            verifyCode={async (code) => {
              await wait(900)
              return code === "123456"
            }}
          />
          <p className="text-center text-xs text-muted-foreground">
            Use an email containing <span className="font-mono text-foreground">fail</span> to see the error state
            {variant === "steps" && (
              <>
                {" "}· verification code <span className="font-mono text-foreground">123456</span>
              </>
            )}
          </p>
        </div>
      </div>
    )
  },
}
