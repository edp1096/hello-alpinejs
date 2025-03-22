// src/clickHook.js

/**
 * 클릭 이벤트 감지 및 처리를 위한 훅
 * - a 태그 클릭 감지
 * - onclick 속성 감지
 * - Alpine.js @click 디렉티브 감지
 */
const ClickHook = (function () {
    const hooks = [];
    let initialized = false;
    let alpineInitialized = false;
    let loadingCallback = null;

    // 로딩 콜백
    function setLoadingCallback(callback) {
        loadingCallback = callback;
    }

    /**
     * 클릭 훅 초기화
     */
    function init() {
        if (initialized) return;

        // 전역 클릭 리스너 등록
        document.addEventListener('click', handleGlobalClick, true);

        // Alpine.js 이벤트 캡처를 위한 특수 리스너
        document.addEventListener('click', handleAlpineClick, true);

        // DOM 변경 감시를 위한 MutationObserver 설정
        const observer = new MutationObserver(watchDOMChanges);
        observer.observe(document.body, { childList: true, subtree: true });

        // Alpine.js 초기화 이벤트 감지
        document.addEventListener('alpine:init', () => {
            // console.log('Alpine:init event detected');
            alpineInitialized = true;
        });

        initialized = true;
    }

    /**
     * 전역 클릭 이벤트 처리
     * @param {Event} event 클릭 이벤트
     */
    function handleGlobalClick(event) {
        // onclick 속성을 가진 모든 요소 찾기 (직접 타겟뿐만 아니라 부모 요소까지)
        let element = event.target;
        let clickableElement = null;

        // 타겟 자체 또는 부모 중에 onclick 속성이 있는지 확인
        while (element && element !== document.body) {
            if (element.hasAttribute('onclick') || element.tagName === 'A') {
                clickableElement = element;
                break;
            }
            element = element.parentElement;
        }

        // 클릭 가능한 요소가 없으면 종료
        if (!clickableElement) return;

        // onclick 속성 처리
        if (clickableElement.hasAttribute('onclick')) {
            const onclickAttr = clickableElement.getAttribute('onclick') || '';
            // console.log('Onclick attribute detected:', onclickAttr);

            // 다양한 패턴 감지를 위한 로직
            const isNavigation =
                onclickAttr.includes('location.href') ||
                onclickAttr.includes('location.search') ||
                onclickAttr.includes('location = ') ||
                onclickAttr.includes('window.location') ||
                onclickAttr.match(/location\s*\[\s*['"]href['"]\s*\]/) ||
                onclickAttr.match(/goto[a-zA-Z]*\(/) ||  // gotoDetail, gotoPage 등
                onclickAttr.match(/navigate[a-zA-Z]*\(/); // navigateTo 등

            // 각 등록된 훅 호출
            for (const hook of hooks) {
                hook(clickableElement, event, {
                    type: isNavigation ? 'onclick-navigation' : 'onclick-function',
                    value: onclickAttr
                });
            }
            return;
        }

        // a 태그 처리
        if (clickableElement.tagName === 'A' && clickableElement.href) {
            for (const hook of hooks) {
                hook(clickableElement, event, {
                    type: 'href',
                    url: clickableElement.href
                });
            }
        }
    }

    /**
     * Alpine.js 클릭 이벤트 처리 (별도 핸들러)
     * @param {Event} event 클릭 이벤트
     */
    function handleAlpineClick(event) {
        // 이벤트 타겟 또는 부모에서 Alpine.js 속성 찾기
        let element = event.target;
        let alpineElement = null;

        // DOM 트리를 올라가며 Alpine.js 속성 찾기
        while (element && element !== document.body) {
            // 표준 x-on:click 또는 축약형 @click 속성 검사
            if (hasAlpineClickAttribute(element)) {
                alpineElement = element;
                break;
            }
            element = element.parentElement;
        }

        // Alpine.js 요소가 없으면 종료
        if (!alpineElement) return;

        // no-loading-screen 속성 확인
        if (alpineElement.hasAttribute('no-loading-screen')) {
            // console.log('no-loading-screen 속성이 있는 요소, 로딩 화면 표시하지 않음');
            return;
        }

        // Alpine.js 속성 값 가져오기
        const expression = getAlpineClickExpression(alpineElement);
        // console.log('Alpine.js click detected:', expression);

        // 단순 변수 할당 패턴 감지 (로딩 화면 표시하지 않음)
        const isSimpleAssignment = /^[a-zA-Z0-9_$]+\s*=\s*[^(;]+$/.test(expression) || // variable = value
            /^[a-zA-Z0-9_$]+\s*=\s*!\s*[a-zA-Z0-9_$]+$/.test(expression) || // variable = !variable
            /^[a-zA-Z0-9_$]+\.[a-zA-Z0-9_$]+\s*=\s*[^(;]+$/.test(expression); // object.property = value

        if (isSimpleAssignment) {
            // console.log('Simple assignment detected, not showing loading:', expression);

            // 각 등록된 훅 호출 (네비게이션 아님으로 표시)
            for (const hook of hooks) {
                hook(alpineElement, event, {
                    type: 'alpine',
                    expression: expression,
                    navigationPattern: false // 내비게이션 아님으로 표시
                });
            }
            return; // 여기서 종료
        }

        // image.href 패턴 예외 처리
        if (expression.includes('image.href')) {
            // 슬라이더 이미지 클릭은 로딩 화면 표시하지 않음
            // console.log('Slider image.href pattern detected in Alpine expression');

            for (const hook of hooks) {
                hook(alpineElement, event, {
                    type: 'alpine',
                    expression: expression,
                    navigationPattern: false // 내비게이션으로 취급하지 않음
                });
            }

            return;
        }

        // 내비게이션 패턴 더 정확히 체크
        const isNavigation =
            // location 관련 패턴
            expression.includes('location.href') ||
            expression.includes('location.replace') ||
            expression.includes('location.assign') ||

            // window 객체의 특정 이동 함수 호출
            expression.match(/window\.goto[a-zA-Z0-9_]*\(/) ||
            expression.match(/window\.navigate[a-zA-Z0-9_]*\(/);

        // 내비게이션으로 판단된 경우에만 로딩 화면 표시
        // if (isNavigation && Hooks && Hooks.loading) {
        //     console.log('Alpine.js navigation detected:', expression);
        //     Hooks.loading.show();
        // }
        // if (isNavigation && window.Hooks && window.Hooks.loading) {
        //     console.log('Alpine.js navigation detected:', expression);
        //     window.Hooks.loading.show();
        // }
        if (isNavigation && typeof loadingCallback === 'function') {
            // console.log('Alpine.js navigation detected:', expression);
            loadingCallback(); // 콜백 함수 호출
        }

        // 각 등록된 훅 호출
        for (const hook of hooks) {
            hook(alpineElement, event, {
                type: isNavigation ? 'alpine-navigation' : 'alpine',
                expression: expression,
                navigationPattern: isNavigation
            });
        }
    }

    /**
     * 요소가, 모든 가능한 형태의 Alpine.js click 속성을 가지고 있는지 확인
     */
    function hasAlpineClickAttribute(element) {
        return element.hasAttribute('x-on:click') ||
            element.hasAttribute('@click') ||
            Array.from(element.attributes).some(attr =>
                attr.name.startsWith('x-on:click') ||
                attr.name.startsWith('@click')
            );
    }

    /**
     * Alpine.js click 속성 값 가져오기 (모든 가능한 형태 처리)
     */
    function getAlpineClickExpression(element) {
        return element.getAttribute('x-on:click') ||
            element.getAttribute('@click') ||
            Array.from(element.attributes)
                .find(attr => attr.name.startsWith('x-on:click') || attr.name.startsWith('@click'))?.value || '';
    }

    /**
     * DOM 변경 감시
     * @param {MutationRecord[]} mutations 변경 내역
     */
    function watchDOMChanges(mutations) {
        // DOM 변경 감지하지만 특별한 처리 없음
        // 전역 이벤트 리스너가 모든 클릭을 처리함
    }

    /**
     * 클릭 훅 추가
     * @param {Function} callback 콜백 함수
     */
    function addHook(callback) {
        if (typeof callback !== 'function') {
            console.error('Hook must be a function');
            return false;
        }

        hooks.push(callback);
        if (!initialized) init();
        return true;
    }

    /**
     * 클릭 훅 제거
     * @param {Function} callback 제거할 콜백 함수
     */
    function removeHook(callback) {
        const index = hooks.indexOf(callback);
        if (index !== -1) {
            hooks.splice(index, 1);
            return true;
        }
        return false;
    }

    return {
        init,
        addHook,
        removeHook,
        setLoadingCallback
    };
})();

export default ClickHook;