import { IsoDate, Person, SourceRecord } from '../../core';
import { localToday } from '../clock';
import { DataSource, Persona } from '../data-source';
import { MOCK_CONFIG, MockConfig } from './mock-config';
import { FakeOrg, generateOrg } from './org-generator';

/** DataSource over a generated fake org. Generated once, on first use. */
export class MockDataSource implements DataSource {
  private org: FakeOrg | null = null;

  constructor(
    private readonly anchor: () => IsoDate = localToday,
    private readonly config: MockConfig = MOCK_CONFIG,
  ) {}

  /** The whole generated org, including default programs and planted scenario ids. */
  fakeOrg(): FakeOrg {
    this.org ??= generateOrg(this.anchor(), this.config);
    return this.org;
  }

  async getPeople(): Promise<Person[]> {
    return this.fakeOrg().people;
  }

  async getRecords(): Promise<SourceRecord[]> {
    return this.fakeOrg().records;
  }

  async getPersonas(): Promise<Persona[]> {
    return this.fakeOrg().personas;
  }
}
