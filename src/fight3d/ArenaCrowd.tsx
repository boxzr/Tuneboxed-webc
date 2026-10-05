import { useMemo } from 'react';
import BoxerRig from './BoxerRig';
import Nametag from './Nametag';
import MascotCrowd, { Risers, standSeats } from './MascotCrowd';
import { defaultLoadout, type FighterLoadout } from './loadout';
import { RING_HALF } from './RingScene';

export interface CrowdPerson {
  name: string;
  loadout: FighterLoadout;
}

const STAND_INNER = RING_HALF + 1.7;
const STAND_ROWS = 8;

/** Ringside spots for room players, along the back apron. */
function vipSpots(count: number) {
  const out: { x: number; z: number }[] = [];
  const z = -(RING_HALF + 0.95);
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 0.82;
    out.push({ x, z });
  }
  return out;
}

/**
 * Packed arena: tiered stands of note fans on three sides, plus anyone in
 * the room who is not in a corner, ringside with their real kit and name.
 */
export default function ArenaCrowd({ people, hype = 0 }: { people: CrowdPerson[]; hype?: number }) {
  const seats = useMemo(() => standSeats({ inner: STAND_INNER, rows: STAND_ROWS }), []);

  const vip = useMemo(() => {
    const spots = vipSpots(Math.min(people.length, 6));
    return people.slice(0, spots.length).map((p, i) => ({ ...p, ...spots[i] }));
  }, [people]);

  return (
    <group>
      <Risers inner={STAND_INNER} rows={STAND_ROWS} />
      <MascotCrowd seats={seats} hype={hype} />
      {vip.map((p) => (
        <group key={p.name} position={[p.x, 0, p.z]} scale={0.72}>
          <BoxerRig loadout={p.loadout} pose="idle" facing={1} faceCamera />
          <Nametag name={p.name} accent="#f4efe6" y={1.82} width={0.7} />
        </group>
      ))}
    </group>
  );
}

export function houseFans(exclude: string[]): CrowdPerson[] {
  const names = ['Jules', 'Sam', 'Devon', 'Priya', 'Chris', 'Nia', 'Omar', 'Val', 'Reese', 'Kai'];
  const skip = new Set(exclude.map((n) => n.toLowerCase()));
  return names
    .filter((n) => !skip.has(n.toLowerCase()))
    .map((name) => ({ name, loadout: defaultLoadout(name) }));
}
