const cmpDataTodos = () => {
    const initializerTodo = {
        todos: [],
        init() {
            const todoItems = this.$refs.todoItem
            if (!todoItems || !todoItems.parentNode) { return false }

            for (const todo of todoItems.parentNode.children) {
                if (todo.hasAttribute('is-static')) {
                    this.todos.push(todo.innerText)
                    todo.remove()
                }
            }
        },
        addTodo() {
            const newTodo = `Todo ${this.todos.length + 1}`
            this.todos.push(newTodo)
        },
        removeTodo() {
            if (this.todos.length > 0) { this.todos.pop() }
        }
    }

    return initializerTodo
}
