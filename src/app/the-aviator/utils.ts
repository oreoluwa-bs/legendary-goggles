export const mousePosition = { x: 0, y: 0 };

export function normalize(
  v: number,
  vmin: number,
  vmax: number,
  tmin: number,
  tmax: number
) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}
