//! NaijaGaz core — the brain.
//!
//! Pure functions, no I/O. The JS shell calls these to validate inputs,
//! format prices, and read the cylinder catalog. The same logic ports
//! forward to Phase 1's Rust/axum backend without modification.

use wasm_bindgen::prelude::*;

/// Canonical cylinder catalog — (size_label, price_naira, refill_days).
/// Refill cadence is the §10.3 spell: how long an average household burns
/// through one fill of this size.
const CYLINDERS: &[(&str, u64, u32)] = &[
    ("5",    7_200,  8),
    ("6",    8_500,  10),
    ("12.5", 16_500, 21),
    ("25",   32_000, 40),
];

#[wasm_bindgen]
pub fn cylinder_price(size: &str) -> u64 {
    CYLINDERS
        .iter()
        .find(|(s, _, _)| *s == size)
        .map(|(_, p, _)| *p)
        .unwrap_or(0)
}

#[wasm_bindgen]
pub fn cylinder_refill_days(size: &str) -> u32 {
    CYLINDERS
        .iter()
        .find(|(s, _, _)| *s == size)
        .map(|(_, _, d)| *d)
        .unwrap_or(21)
}

/// JSON array of all cylinder offerings — for the UI to render the size picker.
#[wasm_bindgen]
pub fn cylinder_catalog() -> String {
    let mut out = String::from("[");
    for (i, (size, price, days)) in CYLINDERS.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        out.push_str(&format!(
            r#"{{"size":"{}","price":{},"days":{}}}"#,
            size, price, days
        ));
    }
    out.push(']');
    out
}

/// `16500` → `"₦16,500"`. ASCII-only digits with the naira glyph.
#[wasm_bindgen]
pub fn format_naira(amount: u64) -> String {
    let s = amount.to_string();
    let bytes = s.as_bytes();
    let n = bytes.len();
    let mut out = String::with_capacity(n + 2);
    out.push('₦');
    for (i, b) in bytes.iter().enumerate() {
        if i > 0 && (n - i) % 3 == 0 {
            out.push(',');
        }
        out.push(*b as char);
    }
    out
}

/// Normalize any plausible Nigerian phone to E.164 (`+234XXXXXXXXXX`).
/// Returns `""` for invalid input — the JS shell checks `.length > 0`.
///
/// Accepts: `08012345678`, `+2348012345678`, `2348012345678`,
/// `8012345678`, and any of the above with spaces, dashes, or parens.
#[wasm_bindgen]
pub fn validate_phone(raw: &str) -> String {
    let digits: String = raw.chars().filter(|c| c.is_ascii_digit()).collect();
    let core = if let Some(rest) = digits.strip_prefix("234") {
        rest.to_string()
    } else if digits.starts_with('0') && digits.len() == 11 {
        digits[1..].to_string()
    } else if digits.len() == 10 {
        digits.clone()
    } else {
        return String::new();
    };
    if core.len() != 10 {
        return String::new();
    }
    let first = core.chars().next().unwrap();
    if !matches!(first, '7' | '8' | '9') {
        return String::new();
    }
    format!("+234{}", core)
}

/// Phase 0 districts only. Case-sensitive — JS lowercases before calling.
#[wasm_bindgen]
pub fn validate_district(d: &str) -> bool {
    matches!(d, "lugbe" | "kubwa" | "nyanya")
}

#[wasm_bindgen]
pub fn validate_payment(p: &str) -> bool {
    matches!(p, "cash" | "transfer" | "pos")
}

/// Total amount due for an order — currently just the cylinder price,
/// but kept as a separate function so Phase 1 fee/discount logic lands here.
#[wasm_bindgen]
pub fn order_total(size: &str) -> u64 {
    cylinder_price(size)
}

/// Build version string — bumped per release. The SW reads this to bust caches.
#[wasm_bindgen]
pub fn version() -> String {
    String::from(env!("CARGO_PKG_VERSION"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cylinder_pricing_canonical() {
        assert_eq!(cylinder_price("12.5"), 16_500);
        assert_eq!(cylinder_price("5"), 7_200);
        assert_eq!(cylinder_price("6"), 8_500);
        assert_eq!(cylinder_price("25"), 32_000);
        assert_eq!(cylinder_price("99"), 0);
        assert_eq!(cylinder_price(""), 0);
    }

    #[test]
    fn refill_cadence_per_size() {
        assert_eq!(cylinder_refill_days("5"), 8);
        assert_eq!(cylinder_refill_days("6"), 10);
        assert_eq!(cylinder_refill_days("12.5"), 21);
        assert_eq!(cylinder_refill_days("25"), 40);
    }

    #[test]
    fn naira_formats_with_thousands_separator() {
        assert_eq!(format_naira(0), "₦0");
        assert_eq!(format_naira(7), "₦7");
        assert_eq!(format_naira(500), "₦500");
        assert_eq!(format_naira(7_200), "₦7,200");
        assert_eq!(format_naira(16_500), "₦16,500");
        assert_eq!(format_naira(32_000), "₦32,000");
        assert_eq!(format_naira(1_234_567), "₦1,234,567");
    }

    #[test]
    fn phone_e164_normalizes_common_ng_formats() {
        assert_eq!(validate_phone("08012345678"), "+2348012345678");
        assert_eq!(validate_phone("+2348012345678"), "+2348012345678");
        assert_eq!(validate_phone("2348012345678"), "+2348012345678");
        assert_eq!(validate_phone("8012345678"), "+2348012345678");
        assert_eq!(validate_phone("0803-123-4567"), "+2348031234567");
        assert_eq!(validate_phone("0701 234 5678"), "+2347012345678");
        assert_eq!(validate_phone("0901-111-2222"), "+2349011112222");
        assert_eq!(validate_phone("(0803) 123-4567"), "+2348031234567");
    }

    #[test]
    fn phone_rejects_invalid() {
        assert_eq!(validate_phone(""), "");
        assert_eq!(validate_phone("123"), "");
        assert_eq!(validate_phone("06012345678"), "");
        assert_eq!(validate_phone("0801234567"), "");
        assert_eq!(validate_phone("not a phone"), "");
        assert_eq!(validate_phone("+12345678901"), "");
    }

    #[test]
    fn districts_phase0_allowlist() {
        assert!(validate_district("lugbe"));
        assert!(validate_district("kubwa"));
        assert!(validate_district("nyanya"));
        assert!(!validate_district("wuse"));
        assert!(!validate_district("LUGBE"));
        assert!(!validate_district(""));
    }

    #[test]
    fn payment_methods_allowlist() {
        assert!(validate_payment("cash"));
        assert!(validate_payment("transfer"));
        assert!(validate_payment("pos"));
        assert!(!validate_payment("crypto"));
        assert!(!validate_payment(""));
    }

    #[test]
    fn catalog_emits_valid_json_with_all_sizes() {
        let j = cylinder_catalog();
        assert!(j.starts_with('['));
        assert!(j.ends_with(']'));
        assert!(j.contains(r#""size":"5""#));
        assert!(j.contains(r#""size":"12.5""#));
        assert!(j.contains(r#""price":16500"#));
        assert!(j.contains(r#""days":21"#));
        assert!(j.contains(r#""price":32000"#));
    }

    #[test]
    fn order_total_matches_price() {
        assert_eq!(order_total("12.5"), cylinder_price("12.5"));
        assert_eq!(order_total("25"), cylinder_price("25"));
    }
}
