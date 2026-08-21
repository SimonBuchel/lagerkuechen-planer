/**
 * IO layer: turns a PDF buffer into normalized {@link PageGeometry} pages using
 * pdf.js. This is the only module that touches pdf.js. It walks the operator
 * list to recover filled shapes with their colours (Kapitel 3.1: category lives
 * in the fill colour) and reads the text layer for positioned words.
 *
 * Everything is emitted in **top-down** coordinates so the pure analysis code
 * never has to think about pdf.js' bottom-up user space.
 */

// pdf.js legacy build runs in plain Node without a browser worker.
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
// Embed the worker source as a string at build time. pdf.js loads its worker via
// a runtime `import(this.workerSrc)` that bundlers (Vercel's @vercel/nft) can't
// trace, so the worker file is otherwise missing from the serverless function
// ("Setting up fake worker failed: Cannot find module pdf.worker.mjs"). `?raw`
// inlines the code into the bundle, independent of any file-tracing heuristic.
import workerSource from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?raw';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { FilledRect, PageGeometry, RGB, Word } from './types';

// Materialise the embedded worker to a tmp file and point pdf.js at it.
try {
	const workerPath = join(tmpdir(), 'lagerkueche-pdf.worker.min.mjs');
	writeFileSync(workerPath, workerSource);
	pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
} catch {
	// Fall back to pdf.js' own default resolution when the tmp write isn't possible.
}

// pdf.js v4 relies on Promise.withResolvers, which only exists on Node 22+.
// Vercel/older runtimes on Node 20 would otherwise throw during getDocument,
// making every upload look like "not an eCamp export". Polyfill it defensively.
{
	const P = Promise as unknown as { withResolvers?: () => unknown };
	if (typeof P.withResolvers !== 'function') {
		P.withResolvers = function <T>() {
			let resolve!: (value: T | PromiseLike<T>) => void;
			let reject!: (reason?: unknown) => void;
			const promise = new Promise<T>((res, rej) => {
				resolve = res;
				reject = rej;
			});
			return { promise, resolve, reject };
		};
	}
}

const OPS = pdfjs.OPS;

/** 2-D affine matrix in pdf.js order [a, b, c, d, e, f]. */
type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** Composes two matrices the way pdf.js' Util.transform does (m1 ∘ m2). */
function multiply(m1: Matrix, m2: Matrix): Matrix {
	return [
		m1[0] * m2[0] + m1[2] * m2[1],
		m1[1] * m2[0] + m1[3] * m2[1],
		m1[0] * m2[2] + m1[2] * m2[3],
		m1[1] * m2[2] + m1[3] * m2[3],
		m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
		m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
	];
}

/** Applies a matrix to a point, returning transformed [x, y]. */
function apply(m: Matrix, x: number, y: number): [number, number] {
	return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

/** Normalizes a colour whose channels may be 0–255 or 0–1 to the 0–1 range. */
function normalizeColor(r: number, g: number, b: number): RGB {
	const scale = r > 1 || g > 1 || b > 1 ? 1 / 255 : 1;
	return { r: r * scale, g: g * scale, b: b * scale };
}

function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
	return {
		r: (1 - c) * (1 - k),
		g: (1 - m) * (1 - k),
		b: (1 - y) * (1 - k)
	};
}

/** Loads a PDF and returns one normalized {@link PageGeometry} per page. */
export async function loadPageGeometries(data: Uint8Array): Promise<PageGeometry[]> {
	const doc = await pdfjs.getDocument({
		data,
		isEvalSupported: false,
		useSystemFonts: false
	}).promise;

	let docTitle: string | undefined;
	try {
		const meta = await doc.getMetadata();
		const info = meta.info as { Title?: string } | undefined;
		if (info?.Title) docTitle = info.Title;
	} catch {
		// metadata is optional
	}

	const pages: PageGeometry[] = [];
	for (let i = 1; i <= doc.numPages; i++) {
		const page = await doc.getPage(i);
		const viewport = page.getViewport({ scale: 1 });
		const height = viewport.height;
		const width = viewport.width;

		const rects = await extractFilledRects(page, height);
		const words = await extractWords(page, height);

		pages.push({ width, height, rects, words, docTitle });
		page.cleanup();
	}

	await doc.destroy();
	return pages;
}

