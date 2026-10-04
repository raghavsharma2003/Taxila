import type { Moment } from "../../../../shared/brain.ts";
export const SOUND_WORDS: RegExp;
export const DELIVERY_LABEL: string;
export function realtimeDeliveryLine(moment: Moment | null | undefined): string | null;
export function lintDeliveryLine(line: string): boolean;
