var TodoComponent=(()=>{var d=Object.defineProperty;var a=Object.getOwnPropertyDescriptor;var c=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var m=(o,t)=>{for(var e in t)d(o,e,{get:t[e],enumerable:!0})},u=(o,t,e,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of c(t))!p.call(o,n)&&n!=e&&d(o,n,{get:()=>t[n],enumerable:!(i=a(t,n))||i.enumerable});return o};var f=o=>u(d({},"__esModule",{value:!0}),o);var T={};m(T,{registerTodo:()=>l});var s='<div x-data="todoComponent" x-init="init()" class="alpine-todo-component"><div class="alpine-todo-component__controls"><button @click="addTodo()" class="alpine-todo-component__button add">Add Todo</button><button @click="removeTodo()" class="alpine-todo-component__button remove">Remove Todo</button></div><ul class="alpine-todo-component__list"><li is-static x-ref="todoItem" class="alpine-todo-component__item">Todo 1</li><li is-static x-ref="todoItem" class="alpine-todo-component__item">Todo 2</li><template x-if="todos.length > 0"><template x-for="(todo, index) in todos" :key="index"><li x-text="todo" class="alpine-todo-component__item"></li></template></template></ul></div>';function l(){return window.Alpine?(window.Alpine.data("todoComponent",()=>({todos:[],init(){window.Alpine.nextTick(()=>{let o=this.$refs.todoItem;if(o&&!Array.isArray(o)){let t=o.length?Array.from(o):[o];for(let e of t){let i=e.parentNode;i&&i.querySelectorAll("[is-static]").forEach(r=>{this.todos.push(r.innerText),r.remove()})}}})},addTodo(){let o=`Todo ${this.todos.length+1}`;this.todos.push(o)},removeTodo(){this.todos.length>0&&this.todos.pop()}})),{mount(o){typeof o=="string"&&(o=document.querySelector(o)),o?o.innerHTML=s:console.error("\uB300\uC0C1 \uC5D8\uB9AC\uBA3C\uD2B8\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4:",o)},getTemplate(){return s}}):(console.error("Alpine.js is not loaded. Please load Alpine.js first."),null)}typeof document<"u"&&document.addEventListener("DOMContentLoaded",()=>{window.Alpine&&document.querySelectorAll("[data-todo-mount]").forEach(o=>{let t=l();t&&t.mount(o)})});window.TodoComponent={registerTodo:l};return f(T);})();
