const express = require('express');
const path = require('path');
const fs = require('fs');

// Express 앱 생성
const app = express();

// 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// temp 디렉토리 생성 (존재하지 않는 경우)
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// 라우트 설정
const componentsRouter = require('./routes/components');
const bundleRouter = require('./routes/bundle');

app.use('/components', componentsRouter);
app.use('/bundle', bundleRouter);

// 루트 경로
app.get('/', (req, res) => {
    res.render('index');
});

// 404 오류 핸들러 
app.use((req, res, next) => {
    res.status(404);

    // Accept 헤더에 따라 HTML 또는 JSON 응답 제공
    if (req.accepts('html')) {
        res.render('error', {
            title: '페이지를 찾을 수 없습니다',
            message: '요청하신 페이지를 찾을 수 없습니다.',
            error: { status: 404 }
        });
    } else if (req.accepts('json')) {
        res.json({
            success: false,
            error: '페이지를 찾을 수 없습니다',
            status: 404
        });
    } else {
        res.type('txt').send('404 Not Found');
    }
});

// 서버 오류 핸들러
app.use((err, req, res, next) => {
    console.error('서버 오류:', err);

    const statusCode = err.status || 500;
    res.status(statusCode);

    // Accept 헤더에 따라 HTML 또는 JSON 응답 제공
    if (req.accepts('html')) {
        try {
            res.render('error', {
                title: '오류가 발생했습니다',
                message: '요청을 처리하는 중 오류가 발생했습니다.',
                error: process.env.NODE_ENV === 'development' ? err : {}
            });
        } catch (renderError) {
            // 렌더링 오류 발생 시 기본 HTML 제공
            res.send(`
        <html>
          <head><title>오류 발생</title></head>
          <body>
            <h1>500 서버 오류</h1>
            <p>요청을 처리하는 중 오류가 발생했습니다.</p>
            <a href="/">홈으로 돌아가기</a>
          </body>
        </html>
      `);
        }
    } else if (req.accepts('json')) {
        res.json({
            success: false,
            error: '서버 오류가 발생했습니다',
            status: statusCode
        });
    } else {
        res.type('txt').send('500 Internal Server Error');
    }
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`컴포넌트 번들러가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`브라우저에서 http://localhost:${PORT} 접속하여 사용하세요.`);
});

module.exports = app;