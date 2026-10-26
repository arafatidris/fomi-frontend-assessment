# Fomi Studio: Product Thinking

**Workspace chosen:** Image Generation Workspace
**Live:** [LIVE_URL/studio](LIVE_URL/studio) · **Code:** `src/components/studio`

> **Thesis.** Models are getting faster, cheaper and better every quarter. When a render costs seconds and cents, generating stops being the hard part. **Directing and choosing** become the work. Fomi Studio is designed for that: *direct, don't re-roll.*

---

## 1. What problem were you trying to solve? Who is it for?

**The user** is a professional creative: an art director, brand designer or photographer at an agency or in-house team. They produce campaign imagery every day, work from a brief with concrete deliverables (a 16:9 web hero, 4:5 social posts, a 9:16 story), are accountable for quality, and live in keyboard-driven tools like Figma, Lightroom and Cursor. They return to the same project for days.

**The problem.** Today's generators behave like slot machines:

- **Iteration is uncontrolled.** Change one word in a 90-word prompt and the composition, light and mood all shift. There is no way to say *keep this, change only that*.
- **AI edits are invisible.** "Enhance prompt" features rewrite your words silently. You can't tell what changed, or why a take looks different.
- **Selection is the real job, and it's unsupported.** A pro renders dozens of takes per deliverable, then has to pick, reject and compare in a chronological feed that mixes every project together.
- **Tools don't know about deliverables.** A campaign is a shot list. Generators only know "generations", so status, sizes and approvals live in someone's head or a spreadsheet.
- **Returning is expensive.** After a day away: where was I, what did I approve, what's left?

## 2. The three most important UX decisions

**1. The prompt becomes a *Direction* you can lock and explore one axis at a time.**
Each shot's prompt is split into the six dimensions a director reasons about: Subject, Setting, Light, Camera, Palette and Mood. Any field can be **locked**, edited inline, or **explored**. An exploration renders four takes where only that field changes, with the seed fixed.
*Why:* it's how photographers work, changing one variable at a time. A sweep answers "what if the light were different?" in one round instead of ten re-rolls, the differences between takes become explainable, and comparisons are fair.

**2. AI changes are proposed as diffs you approve.**
Typing *"colder, more mist"* doesn't render anything. Fomi shows the proposed edit on the fields themselves (old value struck through, new value highlighted), reports what it left alone because it's locked, and waits for **Apply & render**. Every round then keeps its change set as chips, so the history reads like a changelog.
*Why:* trust and authorship. Professionals need to know exactly what the model will change before spending a render. Locks become a promise the AI keeps, and provenance comes for free.

**3. Organise work around shots, and make culling first-class.**
The left rail is the campaign's shot list (format, size, status, progress), not a feed. Inside a shot, review runs at keyboard speed, borrowed from Lightroom and Photo Mechanic: arrows to move, **P**ick, **X** reject, **F**inal, **C**ompare (A/B split slider plus a field-level diff), and **B**ranch a new direction from any take. ⌘K reaches everything else.
*Why:* pros spend more time choosing than generating, and deliverables are what they're paid for. A returning user lands on "First light · 9 to review", not on an endless scroll.

*Supporting decisions:* a neutral, chroma-free dark UI so the chrome doesn't bias colour judgement; on phones Studio becomes a **review** tool (big pick/reject buttons, swipe between takes) rather than a cramped authoring tool.

## 3. Which features did you intentionally leave out, and why?

| Left out | Why |
|---|---|
| Infinite canvas / node graphs | Powerful but heavy. Most campaign work is linear iteration on a handful of frames; a graph adds cognitive load for the 90% case. A lineage view could come later as an advanced mode. |
| Chat assistant | Chat is a weak interface for visual direction: unstructured, ambiguous, and it scrolls your decisions away. One "direct a change" input with a structured, reviewable result does the useful part. |
| Sampler knobs and a model zoo (CFG, steps, schedulers) | As models improve, these matter less. One good default and a quality tier cover professional needs; knobs belong behind an expert setting. |
| Community feed inside the workspace | The workspace is the hero. Inspiration lives in Create's Gallery, one click away. |
| Inpainting and region edits | They belong in the Image Editing workspace. Studio's job is direction and selection; it would hand off with "Open in Edit". |
| Multiplayer cursors and comments | Valuable for client review, but a separate problem. The data model (shots → rounds → takes) is ready to carry comments and approvals. |
| Credits and upsell UI | Not in a professional's working surface. Cost is stated before a render in Create, never interrupting the work. |

