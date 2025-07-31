# Enterprise Web UI Guidelines

## Introduction
This document provides internal guidance for developers building user interfaces for the Acme Corp web platform.

## General Principles
- Simplicity and clarity should guide all UI decisions.
- Consistency across different modules is a priority.
- All designs must follow the Acme Corp brand identity.

## Colors
- Primary color: Acme Blue (#0033cc).
- Secondary color: Light Gray (#f5f5f5).
- Avoid using red unless it indicates error states.
- Use green (#28a745) to represent success or completion.

## Typography
- Default font family: `Roboto`, fallback to `Arial`, sans-serif.
- Font sizes:
  - Headings: 24px, 20px, 18px (H1, H2, H3 respectively).
  - Body text: 16px.
- Avoid more than two font weights per page.

## Navigation
- The main navigation must always include:
  - Home
  - Dashboard
  - Profile
  - Support
- The company logo must appear on the left side of the navigation bar.
- Navigation should be responsive, collapsing into a hamburger menu on mobile.

## Buttons
- Primary action buttons are blue with white text.
- Secondary actions use light gray with black text.
- Avoid using multiple primary buttons on the same view.

## Forms
- All form inputs must have labels.
- Use placeholder text for hints, not for labels.
- Display validation messages below the input field.
- Required fields must be clearly marked with an asterisk.

## Icons
- Only use icons from the company-approved Acme Icons set.
- Icons must accompany text on buttons.

## Footer
- The footer must include:
  - Terms of Service
  - Privacy Policy
  - Contact Us

## Performance
- Avoid animations that exceed 300ms.
- Lazy load all images not visible on initial viewport.
- Prefer SVGs over PNGs for scalable graphics.

## Accessibility
- All clickable elements must be reachable via keyboard navigation.
- Provide ARIA labels where necessary.
- Maintain a minimum color contrast ratio of 4.5:1.

## Conclusion
Following these guidelines ensures a unified experience across all Acme Corp products.

