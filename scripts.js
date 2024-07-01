// class CmpCalendar extends HTMLElement {
//     constructor() {
//         super()
//         this.attachShadow({ mode: 'open' })
//     }

//     async connectedCallback() {
//         const response = await fetch('components/calendar.html')
//         if (!response.ok) {
//             throw new Error('Network response was not ok')
//         }
//         const data = await response.text()
//         this.shadowRoot.innerHTML = data

//         this.executeScripts(this.shadowRoot)
//     }

//     executeScripts(root) {
//         const scripts = root.querySelectorAll('script')
//         scripts.forEach((script) => {
//             const newScript = document.createElement('script')
//             newScript.textContent = script.textContent
//             script.replaceWith(newScript)
//         })
//     }
// }
// customElements.define('cmp-calendar', CmpCalendar)

class CustomElement extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
    }

    async connectedCallback() {
        const response = await fetch('components/content.html')
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        const data = await response.text()
        this.shadowRoot.innerHTML = data

        this.loadExternalResources()
        this.executeScripts(this.shadowRoot)
    }

    loadExternalResources() {
        // Load CSS
        const cssLinks = this.shadowRoot.querySelectorAll('link[rel="stylesheet"]')
        cssLinks.forEach(link => {
            const newLink = document.createElement('link')
            newLink.rel = 'stylesheet'
            newLink.href = link.href
            newLink.onload = () => {
                console.log(`External CSS ${link.href} loaded`)
            }
            newLink.onerror = (error) => {
                console.error(`Failed to load external CSS ${link.href}:`, error)
            }
            this.shadowRoot.appendChild(newLink)
        })

        // Load JS
        const scripts = this.shadowRoot.querySelectorAll('script[src]')
        scripts.forEach(script => {
            const newScript = document.createElement('script')
            newScript.src = script.src
            newScript.onload = () => {
                console.log(`External script ${script.src} loaded`)
            }
            newScript.onerror = (error) => {
                console.error(`Failed to load external script ${script.src}:`, error)
            }
            this.shadowRoot.appendChild(newScript)
        })
    }

    executeScripts(root) {
        const scripts = root.querySelectorAll('script')
        scripts.forEach(script => {
            if (script.src) { return }
            const newScript = document.createElement('script')
            newScript.textContent = script.textContent
            this.shadowRoot.appendChild(newScript)
        })
    }
}
customElements.define('custom-element', CustomElement)
