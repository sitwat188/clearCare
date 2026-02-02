export declare class EncryptionService {
    private readonly key;
    private readonly enabled;
    constructor();
    encrypt(plainText: string | null | undefined): string;
    decrypt(cipherText: string | null | undefined): string;
}
