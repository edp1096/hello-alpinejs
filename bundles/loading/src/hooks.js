// src/hooks.js
import ClickHook from './clickHook';
import NavigationHook from './navigationHook';
import LoadingHook from './loadingHook';


/**
 * 모든 내비게이션 메서드를 감지하는 통합 솔루션
 */
function setupNavigationDetection() {
    try {
        // 1. window.location 객체 프록시 설정
        setupLocationProxy();

        // 2. Form Submit 감지
        setupFormSubmitDetection();

        // 3. HTML5 History API 감지 (이미 hooks.js에 있음)

        // 4. 일반적인 내비게이션 패턴 함수 감지
        hookNavigationFunctions();
    } catch (e) {
        console.error('내비게이션 감지 설정 오류:', e);
    }
}

/**
 * 네비게이션으로 간주할 경로 패턴인지 확인 (화이트리스트 접근)
 */
function isNavigationUrl(url) {
    if (!url || typeof url !== 'string') return false;

    // 1. 정적 리소스 및 특수 URL 제외
    if (url.startsWith('javascript:') || url === 'image.href') {
        return false;
    }

    // 2. 미디어 파일 제외
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp|mp3|mp4|pdf)($|\?)/i)) {
        return false;
    }

    // 3. 유효한 URL인지 확인 (http://, https:// 또는 /로 시작하는 경로)
    const isValidUrl = url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('/');

    if (!isValidUrl) return false;

    // 4. 실제 페이지 경로인지 확인 (예: .php 파일 등)
    const isPagePath = url.includes('.php') ||
        url.includes('.html') ||
        url.includes('/market/') ||
        url.includes('/auth/') ||
        url.endsWith('/');

    // 5. 쿼리 파라미터 확인 (idx 등의 중요 파라미터가 있으면 페이지 이동으로 간주)
    const hasImportantParams = url.includes('?idx=') ||
        url.includes('&idx=') ||
        url.includes('?id=') ||
        url.includes('&id=');

    return isPagePath || hasImportantParams;
}

/**
 * window.location 객체 프록시 설정
 */
function setupLocationProxy() {
    try {
        // 원본 location 객체 저장
        const originalLocation = window.location;

        // 네비게이션으로 간주할 경로 변경 패턴 (화이트리스트)
        function isActualNavigation(oldUrl, newUrl, prop, value) {
            // href 속성 변경인 경우
            if (prop === 'href') {
                // 문자열이 아니면 네비게이션 아님
                if (typeof value !== 'string') {
                    return false;
                }

                // 화이트리스트 검사
                if (!isNavigationUrl(value)) {
                    return false;
                }

                // 해시 변경만 있는 경우 제외
                try {
                    const newUrlObj = new URL(value, window.location.origin);
                    const currentUrlObj = new URL(oldUrl);

                    if (newUrlObj.pathname === currentUrlObj.pathname &&
                        newUrlObj.search === currentUrlObj.search &&
                        newUrlObj.hash !== currentUrlObj.hash) {
                        return false;
                    }

                    // 위의 조건들을 모두 통과했다면 실제 네비게이션
                    return true;
                } catch (e) {
                    // URL 파싱 오류는 네비게이션으로 간주하지 않음
                    return false;
                }
            }

            // location.reload, assign, replace 메서드는 네비게이션
            if (prop === 'reload' || prop === 'assign' || prop === 'replace') {
                return true;
            }

            // 기본적으로 네비게이션 아님
            return false;
        }

        // location 객체를 프록시로 대체
        const locationProxy = new Proxy(originalLocation, {
            set: function (target, prop, value) {
                // 실제 네비게이션인지 확인
                if (isActualNavigation(target.href, null, prop, value)) {
                    if (LoadingHook && typeof LoadingHook.show === 'function') {
                        LoadingHook.show();
                    }
                }

                // 변경 적용
                return Reflect.set(target, prop, value);
            },
            get: function (target, prop) {
                // 메서드인 경우 래핑된 버전 반환
                const value = Reflect.get(target, prop);

                if (typeof value === 'function') {
                    // 함수 래핑
                    return function (...args) {
                        // 실제 네비게이션 함수인지 확인
                        if (isActualNavigation(target.href, null, prop, args[0])) {
                            if (LoadingHook && typeof LoadingHook.show === 'function') {
                                LoadingHook.show();
                            }
                        }

                        return value.apply(target, args);
                    };
                }

                return value;
            }
        });

        // 글로벌 location 재정의 시도
        try {
            Object.defineProperty(window, 'location', {
                get: function () {
                    return locationProxy;
                },
                configurable: true
            });
        } catch (e) {
            // console.warn('window.location 재정의 실패:', e);

            // 대안: 개별 메서드 래핑
            const methods = ['assign', 'replace', 'reload'];
            methods.forEach(method => {
                if (typeof originalLocation[method] === 'function') {
                    const original = originalLocation[method];
                    originalLocation[method] = function (...args) {
                        // console.log(`location.${method} 호출 감지`);

                        if (LoadingHook && typeof LoadingHook.show === 'function') {
                            LoadingHook.show();
                        }

                        return original.apply(originalLocation, args);
                    };
                }
            });
        }
    } catch (e) {
        console.error('Location 프록시 설정 오류:', e);
    }
}

