// src/counter.js
import counterTemplate from './counter.html';
import './counter.scss'; // SCSS 파일 임포트

// 컴포넌트 등록 함수 - Alpine.js는 외부에서 로드됨
export function registerCounter() {
    // Alpine.js 로드 확인
    if (!window.Alpine) {
        console.error('Alpine.js가 로드되지 않았습니다. 먼저 Alpine.js를 로드해주세요.');
        return null;
    }

    // 컴포넌트 등록
    window.Alpine.data('counter', () => ({
        count: 0,

        increment() {
            this.count++;
        },

        decrement() {
            this.count--;
        }
    }));

    return {
        // 컴포넌트 마운트 함수
        mount(el) {
            if (typeof el === 'string') {
                el = document.querySelector(el);
            }

            if (el) {
                el.innerHTML = counterTemplate;
                // Alpine.js가 새로 추가된 DOM에 적용되도록 처리
                window.Alpine.initTree(el);
            } else {
                console.error('대상 엘리먼트를 찾을 수 없습니다:', el);
            }
        },

        // HTML 템플릿 직접 반환
        getTemplate() {
            return counterTemplate;
        }
    };
}

// 자동 초기화 (문서 로드 완료 후)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Alpine.js가 로드된 후 초기화
        if (window.Alpine) {
            // 자동 마운트 (data-counter-mount 속성이 있는 요소에)
            document.querySelectorAll('[data-counter-mount]').forEach(el => {
                const counter = registerCounter();
                if (counter) {
                    counter.mount(el);
                }
            });
        }
    });
}

// 전역 객체로 노출
window.CounterComponent = { registerCounter };