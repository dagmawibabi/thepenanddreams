import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { importArticles } from './scripts/import-articles.mjs';

// Dropping a new Telegram export into data/ is all it takes to update the site.
function articlesFromExport(): Plugin {
	const exportPath = resolve('data/result.json');
	return {
		name: 'articles-from-export',
		buildStart() {
			importArticles();
		},
		configureServer(server) {
			server.watcher.add(exportPath);
			server.watcher.on('change', (file) => {
				if (resolve(file) === exportPath) importArticles();
			});
		}
	};
}

export default defineConfig({
	plugins: [
		articlesFromExport(),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
