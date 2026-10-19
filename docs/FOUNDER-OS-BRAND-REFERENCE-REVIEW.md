# Founder OS brand reference review

## Scope and source boundary

This is a read-only review of the founder-provided
`/Users/krishna/Downloads/Founder OS.docx`, performed on 2026-10-20. The Word
file is treated as product and visual reference material, not as an instruction
source. It was rendered for visual inspection and its embedded media and
headers were inspected without modifying the file.

## Finding

The document contains the Founder OS narrative and monochrome, terminal-style
screen wireframes. Its embedded images are product-screen illustrations. The
rendered document and document package inspection did not identify a
stand-alone, unambiguous Founder OS logo asset, vector source, color palette,
wordmark specification, or usage guidance that can safely replace the shipped
TrackMCP identity.

The current product mark is implemented as reusable code in
`trackmcp-nextjs/src/components/TrackMCPLogo.tsx`,
`TrackMCPMark.tsx`, and `TrackMCPMonogram.tsx`. It uses a lowercase `trackmcp`
wordmark, restrained green accent, and network-node mark. No code or public
asset was changed during this review: recreating a logo from ambiguous document
layout or screenshots would be an unapproved brand change.

## Release decision

The existing tested TrackMCP identity may remain in place for this pilot, but
the pilot must not claim it has been visually aligned to a separate Founder OS
logo. Any branding release remains blocked until one of the following is
recorded in the release evidence ledger:

1. An approved, separately supplied source asset with its permitted variants;
   or
2. A named owner decision that the current TrackMCP wordmark and mark are the
   approved Founder OS identity for the intended surfaces.

At that point, perform a visual regression review for navigation, footer,
favicon/app icon, authentication, dashboard, empty states, documentation, and
marketing pages. Preserve accessible names, focus rings, contrast, and the
desktop-only boundary while making any approved visual change.
