import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './public',
  
  build: {
    // Output directory for minified files
    outDir: './dist',
    
    // Empty the output directory before building
    emptyOutDir: true,
    
    // Minification settings
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      format: {
        comments: false // Remove all comments
      }
    },
    
    rollupOptions: {
      input: resolve(__dirname, 'public/js/app.js'),
      
      output: {
        // Output format
        format: 'iife', // Immediately Invoked Function Expression for browser
        
        // Single bundled file
        entryFileNames: 'app.min.js',
        
        // Keep it simple - single file output
        inlineDynamicImports: true
      }
    },
    
    // Source maps for debugging (set to false for production)
    sourcemap: false,
    
    // Target modern browsers
    target: 'es2015'
  },
  
  // Optimization settings
  esbuild: {
    drop: ['console', 'debugger'],
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
});