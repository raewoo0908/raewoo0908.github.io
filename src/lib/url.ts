/** base 경로를 붙여 안전한 절대 링크를 만든다(유저 사이트는 base '/'). */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}` || '/';
}
