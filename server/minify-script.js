const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// ============================================
// CONFIGURATION: Update these with your actual JS file names
// ============================================
const filesToMinify = [
  {
    input: 'public/js/integration.js',
    output: 'public/js/integration.min.js'
  },
  {
    input: 'public/js/init-avatar.js',
    output: 'public/js/init-avatar.min.js'
  },
  {
    input: 'public/js/countries-autocomplete.js',
    output: 'public/js/countries-autocomplete.min.js'
  }
  // Add more files as needed
];

// ============================================
// TERSER CONFIGURATION
// ============================================
const terserConfig = {
  compress: {
    dead_code: true,          // Remove unreachable code
    drop_console: false,      // Set to true to remove console.log in production
    drop_debugger: true,      // Remove debugger statements
    keep_classnames: false,   // Mangle class names
    keep_fnames: false,       // Mangle function names
    passes: 2                 // Number of compression passes
  },
  mangle: {
    toplevel: false,          // Don't mangle top-level names
    keep_classnames: false,   // Mangle class names
    keep_fnames: false        // Mangle function names
  },
  format: {
    comments: false,          // Remove all comments
    beautify: false,          // Don't beautify output
    preamble: '/* Minified by Terser */'
  }
};

// Production config (removes console.log)
const terserConfigProd = {
  ...terserConfig,
  compress: {
    ...terserConfig.compress,
    drop_console: true,
    drop_debugger: true
  }
};

// ============================================
// MINIFICATION FUNCTION
// ============================================
async function minifyFile(inputPath, outputPath, isProduction = false) {
  try {
    console.log(`📦 Minifying: ${inputPath}...`);
    
    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠️  Warning: ${inputPath} not found, skipping...\n`);
      return;
    }
    
    // Read the source file
    const code = fs.readFileSync(inputPath, 'utf8');
    
    // Get original size
    const originalSize = Buffer.byteLength(code, 'utf8');
    
    // Minify with appropriate config
    const config = isProduction ? terserConfigProd : terserConfig;
    const result = await minify(code, config);
    
    if (result.error) {
      throw result.error;
    }
    
    // Write minified file
    fs.writeFileSync(outputPath, result.code, 'utf8');
    
    // Get minified size
    const minifiedSize = Buffer.byteLength(result.code, 'utf8');
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
    
    console.log(`✅ ${path.basename(outputPath)} created`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`   Saved: ${savings}%\n`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error minifying ${inputPath}:`);
    console.error(`   ${error.message}\n`);
    return false;
  }
}

// ============================================
// MINIFY ALL FILES
// ============================================
async function minifyAll(isProduction = false) {
  console.log('🚀 Starting minification process...');
  console.log(`📝 Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of filesToMinify) {
    const success = await minifyFile(file.input, file.output, isProduction);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('✨ Minification complete!');
  console.log(`   ✅ Success: ${successCount} files`);
  if (failCount > 0) {
    console.log(`   ❌ Failed: ${failCount} files`);
  }
  console.log('');
}

// ============================================
// WATCH MODE
// ============================================
function watchFiles(isProduction = false) {
  console.log('👀 Watch mode enabled. Watching for changes...\n');
  
  const watchers = [];
  
  filesToMinify.forEach(file => {
    if (fs.existsSync(file.input)) {
      const watcher = fs.watch(file.input, (eventType) => {
        if (eventType === 'change') {
          console.log(`\n📝 ${file.input} changed, re-minifying...\n`);
          minifyFile(file.input, file.output, isProduction);
        }
      });
      watchers.push(watcher);
      console.log(`   Watching: ${file.input}`);
    } else {
      console.warn(`   ⚠️  ${file.input} not found, skipping watch...`);
    }
  });
  
  console.log('\n');
  
  // Initial minification
  minifyAll(isProduction);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping watch mode...');
    watchers.forEach(watcher => watcher.close());
    process.exit(0);
  });
}

// ============================================
// MAIN EXECUTION
// ============================================
const args = process.argv.slice(2);
const isWatchMode = args.includes('--watch') || args.includes('-w');
const isProduction = args.includes('--prod') || args.includes('-p');

if (isWatchMode) {
  watchFiles(isProduction);
} else {
  minifyAll(isProduction).then(() => {
    process.exit(0);
  });
}