export enum PlanType {
  MEMBERSHIP = 'MEMBERSHIP',
  ADD_ON = 'ADD_ON'
}

export interface Plan {
  id?: number;
  name: string;
  duration: number;
  price: number;
  description?: string;
  type: PlanType;
}
