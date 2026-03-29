import { useState, type FormEvent } from 'react'
import './App.css'

// TypeScript interface for Todo items
interface Todo {
  id: number
  text: string
  completed: boolean
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState('')

  // Add a new todo
  const addTodo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Form validation: non-empty todos
    const trimmedValue = inputValue.trim()
    if (!trimmedValue) {
      return
    }

    const newTodo: Todo = {
      id: Date.now(), // Simple unique ID using timestamp
      text: trimmedValue,
      completed: false
    }

    setTodos([...todos, newTodo])
    setInputValue('') // Clear input after adding
  }

  // Toggle todo completion status
  const toggleComplete = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ))
  }

  // Delete a todo
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="app">
      <h1>Todo App</h1>

      {/* Form for adding new todos */}
      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a new todo..."
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add
        </button>
      </form>

      {/* Todo list */}
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className="todo-item">
            <span
              className={`todo-text ${todo.completed ? 'completed' : ''}`}
              onClick={() => toggleComplete(todo.id)}
            >
              {todo.text}
            </span>
            <div className="todo-actions">
              <button
                onClick={() => toggleComplete(todo.id)}
                className="complete-button"
              >
                {todo.completed ? '↶' : '✓'}
              </button>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="delete-button"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Empty state message */}
      {todos.length === 0 && (
        <p className="empty-message">No todos yet. Add one above!</p>
      )}
    </div>
  )
}

export default App
