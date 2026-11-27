# Motion (stance: feedback only)

| Trigger | Element | Communicates | Property | Duration / easing | Reduced motion |
|---|---|---|---|---|---|
| Tick a task, checkpoint or guardrail | stop dot + check | the stop is now visited (state change) | background-color, check opacity + scale .6 to 1 | 160ms ease-out | instant |
| Press a stop | stop dot | the tap registered (feedback) | transform scale .92 | 160ms | none |
| Log hours saved | hours meter fill | hours moved toward the plan | width (HTML meter; the only layout-ish property, on one small bar) | 300ms ease-out | instant |
| Open a sheet | backdrop + sheet | a detail layer is above the screen (continuity) | backdrop colour, sheet translateY 24px to 0 | 200 / 220ms ease-out | instant |
| Toast | toast | a save or copy finished | opacity, translateY 8px | 200ms | instant |

Removed: page transitions between tabs (no information), line "drawing" animation on the roadmap (decorative), number count-ups (rule 18 jitter, and fake liveness).
Nothing is hidden until an animation runs; `prefers-reduced-motion: reduce` sets every transition to none.
