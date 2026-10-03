---
name: fountible-motion
description: "Animate Fountible layers: preset effects with per-letter splits, declarative keyframe timelines, and motion-path travel along a curve."
when_to_use: "TRIGGER on 'animate', 'add motion', 'make it fade / slide / bounce / spin / orbit', 'stagger the letters', 'add a timeline', 'make it arc across the screen', 'text on a curve'."
---

# Motion

Three layers. Pick the lowest one that does the job.

```
A preset?                → set_animation
Precise keyframes?       → set_timeline
Travelling along a curve? → follow_path   (letters bending along it? → text_on_path)
```

## 1. `set_animation` — presets

Categories: **Enter** (fade-in, slide-in, scale-in, blur-in, rotate-in,
flip-in), **Text** (letters-fade-in, letters-rise, mask-reveal, words-fade-in,
letters-flip, letters-scale, letters-wave), **Emphasis** (grow, shrink,
wiggle), **Loop** (spin, pulse, float). Triggers: `load`, `inView`, `hover`,
`press`, `loop`.

**Per-letter motion:** apply the effect to the **text layer** and pass
`split: {by: "chars" | "words"}` with a `stagger`. The split happens only
during playback, so the layer stays one editable text layer the user can
double-click and retype. Do not pre-split text into separate layers to get this
effect — that destroys editability.

`stagger` without `split` needs two or more real child nodes.
`wrap: "clip"` plus a translateY effect gives the mask-reveal look.

`clear: true` removes authored motion — that's why this tool reports as
destructive.

## 2. `set_timeline` — declarative keyframes

On a **top-level frame only**. It replaces the same-named clip's tracks, so
re-running it is an update, not an append.

**To fix or tweak part of an existing clip**, pass `merge: true` with ONLY the
tracks you change (plus `removeTracks: [{nodeId, channel}]`): every other track,
the audio and the loop stay as they were. Never rewrite a whole clip to fix one
moment, and never refuse a small fix because the clip is large.

**Channel semantics are what models get wrong:**

| Channel | Meaning |
| --- | --- |
| `x`, `y` | px **offsets** from the designed position. `0` = at rest. |
| `rotate` | degree **offset**. |
| `scale`, `scaleX`, `scaleY` | **multipliers**. `1` = at rest, not `100`. |
| `opacity` | **absolute** 0–1. |
| `width`, `height`, `cornerRadius` | absolute px; resize about the transform origin |
| `fill`, `stroke` | CSS colours; only on layers with a *solid* fill/stroke |
| `textOffset` | fraction a text run has slid along a `text_on_path` curve; deliberately unclamped, so `-0.4 → 1.4` scrolls a headline on from before the start and off past the end, and `0 → 1` on a closed ring orbits once |
| `count` | the **number a text layer displays** at that time: `0 → 84320` counts up. The format comes from the layer's own designed text — prefix, suffix, thousands separators and decimal places are kept, so `$84,320` shows `$42,160` halfway. Set the layer's text to the final number first; needs plain text (no inline-formatted ranges) holding exactly one number, not on a curve — a number inside a sentence goes in its own text layer |
| `textReveal` | typing: the **fraction 0–1** of a text layer's characters shown from the start. `0` = none, `1` = all, not `100`. The untyped rest keeps its space, so nothing around it shifts. Linear ease reads as steady typing. Not for text on a curve |
| `draw` | a stroke that draws itself: the **fraction 0–1** of a vector layer's stroke drawn from the start of its path. `0` = nothing, `1` = the whole stroke (the design), not `100`; `0 → 1` draws it on, `1 → 0` erases it. Vector layers only — paths, lines, ellipses, polygons, stars, icons, inserted SVG — with a visible, undashed stroke. Frames and rectangles are refused: their strokes are CSS borders with no path, so draw the outline with `insert_svg` instead. The fill is not affected (give the shape no fill for a pure line-draw); a layer with several paths draws them together |
| `clipTop`, `clipRight`, `clipBottom`, `clipLeft` | wipes and reveals on any layer: the **percentage 0–100** of the layer clipped away from that edge. `0` = that edge not clipped (the design), `100` = clipped all the way across, not `1`. The channel names the edge that is *hidden*, so the reveal travels from the opposite one: `clipRight` `100 → 0` wipes in from the left, `clipBottom` `100 → 0` from the top down; `0 → 100` wipes out. Key several edges together for other reveals (`clipLeft` and `clipRight` `50 → 0` opens from the center). Children and shadows are clipped with the layer and nothing around it shifts. Refused on a layer clipped by a vector mask — wipe the frame or group around it instead |
| `goo` | liquid / metaball merges: the **goo radius in px** of a *container* (frame or group, no fill of its own) — its layers melt into one another where they come close and keep their colors. Key the container, not its children: roughly `8–20` while merging, `0` on the last keyframe to land the exact, crisp shapes. Use it instead of faking goo with stacked blurs and blend modes |

