// The smallest box a play piece lays out in when embedded in the lesson Desk (the world plus the goal rail and up to three
// rows of controls at the touch floor). Below it the Studio stage shows the level's board twin instead (forge's stage).
// The Desk's play mode (docs/design/round3/play/patches/04) is sized so common phones (≥ 690 CSS px tall) meet it.
export const MIN_BOX = { w: 300, h: 440 } as const;
/** The window event the lesson runtime dispatches for each committed child utterance (detail: { text }); patch 05. */
export const PLAY_HEARD = "taxila:play-heard";
