export interface Customer {
  id: number;
  name: string;
  email: string;
  available?: boolean;
}

export type NewCustomer = Pick<Customer, 'name' | 'email'>;
