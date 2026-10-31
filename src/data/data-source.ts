import { CategoryId, Person, SourceRecord } from '../core';

/** An item in the fake data: its type, ID and name. */
export interface CatalogItem {
  category: CategoryId;
  itemId: string;
  itemName: string;
}

/** A sample viewer for the demo's "View as" control. */
export interface Persona {
  id: string;
  label: string;
  /** The person they are; they see this person's subtree. */
  personId: string;
  isAdmin: boolean;
}

/**
 * The seam to the real systems. Screens get people and records only through this. The mockup
 * uses MockDataSource; the real app provides an API-backed one through dependency injection.
 */
export interface DataSource {
  getPeople(): Promise<Person[]>;
  getRecords(): Promise<SourceRecord[]>;
  getPersonas(): Promise<Persona[]>;
}
