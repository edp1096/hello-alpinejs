// build.js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const http = require('http');
const chokidar = require('chokidar');
const open = require('open');
const WebSocket = require('ws');
const sassPlugin = require('esbuild-sass-plugin').sassPlugin;

// 라이브 리로드를 위한 클라이언트 코드
const livereloadScript = `
  <!-- 라이브 리로드 스크립트 -->
  <script>
    (function() {
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 2;
      const reconnectInterval = 100; // 0.1초
      let socket;

      // WebSocket 연결 함수
      function connectWebSocket() {
        socket = new WebSocket('ws://localhost:8001');

        socket.addEventListener('open', function() {
          console.log('라이브 리로드 연결됨');
          reconnectAttempts = 0; // 연결 성공 시 재시도 카운터 초기화
        });

        socket.addEventListener('message', function(event) {
          if(event.data === 'reload') {
            console.log('변경 감지: 페이지 새로고침');
            location.reload();
          }
        });

        socket.addEventListener('close', function() {
          // 재연결 시도
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(\`라이브 리로드 연결 종료. 재연결 시도 (\${reconnectAttempts}/\${maxReconnectAttempts})...\`);

            setTimeout(() => { connectWebSocket(); }, reconnectInterval);
          } else {
            console.log('최대 재연결 시도 횟수 초과. 창을 닫습니다.');
            // 브라우저 창 닫기 시도
            window.close();

            // window.close()가 작동하지 않을 경우 (보안 정책 등의 이유로)
            // 사용자에게 메시지 표시
            setTimeout(() => {
              if (!window.closed) {
                alert('라이브 리로드 서버에 연결할 수 없습니다. 수동으로 창을 닫고 개발 서버를 확인해주세요.');
              }
            }, 500);
          }
        });

        socket.addEventListener('error', function(error) {
          console.error('WebSocket 오류:', error);
        });
      }

      // 초기 연결 시작
      connectWebSocket();
    })();
  </script>
`;

// HTML 파일을 가져오는 플러그인
const htmlImportPlugin = {
    name: 'html-import',
    setup(build) {
        // HTML 파일을 처리하는 로더
        build.onLoad({ filter: /\.html$/ }, async (args) => {
            const contents = await fs.promises.readFile(args.path, 'utf8');

            // HTML 내용을 한 줄로 변환하고 공백 최소화
            const minifiedHtml = contents
                .replace(/\s+/g, ' ')            // 연속된 공백을 하나로
                .replace(/>\s+</g, '><')         // 태그 사이 공백 제거
                .replace(/<!--.*?-->/g, '')      // 주석 제거
                .trim();                         // 앞뒤 공백 제거

            // JavaScript 문자열로 변환
            const escapedContents = minifiedHtml
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/\$/g, '\\$');

            const result = `export default \`${escapedContents}\`;`;
            return { contents: result, loader: 'js' };
        });
    }
};

// JS 코드에서 SCSS import를 처리하는 플러그인
const emptyCssPlugin = {
    name: 'empty-css',
    setup(build) {
        // SCSS/CSS 파일이 JS에서 임포트될 때 빈 모듈로 처리
        build.onLoad({ filter: /\.(scss|css)$/ }, async (args) => {
            return {
                contents: '/* SCSS/CSS imports are handled separately */',
                loader: 'js'
            };
        });
    }
};

// JS 번들링 설정
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
                emptyCssPlugin  // SCSS/CSS 임포트 처리
            ],
            external: ['alpinejs'],
            define: {
                'process.env.NODE_ENV': '"production"'
            }
        });

        console.log('JS 번들링 완료!', new Date().toLocaleTimeString());
        return true;
    } catch (error) {
        console.error('JS 번들링 에러:', error);
        return false;
    }
}

// CSS 번들링 설정
async function buildCSS() {
    try {
        await esbuild.build({
            entryPoints: ['src/todo.scss'],
            outfile: 'dist/todo-styles.css',
            bundle: true,
            minify: true,
            plugins: [
                sassPlugin({
                    // SCSS 처리 옵션
                    type: 'css', // CSS 출력
                    loadPaths: ['src', 'node_modules']
                })
            ]
        });

        console.log('CSS 번들링 완료!', new Date().toLocaleTimeString());
        return true;
    } catch (error) {
        console.error('CSS 번들링 에러:', error);
        return false;
    }
}