/**
 * Form Submit 감지 설정
 */
function setupFormSubmitDetection() {
    try {
        // 전역 submit 이벤트 감지
        document.addEventListener('submit', function (event) {
            // 폼 또는 제출 버튼에 no-loading-screen 속성이 있는지 확인
            const form = event.target;
            const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');

            if (form.hasAttribute('no-loading-screen') ||
                (submitButton && submitButton.hasAttribute('no-loading-screen'))) {
                // console.log('no-loading-screen 속성이 있는 폼/버튼, 로딩 화면 표시하지 않음');
                return;
            }

            if (LoadingHook && typeof LoadingHook.show === 'function') {
                LoadingHook.show();
            }
        }, true);

        // HTMLFormElement.prototype.submit 메서드 후킹
        if (window.HTMLFormElement && HTMLFormElement.prototype.submit) {
            const originalSubmit = HTMLFormElement.prototype.submit;

            HTMLFormElement.prototype.submit = function () {
                // 폼에 no-loading-screen 속성이 있는지 확인
                if (this.hasAttribute('no-loading-screen')) {
                    // console.log('no-loading-screen 속성이 있는 폼, 로딩 화면 표시하지 않음');
                    return originalSubmit.apply(this, arguments);
                }

                if (LoadingHook && typeof LoadingHook.show === 'function') {
                    LoadingHook.show();
                }

                return originalSubmit.apply(this, arguments);
            };
        }
    } catch (e) {
        console.error('Form submit 감지 설정 오류:', e);
    }
}

/**
 * 일반적인 내비게이션 함수 감지
 */
function hookNavigationFunctions() {
    // 1. window 객체의 일반적인 내비게이션 함수 검색
    const navFunctionPatterns = [
        'goto', 'navigate', 'route', 'link', 'page', 'redirect',
        'load', 'open', 'visit', 'browse'
    ];

    // 명시적으로 제외할 객체/함수 패턴
    const excludedObjects = ['toast', 'Toast', 'notification'];

    // window 객체의 함수 후킹
    for (const prop in window) {
        try {
            // 제외 목록에 있는 객체는 건너뜀
            if (excludedObjects.some(pattern => prop.toLowerCase().includes(pattern.toLowerCase()))) {
                continue;
            }

            // 함수인지 확인
            if (typeof window[prop] === 'function') {
                const funcName = prop.toLowerCase();

                // 내비게이션 관련 함수 이름인지 확인
                const isNavFunction = navFunctionPatterns.some(pattern =>
                    funcName.includes(pattern)
                );

                if (isNavFunction) {
                    const originalFunc = window[prop];

                    window[prop] = function () {
                        if (LoadingHook && typeof LoadingHook.show === 'function') {
                            LoadingHook.show();
                        }

                        return originalFunc.apply(this, arguments);
                    };
                }
            }
        } catch (e) {
            continue;
        }
    }

    // 2. 프레임워크별 특수 내비게이션 처리
    setupFrameworkSpecificHooks();
}

