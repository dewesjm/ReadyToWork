import { SupervisorOption } from '../../core';

/** Spaces per level in supervisor pick lists. */
export const SUPERVISOR_INDENT = 3;

/** Pick-list entries: "You (name)" for the viewer, "Name, Title" for others, indented by level. */
export function supervisorChoices(
  options: readonly SupervisorOption[],
  viewerId: string | undefined,
): { id: string; label: string }[] {
  const indent = ' '.repeat(SUPERVISOR_INDENT);
  return options.map((o) => ({
    id: o.person.id,
    label:
      indent.repeat(o.depth) +
      (o.person.id === viewerId ? `You (${o.person.name})` : `${o.person.name}, ${o.person.title}`),
  }));
}
