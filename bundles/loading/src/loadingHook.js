// src/loadingHook.js
import loadingTemplate from './loading.html';
import './loading.scss';

/**
 * 로딩 화면 관리를 위한 훅
 */
const LoadingHook = (function () {
    let loadingElement = null;
    let isInitialized = false;
    let isVisible = false;
    let showTimer = null;
    let hideTimer = null;
    let debugMode = false;

    /**
     * 디버그 로깅 함수
     */
    function log(...args) {
        if (debugMode) {
            console.log('[LoadingHook]', ...args);
        }
    }

    /**
     * 로딩 훅 초기화
     * @param {Object} options 초기화 옵션
     * @param {boolean} options.appendToBody DOM에 자동 추가 여부
     * @param {boolean} options.debug 디버그 모드 활성화 여부
     * @returns {HTMLElement} 로딩 요소
     */
    function init(options = { appendToBody: true, debug: false }) {
        if (isInitialized) return loadingElement;

        debugMode = options.debug;
        log('Initializing loading hook');

        // 이미 DOM에 있는지 확인
        loadingElement = document.getElementById('hooks-fullscreen-loading');

        // 없으면 생성
        if (!loadingElement) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = loadingTemplate;
            loadingElement = tempDiv.firstElementChild;

            if (options.appendToBody) {
                document.body.appendChild(loadingElement);
                log('Loading element appended to body');
            }
        }

        // 트랜지션 속성 확인
        const computedStyle = window.getComputedStyle(loadingElement);
        log('Loading element transition:', computedStyle.transition);

        isInitialized = true;
        return loadingElement;
    }

    /**
     * 로딩 화면 표시
     * @param {number} delay 딜레이 시간 (밀리초)
     */
    function show(delay = 0) {
        if (!isInitialized) init();
        if (isVisible) return;

        log('Show loading requested', delay > 0 ? `with ${delay}ms delay` : 'immediately');

        // 이전 타이머 취소
        clearTimeout(hideTimer);
        clearTimeout(showTimer);

        const displayLoading = () => {
            if (loadingElement) {
                isVisible = true;

                // 강제로 레이아웃 재계산 유도 (리플로우 트리거)
                void loadingElement.offsetWidth;

                // 다음 프레임에서 active 클래스 추가
                requestAnimationFrame(() => {
                    loadingElement.classList.add('active');
                    log('Loading screen visible');
                });
            }
        };

        if (delay > 0) {
            showTimer = setTimeout(displayLoading, delay);
        } else {
            displayLoading();
        }
    }

    /**
     * 로딩 화면 숨김
     * @param {number} delay 딜레이 시간 (밀리초)
     */
    function hide(delay = 0) {
        if (!isInitialized || !isVisible) return;

        log('Hide loading requested', delay > 0 ? `with ${delay}ms delay` : 'immediately');

        // 페이지 전환 중인지 확인
        const isNavigating = document.visibilityState === 'hidden' ||
            document.readyState === 'unloading';

        // 페이지 전환 중이면 숨기지 않음
        if (isNavigating) {
            log('Navigation in progress, keeping loading screen visible');
            return;
        }

        // 이전 타이머 취소
        clearTimeout(hideTimer);
        clearTimeout(showTimer);

        const hideLoading = () => {
            if (loadingElement) {
                // active 클래스 제거
                loadingElement.classList.remove('active');
                log('Loading screen hidden');

                // 트랜지션 완료 후 처리
                const onTransitionEnd = () => {
                    isVisible = false;
                    loadingElement.removeEventListener('transitionend', onTransitionEnd);
                    log('Loading transition completed');
                };

                loadingElement.addEventListener('transitionend', onTransitionEnd);

                // 트랜지션이 발생하지 않는 경우를 대비한 백업 타이머
                setTimeout(onTransitionEnd, 500);
            }
        };

        if (delay > 0) {
            hideTimer = setTimeout(hideLoading, delay);
        } else {
            hideLoading();
        }
    }

    /**
     * 비동기 작업 수행 중에 로딩 화면 표시
     * @param {Function} callback 실행할 비동기 함수
     * @param {Object} options 옵션
     * @param {number} options.showDelay 표시 지연 시간
     * @param {number} options.hideDelay 숨김 지연 시간
     * @returns {Promise} 콜백 실행 결과
     */
    async function during(callback, options = {}) {
        const { showDelay = 0, hideDelay = 0 } = options;

        try {
            show(showDelay);
            log('Async operation started');
            return await Promise.resolve(callback());
        } finally {
            log('Async operation completed');
            hide(hideDelay);
        }
    }

    /**
     * 로딩 템플릿 문자열 반환
     * @returns {string} HTML 템플릿
     */
    function getTemplate() {
        return loadingTemplate;
    }

    /**
     * 로딩 상태 확인
     * @returns {boolean} 현재 로딩 화면 표시 여부
     */
    function isActive() {
        return isVisible;
    }

    /**
     * 디버그 모드 설정
     * @param {boolean} value 디버그 모드 활성화 여부
     */
    function setDebug(value) {
        debugMode = !!value;
        return this;
    }

    return {
        init,
        show,
        hide,
        during,
        getTemplate,
        isActive,
        setDebug
    };
})();

export default LoadingHook;