import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const DPI = 2;
const YEN = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });

const COLORS: [number, { bg: string; text: string; name: string }][] = [
  [10000, { bg: '#e62117', text: '#fff', name: 'rgba(255,255,255,0.7)' }],
  [5000, { bg: '#e91e63', text: '#fff', name: 'rgba(255,255,255,0.7)' }],
  [2000, { bg: '#f57c00', text: 'rgba(255,255,255,0.87)', name: 'rgba(255,255,255,0.7)' }],
  [1000, { bg: '#ffca28', text: 'rgba(0,0,0,0.87)', name: 'rgba(0,0,0,0.54)' }],
  [500, { bg: '#1de9b6', text: '#000', name: 'rgba(0,0,0,0.54)' }],
  [200, { bg: '#00e5ff', text: '#000', name: 'rgba(0,0,0,0.7)' }],
  [100, { bg: '#1e88e5', text: '#fff', name: 'rgba(255,255,255,0.7)' }],
];

export interface Props {
  price: number;
  name: string;
  iconSrc?: string;
  message?: string;
}

// satori が受け付ける React-element-like のプレーンオブジェクトを組み立てる簡易ヘルパー。
// JSX を避けることで tsconfig の jsx 設定・React 依存を不要にしている。
type SatoriNode =
  | string
  | number
  | null
  | undefined
  | false
  | { type: string; props: { children?: SatoriNode | SatoriNode[]; style?: Record<string, unknown>; [key: string]: unknown } };

function h(
  type: string,
  props: Record<string, unknown> | null,
  ...children: SatoriNode[]
): SatoriNode {
  const flat = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  const finalChildren = flat.length === 0 ? undefined : flat.length === 1 ? flat[0] : flat;
  return { type, props: { ...(props ?? {}), children: finalChildren } };
}

function toDataUri(buf: ArrayBuffer, type: string): string {
  return `data:${type};base64,${Buffer.from(buf).toString('base64')}`;
}

const FETCH_TIMEOUT_MS = 5000;

async function fetchWithTimeout(input: string | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFont(text: string, weight: number): Promise<ArrayBuffer> {
  const url = new URL('https://fonts.googleapis.com/css2');
  url.searchParams.set('family', `Noto Sans JP:wght@${weight}`);
  url.searchParams.set('text', text);

  const cssRes = await fetchWithTimeout(url, { headers: { 'User-Agent': 'satori' } });
  if (!cssRes.ok) throw new Error(`fetchFont css fetch failed: ${cssRes.status}`);
  const css = await cssRes.text();
  const fontUrl = css.match(/src: url\((?<u>https:\/\/[^)]+)\)/u)?.groups?.u;
  if (!fontUrl) throw new Error('fetchFont: Font URL not found');
  const fontRes = await fetchWithTimeout(fontUrl);
  if (!fontRes.ok) throw new Error(`fetchFont font fetch failed: ${fontRes.status}`);
  return fontRes.arrayBuffer();
}

async function fetchIcon(src?: string): Promise<string | undefined> {
  if (!src) return undefined;
  try {
    const res = await fetchWithTimeout(src);
    if (!res.ok) return undefined;
    return toDataUri(await res.arrayBuffer(), res.headers.get('content-type') ?? 'image/png');
  } catch {
    return undefined;
  }
}

async function loadEmoji(segment: string): Promise<string> {
  const str = segment.indexOf('\u200D') === -1 ? segment.replace(/\uFE0F/g, '') : segment;
  const code = [...str].map((c) => c.codePointAt(0)!.toString(16)).join('-');
  try {
    const res = await fetchWithTimeout(
      `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code.toLowerCase()}.svg`
    );
    if (!res.ok) return segment;
    return toDataUri(await res.arrayBuffer(), 'image/svg+xml');
  } catch {
    return segment;
  }
}

// Discord カスタム絵文字構文: <:name:id> / <a:name:id>
export const CUSTOM_EMOJI_RE = /<(a)?:(\w+):(\d+)>/g;

const EMOJI_FETCH_CONCURRENCY = 8;

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    results.push(...(await Promise.all(items.slice(i, i + concurrency).map(fn))));
  }
  return results;
}

type MessageSegment =
  | { kind: 'text'; value: string }
  | { kind: 'emoji'; id: string; name: string; animated: boolean };

export function parseMessage(input: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  for (const match of input.matchAll(CUSTOM_EMOJI_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ kind: 'text', value: input.slice(lastIndex, start) });
    }
    segments.push({
      kind: 'emoji',
      animated: match[1] === 'a',
      name: match[2]!,
      id: match[3]!,
    });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < input.length) {
    segments.push({ kind: 'text', value: input.slice(lastIndex) });
  }
  return segments;
}

