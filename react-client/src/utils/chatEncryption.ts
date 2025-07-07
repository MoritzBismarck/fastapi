// react-client/src/utils/chatEncryption.ts
export class ChatEncryption {
  private keyPair: CryptoKeyPair | null = null;

  async generateKeyPair(): Promise<CryptoKeyPair> {
    this.keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
    return this.keyPair;
  }

  async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("spki", publicKey);
    const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
    const exportedAsBase64 = btoa(exportedAsString);
    return exportedAsBase64;
  }

  async importPublicKey(publicKeyString: string): Promise<CryptoKey> {
    const binaryString = atob(publicKeyString);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return await crypto.subtle.importKey(
      "spki",
      bytes,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
  }

  async encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      publicKey,
      encoded
    );
    
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encrypted))));
  }

  async decryptMessage(encryptedData: string): Promise<string> {
    if (!this.keyPair) {
      throw new Error("No key pair available for decryption");
    }
    
    const binaryString = atob(encryptedData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      this.keyPair.privateKey,
      bytes
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}