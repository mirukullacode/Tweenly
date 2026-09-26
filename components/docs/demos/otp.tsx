"use client"

import { as, type DemoMap } from "@/components/docs/demo-utils"
import { OtpInput, type OtpInputProps } from "@/registry/new-york/otp-input/otp-input"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const otpDemos: DemoMap = {
  "otp-input": ({ values }) => {
    const props = as<OtpInputProps>(values)
    const pattern = props.pattern ?? "numeric"
    const accepted = (pattern === "numeric" ? "12345678" : "A1B2C3D4").slice(0, props.length ?? 6)
    return (
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Check your inbox</h3>
          <p className="text-sm text-muted-foreground">Enter the code we sent to you@example.com</p>
        </div>
        <OtpInput
          {...props}
          verify={async (code) => {
            await wait(900)
            return code === accepted
          }}
        />
        <p className="text-xs text-muted-foreground">
          Try <span className="font-mono text-foreground">{accepted}</span> · anything else fails
        </p>
      </div>
    )
  },
}
