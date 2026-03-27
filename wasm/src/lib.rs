use ed25519_dalek::SigningKey;
use rand::rngs::OsRng;
use serde::Serialize;
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
pub struct KeypairResult {
    address: String,
    #[serde(rename = "privateKeyBase58")]
    private_key_base58: String,
    #[serde(rename = "keypairJson")]
    keypair_json: String,
}

#[wasm_bindgen]
pub fn generate_vanity(
    prefix: &str,
    suffix: &str,
    case_sensitive: bool,
    batch_size: u32,
) -> JsValue {
    let prefix_lower = prefix.to_lowercase();
    let suffix_lower = suffix.to_lowercase();

    for _ in 0..batch_size {
        let signing_key = SigningKey::generate(&mut OsRng);
        let verifying_key = signing_key.verifying_key();
        let pubkey_bytes = verifying_key.to_bytes();
        let address = bs58::encode(&pubkey_bytes).into_string();

        let matches = if case_sensitive {
            (prefix.is_empty() || address.starts_with(prefix))
                && (suffix.is_empty() || address.ends_with(suffix))
        } else {
            let addr_lower = address.to_lowercase();
            (prefix.is_empty() || addr_lower.starts_with(&prefix_lower))
                && (suffix.is_empty() || addr_lower.ends_with(&suffix_lower))
        };

        if matches {
            let keypair_bytes = signing_key.to_keypair_bytes();

            let result = KeypairResult {
                address,
                // Solana wallets expect base58 of the full 64-byte keypair (seed + pubkey)
                private_key_base58: bs58::encode(&keypair_bytes).into_string(),
                keypair_json: format!(
                    "[{}]",
                    keypair_bytes
                        .iter()
                        .map(|b| b.to_string())
                        .collect::<Vec<_>>()
                        .join(",")
                ),
            };

            return serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL);
        }
    }

    JsValue::NULL
}

/// Verify a keypair by re-deriving the public key from the 32-byte seed.
/// Returns the derived address so the caller can confirm it matches.
#[wasm_bindgen]
pub fn verify_keypair(seed_bytes: &[u8]) -> JsValue {
    if seed_bytes.len() != 32 {
        return JsValue::NULL;
    }

    let mut seed = [0u8; 32];
    seed.copy_from_slice(seed_bytes);

    let signing_key = SigningKey::from_bytes(&seed);
    let verifying_key = signing_key.verifying_key();
    let address = bs58::encode(verifying_key.to_bytes()).into_string();

    #[derive(Serialize)]
    struct VerifyResult {
        address: String,
        valid: bool,
    }

    let result = VerifyResult {
        address,
        valid: true,
    };

    serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keypair_generation() {
        let signing_key = SigningKey::generate(&mut OsRng);
        let seed = signing_key.to_bytes();
        let pubkey = signing_key.verifying_key().to_bytes();
        assert_eq!(seed.len(), 32);
        assert_eq!(pubkey.len(), 32);
    }

    #[test]
    fn test_keypair_bytes_format() {
        let signing_key = SigningKey::generate(&mut OsRng);
        let keypair_bytes = signing_key.to_keypair_bytes();
        assert_eq!(keypair_bytes.len(), 64);

        // First 32 bytes should be the secret key
        assert_eq!(&keypair_bytes[..32], &signing_key.to_bytes());
        // Last 32 bytes should be the public key
        assert_eq!(&keypair_bytes[32..], &signing_key.verifying_key().to_bytes());
    }

    #[test]
    fn test_roundtrip_verify() {
        let signing_key = SigningKey::generate(&mut OsRng);
        let seed = signing_key.to_bytes();
        let original_address = bs58::encode(signing_key.verifying_key().to_bytes()).into_string();

        // Re-derive from seed
        let restored = SigningKey::from_bytes(&seed);
        let restored_address = bs58::encode(restored.verifying_key().to_bytes()).into_string();

        assert_eq!(original_address, restored_address);
    }

    #[test]
    fn test_base58_address_characters() {
        let base58_alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

        for _ in 0..100 {
            let signing_key = SigningKey::generate(&mut OsRng);
            let address = bs58::encode(signing_key.verifying_key().to_bytes()).into_string();

            for ch in address.chars() {
                assert!(
                    base58_alphabet.contains(ch),
                    "Address contains invalid base58 char: {}",
                    ch
                );
            }
        }
    }

    #[test]
    fn test_first_char_distribution() {
        // Valid first characters for Solana addresses (32-byte keys)
        let valid_first = "123456789ABCDEFGHJ";

        for _ in 0..10_000 {
            let signing_key = SigningKey::generate(&mut OsRng);
            let address = bs58::encode(signing_key.verifying_key().to_bytes()).into_string();

            if let Some(first) = address.chars().next() {
                assert!(
                    valid_first.contains(first),
                    "Address starts with unexpected char '{}': {}",
                    first,
                    address
                );
            }
        }
    }

    #[test]
    fn test_prefix_matching_case_sensitive() {
        let signing_key = SigningKey::generate(&mut OsRng);
        let address = bs58::encode(signing_key.verifying_key().to_bytes()).into_string();
        let prefix = &address[..2];

        // Should match its own prefix
        assert!(address.starts_with(prefix));
    }

    #[test]
    fn test_prefix_matching_case_insensitive() {
        let address = "ABCdef123";
        let prefix_lower = "abc";
        assert!(address.to_lowercase().starts_with(prefix_lower));
    }
}
