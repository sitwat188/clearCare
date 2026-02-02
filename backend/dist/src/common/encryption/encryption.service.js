"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PREFIX = 'enc:';
let EncryptionService = class EncryptionService {
    key;
    enabled;
    constructor() {
        const secret = process.env.ENCRYPTION_KEY;
        if (process.env.NODE_ENV === 'production' &&
            (!secret || secret.length < 32)) {
            throw new Error('ENCRYPTION_KEY must be set in production (at least 32 chars, e.g. openssl rand -base64 32)');
        }
        this.enabled = !!(secret && secret.length >= 32);
        this.key = this.enabled
            ? (0, crypto_1.scryptSync)(secret, 'clearcare-salt', KEY_LENGTH)
            : Buffer.alloc(KEY_LENGTH);
    }
    encrypt(plainText) {
        if (plainText == null || plainText === '') {
            return '';
        }
        const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
        const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, this.key, iv, {
            authTagLength: TAG_LENGTH,
        });
        const encrypted = Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final(),
        ]);
        const tag = cipher.getAuthTag();
        const combined = Buffer.concat([iv, tag, encrypted]);
        return PREFIX + combined.toString('base64');
    }
    decrypt(cipherText) {
        if (cipherText == null || cipherText === '') {
            return '';
        }
        if (!this.enabled || !cipherText.startsWith(PREFIX)) {
            return cipherText;
        }
        try {
            const combined = Buffer.from(cipherText.slice(PREFIX.length), 'base64');
            if (combined.length < IV_LENGTH + TAG_LENGTH) {
                return cipherText;
            }
            const iv = combined.subarray(0, IV_LENGTH);
            const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
            const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
            const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, this.key, iv, {
                authTagLength: TAG_LENGTH,
            });
            decipher.setAuthTag(tag);
            return Buffer.concat([
                decipher.update(encrypted),
                decipher.final(),
            ]).toString('utf8');
        }
        catch {
            return cipherText;
        }
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map