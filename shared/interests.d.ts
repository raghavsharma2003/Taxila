// Types for shared/interests.js (the one interest registry, BUILD-PLAN W2-C #6).
export interface Interest { id: string; label: string; tile: boolean; skin: string; studio: boolean; words: string[] }
export const INTEREST_REGISTRY: readonly Interest[];
export const INTEREST_IDS: readonly string[];
export const TILE_IDS: readonly string[];
export const STUDIO_INTERESTS: readonly string[];
export function interestOf(idOrLabel: unknown): Interest | null;
export function skinOf(idOrLabel: unknown): string;
export function interestIdsOf(list: unknown[] | undefined | null): string[];
export function interestsIn(text: unknown): string[];
