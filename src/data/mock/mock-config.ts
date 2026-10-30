import { Status } from '../../core';

/** Every tunable number for the fake org. */
export interface MockConfig {
  seed: number;
  shape: {
    managers: number;
    generalForemenPerManager: [min: number, max: number];
    foremenPerGeneralForeman: [min: number, max: number];
    crewPerForeman: [min: number, max: number];
  };
  /** Share of people with each status (sums to 1). */
  statusMix: Record<Status, number>;
  /** How unevenly problems spread across crews; 0 makes every crew alike. */
  crewHealthSpread: number;
  /** Share of crew members on a program by default. */
  programAssignmentRate: number;
  /** Planted scenario: how many in the tool crew have expired calibrations. */
  expiredToolPeople: number;
}

export const MOCK_CONFIG: MockConfig = {
  seed: 20261030,
  shape: {
    managers: 4,
    generalForemenPerManager: [2, 3],
    foremenPerGeneralForeman: [2, 3],
    crewPerForeman: [5, 8],
  },
  statusMix: { ready: 0.73, expiring: 0.18, 'not-ready': 0.09 },
  crewHealthSpread: 1.2,
  programAssignmentRate: 0.3,
  expiredToolPeople: 4,
};
