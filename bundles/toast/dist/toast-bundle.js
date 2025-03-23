var ToastComponent=(()=>{var m=Object.defineProperty;var T=Object.getOwnPropertyDescriptor;var C=Object.getOwnPropertyNames;var E=Object.prototype.hasOwnProperty;var P=(o,a)=>{for(var t in a)m(o,t,{get:a[t],enumerable:!0})},A=(o,a,t,e)=>{if(a&&typeof a=="object"||typeof a=="function")for(let s of C(a))!E.call(o,s)&&s!==t&&m(o,s,{get:()=>a[s],enumerable:!(e=T(a,s))||e.enumerable});return o};var k=o=>A(m({},"__esModule",{value:!0}),o);var I={};P(I,{registerToast:()=>d});var l='<div x-data="toast" class="toast-wrapper"><div class="toast-container top-right"><template x-for="item in getItemsForPosition(\'top-right\')" :key="item.id"><div class="toast-item" :class="item.type" x-show="item.visible" x-transition:enter="toast-enter" x-transition:enter-start="toast-enter-start" x-transition:enter-end="toast-enter-end" x-transition:leave="toast-leave" x-transition:leave-start="toast-leave-start" x-transition:leave-end="toast-leave-end"><div class="toast-content"><div class="toast-icon"></div><div class="toast-message"><span class="toast-title" x-text="item.title"></span><span class="toast-description" x-text="item.message"></span></div></div><button x-show="item.closable" class="toast-close" @click="removeToast(item.id)"></button><div x-show="item.showProgress" class="toast-progress" :style="`width: ${item.progress}%`"></div></div></template></div><div class="toast-container top-left"><template x-for="item in getItemsForPosition(\'top-left\')" :key="item.id"><div class="toast-item" :class="item.type" x-show="item.visible" x-transition:enter="toast-enter" x-transition:enter-start="toast-enter-start-left" x-transition:enter-end="toast-enter-end" x-transition:leave="toast-leave" x-transition:leave-start="toast-leave-start" x-transition:leave-end="toast-leave-end-left"><div class="toast-content"><div class="toast-icon"></div><div class="toast-message"><span class="toast-title" x-text="item.title"></span><span class="toast-description" x-text="item.message"></span></div></div><button x-show="item.closable" class="toast-close" @click="removeToast(item.id)"></button><div x-show="item.showProgress" class="toast-progress" :style="`width: ${item.progress}%`"></div></div></template></div><div class="toast-container top-center"><template x-for="item in getItemsForPosition(\'top-center\')" :key="item.id"><div class="toast-item" :class="item.type" x-show="item.visible" x-transition:enter="toast-enter" x-transition:enter-start="toast-enter-start-center" x-transition:enter-end="toast-enter-end" x-transition:leave="toast-leave" x-transition:leave-start="toast-leave-start" x-transition:leave-end="toast-leave-end-center"><div class="toast-content"><div class="toast-icon"></div><div class="toast-message"><span class="toast-title" x-text="item.title"></span><span class="toast-description" x-text="item.message"></span></div></div><button x-show="item.closable" class="toast-close" @click="removeToast(item.id)"></button><div x-show="item.showProgress" class="toast-progress" :style="`width: ${item.progress}%`"></div></div></template></div><div class="toast-container bottom-right"><template x-for="item in getItemsForPosition(\'bottom-right\')" :key="item.id"><div class="toast-item" :class="item.type" x-show="item.visible" x-transition:enter="toast-enter" x-transition:enter-start="toast-enter-start" x-transition:enter-end="toast-enter-end" x-transition:leave="toast-leave" x-transition:leave-start="toast-leave-start" x-transition:leave-end="toast-leave-end"><div class="toast-content"><div class="toast-icon"></div><div class="toast-message"><span class="toast-title" x-text="item.title"></span><span class="toast-description" x-text="item.message"></span></div></div><button x-show="item.closable" class="toast-close" @click="removeToast(item.id)"></button><div x-show="item.showProgress" class="toast-progress" :style="`width: ${item.progress}%`"></div></div></template></div><div class="toast-container bottom-left"><template x-for="item in getItemsForPosition(\'bottom-left\')" :key="item.id"><div class="toast-item" :class="item.type" x-show="item.visible" x-transition:enter="toast-enter" x-transition:enter-start="toast-enter-start-left" x-transition:enter-end="toast-enter-end" x-transition:leave="toast-leave" x-transition:leave-start="toast-leave-start" x-transition:leave-end="toast-leave-end-left"><div class="toast-content"><div class="toast-icon"></div><div class="toast-message"><span class="toast-title" x-text="item.title"></span><span class="toast-description" x-text="item.message"></span></div></div><button x-show="item.closable" class="toast-close" @click="removeToast(item.id)"></button><div x-show="item.showProgress" class="toast-progress" :style="`width: ${item.progress}%`"></div></div></template></div><div class="toast-container bottom-center"><template x-for="item in getItemsForPosition(\'bottom-center\')" :key="item.id"><div class="toast-item" :class="item.type" x-show="item.visible" x-transition:enter="toast-enter" x-transition:enter-start="toast-enter-start-center" x-transition:enter-end="toast-enter-end" x-transition:leave="toast-leave" x-transition:leave-start="toast-leave-start" x-transition:leave-end="toast-leave-end-center"><div class="toast-content"><div class="toast-icon"></div><div class="toast-message"><span class="toast-title" x-text="item.title"></span><span class="toast-description" x-text="item.message"></span></div></div><button x-show="item.closable" class="toast-close" @click="removeToast(item.id)"></button><div x-show="item.showProgress" class="toast-progress" :style="`width: ${item.progress}%`"></div></div></template></div></div>';var u="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M0%200h24v24H0z%22%2F%3E%3Cpath%20d%3D%22M10%2015.172l9.192-9.193%201.415%201.414L10%2018l-6.364-6.364%201.414-1.414z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E";var x="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M0%200h24v24H0z%22%2F%3E%3Cpath%20d%3D%22M12%2022C6.477%2022%202%2017.523%202%2012S6.477%202%2012%202s10%204.477%2010%2010-4.477%2010-10%2010zm0-2a8%208%200%201%200%200-16%208%208%200%200%200%200%2016zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E";var g="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M0%200h24v24H0z%22%2F%3E%3Cpath%20d%3D%22M12.866%203l9.526%2016.5a1%201%200%200%201-.866%201.5H2.474a1%201%200%200%201-.866-1.5L11.134%203a1%201%200%200%201%201.732%200zm-8.66%2016h15.588L12%205.5%204.206%2019zM11%2016h2v2h-2v-2zm0-7h2v5h-2V9z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E";var f="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M0%200h24v24H0z%22%2F%3E%3Cpath%20d%3D%22M12%2022C6.477%2022%202%2017.523%202%2012S6.477%202%2012%202s10%204.477%2010%2010-4.477%2010-10%2010zm0-2a8%208%200%201%200%200-16%208%208%200%200%200%200%2016zM11%207h2v2h-2V7zm0%204h2v6h-2v-6z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E";var w="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M0%200h24v24H0z%22%2F%3E%3Cpath%20d%3D%22M12%2010.586l4.95-4.95%201.414%201.414-4.95%204.95%204.95%204.95-1.414%201.414-4.95-4.95-4.95%204.95-1.414-1.414%204.95-4.95-4.95-4.95L7.05%205.636z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E";var y={check:u,error:x,warning:g,info:f,close:w};function d(o={}){if(!window.Alpine)return console.error("Alpine.js is not loaded. Please load Alpine.js first."),null;if(typeof customElements<"u"&&!customElements.get("my-toast")){class t extends HTMLElement{connectedCallback(){let s=this.getAttribute("position"),i=this.getAttribute("duration"),n=this.getAttribute("max-toasts"),r={...o};s&&(r.position=s),i&&(r.duration=parseInt(i)||3e3),n&&(r.maxToasts=parseInt(n)||5),this.innerHTML=l,this.id&&window.Alpine.store("toastConfig_"+this.id,r)}disconnectedCallback(){this.id&&window.Alpine.store("toastConfig_"+this.id,null)}}customElements.define("my-toast",t)}return window.Alpine.data("toast",()=>({icons:y,itemGroups:{"top-right":[],"top-left":[],"top-center":[],"bottom-right":[],"bottom-left":[],"bottom-center":[]},position:o.position||"top-right",duration:o.duration||3e3,maxToasts:o.maxToasts||5,toastIdCounter:0,getIconUrl(t){return this.icons[t]||""},init(){if(document.documentElement.style.setProperty("--icon-check",`url('${this.icons.check}')`),document.documentElement.style.setProperty("--icon-error",`url('${this.icons.error}')`),document.documentElement.style.setProperty("--icon-warning",`url('${this.icons.warning}')`),document.documentElement.style.setProperty("--icon-info",`url('${this.icons.info}')`),document.documentElement.style.setProperty("--icon-close",`url('${this.icons.close}')`),this.$el&&this.$el.closest("my-toast")&&this.$el.closest("my-toast").id){let e=window.Alpine.store("toastConfig_"+this.$el.closest("my-toast").id);e&&(this.position=e.position||this.position,this.duration=e.duration||this.duration,this.maxToasts=e.maxToasts||this.maxToasts)}window.toast||(window.toast={success:(e,s={})=>this.addToast({message:e,type:"success",...s}),error:(e,s={})=>this.addToast({message:e,type:"error",...s}),warning:(e,s={})=>this.addToast({message:e,type:"warning",...s}),info:(e,s={})=>this.addToast({message:e,type:"info",...s}),setPosition:e=>{this.position=e}});let t=this.$el.closest("my-toast");t&&t.addEventListener("show-toast",e=>{e.detail&&this.addToast(e.detail)})},getItemsForPosition(t){return this.itemGroups[t]||[]},getTotalItems(){return Object.values(this.itemGroups).reduce((t,e)=>t+e.length,0)},addToast(t){let e=this.toastIdCounter++,s=t.position||this.position,i={id:e,title:t.title||this.getDefaultTitle(t.type),message:t.message||"",type:t.type||"info",duration:t.duration||this.duration,visible:!0,closable:t.closable!==!1,showProgress:t.showProgress!==!1,progress:100,timerId:null};if(this.itemGroups[s]||(this.itemGroups[s]=[]),this.itemGroups[s].length>=this.maxToasts){let n=this.itemGroups[s][0];n&&n.timerId&&clearTimeout(n.timerId),this.itemGroups[s].shift()}if(this.itemGroups[s].push(i),i.duration>0){let r=Date.now()+i.duration,c=()=>{let b=Date.now(),v=(r-b)/i.duration*100,p=!1;for(let[M,D]of Object.entries(this.itemGroups)){let h=D.find(F=>F.id===e);if(h){h.progress=Math.max(0,v),p=!0;break}}p&&v>0&&requestAnimationFrame(c)};i.showProgress&&requestAnimationFrame(c),i.timerId=setTimeout(()=>{this.removeToast(e)},i.duration)}return e},removeToast(t){for(let e of Object.keys(this.itemGroups)){let s=this.itemGroups[e].findIndex(i=>i.id===t);if(s!==-1){this.itemGroups[e][s].visible=!1,setTimeout(()=>{this.itemGroups[e]=this.itemGroups[e].filter(i=>i.id!==t)},300);break}}},getDefaultTitle(t){switch(t){case"success":return"\uC131\uACF5";case"error":return"\uC624\uB958";case"warning":return"\uACBD\uACE0";case"info":return"\uC815\uBCF4";default:return""}}})),{mount(t){typeof t=="string"&&(t=document.querySelector(t)),t?t.innerHTML=l:console.error("Cannot find target element.",t)},getTemplate(){return l}}}typeof document<"u"&&document.addEventListener("DOMContentLoaded",()=>{if(window.Alpine&&(document.querySelectorAll("[data-toast-mount]").forEach(o=>{let a=d();a&&a.mount(o)}),!document.querySelector("my-toast"))){let o=document.createElement("my-toast");o.id="global-toast",document.body.appendChild(o),d()}});window.ToastComponent={registerToast:d};return k(I);})();
