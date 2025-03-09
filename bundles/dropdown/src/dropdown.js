// src/dropdown.js
import dropdownTemplate from './dropdown.html';
import './dropdown.scss';

export function registerDropdown(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    window.Alpine.data('dropdown', () => ({
        isOpen: false,
        options: config.options || [
            { name: 'My profile', icon: 'ri-user-3-line' },
            { name: 'Messages', icon: 'ri-message-3-line' },
            { name: 'Accounts', icon: 'ri-lock-line' },
            { name: 'Settings', icon: 'ri-settings-3-line' }
        ],
        selectedOption: {},

        toggle() {
            this.isOpen = !this.isOpen;
        },

        selectOption(option) {
            this.selectedOption = option;
            this.isOpen = false;

            // Trigger event if callback provided
            if (typeof config.onSelect === 'function') {
                config.onSelect(option);
            }
        },

        init() {
            // Set default selected option if provided
            if (config.defaultOption) {
                this.selectedOption = config.defaultOption;
            } else if (this.options.length > 0) {
                this.selectedOption = this.options[0];
            }

            // Close dropdown when clicking outside
            this.$nextTick(() => {
                document.addEventListener('click', (event) => {
                    if (!this.$el.contains(event.target)) {
                        this.isOpen = false;
                    }
                });
            });

            // Close other dropdowns when this one is opened
            this.$watch('isOpen', (value) => {
                if (value) {
                    // Update z-index to ensure this dropdown is on top
                    this.$el.style.zIndex = '100';

                    // Find all other dropdown components and close them
                    document.querySelectorAll('.alpine-dropdown-component').forEach(el => {
                        if (el !== this.$el && el.__x) {
                            el.__x.getUnobservedData().isOpen = false;
                            el.style.zIndex = '1';
                        }
                    });
                } else {
                    // Reset z-index when closed
                    this.$el.style.zIndex = '1';
                }
            });
        }
    }));

    const controller = {
        mount(el) {
            if (typeof el == 'string') { el = document.querySelector(el); }

            if (el) {
                el.innerHTML = dropdownTemplate;
                // window.Alpine.nextTick(() => { window.Alpine.initTree(el); });
            } else {
                console.error('Cannot find target element.', el);
            }
        },

        getTemplate() { return dropdownTemplate; }
    };

    return controller;
}

// Auto initialization after the document is fully loaded
if (typeof document != 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            document.querySelectorAll('[data-dropdown-mount]').forEach(el => {
                const dropdown = registerDropdown();
                if (dropdown) { dropdown.mount(el); }
            });
        }
    });
}

window.DropdownComponent = { registerDropdown };