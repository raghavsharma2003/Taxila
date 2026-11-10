// Which parent control has a reader in the child's path (audit SEAM-09; dc-r7 D5: "a control that does nothing is hidden").
// Each control the Controls page can save is listed with the file that reads its stored column on the child's side, or null
// when nothing reads it yet. A null control is hidden (its stored value is kept); it comes back when its reader exists.
// tests/r7-audit-control-readers.test.mjs checks every listed reader really reads the column, and that every control the
// page can save is listed and, when unread, gated by controlShown.
export const CONTROL_READERS: Readonly<Record<string, { column: string; reader: string | null }>> = Object.freeze({
  dailyMinutes: { column: "daily_minutes", reader: "server/routes/child.js" },
  hoursStart: { column: "hours_start", reader: "server/routes/child.js" },
  limitsOn: { column: "limits_on", reader: "server/routes/child.js" },
  address: { column: "address", reader: "server/routes/lesson.js" },
  // unread today: hidden until the child's plan carries them (learner-proposals.md, "Wire the hidden controls")
  extraTime: { column: "extra_time", reader: null },
  dataSaver: { column: "data_saver", reader: null },
  captionsAlways: { column: "captions_always", reader: null },
  comfortMode: { column: "comfort_mode", reader: null },
  // shown only once a second channel sends (Platform's Notifier); nothing reads it yet
  reportChannel: { column: "report_channel", reader: null },
});

/** Is this control shown? Only when something on the child's side reads it. */
export const controlShown = (key: string): boolean => !!CONTROL_READERS[key]?.reader;
