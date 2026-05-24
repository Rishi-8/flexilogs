export type ID = string;

export interface Category {
  id: ID;
  name: string;
  color: string;
  icon?: string | null;
}

export interface Log {
  id: ID;
  categoryId: ID;
  title: string;
  description?: string | null;
  /** ISO date YYYY-MM-DD */
  date: string;
  /** HH:mm */
  startTime?: string | null;
  /** HH:mm */
  endTime?: string | null;
  tags: string[];
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}
