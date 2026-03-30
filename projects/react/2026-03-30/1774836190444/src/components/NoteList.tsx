import type { Note } from '../types'
import NoteItem from './NoteItem'

interface NoteListProps {
  notes: Note[]
  onDelete: (id: string) => void
}

function NoteList({ notes, onDelete }: NoteListProps) {
  if (notes.length === 0) {
    return <p className="empty-message">No notes yet. Add one above!</p>
  }

  return (
    <div className="note-list">
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} onDelete={onDelete} />
      ))}
    </div>
  )
}

export default NoteList
