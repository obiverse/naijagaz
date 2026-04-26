/* tslint:disable */
/* eslint-disable */

/**
 * JSON array of all cylinder offerings — for the UI to render the size picker.
 */
export function cylinder_catalog(): string;

export function cylinder_price(size: string): bigint;

export function cylinder_refill_days(size: string): number;

/**
 * `16500` → `"₦16,500"`. ASCII-only digits with the naira glyph.
 */
export function format_naira(amount: bigint): string;

/**
 * Total amount due for an order — currently just the cylinder price,
 * but kept as a separate function so Phase 1 fee/discount logic lands here.
 */
export function order_total(size: string): bigint;

/**
 * Phase 0 districts only. Case-sensitive — JS lowercases before calling.
 */
export function validate_district(d: string): boolean;

export function validate_payment(p: string): boolean;

/**
 * Normalize any plausible Nigerian phone to E.164 (`+234XXXXXXXXXX`).
 * Returns `""` for invalid input — the JS shell checks `.length > 0`.
 *
 * Accepts: `08012345678`, `+2348012345678`, `2348012345678`,
 * `8012345678`, and any of the above with spaces, dashes, or parens.
 */
export function validate_phone(raw: string): string;

/**
 * Build version string — bumped per release. The SW reads this to bust caches.
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly cylinder_price: (a: number, b: number) => bigint;
    readonly cylinder_refill_days: (a: number, b: number) => number;
    readonly cylinder_catalog: (a: number) => void;
    readonly format_naira: (a: number, b: bigint) => void;
    readonly validate_phone: (a: number, b: number, c: number) => void;
    readonly validate_district: (a: number, b: number) => number;
    readonly validate_payment: (a: number, b: number) => number;
    readonly version: (a: number) => void;
    readonly order_total: (a: number, b: number) => bigint;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export2: (a: number, b: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