function stripCustomEmoji(input: string): string {
  return input.replace(CUSTOM_EMOJI_RE, '');
}

async function fetchCustomEmoji(id: string): Promise<string | undefined> {
  try {
    const res = await fetchWithTimeout(
      `https://cdn.discordapp.com/emojis/${id}.png?size=64`
    );
    if (!res.ok) return undefined;
    return toDataUri(await res.arrayBuffer(), 'image/png');
  } catch {
    return undefined;
  }
}

export async function generateImage({ price, name, iconSrc: rawIcon, message }: Props): Promise<Uint8Array> {
  const segments = message ? parseMessage(message) : [];
  // CDN 取得失敗時の `:name:` フォールバック表示用に、絵文字名もフォントテキストに含める
  const emojiFallbackText = segments
    .flatMap((seg) => (seg.kind === 'emoji' ? [`:${seg.name}:`] : []))
    .join('');
  const fontText = `x${stripCustomEmoji(message ?? '')}${emojiFallbackText}`;
  const emojiIds = [...new Set(segments.flatMap((s) => (s.kind === 'emoji' ? [s.id] : [])))];

  const [fontNormal, fontBold, iconSrc, emojiSrcs] = await Promise.all([
    fetchFont(fontText, 400),
    fetchFont(`${name}￥${price},`, 500),
    fetchIcon(rawIcon),
    mapWithConcurrency(emojiIds, EMOJI_FETCH_CONCURRENCY, async (id) =>
      [id, await fetchCustomEmoji(id)] as const
    ),
  ]);
  const emojiMap = new Map(emojiSrcs);

  const color = (COLORS.find(([t]) => price >= t) ?? COLORS.at(-1)!)[1];

  const iconNode = iconSrc
    ? h('img', {
        src: iconSrc,
        width: 32 * DPI,
        height: 32 * DPI,
        style: {
          width: `${32 * DPI}px`,
          height: `${32 * DPI}px`,
          borderRadius: '50%',
          marginRight: `${16 * DPI}px`,
        },
      })
    : h('span', {
        style: {
          width: `${32 * DPI}px`,
          height: `${32 * DPI}px`,
          borderRadius: '50%',
          marginRight: `${16 * DPI}px`,
          backgroundColor: 'rgba(0,0,0,0.1)',
        },
      });

  const headerRow = h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: `${8 * DPI}px ${16 * DPI}px`,
        fontWeight: 500,
      },
    },
    iconNode,
    h(
      'div',
      { style: { display: 'flex' } },
      h('span', { style: { color: color.name, fontSize: `${14 * DPI}px` } }, name),
      h('span', { style: { paddingLeft: `${8 * DPI}px` } }, YEN.format(price))
    )
  );

  const emojiSize = 18 * DPI;
  const messageChildren: SatoriNode[] = segments.map((seg) => {
    if (seg.kind === 'text') return seg.value;
    const src = emojiMap.get(seg.id);
    if (!src) return `:${seg.name}:`;
    return h('img', {
      src,
      width: emojiSize,
      height: emojiSize,
      style: {
        width: `${emojiSize}px`,
        height: `${emojiSize}px`,
        margin: `0 ${2 * DPI}px`,
      },
    });
  });

  const messageRow = message
    ? h(
        'div',
        {
          style: {
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            padding: `${8 * DPI}px ${16 * DPI}px`,
            paddingTop: '0',
            wordBreak: 'break-word',
          },
        },
        ...messageChildren
      )
    : null;

  const root = h(
    'div',
    {
      lang: 'ja-JP',
      style: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: `${12 * DPI}px`,
        backgroundColor: color.bg,
        color: color.text,
        fontSize: `${15 * DPI}px`,
        fontFamily: "'Noto Sans JP'",
      },
    },
    headerRow,
    messageRow
  );

  const svg = await satori(root as Parameters<typeof satori>[0], {
    width: 368 * DPI,
    height: 1000 * DPI,
    fonts: [
      { name: 'Noto Sans JP', data: fontNormal, weight: 400, style: 'normal' },
      { name: 'Noto Sans JP', data: fontBold, weight: 500, style: 'normal' },
    ],
    loadAdditionalAsset: async (code, segment) =>
      code === 'emoji' ? loadEmoji(segment) : segment,
  });

  const resvg = new Resvg(svg, { background: 'transparent' });
  const bbox = resvg.innerBBox();
  if (bbox) resvg.cropByBBox(bbox);
  return resvg.render().asPng();
}
