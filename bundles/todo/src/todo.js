// src/todo.js
import todoTemplate from './todo.html';
import './todo.scss';

export function registerTodo() {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    window.Alpine.data('todoComponent', () => ({
        todos: [],

        init() {
            window.Alpine.nextTick(() => {
                const todoItems = this.$refs.todoItem;

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
        mount(el) {
            if (typeof el == 'string') {
                el = document.querySelector(el);
            }

            if (el) {
                el.innerHTML = todoTemplate;
                // window.Alpine.initTree(el);
            } else {
                console.error('대상 엘리먼트를 찾을 수 없습니다:', el);
            }
        },

        getTemplate() {
            return todoTemplate;
        }
    };
}

// Automatically initialize after the document is fully loaded
if (typeof document != 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            document.querySelectorAll('[data-todo-mount]').forEach(el => {
                const todo = registerTodo();
                if (todo) { todo.mount(el); }
            });
        }
    });
}

window.TodoComponent = { registerTodo };