// src/counter.js
import counterTemplate from './counter.html';
import './counter.scss';

export function registerCounter(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    window.Alpine.data('counter', () => ({
        config: config,
        count: 0,
        increment() { this.count++; },
        decrement() { this.count--; },

        init() {
            // if (this.config.count) { this.count = parseInt(this.config.count); }
            if (this.config) {
                Object.entries(this.config).forEach(([key, value]) => {
                    if (key in this) { this[key] = value; }
                });
            }
        }
    }));

    const controller = {
        mount(el) {
            if (typeof el == 'string') { el = document.querySelector(el); }

            if (el) {
                el.innerHTML = counterTemplate;
                // window.Alpine.nextTick(() => { window.Alpine.initTree(el); });
            } else {
                console.error('Cannot find target element.', el);
            }
        },

        getTemplate() { return counterTemplate; }
    };

    return controller;
}

// Auto initialization after the document is fully loaded
if (typeof document != 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            document.querySelectorAll('[data-counter-mount]').forEach(el => {
                const counter = registerCounter();
                if (counter) { counter.mount(el); }
            });
        }
    });
}

window.CounterComponent = { registerCounter };