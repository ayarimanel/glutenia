Please update the attached/uploaded report (`glutenia-gamification-report.md`) so its content matches the current state of the Glutenia app. The app's gamification system has moved on since this report was written (2026-07-21) — a few things it describes are now outdated or missing, and a few new things have shipped that aren't in it at all.

**Do not change the style, structure, formatting, headings, tables, or overall design of this document — I like it exactly as it is.** Every fix and addition below should read in the same voice as the rest of the report, and use the exact same formatting patterns already established (e.g. new badges must follow the identical Description / Unlock condition / Purpose-and-value structure every other badge already uses; new mermaid diagram nodes should match the existing diagram style). Do not add new top-level sections unless explicitly told to below. Do not touch the Mermaid diagrams' overall shape beyond the specific edits called out.

## Part A — Fix these factual errors / internal inconsistencies

1. **Section 3 ("User Journey") diagram, node D**: currently reads "Answers the **4**-step personal questionnaire." This contradicts Section 4, which correctly calls it a "**five**-step" questionnaire (it is Role → Journey → Goal → Eating Out → Confidence). Change "4-step" to "5-step" so the two sections agree.

2. **Section 4 ("Onboarding Questionnaire"), "How it connects to everything else"**: the bullet about the "Your Journey" progress tracker currently invents a *different* five-stage label set than the rest of the report — it says the tracker runs "*Beginner → Aware → Safe Eater → Fighter → Titan*." This is wrong and contradicts Section 6, which correctly states the personal-title vocabulary as *Newcomer, Explorer, Label Reader, Safe Eater, Advocate* (for someone managing their own gluten-free life) and *Ally, Caregiver, Protector, Champion, Lifeline* (for someone supporting another person).

   The truth is simpler than the report currently makes it sound: **the "Your Journey" tracker and the personal title are driven by the exact same five-stage vocabulary** — there is only one set of stage names, not two. Please rewrite that bullet to say the tracker uses the same personal-title stages introduced in Section 6, rather than naming a separate/different set of five words. (Section 8.2's mention of the tracker already just refers back to Section 4, so fixing this one spot fixes both.)

3. **Section 9.2 ("For the administrator")**: the bullet list is missing one item that the dashboard actually shows — how often users eat out at restaurants (an "Eating Out Frequency" breakdown), which sits alongside the existing Warrior/Supporter, experience, goal, and confidence breakdowns. Please add it back in, in the same style as the other bullets, positioned wherever reads best in that list.

## Part B — Add this new content (things that shipped after this report was written)

4. **A new kind of badge now exists, and the report's badge section (Section 7) doesn't cover it.** Every badge described today is earned through a repeated *action* (scanning, ordering, streaks, etc.). Four new badges are unlocked instead by a *fact the user already told the app* during onboarding or a community contribution — a one-time declaration rather than a counter crossing a threshold. Please add a new subsection under Section 7 (following the existing pattern of 7.1–7.6, so it would become **7.7**) introducing this category, with a short framing sentence explaining that these badges recognize who someone already is or what they've already shared, not repeated activity — and then add badge entries for all four, in the exact same format as every other badge entry (Description / Unlock condition / Purpose and value, plus a tier):

   - **Community Contributor** — 🥉 Bronze — *Community* category, Supporter-only.
     - Description: "You reported a missing product to help the whole community stay safe."
     - Unlock condition: Report 1 product.
     - Purpose and value: rewards the first time a supporter contributes product data back to the community, turning a helpful act into a recognized milestone.
   - **Seasoned Veteran** — 🥉 Bronze — *Journey* category, available to both roles.
     - Description: "Living gluten-free for 3+ years — a true expert."
     - Unlock condition: Report 3+ years of gluten-free experience during onboarding (or when updating your journey later).
     - Purpose and value: recognizes deep lived experience the moment it's shared, rather than making a long-time user wait to "earn" recognition for time they'd already spent living gluten-free before ever downloading the app.
   - **Confident Reader** — 🥉 Bronze — *Journey* category, available to both roles.
     - Description: "Told us you're highly confident spotting gluten-free products."
     - Unlock condition: Select the highest confidence level when asked how confident you are identifying gluten.
     - Purpose and value: affirms an already-earned real-world skill instead of only ever rewarding in-app actions.
   - **Dedicated Caregiver** — 🥉 Bronze — *Journey* category, Supporter-only.
     - Description: "On Glutenia to support a loved one through their journey."
     - Unlock condition: Set your onboarding goal to supporting a child or a partner/family member.
     - Purpose and value: gives caregivers specific recognition distinct from the general Supporter role, acknowledging the particular kind of care they've taken on.

   (If it reads better to weave these four into a short intro paragraph before the four entries — explaining that unlike every other badge, these can unlock the moment onboarding is completed or edited, with no in-app action required — please do; use your judgment on the exact wording as long as the facts above are accurate.)

5. **Section 6 ("Levels") needs a small but important addition.** The existing "Levels and personal titles work side by side" callout box already correctly distinguishes the numeric Level (activity) from the personal Title (identity/experience) — that distinction is accurate and should stay. What's new: **the Level itself now also comes with its own short title**, shown right next to the level number, completely separate from the personal identity title discussed in that callout. This new level-title is purely about *how active/experienced someone is in the app*, using its own distinct vocabulary that never overlaps with the personal-title words:

   | Level range | Title |
   |---|---|
   | 1–2 | Rookie |
   | 3–4 | Regular |
   | 5–6 | Enthusiast |
   | 7–8 | Veteran |
   | 9–10 | Master |
   | 11+ | Legend |

   Please extend the existing callout (or add a short new paragraph right after it) explaining that there are now, in effect, two distinct titles on the profile at once — the personal identity title (Newcomer/Explorer/.../Ally/Caregiver/... from onboarding) and this new activity-based Level title (Rookie through Legend) — and that keeping them visually and verbally distinct is deliberate, so a user's activity progress and their self-described identity never get confused with one another.

## When you're done

Give me a short summary of exactly what you changed and why, section by section, the same way you would for a proofreading pass — so I can quickly confirm everything above landed correctly without having to re-read the whole document myself.
