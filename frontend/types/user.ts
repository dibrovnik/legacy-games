export interface User {
  id: number;
  first_name: string;
  last_name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  balance_rub: string;
  balance_bonus: string;
  vip_active: boolean;
  vip_expires_at: string;
  role: Role;
  access_token?: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permmission[];
}

export interface Permmission {
  id: number;
  name: string;
}
