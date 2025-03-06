// src/todo.js
import todoTemplate from './todo.html';
import './todo.scss'; // SCSS 파일 임포트

// 컴포넌트 등록 함수 - Alpine.js는 외부에서 로드됨
export function registerTodo() {
    // Alpine.js 로드 확인
    if (!window.Alpine) {
        console.error('Alpine.js가 로드되지 않았습니다. 먼저 Alpine.js를 로드해주세요.');
        return null;
    }

    // 컴포넌트 등록
    window.Alpine.data('todoComponent', () => ({
        todos: [],

        init() {
            // nextTick을 사용하여 DOM이 완전히 렌더링된 후 실행
            window.Alpine.nextTick(() => {
                const todoItems = this.$refs.todoItem;
                // NodeList인 경우 배열로 변환
                if (todoItems && !Array.isArray(todoItems)) {
                    const items = todoItems.length ? Array.from(todoItems) : [todoItems];

                    for (const todo of items) {
                        const parent = todo.parentNode;
                        if (parent) {
                            const staticItems = parent.querySelectorAll('[is-static]');
                            staticItems.forEach(item => {
                                this.todos.push(item.innerText);
                                item.remove();
                            });
                        }
                    }
                }
            });
        },

        addTodo() {
            const newTodo = `Todo ${this.todos.length + 1}`;
            this.todos.push(newTodo);
        },

        removeTodo() {
            if (this.todos.length > 0) {
                this.todos.pop();
            }
        }
    }));

    return {
        // 컴포넌트 마운트 함수
        mount(el) {
            if (typeof el === 'string') {
                el = document.querySelector(el);
            }

            if (el) {
                el.innerHTML = todoTemplate;
                // Alpine.js가 새로 추가된 DOM에 적용되도록 처리
                window.Alpine.initTree(el);
            } else {
                console.error('대상 엘리먼트를 찾을 수 없습니다:', el);
            }
        },

        // HTML 템플릿 직접 반환
        getTemplate() {
            return todoTemplate;
        }
    };
}

// 자동 초기화 (문서 로드 완료 후)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Alpine.js가 로드된 후 초기화
        if (window.Alpine) {
            // 자동 마운트 (data-todo-mount 속성이 있는 요소에)
            document.querySelectorAll('[data-todo-mount]').forEach(el => {
                const todo = registerTodo();
                if (todo) {
                    todo.mount(el);
                }
            });
        }
    });
}

// 전역 객체로 노출
window.TodoComponent = { registerTodo };