# Google Play Policy Remediation (2026-07-22)

This file tracks concrete fixes for the rejected Play review and what must be updated before resubmission.

## 1) Photo and Video Permissions policy

Status: Code fixed.

Changes applied:
- Removed broad Android media/storage/audio permissions from app config and Android manifest.
- Kept only camera permission for in-app camera capture.
- Updated gallery flow to use system picker directly without pre-requesting media library permission.

Why this helps:
- The app now follows least-privilege access.
- Photo selection is handled through the system picker flow, which aligns with Play guidance to avoid unnecessary broad photo/video access.

## 2) Privacy Policy section of User Data policy

Status: Requires website + Play Console update.

Observed problem:
- Current public privacy policy page contains placeholder text: "Effective Date: [Insert Launch Date]".
- Placeholder and inconsistent wording can trigger "Invalid Privacy policy".

Required actions:
1. Replace all placeholders on the live privacy policy page.
2. Ensure policy explicitly covers:
- What data is collected (account, patient treatment data, uploaded photos, device/app logs).
- Why data is collected (treatment workflow, communication, security).
- Who data is shared with (provider, lab, service providers).
- Data retention and deletion request method.
- Contact email for privacy requests.
3. Ensure policy URL is publicly reachable without login and matches the app/package.
4. Update Play Console Privacy Policy URL if changed.
5. Ensure Data safety form exactly matches real behavior.

Suggested effective date:
- Effective Date: July 22, 2026

## 3) Misleading Claims policy

Status: Requires Play listing cleanup and consistency checks.

Likely causes:
- Absolute statements in policy/listing that may be unverifiable (for example, "we do not ..." statements that conflict with actual telemetry/logging/services).
- Medical app language that implies outcomes/guarantees.

Required actions:
1. In Play listing (short description, full description, screenshots):
- Remove guarantees/promises of treatment outcomes.
- Avoid "best", "guaranteed", "permanent", "cure", "100%" style claims.
- Keep functional, factual wording only.
2. In privacy policy:
- Replace absolute claims with precise, verifiable wording.
3. Ensure all metadata matches actual app behavior and current features.

## Ready-to-publish privacy policy template

Use this as your website content (replace bracketed values before publishing):

---
SmileReign Privacy Policy
Effective Date: July 22, 2026
Last Updated: July 22, 2026

SmileReign is operated by Cal West Dental Lab ("we", "our", "us").
This Privacy Policy describes how we collect, use, share, retain, and protect personal information when users access SmileReign mobile applications and related services.

Contact:
Cal West Dental Lab
7002 Moody St, Suite 204, La Palma, CA 90623
Email: caldentallab@smilereign.com

Information we collect
- Account and profile information (name, email, phone, provider and patient identifiers).
- Treatment workflow information (case details, treatment steps, status updates).
- User-submitted media (photos uploaded for treatment tracking).
- Technical and security data (device model, OS version, app logs, IP/network signals used for reliability and abuse prevention).

How we use information
- Provide and operate treatment tracking and communication features.
- Enable coordination between patients, dental providers, and lab staff.
- Maintain service reliability, security, and fraud prevention.
- Comply with legal obligations.

How we share information
- With authorized dental providers and lab personnel involved in a case.
- With vendors/service providers that process data on our behalf (for hosting, storage, or technical operations) under contractual safeguards.
- When required by law, legal process, or to protect rights and safety.

Data retention
- We retain data only as long as needed for treatment workflow, legal obligations, dispute resolution, and enforcement of agreements.

Your choices and rights
- Depending on your jurisdiction, you may request access, correction, or deletion of personal information.
- To request deletion or exercise privacy rights, contact caldentallab@smilereign.com.
- We may verify identity before completing requests.

Children
- SmileReign is not directed to children under 13.
- Any minor patient information is managed by authorized providers or guardians for treatment purposes.

Security
- We use administrative, technical, and organizational safeguards to protect information.
- No method of transmission or storage is completely secure.

Changes to this policy
- We may update this policy periodically.
- Material updates will be posted with a new "Last Updated" date.
---

## Pre-resubmission checklist

- [ ] Build new Android AAB after permission cleanup.
- [ ] Confirm merged Android manifest no longer includes READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE, READ_MEDIA_IMAGES, RECORD_AUDIO.
- [ ] Publish corrected privacy policy page with no placeholders.
- [ ] Put same final privacy policy URL in Play Console.
- [ ] Align Play Data safety form with actual data handling.
- [ ] Remove misleading/promissory language from Play listing text and screenshots.
- [ ] Resubmit with release notes: "Removed unnecessary media/audio permissions and updated privacy policy disclosures."
