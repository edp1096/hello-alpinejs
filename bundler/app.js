const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

// 라우터 임포트
const componentsRouter = require('./routes/components');
const bundleRouter = require('./routes/bundle');

// Express 앱 생성
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 임시 디렉토리 생성
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// 라우트 등록
app.use('/components', componentsRouter);
app.use('/bundle', bundleRouter);

// 메인 페이지
app.get('/', (req, res) => {
    res.render('index');
});

// 클라이언트 오류 처리
app.use((req, res, next) => {
    res.status(404).render('error', {
        title: '페이지를 찾을 수 없습니다',
        message: '요청하신 페이지를 찾을 수 없습니다.',
        error: { status: 404 }
    });
});

// 서버 오류 처리
app.use((err, req, res, next) => {
    console.error('서버 오류:', err);

    const statusCode = err.status || 500;
    res.status(statusCode).render('error', {
        title: '오류가 발생했습니다',
        message: '요청을 처리하는 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 서버 시작
app.listen(port, () => {
    console.log(`컴포넌트 번들러가 http://localhost:${port} 에서 실행 중입니다.`);
    console.log(`브라우저에서 http://localhost:${port} 접속하여 사용하세요.`);
});