import "bootstrap/dist/css/bootstrap.min.css"
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useMemo, useState } from "react"
import { Container } from "react-bootstrap"
import { Routes, Route, Navigate } from "react-router-dom"
import { NewNote } from "./components/NewNote"
import { useLocalStorage } from "./useLocalStorage"
import { v4 as uuidV4 } from "uuid"
import { NoteList } from "./components/NoteList"
import { NoteLayout } from "./components/NoteLayout"
import { Note } from "./components/Note"
import { EditNote } from "./components/EditNote"
import ChatBot from "./components/Chatbot"
import { ThemeSwitcher } from "./components/ThemeSwitch"
import { ThemeProvider } from "./components/ThemeContext"
import { LoadingScreen } from "./components/LoadingScreen"

export type Note = {
  id: string
} & NoteData

export type RawNote = {
  id: string
  images: { url: string; public_id: string }[];
} & RawNoteData

export type RawNoteData = {
  title: string
  markdown: string
  tagIds: string[]
}

export type NoteData = {
  title: string
  markdown: string
  tags: Tag[]
  images: { url: string; public_id: string }[];
}

export type Tag = {
  id: string
  label: string
}

function App() {
  const [notes, setNotes] = useLocalStorage<RawNote[]>("NOTES", [])
  const [tags, setTags] = useLocalStorage<Tag[]>("TAGS", [])
  const [isLoaded, setIsLoaded]=useState(false);

  const notesWithTags = useMemo(() => {
    return notes.map(note => {
      return { 
        ...note, 
        tags: tags.filter(tag => note.tagIds.includes(tag.id)),
        images: note.images || []
      }
    })
  }, [notes, tags])

  function onCreateNote({ tags, images, ...data }: NoteData) {
    setNotes(prevNotes => {
      return [
        ...prevNotes,
        { ...data, id: uuidV4(), tagIds: tags.map(tag => tag.id), images },
      ]
    })
  }

  function onUpdateNote(id: string, { tags, images, ...data }: NoteData) {
    setNotes(prevNotes => {
      return prevNotes.map(note => {
        if (note.id === id) {
          return { ...note, ...data, tagIds: tags.map(tag => tag.id), images }
        } else {
          return note
        }
      })
    })
  }

  function onDeleteNote(id: string) {
    setNotes(prevNotes => {
      return prevNotes.filter(note => note.id !== id)
    })
  }

  function addTag(tag: Tag) {
    setTags(prev => [...prev, tag])
  }

  function updateTag(id: string, label: string) {
    setTags(prevTags => {
      return prevTags.map(tag => {
        if (tag.id === id) {
          return { ...tag, label }
        } else {
          return tag
        }
      })
    })
  }

  function deleteTag(id: string) {
    setTags(prevTags => {
      return prevTags.filter(tag => tag.id !== id)
    })
  }

  return (
    <>
    {!isLoaded && <LoadingScreen onComplete={()=>{setIsLoaded(true)}} />}
    { isLoaded &&
    <ThemeProvider>
    <Container className="my-4">
      <ThemeSwitcher />
      <Routes>
        <Route
          path="/"
          element={
            <NoteList
              notes={notesWithTags}
              availableTags={tags}
              onUpdateTag={updateTag}
              onDeleteTag={deleteTag}
            />
          }
        />
        <Route
          path="/new"
          element={
            <NewNote
              onSubmit={onCreateNote}
              onAddTag={addTag}
              availableTags={tags}
            />
          }
        />
        <Route path="/:id" element={<NoteLayout notes={notesWithTags} />}>
          <Route index element={<Note onDelete={onDeleteNote} />} />
          <Route
            path="edit"
            element={
              <EditNote
                onSubmit={onUpdateNote}
                onAddTag={addTag}
                availableTags={tags}
              />
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ChatBot notes={notesWithTags} />
    </Container>
    </ThemeProvider>
    }
    </>
  )
}

export default App
