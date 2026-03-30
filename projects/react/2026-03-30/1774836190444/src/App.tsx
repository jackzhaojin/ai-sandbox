import { useState, useEffect } from 'react'
import type { Note } from './types'
import { loadNotes, saveNotes } from './utils/storage'
import NoteForm from './components/NoteForm'
import NoteList from './components/NoteList'

function App() {
  const [notes, setNotes] = useState<Note[]>([])

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = loadNotes()
    setNotes(savedNotes)
  }, [])

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  // Generate a simple UUID v4
  const generateId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const handleAddNote = (title: string, body: string) => {
    const newNote: Note = {
      id: generateId(),
      title,
      body,
      createdAt: Date.now(),
    }

    setNotes((prevNotes) => [newNote, ...prevNotes])
  }

  const handleDeleteNote = (id: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id))
  }

  return (
    <div className="app">
      <header>
        <h1>Notes App</h1>
      </header>

      <main>
        <section className="note-form-section">
          <h2>Add a Note</h2>
          <NoteForm onSubmit={handleAddNote} />
        </section>

        <section className="note-list-section">
          <h2>Your Notes</h2>
          <NoteList notes={notes} onDelete={handleDeleteNote} />
        </section>
      </main>
    </div>
  )
}

export default App
