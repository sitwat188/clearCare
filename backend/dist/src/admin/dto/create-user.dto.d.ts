export declare class CreateUserDto {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: 'patient' | 'provider' | 'administrator';
    permissions?: string[];
    createdAt?: string;
    organizationId?: string;
}
