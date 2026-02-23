/**
 * Password hashing utilities using Web Crypto API
 * Compatible with Cloudflare Workers
 */

const ITERATIONS = 100000;
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  // Convert password to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    key,
    HASH_LENGTH * 8
  );
  
  // Combine salt and hash
  const combined = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
  combined.set(salt, 0);
  combined.set(new Uint8Array(hashBuffer), SALT_LENGTH);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Decode base64
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    
    // Extract salt and stored hash
    const salt = combined.slice(0, SALT_LENGTH);
    const storedHash = combined.slice(SALT_LENGTH);
    
    // Convert password to buffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // Derive key with same salt
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      key,
      HASH_LENGTH * 8
    );
    
    const computedHash = new Uint8Array(hashBuffer);
    
    // Compare hashes (constant time)
    if (computedHash.length !== storedHash.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ storedHash[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
