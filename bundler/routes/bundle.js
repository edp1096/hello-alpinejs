const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bundler = require('../services/bundler');

// 번들 생성 API
router.post('/create', async (req, res) => {
    try {
        const { components, options } = req.body;

        if (!components || !Array.isArray(components) || components.length === 0) {
            return res.status(400).json({
                success: false,
                error: '유효한 컴포넌트 목록을 제공해야 합니다.'
            });
        }

        // 번들링 옵션
        const bundleOptions = {
            minify: options?.minify !== false,
            sourcemap: options?.sourcemap === true
        };

        console.log(`번들 생성 요청: ${components.join(', ')}`);

        // 번들 생성
        const result = await bundler.createBundle(components, bundleOptions);

        // 성공 응답
        return res.status(200).json({
            success: true,
            bundleId: result.bundleId,
            message: '번들이 성공적으로 생성되었습니다.'
        });
    } catch (error) {
        console.error('번들 생성 오류:', error);

        // 오류 응답
        return res.status(500).json({
            success: false,
            error: '번들 생성 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류')
        });
    }
});

// 번들 다운로드 API
router.get('/download/:bundleId', (req, res) => {
    try {
        const bundleId = req.params.bundleId;

        // 번들 파일 경로 가져오기
        const zipFilePath = bundler.getBundleFile(bundleId);

        if (!zipFilePath) {
            return res.status(404).json({
                success: false,
                error: '요청한 번들을 찾을 수 없습니다.'
            });
        }

        console.log(`번들 다운로드 요청: ${bundleId}`);

        // 파일명 생성
        const filename = `alpine-components-${bundleId}.zip`;

        // 다운로드 응답 설정
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // 파일 스트림 전송
        const fileStream = fs.createReadStream(zipFilePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('번들 다운로드 오류:', error);

        // 오류 응답
        return res.status(500).json({
            success: false,
            error: '번들 다운로드 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류')
        });
    }
});

// 번들 상태 확인 API (추가)
router.get('/status/:bundleId', (req, res) => {
    try {
        const bundleId = req.params.bundleId;

        // 번들 파일 존재 확인
        const zipFilePath = bundler.getBundleFile(bundleId);

        if (!zipFilePath) {
            return res.status(404).json({
                success: false,
                status: 'not_found',
                message: '요청한 번들을 찾을 수 없습니다.'
            });
        }

        // 파일 크기와 생성 시간 정보 추가
        const stats = fs.statSync(zipFilePath);

        return res.status(200).json({
            success: true,
            status: 'ready',
            message: '번들이 준비되었습니다.',
            fileSize: stats.size,
            createdAt: stats.birthtime
        });
    } catch (error) {
        console.error('번들 상태 확인 오류:', error);

        return res.status(500).json({
            success: false,
            status: 'error',
            message: '번들 상태 확인 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;