**Cascades are one track:** pass `nodeIds` instead of `nodeId`, plus
`stagger: {each, from}` — every layer gets the same keyframes, shifted by its
order × `each` ms (`from`: `first`, `last`, `center`, `edges`).

**Each keyframe's `ease` shapes the segment INTO it.** An accelerating fall is
`inQuad` on the impact keyframe; a decelerating rise is `outQuad` on the apex.
Default is `outCubic`. Named eases, cubic-bezier, and spring forms all work.

For a squash pivot, set an `origin-[50%_100%]` class on the layer *first* —
width/height keyframes resize about the transform origin.

A component instance plays the **main component's** timeline. Author it there,
not on the instance.

## 3. `follow_path` — travel along a curve

Prefer `shape` (`circle`, `ellipse`, `arch`, `rounded-rect`): it sizes the
guide from the layer, caps it to the artboard, starts at the rest pose so
nothing jumps at t=0, and leaves a **parametric** guide the user can drag
afterwards.

Otherwise pass `d` — an SVG path in **px offsets from the layer's current
position**, starting `M 0 0`.

`orient: true` turns the layer to face travel direction; `orientOffset: -90`
for artwork drawn nose-up.

A real curve beats a dozen hand-placed x/y keyframes — it stays editable and
reads as one intention.

On a text layer, `follow_path` carries the whole block rigidly with the type
straight. Use **`text_on_path`** when the letters themselves should bend along
the curve.

## Sound — `add_timeline_audio`

Puts a voiceover, a music bed or a sound effect on a top-level frame's
timeline from an **https link to the audio file itself** (MP3, WAV, M4A, OGG).
The sound is copied into the document, so a short-lived download link is fine.

- `at` is where it starts, in ms. The timeline grows to fit the sound.
- Sounds overlap freely. Put music under a voice with `volume: 25` — volume is
  a **percent**, 100 = full, so `1` means 1%.
- A frame with no timeline gets one, so sound can come before any keyframes.
- It plays in preview and is mixed into the exported MP4.

**Many sounds, deletes and sync.** Put every sound of a film in ONE call with
`sounds: [...]`: each item is an add (`url`), a change (`audioId` — only the
fields you pass change), a file swap (`audioId` + `url`, keeping its placement,
level and fades) or a delete (`audioId` + `remove: true`), and the whole call is
one undo step that changes nothing if any item or download fails.
`removeAudioIds` deletes several at once. Delete a sound to get rid of it —
never mute it or turn it down — and change one by `audioId` instead of adding a
second copy. To sync, pass `hitAt` (ms on the timeline) instead of `at`: the
file is analyzed and started so its main hit, its loudest attack, lands exactly
there. Every result reports each sound's main hit, its strongest onsets and,
for clearly rhythmic music, its tempo. `label` names the sound; `clip` (or
`name`) picks the timeline clip when a frame has several.

Fountible does not make the audio. If the user has another tool that does, get
the file's download link from it and pass that here.

## Afterwards

Effects export as plain anime.js code, and the user plays timelines from the
frame's Timelines section. Tell them where to hit play — motion they can't find
reads as motion that didn't happen.