## 4. Which existing products inspired your thinking?

- **Lightroom / Photo Mechanic.** *Liked:* flag-based culling and a neutral grey UI made for colour work. *Would improve:* they cull what already exists. Here a pick feeds straight back into generation by branching its direction.
- **Cursor.** *Liked:* AI proposes, you accept a diff, and ⌘K is always there. *Adapted:* diffs on structured creative fields instead of raw text.
- **Linear.** *Liked:* opinionated statuses, keyboard-first speed, a palette for everything. *Took:* "to review" counts and progress that tell you what to do next.
- **Figma.** *Liked:* panels around a central stage, a properties panel, and focus mode. The Direction panel is Studio's properties panel.
- **Midjourney.** *Liked:* the 4-up grid and quick variations. *Would improve:* "vary" is opaque. Variations should be *named* (vary the light) and show exactly what changed.
- **Krea, Higgsfield, Leonardo, Magnific.** *Liked:* speed, presets and rich controls. *Would improve:* they put every control up front, which encourages re-rolling over directing. Progressive disclosure keeps the power without the clutter.
- **Film production.** Shot lists, takes, slates, circled takes. That vocabulary *is* the interface: take numbers like `4.2`, rounds, finals.
- **Instagram and Pinterest.** Simplicity for mobile review: one big image and a binary choice.

## 5. If you had another month, what would you improve?

1. **Live drafts.** Low-resolution previews while you edit a field, now that models are fast enough.
2. **Consistency locks.** Lock identity with references (*this jacket*, *this model*, *this product*) as first-class direction fields.
3. **Client review.** A share link where clients comment and approve per take, with an activity history.
4. **Taste learning.** Learn from picks and rejects to rank new takes and suggest better sweep values.
5. **Lineage view.** A visual graph of branches for complex shots.
6. **Delivery.** Export presets per deliverable (size, format, colour profile, naming) straight into a DAM.
7. **Video.** The same Direction model with motion and camera-path fields: shots become sequences.
8. **Engineering.** Reducer and engine unit tests, Playwright journeys, visual regression, Storybook for the primitives, virtualization for very large projects, a real job queue with WebSockets, and product analytics on *renders per approved final*.
9. **Research.** Usability sessions with five working art directors before any of the above.

## 6. The single differentiating workflow

**Lock what works. Explore one variable at a time. Approve every AI change as a diff.**

Existing platforms let you re-roll faster. Fomi Studio lets you *converge*: each round changes one known thing, shows you what changed, and moves the shot measurably closer to a final. It turns generation from a slot machine into direction.

---

## Design trade-offs

- **Prioritised:** direction and selection over generation controls; keyboard speed; the context of the deliverable (format, status, what's left).
- **Simplified:** one default model, four takes per round, aspect ratio taken from the shot spec, six fixed direction fields instead of free-form tags.
- **Removed:** canvas, chat, sampler knobs, social features.
- **What it costs, and the mitigations:**
  - Structured fields can feel limiting for poetic prompts. The composed full prompt is always visible, and any field accepts free text.
  - Fixing the seed in sweeps reduces variety. That's deliberate; a re-roll is one shortcut away.
  - The neutral dark UI departs from Fomi's warm brand. The brand lives in the coral accent and the type; colour fidelity matters more where judgements are made.
  - Mobile is review-first, not full authoring. Professionals author at a desk and approve on the go.

## How the demo works

- **Mock rendering.** The direction "AI" is a small deterministic rule set behind `POST /api/studio/direct`. Sweep takes are derived from a single photographic plate: crops stand in for camera moves, and colour grades for light, palette and mood. Only the explored axis changes, which is the behaviour the product promises.
- **Rendering and state.** Static prerendering; a 40-line external store with selector subscriptions, so only the take you rate re-renders; native `<dialog>` and Popover API.
- **Persistence.** The project persists locally, so you come back to exactly where you left off.
