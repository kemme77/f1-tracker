// FIA timing sector boundaries per circuit, expressed as the corner number at
// which each sector ENDS. Sector 3 implicitly ends at the start/finish line.
//
// These are NOT published as static data — they come from live timing during a
// session. The values below are hand-picked from broadcast graphics and racing
// resources. If a track map looks wrong, adjust the pair here.
export const SECTOR_END_TURNS: Record<string, [number, number]> = {
  albert_park: [3, 9],
  americas: [11, 15],
  bahrain: [4, 10],
  baku: [3, 16],
  catalunya: [3, 9],
  hungaroring: [4, 11],
  imola: [4, 14],
  interlagos: [3, 11],
  jeddah: [9, 22],
  losail: [6, 11],
  marina_bay: [7, 14],
  miami: [8, 16],
  monaco: [5, 13],
  monza: [4, 7],
  red_bull_ring: [3, 7],
  rodriguez: [5, 11],
  shanghai: [6, 13],
  silverstone: [6, 14],
  spa: [5, 14],
  suzuka: [7, 14],
  vegas: [5, 12],
  villeneuve: [6, 12],
  yas_marina: [5, 11],
  zandvoort: [7, 11],
};
