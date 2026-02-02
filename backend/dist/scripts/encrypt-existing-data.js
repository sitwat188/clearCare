"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eq = trimmed.indexOf('=');
            if (eq > 0) {
                const key = trimmed.slice(0, eq).trim();
                let val = trimmed.slice(eq + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) ||
                    (val.startsWith("'") && val.endsWith("'")))
                    val = val.slice(1, -1);
                process.env[key] = val;
            }
        }
    }
}
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PREFIX = 'enc:';
function getEncryptKey() {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret || secret.length < 32) {
        throw new Error('ENCRYPTION_KEY must be set and at least 32 characters (e.g. openssl rand -base64 32). ' +
            'Set it in .env and run again.');
    }
    return (0, crypto_1.scryptSync)(secret.trim(), 'clearcare-salt', KEY_LENGTH);
}
function encrypt(plainText, key) {
    if (plainText == null || plainText === '')
        return '';
    const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, key, iv, {
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
function shouldEncrypt(value) {
    if (value == null || value === '')
        return false;
    return !value.startsWith(PREFIX);
}
const prisma = new client_1.PrismaClient();
async function main() {
    const key = getEncryptKey();
    let patientsUpdated = 0;
    let instructionsUpdated = 0;
    let usersUpdated = 0;
    const patients = await prisma.patient.findMany({
        where: { deletedAt: null },
    });
    for (const p of patients) {
        const updates = {};
        if (shouldEncrypt(p.dateOfBirth))
            updates.dateOfBirth = encrypt(p.dateOfBirth, key);
        if (shouldEncrypt(p.medicalRecordNumber))
            updates.medicalRecordNumber = encrypt(p.medicalRecordNumber, key);
        if (p.phone != null && shouldEncrypt(p.phone))
            updates.phone = encrypt(p.phone, key);
        if (p.addressStreet != null && shouldEncrypt(p.addressStreet))
            updates.addressStreet = encrypt(p.addressStreet, key);
        if (p.addressCity != null && shouldEncrypt(p.addressCity))
            updates.addressCity = encrypt(p.addressCity, key);
        if (p.addressState != null && shouldEncrypt(p.addressState))
            updates.addressState = encrypt(p.addressState, key);
        if (p.addressZipCode != null && shouldEncrypt(p.addressZipCode))
            updates.addressZipCode = encrypt(p.addressZipCode, key);
        if (p.emergencyContactName != null && shouldEncrypt(p.emergencyContactName))
            updates.emergencyContactName = encrypt(p.emergencyContactName, key);
        if (p.emergencyContactRelationship != null &&
            shouldEncrypt(p.emergencyContactRelationship))
            updates.emergencyContactRelationship = encrypt(p.emergencyContactRelationship, key);
        if (p.emergencyContactPhone != null &&
            shouldEncrypt(p.emergencyContactPhone))
            updates.emergencyContactPhone = encrypt(p.emergencyContactPhone, key);
        if (Object.keys(updates).length > 0) {
            await prisma.patient.update({
                where: { id: p.id },
                data: updates,
            });
            patientsUpdated++;
        }
    }
    const instructions = await prisma.careInstruction.findMany({
        where: { deletedAt: null },
    });
    for (const i of instructions) {
        if (i.content != null && shouldEncrypt(i.content)) {
            await prisma.careInstruction.update({
                where: { id: i.id },
                data: { content: encrypt(i.content, key) },
            });
            instructionsUpdated++;
        }
    }
    const users = await prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, twoFactorSecret: true, backupCodes: true },
    });
    for (const u of users) {
        const updates = {};
        if (u.twoFactorSecret != null && shouldEncrypt(u.twoFactorSecret)) {
            updates.twoFactorSecret = encrypt(u.twoFactorSecret, key);
        }
        if (u.backupCodes != null && shouldEncrypt(u.backupCodes)) {
            updates.backupCodes = encrypt(u.backupCodes, key);
        }
        if (Object.keys(updates).length > 0) {
            await prisma.user.update({
                where: { id: u.id },
                data: updates,
            });
            usersUpdated++;
        }
    }
    console.log('Encryption of existing data complete.');
    console.log('  Patients (rows with at least one field encrypted):', patientsUpdated);
    console.log('  Care instructions:', instructionsUpdated);
    console.log('  Users (2FA/backup codes):', usersUpdated);
}
main()
    .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=encrypt-existing-data.js.map