/** Walks the operator list to recover filled paths as coloured rectangles. */
async function extractFilledRects(
	page: pdfjs.PDFPageProxy,
	pageHeight: number
): Promise<FilledRect[]> {
	const opList = await page.getOperatorList();
	const rects: FilledRect[] = [];

	let ctm: Matrix = IDENTITY;
	const stack: Matrix[] = [];
	let fill: RGB = { r: 0, g: 0, b: 0 };
	let pending: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

	for (let i = 0; i < opList.fnArray.length; i++) {
		const fn = opList.fnArray[i];
		const args = opList.argsArray[i] as unknown[];

		switch (fn) {
			case OPS.save:
				stack.push(ctm);
				break;
			case OPS.restore:
				ctm = stack.pop() ?? IDENTITY;
				break;
			case OPS.transform:
				ctm = multiply(ctm, args as unknown as Matrix);
				break;
			case OPS.setFillRGBColor:
				fill = normalizeColor(args[0] as number, args[1] as number, args[2] as number);
				break;
			case OPS.setFillGray: {
				const g = args[0] as number;
				fill = normalizeColor(g, g, g);
				break;
			}
			case OPS.setFillCMYKColor:
				fill = cmykToRgb(
					args[0] as number,
					args[1] as number,
					args[2] as number,
					args[3] as number
				);
				break;
			case OPS.constructPath:
				pending = pathBounds(args, ctm);
				break;
			case OPS.fill:
			case OPS.eoFill:
			case OPS.fillStroke:
			case OPS.eoFillStroke:
			case OPS.closeFillStroke:
			case OPS.closeEOFillStroke:
				if (pending) {
					rects.push(boundsToRect(pending, pageHeight, fill));
					pending = null;
				}
				break;
			default:
				break;
		}
	}

	return rects;
}

/** Computes the transformed bounding box of a constructPath op. */
function pathBounds(
	args: unknown[],
	ctm: Matrix
): { minX: number; minY: number; maxX: number; maxY: number } | null {
	const subOps = args[0] as number[];
	const coords = args[1] as number[];
	if (!subOps || !coords) return null;

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	const push = (x: number, y: number) => {
		const [tx, ty] = apply(ctm, x, y);
		if (tx < minX) minX = tx;
		if (ty < minY) minY = ty;
		if (tx > maxX) maxX = tx;
		if (ty > maxY) maxY = ty;
	};

	let c = 0; // cursor into the flat coordinate stream
	for (const op of subOps) {
		switch (op) {
			case OPS.moveTo:
			case OPS.lineTo:
				push(coords[c], coords[c + 1]);
				c += 2;
				break;
			case OPS.curveTo:
				push(coords[c], coords[c + 1]);
				push(coords[c + 2], coords[c + 3]);
				push(coords[c + 4], coords[c + 5]);
				c += 6;
				break;
			case OPS.curveTo2:
			case OPS.curveTo3:
				push(coords[c], coords[c + 1]);
				push(coords[c + 2], coords[c + 3]);
				c += 4;
				break;
			case OPS.rectangle: {
				const x = coords[c];
				const y = coords[c + 1];
				const w = coords[c + 2];
				const h = coords[c + 3];
				push(x, y);
				push(x + w, y + h);
				c += 4;
				break;
			}
			case OPS.closePath:
				break;
			default:
				// Unknown sub-op: stop to avoid mis-reading the coordinate stream.
				break;
		}
	}

	if (!isFinite(minX) || !isFinite(minY)) return null;
	return { minX, minY, maxX, maxY };
}

/** Converts a user-space bounding box to a top-down {@link FilledRect}. */
function boundsToRect(
	b: { minX: number; minY: number; maxX: number; maxY: number },
	pageHeight: number,
	fill: RGB
): FilledRect {
	return {
		x0: b.minX,
		x1: b.maxX,
		top: pageHeight - b.maxY,
		bottom: pageHeight - b.minY,
		fill
	};
}

/** Reads the text layer as positioned, top-down {@link Word}s. */
async function extractWords(page: pdfjs.PDFPageProxy, pageHeight: number): Promise<Word[]> {
	const content = await page.getTextContent();
	const words: Word[] = [];

	for (const item of content.items) {
		if (!('str' in item)) continue;
		const text = item.str;
		if (text.length === 0) continue;

		// transform = [a, b, c, d, e, f]; e/f are the text origin (baseline).
		const t = item.transform as number[];
		const x = t[4];
		const yBaseline = t[5];
		const w = item.width;
		const h = item.height || Math.hypot(t[2], t[3]);

		words.push({
			text,
			x0: x,
			x1: x + w,
			top: pageHeight - (yBaseline + h),
			bottom: pageHeight - yBaseline,
			fontName: item.fontName
		});
	}

	return words;
}
