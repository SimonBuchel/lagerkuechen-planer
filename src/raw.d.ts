// Vite `?raw` imports return the file's text content as the default export.
declare module '*?raw' {
	const content: string;
	export default content;
}
