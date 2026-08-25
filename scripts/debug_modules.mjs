import {build} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const modules = new Set();

const result = await build({
  root: '.',
  plugins: [
    {
      name: 'module-counter',
      resolveId(id, importer) {
        if (!id.includes('node_modules')) {
          modules.add(id);
          console.log('RESOLVE:', id, '<-', importer || 'entry');
        }
        return null;
      }
    },
    tailwindcss(),
    react()
  ],
  build: { write: false, outDir: 'dist-debug' },
  logLevel: 'info'
});

console.log('\n=== Total source modules:', modules.size, '===');
modules.forEach(m => console.log(' ', m));