/**
 * 프레임워크별 특수 내비게이션 처리
 */
function setupFrameworkSpecificHooks() {
    // Alpine.js 이벤트 처리
    if (window.Alpine) {
        window.Alpine.magic('showLoading', () => {
            return () => {
                if (LoadingHook && typeof LoadingHook.show === 'function') {
                    LoadingHook.show();
                }
                return true;
            };
        });
    }

    // React Router 감지 및 처리
    if (window.ReactRouter || (window.React && window.history.__reactRouter)) {
        // console.log('React Router 감지됨, 특수 후킹 설정');
        // React Router 후킹 코드 (생략)
    }

    // Vue Router 감지 및 처리
    if (window.Vue && window.VueRouter) {
        // console.log('Vue Router 감지됨, 특수 후킹 설정');
        // Vue Router 후킹 코드 (생략)
    }
}

/**
 * Hooks - 클릭, 내비게이션, 로딩 기능을 통합한 라이브러리
 */
const Hooks = (function () {
    let debugMode = false;
    let directHookingFailed = false;
    let initialized = false;

    // 로딩 표시가 필요한 네트워크 요청 감지
    function setupNetworkLoadingDetection() {
        // fetch API 감지
        if (window.fetch) {
            const originalFetch = window.fetch;
            window.fetch = function (...args) {
                LoadingHook.show();

                return originalFetch.apply(this, args)
                    .finally(() => {
                        LoadingHook.hide();
                    });
            };
        }

        // XMLHttpRequest 감지
        if (window.XMLHttpRequest) {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function (...args) {
                return originalOpen.apply(this, args);
            };

            XMLHttpRequest.prototype.send = function (...args) {
                // 로딩 화면 표시
                LoadingHook.show();

                this.addEventListener('loadend', () => {
                    LoadingHook.hide();
                });

                return originalSend.apply(this, args);
            };
        }
    }

    /**
     * Alpine.js 버튼 직접 감시
     */
    function setupDirectAlpineButtonWatch() {
        try {
            // 특수 함수 감지 (setSearchCondition 등)
            const specialFunctions = ['setSearchCondition', 'submitForm', 'search', 'applyFilter'];

            // Alpine.js 초기화 이벤트
            document.addEventListener('alpine:initialized', () => {
                setupAlpineButtons();
            });

            // DOM에서 Alpine 버튼 찾기
            function setupAlpineButtons() {
                document.querySelectorAll('[\\@click], [x-on\\:click]').forEach(el => {
                    if (el.dataset.hookWatched) return; // 이미 감시 중

                    // 특수 함수 호출 여부 확인
                    const clickAttr = el.getAttribute('@click') || el.getAttribute('x-on:click');
                    if (clickAttr) {
                        const hasSpecialFunction = specialFunctions.some(fn => clickAttr.includes(fn));

                        // Apply 버튼 또는 특수 함수가 있는 경우
                        if (hasSpecialFunction ||
                            el.id === 'apply-button' ||
                            (el.textContent && el.textContent.trim().includes('적용'))) {

                            // 클릭 이벤트 리스너 추가
                            el.addEventListener('click', function (e) {
                                LoadingHook.show();

                                // 상태 변경 확인을 위한 타이머
                                setTimeout(() => {
                                    // URL이 변경되지 않으면 로딩 화면 숨김
                                    if (LoadingHook.isActive && LoadingHook.isActive()) {
                                        LoadingHook.hide();
                                    }
                                }, 500);
                            }, true);

                            el.dataset.hookWatched = 'true';
                        }
                    }
                });
            }

            // 초기 설정
            if (document.readyState !== 'loading') {
                setupAlpineButtons();
            } else {
                document.addEventListener('DOMContentLoaded', setupAlpineButtons);
            }

            // MutationObserver로 동적 추가되는 요소 감시
            const observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === 1 && (node.querySelector('[\\@click], [x-on\\:click]') ||
                                node.matches('[\\@click], [x-on\\:click]'))) {
                                setupAlpineButtons();
                                break;
                            }
                        }
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

        } catch (err) {
            console.warn('Error setting up direct Alpine button watch:', err);
        }
    }

    /**
     * location.search 변경 감지를 위한 대체 방법
     */
    function setupDirectLocationSearchWatch() {
        try {
            // 현재 URL 저장
            let lastUrl = location.href;
            let lastSearch = location.search;
            let lastHash = location.hash;

            // polling 방식으로 URL 변경 감지
            const pollInterval = setInterval(() => {
                const currentUrl = location.href;
                const currentSearch = location.search;
                const currentHash = location.hash;

                // 해시만 변경된 경우 확인
                const hashOnlyChanged = currentUrl !== lastUrl &&
                    currentSearch === lastSearch &&
                    currentHash !== lastHash;

                if (currentUrl !== lastUrl) {
                    // 변경 이벤트 트리거
                    if (currentSearch !== lastSearch) {
                        // 해시만 변경된 경우가 아닐 때만 로딩 표시
                        if (!hashOnlyChanged) {
                            LoadingHook.show();
                        }
                    } else if (hashOnlyChanged) {
                        // console.log('Hash only changed, not showing loading');
                    }

                    // 저장
                    lastUrl = currentUrl;
                    lastSearch = currentSearch;
                    lastHash = currentHash;
                }
            }, 100);

            // window 종료 시 정리
            window.addEventListener('beforeunload', () => {
                clearInterval(pollInterval);
            });

        } catch (err) {
            console.warn('Error setting up direct location.search watch:', err);
        }
    }

    /**
     * 모든 훅 초기화
     * @param {Object} options 초기화 옵션
     * @param {Object} options.loading 로딩 관련 옵션
     * @param {boolean} options.detectNetwork 네트워크 요청 자동 감지 여부
     * @param {boolean} options.debug 디버그 모드 활성화 여부
     */
    function init(options = {}) {
        if (initialized) return true;

        // 기본 옵션
        const defaultOptions = {
            loading: { appendToBody: true },
            detectNetwork: false,
            debug: false
        };

        const mergedOptions = { ...defaultOptions, ...options };
        debugMode = mergedOptions.debug;

        // 통합 내비게이션 감지 설정
        setupNavigationDetection();

        // 각 훅 초기화 (try-catch로 오류 처리)
        try {
            ClickHook.init();

            ClickHook.setLoadingCallback(() => {
                if (LoadingHook && typeof LoadingHook.show === 'function') {
                    LoadingHook.show();
                }
            });
        } catch (err) {
            console.warn('Error initializing ClickHook:', err);
        }

        try {
            NavigationHook.init();
        } catch (err) {
            console.warn('Error initializing NavigationHook:', err);
            directHookingFailed = true;
        }

        try {
            LoadingHook.init(mergedOptions.loading);
        } catch (err) {
            console.warn('Error initializing LoadingHook:', err);
        }

        // 전역 클릭 캡처 설정
        try {
            setupGlobalClickCapture();
        } catch (err) {
            console.warn('Error setting up global click capture:', err);
        }

        // 네트워크 요청 감지 설정 (옵션)
        if (mergedOptions.detectNetwork) {
            try {
                setupNetworkLoadingDetection();
            } catch (err) {
                console.warn('Error setting up network detection:', err);
            }
        }

        // 모든 내비게이션 이벤트에 로딩 화면 연결
        try {
            setupNavigationLoadingHandlers();
        } catch (err) {
            console.warn('Error setting up navigation loading handlers:', err);
        }

        // 직접 hooking이 실패한 경우 대체 방법 사용
        if (directHookingFailed) {
            // Alpine.js 버튼 직접 감시
            setupDirectAlpineButtonWatch();

            // location.search 변경 감지
            setupDirectLocationSearchWatch();
        }

        // 가시성 변경 감지 (뒤로가기 등)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                setTimeout(() => {
                    if (LoadingHook.isActive && LoadingHook.isActive()) {
                        LoadingHook.hide();
                    }
                }, 200);
            }
        });

        // 문서 로드 완료시 자동 로딩 숨김
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (LoadingHook && LoadingHook.isActive && LoadingHook.isActive() &&
                    NavigationHook && typeof NavigationHook.isNavigating === 'function' &&
                    !NavigationHook.isNavigating()) {
                    LoadingHook.hide();
                }
            }, 100);
        });

        initialized = true;
        return true;
    }

    /**
     * 내비게이션 이벤트에 로딩 화면 연결
     */
    function setupNavigationLoadingHandlers() {
        try {
            NavigationHook.addHook((event, info) => {
                // 각 내비게이션 액션에 따른 처리
                switch (info.action) {
                    // 로딩 시작이 필요한 액션들 (해시 변경 제외)
                    case 'popstate':
                    case 'location-search':
                    case 'location-href':
                    case 'location-assign':
                    case 'location-replace':
                    case 'pushstate':
                    case 'swipe':
                    case 'gesture':
                    case 'url-changed':
                    case 'url-changed-after-click':
                    case 'alpine-navigation':
                        // 해시만 변경된 경우는 로딩 화면 표시하지 않음
                        if (info.hashOnly) {
                            return;
                        }

                        LoadingHook.show();
                        break;

                    // 해시 관련 액션들 (로딩 화면 표시하지 않음)
                    case 'hashchange':
                    case 'popstate-hash':
                        // console.log('Hash navigation detected, not showing loading screen');
                        break;

                    // 로딩 종료가 필요한 액션들
                    case 'popstate-completed':
                    case 'load-completed':
                        LoadingHook.hide();
                        break;

                    // 탭 가시성 변경 관련 액션들
                    case 'visibility-restored':
                        // 가시성이 복원되었을 때 로딩 화면이 표시되어 있으면 숨김
                        if (LoadingHook.isActive && LoadingHook.isActive()) {
                            LoadingHook.hide();
                        }
                        break;

                    case 'tab-hidden':
                        // 탭이 숨겨질 때는 특별한 처리 불필요
                        // console.log('Tab hidden, no specific loading action needed');
                        break;

                    default:
                        // 다른 액션은 무시
                        break;
                }
            });
        } catch (err) {
            console.warn('Failed to set up navigation hooks directly:', err);
            directHookingFailed = true;
        }
    }

    /**
     * 특정 버튼이나 이벤트에 대한 전역 클릭 캡처 설정
     */
    function setupGlobalClickCapture() {
        document.addEventListener('click', (event) => {
            // no-loading-screen 속성 확인
            if (event.target.hasAttribute('no-loading-screen') ||
                event.target.closest('[no-loading-screen]')) {
                // console.log('no-loading-screen 속성이 있는 요소, 로딩 화면 표시하지 않음');
                return;
            }

            // 타겟 요소 또는 부모에서 onclick 속성 찾기
            let element = event.target;
            let onclickElement = null;

            while (element && element !== document.body) {
                if (element.hasAttribute('onclick')) {
                    onclickElement = element;
                    break;
                }
                element = element.parentElement;
            }

            // onclick 속성이 있는 경우
            if (onclickElement) {
                const onclickAttr = onclickElement.getAttribute('onclick') || '';

                // 내비게이션 관련 패턴 감지
                if (onclickAttr.includes('location.href') ||
                    onclickAttr.includes('goto') ||
                    onclickAttr.match(/location\s*\[\s*['"]href['"]\s*\]/)) {

                    LoadingHook.show();
                }
            }

            // 특정 ID, 클래스, 속성을 가진 요소에 대한 처리
            const target = event.target;

            // 앵커 링크 클릭 감지
            if (target.tagName === 'A' || target.closest('a')) {
                const link = target.tagName === 'A' ? target : target.closest('a');
                const href = link.getAttribute('href');

                // 해시만 있는 링크인지 확인
                if (href && href.startsWith('#')) {
                    // console.log('Hash link clicked, not showing loading screen');
                    // 해시 링크는 로딩 화면 표시하지 않음
                    return;
                }
            }

            // data-search-trigger 속성이 있는 요소
            if (target.hasAttribute('data-search-trigger') || target.closest('[data-search-trigger]')) {
                LoadingHook.show();
            }

            // Alpine.js 컴포넌트 내부의 버튼 검출 (x-data 속성 검사)
            const alpineComponent = target.closest('[x-data]');
            if (alpineComponent) {
                const buttonElement = target.closest('button, [role="button"]');
                if (buttonElement) {
                    // 텍스트 안전하게 추출
                    const buttonText = buttonElement.textContent ?
                        buttonElement.textContent.trim().toLowerCase() : '';

                    // 검색, 적용, 조회 등의 텍스트를 가진 버튼
                    if (buttonText.includes('검색') ||
                        buttonText.includes('적용') ||
                        buttonText.includes('조회') ||
                        buttonText.includes('확인')) {

                        LoadingHook.show();
                    }
                }
            }
        }, true); // true = 캡처 단계 (이벤트 버블링보다 먼저 실행)
    }

    /**
     * 클릭 이벤트에 로딩 화면 자동 연결
     * @param {string} selector 선택자 (지정 시 해당 요소만 처리)
     */
    function autoLoading(selector) {
        // 클릭 이벤트에 로딩 화면 연결
        try {
            ClickHook.addHook((element, event, info) => {
                // no-loading-screen 속성 확인
                if (element.hasAttribute('no-loading-screen') ||
                    element.closest('[no-loading-screen]')) {
                    return;
                }

                // 선택자가 지정되었고 요소가 일치하지 않으면 무시
                if (selector && !element.matches(selector)) {
                    return;
                }

                // Alpine.js 클릭 이벤트 처리 (우선순위 상향)
                if (info.type === 'alpine' || info.type === 'alpine-navigation') {
                    // 해시 링크 확인
                    if (element.tagName === 'A' && element.getAttribute('href') && element.getAttribute('href').startsWith('#')) {
                        // console.log('Hash link in Alpine.js, not showing loading');
                        return;
                    }

                    // 즉시 로딩 화면 표시 (조건 검사 없이)
                    LoadingHook.show();

                    // URL 변경 확인을 위한 타이머 설정
                    setTimeout(() => {
                        // URL이 변경되지 않으면 로딩 화면 숨김
                        if (LoadingHook && LoadingHook.isActive && LoadingHook.isActive()) {
                            LoadingHook.hide();
                        }
                    }, 500);

                    return;
                }

                // onclick 관련 처리
                if (info.type === 'onclick-navigation' || info.type === 'onclick-function') {
                    LoadingHook.show();
                    return;
                }

                // a 태그 처리
                if (element.tagName === 'A' && element.href && !element.target) {
                    // 해시 링크인 경우 로딩 화면 표시하지 않음
                    if (element.getAttribute('href').startsWith('#')) {
                        // console.log('Hash link clicked, not showing loading');
                        return;
                    }

                    // 같은 도메인이면 로딩 표시
                    if (element.getAttribute('href').indexOf('://') === -1 ||
                        element.href.startsWith(window.location.origin)) {
                        LoadingHook.show();
                    }
                }
            });
        } catch (err) {
            console.warn('Failed to set up click hooks:', err);
            directHookingFailed = true;
        }
    }

    /**
     * 로딩 화면 수동 표시 메서드
     */
    function showLoading() {
        if (LoadingHook) {
            LoadingHook.show();
            return true;
        }
        return false;
    }

    /**
     * 로딩 화면 수동 숨김 메서드
     */
    function hideLoading() {
        if (LoadingHook) {
            LoadingHook.hide();
            return true;
        }
        return false;
    }

    // 공개 API
    const publicAPI = {
        init,
        autoLoading,
        showLoading,
        hideLoading,

        // 각 개별 훅 접근
        get click() { return ClickHook; },
        get navigation() { return NavigationHook; },
        get loading() { return LoadingHook; },

        // 디버그 모드 설정
        setDebug(value) {
            debugMode = !!value;
            if (LoadingHook && LoadingHook.setDebug) {
                LoadingHook.setDebug(value);
            }
            return this;
        }
    };

    return publicAPI;
})();

// 윈도우에 노출
if (typeof window !== 'undefined') {
    window.Hooks = Hooks;

    // 자동 초기화 (data-hooks-auto 속성이 있는 경우)
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('[data-hooks-auto]')) {
            Hooks.init({ debug: true });
            Hooks.autoLoading('a:not([target="_blank"])');
        }
    });
}

export default Hooks;