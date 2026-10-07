/**
 * Runner game hall of fame. Entries are added by hand after a record is
 * submitted (you get a notification with the details), which doubles as a
 * check against faked scores. The shout-out section on the site only appears
 * once this list has at least one entry.
 */
export type HallOfFameEntry = {
  name: string
  score: number
  /** ISO date, YYYY-MM-DD. */
  date: string
  /** Optional link: X, LinkedIn, GitHub or a personal site. */
  url?: string
}

export const hallOfFame: HallOfFameEntry[] = []

/** Beat this to earn the sunflower card while the hall of fame is empty. */
export const RECORD_FLOOR = 600

/** The score a player has to beat to set a new record. */
export function currentRecord(): number {
  return Math.max(RECORD_FLOOR, ...hallOfFame.map((e) => e.score))
}
