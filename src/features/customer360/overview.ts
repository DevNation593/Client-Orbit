import type {
  Activity,
  Contact,
  Deal,
  FileRecord,
  Lead,
  OrganizationReference,
  Relation,
  Task,
} from "@/types/domain";

export interface OverviewModule<T> {
  /** Total records linked to the contact, not just the ones in `items`. */
  count: number;
  items: T[];
}

/**
 * `GET /contacts/{id}/overview`. A module is present only when the user has
 * the permission to see that resource.
 */
export interface CustomerOverview {
  contact: Contact;
  modules: {
    companies?: OverviewModule<OrganizationReference>;
    leads?: OverviewModule<Lead>;
    opportunities?: OverviewModule<Deal>;
    activities?: OverviewModule<Activity>;
    tasks?: OverviewModule<Task>;
    documents?: OverviewModule<FileRecord>;
    relationships?: OverviewModule<Relation>;
  };
  unavailable_modules: string[];
  generated_at: string;
}
