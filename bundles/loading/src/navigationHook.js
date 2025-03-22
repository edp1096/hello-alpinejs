// src/navigationHook.js
import LoadingHook from './loadingHook';

/**
 * 네비게이션(뒤로가기/앞으로가기) 이벤트 감지 및 처리를 위한 훅
 */
const NavigationHook = (function () {
    const navHooks = [];
    let initialized = false;
    let lastHistoryState = history.state;
    let lastPageY = 0;
    let lastPageX = 0;
    let isLoadingShown = false;
    let visibilityLastChanged = 0;
    let lastVisibilityState = 'visible';
    let isNavigating = false;

    // URL 및 해시 추적을 위한 변수
    let lastUrl = '';
    let lastPathname = '';
    let lastSearch = '';
    let lastHash = '';

    /**
     * 디버그 로깅 함수
     */
    function log(...args) {
        console.log('[NavigationHook]', ...args);
    }

    /**
     * 네비게이션 훅 초기화
     */
    function init() {
        if (initialized) return;

        // 페이지 로드 시 로딩 화면 자동 숨김 설정
        document.addEventListener('DOMContentLoaded', () => {
            if (LoadingHook && LoadingHook.isActive && LoadingHook.isActive()) {
                setTimeout(() => {
                    LoadingHook.hide();
                }, 100);
            }
        });

        // 현재 URL 정보 저장
        saveUrlInfo();

        // history API 래핑
        wrapHistoryMethods();

        // popstate 이벤트 리스너 (뒤로가기/앞으로가기 감지)
        window.addEventListener('popstate', handlePopState);

        // 페이지 가시성 변경 감지 (모바일에서 앱 전환 후 돌아올 때)
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // hashchange 이벤트 리스너 (앵커 링크 클릭 감지)
        window.addEventListener('hashchange', handleHashChange);

        // beforeunload 이벤트 (페이지 이탈 감지)
        window.addEventListener('beforeunload', handleBeforeUnload);

        // 터치 제스처 감지 (모바일)
        setupTouchGestureDetection();

        // 페이지 로드시 현재 상태 저장
        saveCurrentState();

        // location 메서드 후킹
        hookLocationMethods();

        // 페이지 로드 완료 감지
        window.addEventListener('load', () => {
            if (isLoadingShown) {
                // 페이지 로드 완료 시 로딩 화면 숨김
                triggerNavHooks(new Event('synthetic'), {
                    type: 'navigation',
                    action: 'load-completed'
                });
                isLoadingShown = false;
            }
        });

        // 현재 visibilityState 저장
        lastVisibilityState = document.visibilityState;

        initialized = true;
        console.log('NavigationHook initialized');
    }

    /**
     * 현재 URL 정보 분리해서 저장
     */
    function saveUrlInfo() {
        lastUrl = location.href;
        lastPathname = location.pathname;
        lastSearch = location.search;
        lastHash = location.hash;

        // 디버깅용
        console.log('URL info saved:', {
            url: lastUrl,
            pathname: lastPathname,
            search: lastSearch,
            hash: lastHash
        });
    }

    /**
     * URL 변경 감지 및 종류 구분
     * @returns {Object} 변경 정보
     */
    function detectUrlChanges() {
        const currentUrl = location.href;
        const currentPathname = location.pathname;
        const currentSearch = location.search;
        const currentHash = location.hash;

        const changes = {
            url: currentUrl !== lastUrl,
            pathname: currentPathname !== lastPathname,
            search: currentSearch !== lastSearch,
            hash: currentHash !== lastHash,
            hashOnly: currentPathname === lastPathname &&
                currentSearch === lastSearch &&
                currentHash !== lastHash
        };

        // 디버깅용
        if (changes.url) {
            console.log('URL changes detected:', {
                from: lastUrl,
                to: currentUrl,
                changes
            });
        }

        return changes;
    }

    /**
     * History API 메서드 래핑
     */
    function wrapHistoryMethods() {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (state, title, url) {
            // 이전 URL 정보 저장
            const prevUrl = location.href;

            // 상태 변경 전 이벤트 발생
            triggerNavHooks(new Event('synthetic'), {
                type: 'navigation',
                action: 'pushstate',
                from: prevUrl,
                to: url || prevUrl
            });

            originalPushState.call(this, state, title, url);
            saveCurrentState();
            saveUrlInfo();
        };

        history.replaceState = function (state, title, url) {
            // 이전 URL 정보 저장
            const prevUrl = location.href;

            // 상태 변경 전 이벤트 발생
            triggerNavHooks(new Event('synthetic'), {
                type: 'navigation',
                action: 'replacestate',
                from: prevUrl,
                to: url || prevUrl
            });

            originalReplaceState.call(this, state, title, url);
            saveCurrentState();
            saveUrlInfo();
        };
    }

    /**
     * 현재 페이지 상태 저장
     */
    function saveCurrentState() {
        lastHistoryState = history.state;
        try {
            // 현재 URL만 임시 저장 (세션 스토리지는 최소화하여 사용)
            sessionStorage.setItem('_hooks_lasturl', location.href);
        } catch (e) {
            console.warn('Failed to save state to sessionStorage:', e);
        }
    }

    /**
     * hashchange 이벤트 처리
     * @param {HashChangeEvent} event 이벤트 객체
     */
    function handleHashChange(event) {
        console.log('HashChange event detected', {
            oldURL: event.oldURL,
            newURL: event.newURL
        });

        // 해시만 변경된 경우 (페이지 콘텐츠는 변경되지 않음)
        const oldUrlObj = new URL(event.oldURL);
        const newUrlObj = new URL(event.newURL);

        if (oldUrlObj.pathname === newUrlObj.pathname &&
            oldUrlObj.search === newUrlObj.search &&
            oldUrlObj.hash !== newUrlObj.hash) {

            // 해시만 변경된 경우 간단한 이벤트만 발생
            triggerNavHooks(event, {
                type: 'navigation',
                action: 'hashchange',
                from: event.oldURL,
                to: event.newURL,
                hashOnly: true
            });
        } else {
            // 해시 외에 다른 부분도 변경된 경우 popstate와 유사하게 처리
            triggerNavHooks(event, {
                type: 'navigation',
                action: 'hashchange',
                from: event.oldURL,
                to: event.newURL,
                hashOnly: false
            });
        }

        // URL 정보 업데이트
        saveUrlInfo();
    }

    /**
     * popstate 이벤트 처리 (뒤로가기/앞으로가기)
     * @param {PopStateEvent} event 이벤트 객체
     */
    function handlePopState(event) {
        console.log('PopState event detected');

        // URL 변경 감지 및 종류 구분
        const changes = detectUrlChanges();

        // 해시만 변경된 경우는 가벼운 처리
        if (changes.hashOnly) {
            console.log('Hash-only change detected, lightweight handling');
            triggerNavHooks(event, {
                type: 'navigation',
                action: 'popstate-hash',
                state: event.state,
                hashOnly: true
            });

            // URL 정보 업데이트
            saveUrlInfo();
            return;
        }

        // 여기서부터는 실제 네비게이션 이벤트
        isLoadingShown = true;
        isNavigating = true;

        // 이벤트 시작 시 로딩 표시
        triggerNavHooks(event, {
            type: 'navigation',
            action: 'popstate',
            state: event.state
        });

        // 페이지가 완전히 로드된 후 로딩 숨김
        // 두 가지 방법으로 완료 감지: setTimeout과 addEventListener

        // 방법 1: setTimeout으로 지연 처리
        setTimeout(() => {
            if (isLoadingShown) {
                console.log('PopState completed (timeout)');
                triggerNavHooks(event, {
                    type: 'navigation',
                    action: 'popstate-completed',
                    state: event.state
                });
                isLoadingShown = false;
                isNavigating = false;
            }
        }, 300);

        // 방법 2: DOMContentLoaded 또는 load 이벤트 활용
        const completeHandler = () => {
            if (isLoadingShown) {
                console.log('PopState completed (DOMContentLoaded)');
                triggerNavHooks(event, {
                    type: 'navigation',
                    action: 'popstate-completed',
                    state: event.state
                });
                isLoadingShown = false;
                isNavigating = false;

                // 이벤트 리스너 제거
                document.removeEventListener('DOMContentLoaded', completeHandler);
                window.removeEventListener('load', completeHandler);
            }
        };

        // 두 이벤트 모두에 리스너 추가
        document.addEventListener('DOMContentLoaded', completeHandler);
        window.addEventListener('load', completeHandler);

        // URL 정보 업데이트
        saveUrlInfo();
    }

    /**
     * 페이지 이탈 시 처리
     */
    function handleBeforeUnload(event) {
        // 페이지 이탈 시 네비게이션 중임을 표시
        isNavigating = true;

        // 로딩 화면 활성화 확인만 하고 추가 처리는 하지 않음
        try {
            if (typeof LoadingHook !== 'undefined' &&
                LoadingHook &&
                typeof LoadingHook.isActive === 'function') {

                // 로딩 중이면 페이지 전환 중임을 표시
                if (LoadingHook.isActive()) {
                    console.log('Navigation in progress with active loading screen');
                }
            }
        } catch (e) {
            console.warn('Error in beforeunload handler:', e);
        }
    }

    /**
     * 페이지 가시성 변경 처리
     */
    function handleVisibilityChange() {
        const now = Date.now();
        const timeSinceLastChange = now - visibilityLastChanged;
        visibilityLastChanged = now;

        // 너무 빠른 연속 이벤트는 무시 (100ms 이내)
        if (timeSinceLastChange < 100) {
            console.log('Ignoring too frequent visibility change');
            return;
        }

        // 이전 상태와 동일하면 무시
        if (document.visibilityState === lastVisibilityState) {
            console.log('Ignoring duplicate visibility state:', document.visibilityState);
            return;
        }

        console.log('Visibility changed:', lastVisibilityState, '->', document.visibilityState);
        lastVisibilityState = document.visibilityState;

        if (document.visibilityState === 'visible') {
            try {
                // URL 변경 감지 및 종류 구분
                const changes = detectUrlChanges();

                // 해시만 변경된 경우는 네비게이션으로 처리하지 않음
                if (changes.url && !changes.hashOnly) {
                    // 실제 URL이 변경된 경우 (해시 제외)
                    console.log('Significant URL change detected during visibility change');
                    triggerNavHooks(new Event('synthetic'), {
                        type: 'navigation',
                        action: 'gesture',
                        from: lastUrl,
                        to: location.href
                    });
                } else {
                    // URL 변경이 없거나 해시만 변경된 경우
                    console.log('No significant URL change after visibility change');
                    triggerNavHooks(new Event('synthetic'), {
                        type: 'navigation',
                        action: 'visibility-restored',
                        hashChanged: changes.hash
                    });
                }

                saveCurrentState();
                saveUrlInfo();
            } catch (e) {
                console.warn('Error in visibility change handler:', e);
            }
        } else if (document.visibilityState === 'hidden') {
            // 탭이 숨겨질 때 이벤트
            triggerNavHooks(new Event('synthetic'), {
                type: 'navigation',
                action: 'tab-hidden'
            });
        }
    }


    /**
     * 터치 제스처 감지 설정
     */
    function setupTouchGestureDetection() {
        // 터치 시작 시 위치 저장
        document.addEventListener('touchstart', function (e) {
            if (e.touches.length === 1) {
                lastPageX = e.touches[0].pageX;
                lastPageY = e.touches[0].pageY;
            }
        }, { passive: true });

        // 터치 종료 시 제스처 확인
        document.addEventListener('touchend', function (e) {
            if (e.changedTouches.length === 1) {
                const touchX = e.changedTouches[0].pageX;
                const touchY = e.changedTouches[0].pageY;

                // 오른쪽에서 왼쪽으로 스와이프 (Android 뒤로가기 제스처)
                if (lastPageX - touchX > 100 && Math.abs(lastPageY - touchY) < 50) {
                    // 제스처 뒤로가기 시도 가능성 높음 - 다음 상태 변화 감시
                    const currentState = history.state;

                    // 짧은 지연 후 상태 확인
                    setTimeout(() => {
                        if (history.state !== currentState) {
                            console.log('Swipe navigation detected');
                            triggerNavHooks(new Event('synthetic'), {
                                type: 'navigation',
                                action: 'swipe',
                                direction: 'right-to-left'
                            });
                        }
                    }, 50);
                }
            }
        }, { passive: true });
    }

    /**
     * 등록된 모든 네비게이션 훅 실행
     * @param {Event} event 이벤트 객체
     * @param {Object} info 추가 정보
     */
    function triggerNavHooks(event, info) {
        console.log('Triggering navigation hooks:', info.action);
        for (const hook of navHooks) {
            try {
                hook(event, info);
            } catch (e) {
                console.error('Error in navigation hook:', e);
            }
        }
    }

    /**
     * 네비게이션 훅 추가
     * @param {Function} callback 콜백 함수
     */
    function addHook(callback) {
        if (typeof callback !== 'function') {
            console.error('Hook must be a function');
            return false;
        }

        navHooks.push(callback);
        if (!initialized) init();
        return true;
    }

    /**
     * 네비게이션 훅 제거
     * @param {Function} callback 제거할 콜백 함수
     */
    function removeHook(callback) {
        const index = navHooks.indexOf(callback);
        if (index !== -1) {
            navHooks.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * location 메서드 후킹 (search, href, replace)
     */
    function hookLocationMethods() {
        try {
            // 안전하게 location 메서드 후킹을 위한 프록시 접근법
            // location.search 감지
            const originalSearch = Object.getOwnPropertyDescriptor(window.Location.prototype, 'search');
            if (originalSearch && originalSearch.set) {
                try {
                    Object.defineProperty(window.Location.prototype, 'search', {
                        get: originalSearch.get,
                        set: function (value) {
                            console.log('Location.search intercepted:', value);

                            // 네비게이션 훅 트리거
                            triggerNavHooks(new Event('synthetic'), {
                                type: 'navigation',
                                action: 'location-search',
                                value: value
                            });

                            // URL 정보 업데이트 (set 실행 전)
                            const result = originalSearch.set.call(this, value);

                            // URL 정보 업데이트 (set 실행 후)
                            saveUrlInfo();

                            return result;
                        },
                        configurable: true
                    });
                    console.log('Location.search hooked successfully');
                } catch (err) {
                    console.warn('Failed to hook location.search, using alternative method', err);
                    // 대체 방법: 이벤트 감지로 대체
                    setupLocationChangeDetection();
                }
            }

            // location.href 후킹
            const originalHref = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');
            if (originalHref && originalHref.set) {
                try {
                    Object.defineProperty(window.Location.prototype, 'href', {
                        get: originalHref.get,
                        set: function (value) {
                            console.log('Location.href intercepted:', value);

                            // 네비게이션 훅 트리거
                            triggerNavHooks(new Event('synthetic'), {
                                type: 'navigation',
                                action: 'location-href',
                                value: value
                            });

                            // URL 정보 업데이트 (set 전)
                            const result = originalHref.set.call(this, value);

                            // URL 정보 업데이트 (set 후)
                            saveUrlInfo();

                            return result;
                        },
                        configurable: true
                    });
                    console.log('Location.href hooked successfully');
                } catch (err) {
                    console.warn('Failed to hook location.href, using alternative method', err);
                    // 대체 방법: 이벤트 감지로 대체
                    setupLocationChangeDetection();
                }
            }

            // location.replace 메서드 후킹
            try {
                const originalReplace = window.Location.prototype.replace;
                if (originalReplace) {
                    window.Location.prototype.replace = function (url) {
                        console.log('location.replace intercepted:', url);

                        // 네비게이션 훅 트리거
                        triggerNavHooks(new Event('synthetic'), {
                            type: 'navigation',
                            action: 'location-replace',
                            value: url
                        });

                        // 원래 동작 실행
                        const result = originalReplace.call(this, url);

                        // URL 정보 업데이트
                        saveUrlInfo();

                        return result;
                    };
                    console.log('location.replace hooked successfully');
                }
            } catch (err) {
                console.warn('Failed to hook location.replace', err);
            }

            // location.assign 메서드 후킹
            try {
                const originalAssign = window.Location.prototype.assign;
                if (originalAssign) {
                    window.Location.prototype.assign = function (url) {
                        console.log('location.assign intercepted:', url);

                        // 네비게이션 훅 트리거
                        triggerNavHooks(new Event('synthetic'), {
                            type: 'navigation',
                            action: 'location-assign',
                            value: url
                        });

                        // 원래 동작 실행
                        const result = originalAssign.call(this, url);

                        // URL 정보 업데이트
                        saveUrlInfo();

                        return result;
                    };
                    console.log('location.assign hooked successfully');
                }
            } catch (err) {
                console.warn('Failed to hook location.assign', err);
            }
        } catch (e) {
            console.error('Error setting up location method hooks:', e);
            // 오류 발생 시 대체 방법 사용
            setupLocationChangeDetection();
        }
    }

    /**
 * location 변경 감지를 위한 대체 방법
 * (속성 재정의가 실패한 경우 사용)
 */
    function setupLocationChangeDetection() {
        console.log('Setting up alternative location change detection');

        // MutationObserver를 통한 body 변경 감지
        // 페이지 변경의 간접적인 감지 방법
        const bodyObserver = new MutationObserver((mutations) => {
            // URL 변경 확인
            const changes = detectUrlChanges();

            if (changes.url && !changes.hashOnly) {
                console.log('URL change detected via MutationObserver');
                triggerNavHooks(new Event('synthetic'), {
                    type: 'navigation',
                    action: 'url-changed',
                    from: lastUrl,
                    to: location.href,
                    hashOnly: false
                });

                saveCurrentState();
                saveUrlInfo();
            } else if (changes.hash) {
                console.log('Hash change detected via MutationObserver');
                triggerNavHooks(new Event('synthetic'), {
                    type: 'navigation',
                    action: 'url-changed',
                    from: lastUrl,
                    to: location.href,
                    hashOnly: true
                });

                saveUrlInfo();
            }
        });

        // document.body 변경 감지 설정
        if (document.body) {
            bodyObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        // click 이벤트 감지 (location 변경 가능성이 있는 요소)
        document.addEventListener('click', (event) => {
            const target = event.target;

            // form 요소나 submit 버튼 감지
            if (target.tagName === 'BUTTON' ||
                target.tagName === 'INPUT' && target.type === 'submit' ||
                target.closest('form') ||
                target.classList.contains('button')) {

                // URL 변경 가능성이 있는 클릭 감지
                console.log('Potential navigation click detected');

                // 현재 URL 정보 저장
                const currentUrl = location.href;
                const currentHash = location.hash;

                // 다음 프레임에서 URL 변경 확인
                setTimeout(() => {
                    // URL 변경 확인
                    const newChanges = detectUrlChanges();

                    if (newChanges.url && !newChanges.hashOnly) {
                        console.log('URL changed after click');
                        triggerNavHooks(new Event('synthetic'), {
                            type: 'navigation',
                            action: 'url-changed-after-click',
                            from: lastUrl,
                            to: location.href,
                            hashOnly: false
                        });

                        saveCurrentState();
                        saveUrlInfo();
                    } else if (newChanges.hash) {
                        console.log('Hash changed after click');
                        triggerNavHooks(new Event('synthetic'), {
                            type: 'navigation',
                            action: 'url-changed-after-click',
                            from: lastUrl,
                            to: location.href,
                            hashOnly: true
                        });

                        saveUrlInfo();
                    }
                }, 0);
            }
        }, true);

        // Alpine.js 이벤트 감지 (특별 처리)
        if (window.Alpine || document.querySelector('[x-data]')) {
            console.log('Alpine.js detected, setting up special handlers');

            // Alpine.js 초기화 이벤트 감지
            document.addEventListener('alpine:init', () => {
                // Alpine 이벤트 감지 설정
                setupAlpineEventDetection();
            });

            // 이미 초기화된 경우
            if (window.Alpine) {
                setupAlpineEventDetection();
            }
        }
    }

    /**
     * Alpine.js 이벤트 특별 감지
     */
    function setupAlpineEventDetection() {
        try {
            // 이미 설정되었는지 확인
            if (window.Alpine._hooksInitialized) return;

            // 특정 요소에 대한 감시
            document.querySelectorAll('[x-on\\:click], [\\@click]').forEach(el => {
                el.addEventListener('click', (event) => {
                    // 클릭 시 URL 변경 가능성 감지
                    console.log('Alpine element clicked');

                    // 현재 URL 정보 저장
                    const beforeUrlInfo = {
                        url: location.href,
                        pathname: location.pathname,
                        search: location.search,
                        hash: location.hash
                    };

                    // 짧은 지연 후 URL 변경 확인
                    setTimeout(() => {
                        // URL 변경 확인
                        const afterUrlInfo = {
                            url: location.href,
                            pathname: location.pathname,
                            search: location.search,
                            hash: location.hash
                        };

                        const hashOnly = beforeUrlInfo.pathname === afterUrlInfo.pathname &&
                            beforeUrlInfo.search === afterUrlInfo.search &&
                            beforeUrlInfo.hash !== afterUrlInfo.hash;

                        if (beforeUrlInfo.url !== afterUrlInfo.url) {
                            if (!hashOnly) {
                                console.log('URL changed after Alpine event');
                                triggerNavHooks(new Event('synthetic'), {
                                    type: 'navigation',
                                    action: 'alpine-navigation',
                                    from: beforeUrlInfo.url,
                                    to: afterUrlInfo.url,
                                    hashOnly: false
                                });

                                saveCurrentState();
                            } else {
                                console.log('Hash changed after Alpine event');
                                triggerNavHooks(new Event('synthetic'), {
                                    type: 'navigation',
                                    action: 'alpine-navigation',
                                    from: beforeUrlInfo.url,
                                    to: afterUrlInfo.url,
                                    hashOnly: true
                                });
                            }

                            saveUrlInfo();
                        }
                    }, 50);
                });
            });

            // 초기화 플래그 설정
            if (window.Alpine) {
                window.Alpine._hooksInitialized = true;
            }
        } catch (e) {
            console.warn('Error setting up Alpine event detection:', e);
        }
    }

    return {
        init,
        addHook,
        removeHook,
        hookLocationMethods,
        isNavigating: function () { return isNavigating; }
    };
})();

export default NavigationHook;