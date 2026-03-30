import { useState, type FormEvent } from 'react'

interface NoteFormProps {
  onSubmit: (title: string, body: string) => void
}

function NoteForm({ onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Don't submit if both fields are empty
    if (!title.trim() && !body.trim()) {
      return
    }

    onSubmit(title, body)

    // Clear form after submission
    setTitle('')
    setBody('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <textarea
          placeholder="Note body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
        />
      </div>
      <button type="submit">Add Note</button>
    </form>
  )
}

export default NoteForm
