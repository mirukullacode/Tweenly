"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface ShaderGradientProps {
  /** Fades the gradient in from black when it flips to true. Default: true */
  visible?: boolean
  /** Shifts the noise field so two instances never look the same. Default: 0 */
  seed?: number
  /** Overall flow speed. Default: 1 */
  speed?: number
  /** Pointer bends the field. Default: true */
  interactive?: boolean
  className?: string
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// Domain-warped simplex noise, banded into soft ribbons, with film grain on top
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform float uReveal;
  uniform float uDark;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uMouseForce;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
      i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
      i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      f += a * snoise(p);
      p *= 1.9;
      a *= 0.42;
    }
    return f;
  }

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);

    // Pointer pulls the field toward it, like a finger through silk
    vec2 toMouse = m - p;
    float pull = exp(-dot(toMouse, toMouse) * 6.0) * uMouseForce;
    p += toMouse * pull * 0.5;

    float t = uTime * 0.045 + uSeed;
    vec2 q = vec2(fbm(vec3(p * 0.55, t)), fbm(vec3(p * 0.55 + 5.2, t + 1.3)));
    vec2 r = vec2(
      fbm(vec3(p * 0.7 + 1.1 * q + vec2(1.7, 9.2), t * 1.3)),
      fbm(vec3(p * 0.7 + 1.1 * q + vec2(8.3, 2.8), t * 1.1))
    );
    float f = fbm(vec3(p * 0.6 + 1.2 * r, t * 0.8));
    float n = clamp(f * 0.62 + 0.5, 0.0, 1.0);

    // Soft ribbons: fold the field so bright bands feel like light on fabric
    float band = smoothstep(0.35, 0.95, sin(n * 4.5 + r.x * 2.0 + t * 3.0) * 0.5 + 0.5);

    vec3 dBase = vec3(0.027, 0.024, 0.031);
    vec3 dDeep = vec3(0.16, 0.05, 0.03);
    vec3 dEmber = vec3(1.0, 0.36, 0.13);
    vec3 dGlow = vec3(1.0, 0.78, 0.6);
    vec3 dCool = vec3(0.17, 0.09, 0.26);

    vec3 lBase = vec3(0.96, 0.95, 0.93);
    vec3 lDeep = vec3(1.0, 0.84, 0.74);
    vec3 lEmber = vec3(1.0, 0.45, 0.2);
    vec3 lGlow = vec3(1.0, 0.97, 0.93);
    vec3 lCool = vec3(0.86, 0.83, 0.98);

    vec3 base = mix(lBase, dBase, uDark);
    vec3 deep = mix(lDeep, dDeep, uDark);
    vec3 ember = mix(lEmber, dEmber, uDark);
    vec3 glow = mix(lGlow, dGlow, uDark);
    vec3 cool = mix(lCool, dCool, uDark);

    vec3 col = base;
    col = mix(col, cool, smoothstep(0.1, 0.6, length(q)) * 0.55);
    col = mix(col, deep, smoothstep(0.3, 0.75, n));
    col = mix(col, ember, smoothstep(0.5, 0.86, n) * (0.6 + band * 0.4));
    col = mix(col, glow, smoothstep(0.78, 1.0, n) * band * 0.7);

    // Keep the top-left calm so type always reads
    float calm = smoothstep(1.2, 0.0, length(p - vec2(-0.55 * aspect, 0.35)));
    col = mix(col, base, calm * 0.35);

    float vig = smoothstep(1.35, 0.35, length(p * vec2(0.85, 1.0)));
    col = mix(base, col, mix(0.75, 1.0, vig));

    float grain = hash(vUv * uRes + fract(uTime) * 100.0) - 0.5;
    col += grain * mix(0.035, 0.06, uDark);

    gl_FragColor = vec4(mix(base, col, uReveal), 1.0);
  }
`

/** Fullscreen WebGL gradient that flows on its own and bends around the pointer. */
export function ShaderGradient({ visible = true, seed = 0, speed = 1, interactive = true, className }: ShaderGradientProps) {
  const ref = useRef<HTMLDivElement>(null)
  const visibleRef = useRef(visible)

  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  useEffect(() => {
    const host = ref.current
    if (!host) return
    let disposed = false
    let cleanup = () => {}

    import("three").then((THREE) => {
      if (disposed) return
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block"
      host.appendChild(renderer.domElement)

      const isDark = () => document.documentElement.classList.contains("dark")
      const uniforms = {
        uTime: { value: 0 },
        uSeed: { value: seed },
        uReveal: { value: 0 },
        uDark: { value: isDark() ? 1 : 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseForce: { value: 0 },
      }

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
      scene.add(mesh)

      const resize = () => {
        const { width, height } = host.getBoundingClientRect()
        renderer.setSize(width, height, false)
        uniforms.uRes.value.set(width, height)
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(host)

      // Theme flips ease across instead of snapping
      let darkTarget = uniforms.uDark.value
      const mo = new MutationObserver(() => (darkTarget = isDark() ? 1 : 0))
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

      const mouse = { x: 0.5, y: 0.5, force: 0 }
      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect()
        mouse.x = (e.clientX - r.left) / r.width
        mouse.y = 1 - (e.clientY - r.top) / r.height
        mouse.force = mouse.x >= 0 && mouse.x <= 1 && mouse.y >= 0 && mouse.y <= 1 ? 1 : 0
      }
      if (interactive && !reduced) window.addEventListener("pointermove", onMove, { passive: true })

      let onScreen = true
      const io = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting))
      io.observe(host)

      let raf = 0
      let last = performance.now()
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        if (!onScreen) return
        const k = 1 - Math.exp(-dt * 3)
        uniforms.uTime.value += dt * speed * (reduced ? 0 : 1)
        uniforms.uReveal.value += ((visibleRef.current ? 1 : 0) - uniforms.uReveal.value) * (1 - Math.exp(-dt * 1.4))
        uniforms.uDark.value += (darkTarget - uniforms.uDark.value) * k
        uniforms.uMouse.value.x += (mouse.x - uniforms.uMouse.value.x) * k
        uniforms.uMouse.value.y += (mouse.y - uniforms.uMouse.value.y) * k
        uniforms.uMouseForce.value += (mouse.force - uniforms.uMouseForce.value) * k
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(loop)

      cleanup = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        mo.disconnect()
        io.disconnect()
        window.removeEventListener("pointermove", onMove)
        mesh.geometry.dispose()
        material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => {
      disposed = true
      cleanup()
    }
  }, [seed, speed, interactive])

  return <div ref={ref} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-background", className)} />
}
