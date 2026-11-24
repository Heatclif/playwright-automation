// src/eventhub/api/builders/auth-builder.ts
import { AuthInput } from '../types';

/**
 * Fluent builder for constructing Auth payloads (register/login).
 */
export class AuthBuilder {
  private payload: Partial<AuthInput> = {};

  with_email(email: string): this {
    this.payload.email = email;
    return this;
  }

  withEmail(email: string): this {
    return this.with_email(email);
  }

  with_password(password: string): this {
    this.payload.password = password;
    return this;
  }

  withPassword(password: string): this {
    return this.with_password(password);
  }

  with_name(name: string): this {
    this.payload.name = name;
    return this;
  }

  withName(name: string): this {
    return this.with_name(name);
  }

  with_data(data: Partial<AuthInput>): this {
    this.payload = { ...this.payload, ...data };
    return this;
  }

  withData(data: Partial<AuthInput>): this {
    return this.with_data(data);
  }

  without_field(field: keyof AuthInput): this {
    delete this.payload[field];
    return this;
  }

  withoutField(field: keyof AuthInput): this {
    return this.without_field(field);
  }

  build(): AuthInput {
    return { ...this.payload } as AuthInput;
  }
}

/** Backward-compatible alias */
export const AuthConcern = AuthBuilder;
export type AuthConcern = AuthBuilder;
