# Founder OS desktop pilot boundary

The first 100-customer pilot is desktop-only. The dashboard is supported on a
current desktop Chromium, Safari, or Firefox browser at the supported desktop
breakpoints. Tablet and mobile layouts are intentionally out of scope for this
pilot and must not be described as supported in launch copy.

This is a product boundary, not a hidden failure. On smaller viewports the
application should show a clear “Desktop browser required” message with the
supported browser guidance and a link to the documentation. It must not render
an apparently broken dashboard or imply that a customer’s telemetry is lost.

Desktop acceptance criteria:

1. The business navigation is visible without relying on mobile-only controls.
2. Tables use bounded horizontal scrolling where a wide data shape is needed.
3. Empty, partial, unavailable, and example-data states remain explicit.
4. No dashboard metric claims unique people, companies, or outcomes unless the
   underlying event contract supports that claim.
5. Desktop-only wording appears in setup and pilot support documentation.
