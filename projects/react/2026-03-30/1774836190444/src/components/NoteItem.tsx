import type { Note } from '../types'

interface NoteItemProps {
  note: Note
  onDelete: (id: string) => void
}

function NoteItem({ note, onDelete }: NoteItemProps) {
  const formattedDate = new Date(note.createdAt).toLocaleString()

  return (
    <div className="note-item">
      <div className="note-header">
        <h3>{note.title || 'Untitled'}</h3>
        <button onClick={() => onDelete(note.id)} className="delete-btn">
          Delete
        </button>
      </div>
      <p className="note-body">{note.body}</p>
      <p className="note-date">{formattedDate}</p>
    </div>
  )
}

export default NoteItem