// 전체 빌드 함수
async function build() {
    try {
        // 디렉토리 생성 확인
        const distDir = path.join(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
            console.log('dist 디렉토리 생성됨');
        }

        // JS와 CSS 번들링 병렬 실행
        const [jsSuccess, cssSuccess] = await Promise.all([
            buildJS(),
            buildCSS()
        ]);

        // 빌드 결과 확인
        if (jsSuccess && cssSuccess) {
            console.log('모든 번들링 완료!', new Date().toLocaleTimeString());
            return true;
        } else {
            console.error('일부 번들링 실패');
            return false;
        }
    } catch (error) {
        console.error('번들링 에러:', error);
        return false;
    }
}

// HTTP 요청 처리 (정적 파일 서빙)
function handleRequest(req, res) {
    // URL에서 경로 추출
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // 파일 확장자 확인
    const extname = String(path.extname(filePath)).toLowerCase();

    // MIME 타입 매핑
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

    // 파일 읽기
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 파일을 찾을 수 없음
                res.writeHead(404);
                res.end('404 Not Found: ' + filePath);
            } else {
                // 서버 오류
                res.writeHead(500);
                res.end('서버 오류: ' + error.code);
            }
        } else {
            // 성공적으로 파일을 읽음
            res.writeHead(200, { 'Content-Type': contentType });

            // HTML 파일에 라이브 리로드 스크립트 삽입
            if (contentType === 'text/html') {
                content = Buffer.from(
                    content.toString().replace('</body>', `${livereloadScript}</body>`)
                );
            }

            res.end(content);
        }
    });
}

// 웹소켓 서버 생성
function createWebSocketServer() {
    const wss = new WebSocket.Server({ port: 8001 });
    console.log('WebSocket 서버가 포트 8001에서 실행 중');

    // 연결 이벤트 처리
    wss.on('connection', (ws) => {
        console.log('클라이언트 연결됨');

        ws.on('close', () => {
            console.log('클라이언트 연결 종료');
        });
    });

    return wss;
}

// 모든 클라이언트에 새로고침 메시지 전송
function notifyReload(wss) {
    if (!wss) return;

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            console.log('클라이언트에 새로고침 신호 전송');
            client.send('reload');
        }
    });
}

// 라이브 리로드를 포함한 개발 서버 실행
async function runDevServer() {
    try {
        // 초기 빌드
        await build();

        // 서버 포트 설정
        const serverPort = 8000;

        // WebSocket 서버 시작
        const wss = createWebSocketServer();

        // HTTP 서버 생성 및 시작
        const server = http.createServer(handleRequest);

        server.listen(serverPort, () => {
            console.log(`개발 서버 실행 중: http://localhost:${serverPort}`);

            // 브라우저 자동 실행
            open(`http://localhost:${serverPort}`).catch(err => {
                console.error('브라우저 열기 실패:', err);
            });
            console.log('브라우저에서 페이지를 열었습니다.');
        });

        // chokidar를 사용한 파일 감시 설정
        const watcher = chokidar.watch(['src/**/*.js', 'src/**/*.html', 'src/**/*.scss', 'index.html'], {
            ignored: /(^|[\/\\])\../, // 숨김 파일 무시
            persistent: true
        });

        // 파일 변경 감지 시 재빌드 및 새로고침
        watcher.on('change', async (changedPath) => {
            console.log(`파일 변경 감지: ${changedPath}`);

            const success = await build();
            if (success) {
                // 빌드 성공 시 모든 클라이언트에 새로고침 신호 전송
                notifyReload(wss);
            }
        });

        console.log('Watch 모드 활성화: 파일 변경 감지 중...');

        // 종료 핸들링 (Ctrl+C)
        process.on('SIGINT', async () => {
            if (wss) {
                wss.close();
            }

            server.close(() => {
                console.log('HTTP 서버 종료');
            });

            await watcher.close();
            console.log('개발 서버 및 Watch 모드 종료');
            process.exit(0);
        });
    } catch (error) {
        console.error('개발 서버 실행 중 오류:', error);
        process.exit(1);
    }
}

// 명령행 인자에 따라 모드 선택
const args = process.argv.slice(2);
if (args.includes('--watch') || args.includes('--serve') || args.includes('--dev')) {
    runDevServer();
} else {
    build();
}

// 내보내기 (다른 스크립트에서 사용 가능)
module.exports = {
    build,
    buildJS,
    buildCSS,
    runDevServer
};