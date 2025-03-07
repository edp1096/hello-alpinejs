// build.js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const http = require('http');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const sassPlugin = require('esbuild-sass-plugin').sassPlugin;

const livereloadScript = `
  <!-- Live reload script -->
  <script>
    (function() {
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 2;
      const reconnectInterval = 100; // 0.1초
      let socket;

      function connectWebSocket() {
        socket = new WebSocket('ws://localhost:8001');

        socket.addEventListener('open', function() {
          console.log('Live reload server connection is successful');
          reconnectAttempts = 0; // Reset retry count when connected
        });

        socket.addEventListener('message', function(event) {
          if(event.data == 'reload') {
            console.log('File change detected. Reloading...');
            location.reload();
          }
        });

        socket.addEventListener('close', function() {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(\`Connection is closed. Reconnecting (\${reconnectAttempts}/\${maxReconnectAttempts})...\`);

            setTimeout(() => { connectWebSocket(); }, reconnectInterval);
          } else {
            console.log('Reached to reconnect limit. Closing the browser page...');
            window.close();

            setTimeout(() => {
              if (!window.closed) { alert('Live reload server is not available. Please check the dev server.'); }
            }, 500);
          }
        });

        socket.addEventListener('error', function(error) { console.error('WebSocket error:', error); });
      }

      connectWebSocket();
    })();
  </script>
`;


const htmlImportPlugin = {
    name: 'html-import',
    setup(build) {
        build.onLoad({ filter: /\.html$/ }, async (args) => {
            const contents = await fs.promises.readFile(args.path, 'utf8');

            const minifiedHtml = contents
                .replace(/\s+/g, ' ')
                .replace(/>\s+</g, '><')
                .replace(/<!--.*?-->/g, '')
                .trim();

            const escapedContents = minifiedHtml
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/\$/g, '\\$');

            const result = `export default \`${escapedContents}\`;`;
            return { contents: result, loader: 'js' };
        });
    }
};

const emptyCssPlugin = {
    name: 'empty-css',
    setup(build) {
        build.onLoad({ filter: /\.(scss|css)$/ }, async (args) => {
            return {
                contents: '/* SCSS/CSS imports are handled separately */',
                loader: 'js'
            };
        });
    }
};

async function buildJS() {
    try {
        await esbuild.build({
            entryPoints: ['src/todo.js'],
            outfile: 'dist/todo-bundle.js',
            bundle: true,
            minify: true,
            format: 'iife',
            globalName: 'TodoComponent',
            target: ['es2020'],
            plugins: [
                htmlImportPlugin,
                emptyCssPlugin
            ],
            external: ['alpinejs'],
            define: {
                'process.env.NODE_ENV': '"production"'
            }
        });

        console.log('JS bundling is completed!', new Date().toLocaleTimeString());
        return true;
    } catch (error) {
        console.error('JS bundling error:', error);
        return false;
    }
}

async function buildCSS() {
    try {
        await esbuild.build({
            entryPoints: ['src/todo.scss'],
            outfile: 'dist/todo-styles.css',
            bundle: true,
            minify: true,
            plugins: [
                sassPlugin({
                    type: 'css',
                    loadPaths: ['src', 'node_modules']
                })
            ]
        });

        console.log('CSS bundling is completed!', new Date().toLocaleTimeString());
        return true;
    } catch (error) {
        console.error('CSS bundling error:', error);
        return false;
    }
}

async function build() {
    try {
        const distDir = path.join(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
            console.log('Directory dist is created');
        }

        const [jsSuccess, cssSuccess] = await Promise.all([
            buildJS(),
            buildCSS()
        ]);

        if (jsSuccess && cssSuccess) {
            console.log('All bundling are successful!', new Date().toLocaleTimeString());
            return true;
        } else {
            console.error('Few bundle(s) were failed');
            return false;
        }
    } catch (error) {
        console.error('Bundling error:', error);
        return false;
    }
}

// Serve HTTP
function handleRequest(req, res) {
    let filePath = '.' + req.url;
    if (filePath == './') { filePath = './index.html'; }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found: ' + filePath);
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });

            // Inject live reload script
            if (contentType == 'text/html') {
                content = Buffer.from(content.toString().replace('</body>', `${livereloadScript}</body>`));
            }

            res.end(content);
        }
    });
}

function createWebSocketServer() {
    const wss = new WebSocket.Server({ port: 8001 });
    console.log('WebSocket server is running on port 8001');

    wss.on('connection', (ws) => {
        console.log('Client connected');
        ws.on('close', () => { console.log('Client disconnected'); });
    });

    return wss;
}

function notifyReload(wss) {
    if (!wss) return;

    wss.clients.forEach((client) => {
        if (client.readyState == WebSocket.OPEN) {
            console.log('Sending reload message to client');
            client.send('reload');
        }
    });
}

async function runDevServer() {
    try {
        await build();

        const serverPort = 8000;
        const wss = createWebSocketServer();
        const server = http.createServer(handleRequest);

        server.listen(serverPort, async () => {
            console.log(`Server is running at http://localhost:${serverPort}`);

            const { default: open } = await import('open');
            open(`http://localhost:${serverPort}`).catch(err => { console.error('Failed to open the browser:', err); });
            console.log('Browser page opening is successful.');
        });

        // Watch files setting
        const globs = await fg(['src/**/*.js', 'src/**/*.html', 'src/**/*.scss', 'index.html']);
        const watcher = chokidar.watch(globs, {
            ignored: /(^|[\/\\])\../, // Ignore hidden files
            persistent: true
        });

        // Watch files
        watcher.on('change', async (changedPath) => {
            console.log(`File change detected: ${changedPath}`);
            const success = await build();
            if (success) { notifyReload(wss); }
        });

        console.log('Watch mode is activated: watching for file changes...');

        // Handle termination (Ctrl+C)
        process.on('SIGINT', async () => {
            if (wss) { wss.close(); }

            server.close(() => { console.log('HTTP server is closed'); });
            await watcher.close();
            console.log('Dev server and watch mode are closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error in dev server termination:', error);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.includes('--watch')) {
    runDevServer();
} else {
    build();
}

module.exports = {
    build,
    buildJS,
    buildCSS,
    runDevServer
};