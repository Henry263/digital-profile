// public/js/crypto-helper.js

/**
 * Client-Side Password Encryption Utility
 */
const CryptoHelper = {
    CLIENT_SALT: 'qrmypro-secure-salt-2025',
    ITERATIONS: 10000,
    KEY_SIZE: 256,
  
    async hashPassword(password) {
      if (!password) {
        throw new Error('Password cannot be empty');
      }
  
      try {
        if (typeof CryptoJS !== 'undefined') {
          // console.log('🔐 Using CryptoJS for password hashing');
          
          const hash = CryptoJS.PBKDF2(password, this.CLIENT_SALT, {
            keySize: this.KEY_SIZE / 32,
            iterations: this.ITERATIONS,
            hasher: CryptoJS.algo.SHA256
          });
          
          return hash.toString(CryptoJS.enc.Hex);
        }
        
        console.log('🔐 Using Web Crypto API for password hashing');
        
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const saltData = encoder.encode(this.CLIENT_SALT);
        
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          passwordData,
          { name: 'PBKDF2' },
          false,
          ['deriveBits']
        );
        
        const derivedBits = await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: saltData,
            iterations: this.ITERATIONS,
            hash: 'SHA-256'
          },
          keyMaterial,
          this.KEY_SIZE
        );
        
        const hashArray = Array.from(new Uint8Array(derivedBits));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
        
      } catch (error) {
        console.error('❌ Client-side hashing error:', error);
        throw new Error('Failed to hash password on client side');
      }
    },
  
    validatePasswordStrength(password) {
      const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[@$!%*?&#]/.test(password)
      };
  
      const validCount = Object.values(requirements).filter(v => v).length;
      const isValid = validCount === 5;
  
      let strength = 'weak';
      if (validCount >= 5) strength = 'strong';
      else if (validCount >= 3) strength = 'medium';
  
      return {
        isValid,
        requirements,
        strength,
        validCount
      };
    },
  
    generateSecureToken(length = 32) {
      try {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.error('❌ Token generation error:', error);
        throw new Error('Failed to generate secure token');
      }
    },
  
    checkAvailability() {
      return {
        cryptoJS: typeof CryptoJS !== 'undefined',
        webCrypto: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
        available: typeof CryptoJS !== 'undefined' || (typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined')
      };
    },
  
    async initialize() {
      try {
        const availability = this.checkAvailability();
        
        if (!availability.available) {
          console.error('❌ No crypto libraries available');
          return false;
        }
  
        console.log('✅ CryptoHelper initialized');
        console.log('   CryptoJS:', availability.cryptoJS);
        console.log('   Web Crypto API:', availability.webCrypto);
  
        const testHash = await this.hashPassword('test');
        console.log('✅ Password hashing test successful');
        
        return true;
      } catch (error) {
        console.error('❌ CryptoHelper initialization failed:', error);
        return false;
      }
    }
  };
  
  // ✅ ES6 Module Export
  export { CryptoHelper };
  
  // Also keep as global for backward compatibility
  if (typeof window !== 'undefined') {
    window.CryptoHelper = CryptoHelper;
  }