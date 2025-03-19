var SliderComponent=(()=>{var h=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var f=Object.getOwnPropertyNames;var g=Object.prototype.hasOwnProperty;var m=(a,o)=>{for(var t in o)h(a,t,{get:o[t],enumerable:!0})},y=(a,o,t,e)=>{if(o&&typeof o=="object"||typeof o=="function")for(let i of f(o))!g.call(a,i)&&i!==t&&h(a,i,{get:()=>o[i],enumerable:!(e=p(o,i))||e.enumerable});return a};var v=a=>y(h({},"__esModule",{value:!0}),a);var w={};m(w,{registerSlider:()=>c});var l=`<div class="carousel-module-container" x-data="carouselController" x-init="init()"><template x-if="showControl"><div class="carousel-options"><div class="option-group"><h3>\uD2B8\uB79C\uC9C0\uC158 \uD6A8\uACFC</h3><label><input type="radio" name="transition" value="slide" x-model="transitionType"> \uC2AC\uB77C\uC774\uB4DC </label><label><input type="radio" name="transition" value="fade" x-model="transitionType"> \uD398\uC774\uB4DC </label></div><div class="option-group"><h3>\uBAA8\uC11C\uB9AC \uC124\uC815</h3><label class="toggle-switch"><input type="checkbox" x-model="noFillet"><span>\uAC01\uC9C4 \uBAA8\uC11C\uB9AC \uC0AC\uC6A9</span></label></div><div class="option-group"><h3>\uC2A4\uC640\uC774\uD504 \uC124\uC815(\uC2AC\uB77C\uC774\uB4DC \uC124\uC815 \uD544\uC694)</h3><label class="toggle-switch"><input type="checkbox" x-model="useSwipe"><span>\uC2A4\uC640\uC774\uD504 \uD65C\uC131\uD654</span></label></div><div class="option-group"><h3>\uC790\uB3D9 \uC7AC\uC0DD \uC124\uC815</h3><label class="toggle-switch"><input type="checkbox" x-model="autoplayEnabled"><span>\uC790\uB3D9 \uC7AC\uC0DD</span></label><div class="interval-control" x-show="autoplayEnabled"><label><input type="range" min="1" max="10" x-model.number="interval"><span x-text="interval"></span>\uCD08 </label></div></div><div class="option-group"><h3>\uD2B8\uB79C\uC9C0\uC158 \uC18D\uB3C4</h3><label><input type="range" min="0.1" max="2" step="0.1" x-model.number="transitionDuration"><span x-text="transitionDuration"></span>\uCD08 </label></div><div class="option-group"><h3>\uC774\uBBF8\uC9C0 \uC704\uCE58</h3><label><input type="radio" name="imgPosition" value="top" x-model="imagePosition"> \uC0C1\uB2E8 \uC815\uB82C </label><label><input type="radio" name="imgPosition" value="center" x-model="imagePosition"> \uC911\uC559 \uC815\uB82C </label><label><input type="radio" name="imgPosition" value="bottom" x-model="imagePosition"> \uD558\uB2E8 \uC815\uB82C </label></div><div class="option-group"><h3>\uC778\uB514\uCF00\uC774\uD130 \uC124\uC815</h3><label class="toggle-switch"><input type="checkbox" x-model="showIndicators"><span>\uC778\uB514\uCF00\uC774\uD130 \uD45C\uC2DC</span></label></div></div></template><div class="carousel-container" :class="{ 'no-fillet': noFillet }"><div class="carousel-inner" :style="transitionType == 'slide' ? \`transform: translateX(\${-currentIndex * 100}%); transition: transform \${transitionDuration}s ease;\` : ''" :class="{'fade-transition': transitionType == 'fade'}"><template x-for="(image, index) in images" :key="index"><div class="carousel-item" :class="{ 'active': currentIndex == index }" :style="getItemStyle()" @click="location.href = image.href"><img :class="'img-' + imagePosition" :src="image.src" :alt="image.alt || \`\uC2AC\uB77C\uC774\uB4DC \uC774\uBBF8\uC9C0 \${index + 1}\`"></div></template></div><button class="carousel-control prev" @click="prev()" aria-label="\uC774\uC804 \uC2AC\uB77C\uC774\uB4DC"> &#10094; </button><button class="carousel-control next" @click="next()" aria-label="\uB2E4\uC74C \uC2AC\uB77C\uC774\uB4DC"> &#10095; </button><template x-if="showIndicators"><div class="carousel-indicators"><template x-for="(image, index) in images" :key="index"><div class="carousel-indicator" :class="{ 'active': currentIndex == index }" @click="goToSlide(index)"></div></template></div></template></div></div>`;function c(a={}){if(!window.Alpine)return console.error("Alpine.js is not loaded. Please load Alpine.js first."),null;if(typeof customElements<"u"&&!customElements.get("my-slider")){class t extends HTMLElement{connectedCallback(){let i=this.getAttribute("config"),s=this.getAttribute("images"),n={...a};if(this.hasAttribute("transition-type")&&(n.transitionType=this.getAttribute("transition-type")),this.hasAttribute("autoplay")&&(n.autoplayEnabled=this.getAttribute("autoplay")!=="false"),this.hasAttribute("interval")&&(n.interval=parseFloat(this.getAttribute("interval"))||5),this.hasAttribute("duration")&&(n.transitionDuration=parseFloat(this.getAttribute("duration"))||1.2),this.hasAttribute("image-position")&&(n.imagePosition=this.getAttribute("image-position")),this.hasAttribute("indicators")&&(n.showIndicators=this.getAttribute("indicators")!=="false"),this.hasAttribute("show-controls")&&(n.showControl=this.getAttribute("show-controls")!=="false"),this.hasAttribute("no-fillet")&&(n.noFillet=this.getAttribute("no-fillet")!=="false"),this.hasAttribute("swipe")&&(n.useSwipe=this.getAttribute("swipe")!=="false"),i)try{let r=JSON.parse(i);n={...n,...r}}catch(r){console.error("Invalid config attribute:",r)}if(s)try{n.images=JSON.parse(s)}catch(r){console.error("Invalid images attribute:",r)}this.innerHTML=l,this.id&&window.Alpine.store("sliderConfig_"+this.id,n)}disconnectedCallback(){if(this.id&&window.Alpine&&window.Alpine.store){let i="sliderConfig_"+this.id;typeof window.Alpine.store(i)<"u"&&window.Alpine.store(i,{})}}}customElements.define("my-slider",t)}return window.Alpine.data("carouselController",()=>({config:a,currentIndex:0,autoplayInterval:null,images:[],transitionType:"slide",autoplayEnabled:!0,interval:5,transitionDuration:1.2,imagePosition:"center",showIndicators:!0,showControl:!1,noFillet:!1,useSwipe:!1,touchStartX:0,touchStartY:0,touchEndX:0,lastDeltaX:0,dragOffset:0,mouseDown:!1,isDragging:!1,isSwiping:!1,minSwipeDistance:50,swipeThreshold:.15,init(){if(this.$el&&this.$el.closest("my-slider")&&this.$el.closest("my-slider").id){let e=this.$el.closest("my-slider"),i=window.Alpine.store("sliderConfig_"+e.id);i&&(this.config=i,i.transitionType&&(this.transitionType=i.transitionType),i.autoplayEnabled!==void 0&&(this.autoplayEnabled=i.autoplayEnabled),i.interval&&(this.interval=i.interval),i.transitionDuration&&(this.transitionDuration=i.transitionDuration),i.imagePosition&&(this.imagePosition=i.imagePosition),i.showIndicators!==void 0&&(this.showIndicators=i.showIndicators),i.showControl!==void 0&&(this.showControl=i.showControl),i.noFillet!==void 0&&(this.noFillet=i.noFillet),i.useSwipe!==void 0&&(this.useSwipe=i.useSwipe),i.images&&Array.isArray(i.images)&&(this.images=i.images))}else this.config&&Object.entries(this.config).forEach(([e,i])=>{e in this&&(this[e]=i)});this.autoplayEnabled&&this.startAutoplay();let t=this.$el.querySelector(".carousel-container");t&&(t.addEventListener("mouseenter",()=>{this.autoplayEnabled&&this.stopAutoplay()}),t.addEventListener("mouseleave",()=>{this.autoplayEnabled&&this.startAutoplay()})),this.$watch("transitionType",()=>{}),this.$watch("autoplayEnabled",e=>{e?this.startAutoplay():this.stopAutoplay()}),this.$watch("interval",()=>{this.autoplayEnabled&&(this.stopAutoplay(),this.startAutoplay())}),this.$watch("transitionDuration",()=>{this.updateStyles()}),this.$nextTick(()=>{this.setupSwipeHandlers()})},updateStyles(){},getItemStyle(){return this.transitionType=="fade"?{transition:`opacity ${this.transitionDuration}s ease`,animation:`fadeIn ${this.transitionDuration}s ease`}:{}},next(){this.currentIndex=(this.currentIndex+1)%this.images.length},prev(){this.currentIndex=(this.currentIndex-1+this.images.length)%this.images.length},goToSlide(t){this.currentIndex=t},startAutoplay(){this.stopAutoplay(),this.autoplayInterval=setInterval(()=>{this.next()},this.interval*1e3)},stopAutoplay(){clearInterval(this.autoplayInterval)},setupSwipeHandlers(){let t=this.$el.querySelector(".carousel-container");t&&(t.addEventListener("touchstart",e=>this.handleTouchStart(e),{passive:!1}),t.addEventListener("touchmove",e=>this.handleTouchMove(e),{passive:!1}),t.addEventListener("touchend",e=>this.handleTouchEnd(e),{passive:!1}),t.addEventListener("mousedown",e=>this.handleMouseDown(e)),window.addEventListener("mousemove",e=>this.handleMouseMove(e)),window.addEventListener("mouseup",()=>this.handleMouseUp()))},handleTouchStart(t){if(!this.useSwipe||this.transitionType!=="slide")return;this.touchStartX=t.touches[0].clientX,this.touchStartY=t.touches[0].clientY,this.lastDeltaX=0,this.dragOffset=0,this.isSwiping=!1,this.autoplayEnabled&&this.stopAutoplay();let e=this.$el.querySelector(".carousel-inner");e&&(e.style.transition="none")},handleTouchMove(t){if(!this.useSwipe||this.transitionType!=="slide"||!this.touchStartX)return;let e=t.touches[0].clientX,i=t.touches[0].clientY,s=e-this.touchStartX,n=i-this.touchStartY;if(!this.isSwiping&&!this.isDragging&&Math.abs(s)>Math.abs(n)&&Math.abs(s)>10&&(this.isSwiping=!0,this.isDragging=!0,t.preventDefault()),this.isSwiping){t.preventDefault();let r=this.$el.querySelector(".carousel-container"),u=this.$el.querySelector(".carousel-inner");if(r&&u){this.dragOffset=s/r.offsetWidth*100,(this.currentIndex===0&&s>0||this.currentIndex===this.images.length-1&&s<0)&&(this.dragOffset/=2);let d=-this.currentIndex*100+this.dragOffset;u.style.transform=`translateX(${d}%)`}this.touchEndX=e,this.lastDeltaX=s}},handleTouchEnd(t){if(!this.useSwipe||this.transitionType!=="slide"||!this.isSwiping){this.autoplayEnabled&&this.startAutoplay();return}if(this.isSwiping){t.preventDefault();let e=this.$el.querySelector(".carousel-container"),i=this.$el.querySelector(".carousel-inner");if(i){i.style.transition=`transform ${this.transitionDuration}s ease`;let s=e?e.offsetWidth*this.swipeThreshold:this.minSwipeDistance;Math.abs(this.lastDeltaX)>s?this.lastDeltaX>0?this.prev():this.next():i.style.transform=`translateX(${-this.currentIndex*100}%)`}}this.touchStartX=0,this.touchEndX=0,this.touchStartY=0,this.lastDeltaX=0,this.dragOffset=0,this.isDragging=!1,this.isSwiping=!1,this.autoplayEnabled&&this.startAutoplay()},handleMouseDown(t){if(!this.useSwipe||this.transitionType!=="slide")return;t.preventDefault(),this.mouseDown=!0,this.touchStartX=t.clientX,this.touchStartY=t.clientY,this.lastDeltaX=0,this.dragOffset=0,this.isSwiping=!1,this.autoplayEnabled&&this.stopAutoplay();let e=this.$el.querySelector(".carousel-inner");e&&(e.style.transition="none"),document.body.style.cursor="grabbing"},handleMouseMove(t){if(!this.useSwipe||!this.mouseDown)return;let e=t.clientX-this.touchStartX,i=t.clientY-this.touchStartY;if(!this.isSwiping&&!this.isDragging&&Math.abs(e)>Math.abs(i)&&Math.abs(e)>10&&(this.isSwiping=!0,this.isDragging=!0,t.preventDefault()),this.isSwiping){t.preventDefault();let s=this.$el.querySelector(".carousel-container"),n=this.$el.querySelector(".carousel-inner");if(s&&n){this.dragOffset=e/s.offsetWidth*100,(this.currentIndex===0&&e>0||this.currentIndex===this.images.length-1&&e<0)&&(this.dragOffset/=2);let r=-this.currentIndex*100+this.dragOffset;n.style.transform=`translateX(${r}%)`}this.touchEndX=t.clientX,this.lastDeltaX=e}},handleMouseUp(){if(!(!this.useSwipe||!this.mouseDown)){if(document.body.style.cursor="",this.isSwiping){let t=this.$el.querySelector(".carousel-container"),e=this.$el.querySelector(".carousel-inner");if(e){e.style.transition=`transform ${this.transitionDuration}s ease`;let s=t?t.offsetWidth*this.swipeThreshold:this.minSwipeDistance;Math.abs(this.lastDeltaX)>s?this.lastDeltaX>0?this.prev():this.next():e.style.transform=`translateX(${-this.currentIndex*100}%)`}let i=s=>{s.preventDefault(),s.stopPropagation(),document.removeEventListener("click",i,!0)};document.addEventListener("click",i,!0)}this.mouseDown=!1,this.isDragging=!1,this.isSwiping=!1,this.touchStartX=0,this.touchEndX=0,this.touchStartY=0,this.lastDeltaX=0,this.dragOffset=0,this.autoplayEnabled&&this.startAutoplay()}}})),{mount(t){typeof t=="string"&&(t=document.querySelector(t)),t?t.innerHTML=l:console.error("Cannot find target element.",t)},getTemplate(){return l}}}window.SliderComponent={registerSlider:c};return v(w);})();
