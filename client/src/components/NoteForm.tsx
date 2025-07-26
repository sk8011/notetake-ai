import type {FormEvent} from "react"
import { useRef, useState, useEffect } from "react"
import { Button, Col, Form, Row, Stack, OverlayTrigger, Popover } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import CreatableReactSelect from "react-select/creatable"
import type { NoteData, Tag } from "../App"
import { v4 as uuidV4 } from "uuid"
import MarkdownViewer from "./MarkdownViewer"

type NoteFormProps = {
  onSubmit: (data: NoteData) => void
  onAddTag: (tag: Tag) => void
  availableTags: Tag[]
} & Partial<NoteData>

export function NoteForm({
  onSubmit,
  onAddTag,
  availableTags,
  title = "",
  markdown = "",
  tags = [],
  images = [],
}: NoteFormProps) {
  const titleRef = useRef<HTMLInputElement>(null)
  const markdownRef = useRef<HTMLTextAreaElement>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>(tags)
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localMarkdown, setLocalMarkdown] = useState(markdown)
  const [localImages, setLocalImages] = useState(images);
  const [showImageHelp, setShowImageHelp] = useState(false);

  
  useEffect(() => {
    const tempUploads = JSON.parse(localStorage.getItem("tempUploads") || "[]");

    if (tempUploads.length > 0) {
      Promise.all(
        tempUploads.map((public_id: string) =>
          fetch("http://localhost:3001/api/delete-image", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_id }),
          })
        )
      )
        .then(() => {
          console.log("Orphaned images cleaned up after refresh");
          localStorage.removeItem("tempUploads");
        })
        .catch((err) => console.error("Cleanup failed", err));
    }
  }, []);


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Trigger only if markdown has unsaved edits or there are temp uploads
      const hasUnsavedWork =
        localMarkdown !== markdown || localStorage.getItem("tempUploads");

      if (hasUnsavedWork) {
        e.preventDefault();
        e.returnValue = ""; // required for Chrome and most browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [localMarkdown, markdown]);


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const referencedImages = localImages.filter(image =>
      localMarkdown.includes(image.url)
    );

    const unreferencedImages = localImages.filter(
      image => !referencedImages.some(ref => ref.public_id === image.public_id)
    );

    // Delete images that are no longer referenced
    await Promise.all(
      unreferencedImages.map(image =>
        deleteImage(image.public_id, false) // false => don't touch markdown
      )
    );

    // Proceed with saving only the referenced images
    onSubmit({
      title: titleRef.current!.value,
      markdown: localMarkdown,
      tags: selectedTags,
      images: referencedImages,
    });

    localStorage.removeItem("tempUploads");

    navigate("..");
  }


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:3001/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        
        const newImage = { url: data.url, public_id: data.public_id };

        // Save to state
        setLocalImages(prev => [...prev, newImage]);

        // Save to localStorage
        const tempUploads = JSON.parse(localStorage.getItem("tempUploads") || "[]");
        localStorage.setItem("tempUploads", JSON.stringify([...tempUploads, data.public_id]));

        
        // Add the image markdown to the localMarkdown
        const imageMarkdown = `![${file.name}](${data.url})`;
        
        // Insert at cursor position if possible
        if (markdownRef.current) {
          const textarea = markdownRef.current;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newMarkdown = 
            localMarkdown.substring(0, start) + "\n\n" +
            imageMarkdown + "\n\n" +
            localMarkdown.substring(end);
          setLocalMarkdown(newMarkdown);
        } else {
          // Fallback to appending at the end
          setLocalMarkdown(prev => prev + "\n" + imageMarkdown );
        }
        // show image help after successful upload
        setShowImageHelp(true);
        setTimeout(() => setShowImageHelp(false), 4000); // auto-hide after 4s

      } catch (err) {
        alert("You're only allowed to upload images.");
        console.error(err);
      }
    }
  };

  const deleteImage = async (public_id: string, updateMarkdown = true) => {
    try {
      const response = await fetch("http://localhost:3001/api/delete-image", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_id }),
      });
      
      if (!response.ok) throw new Error("Deletion failed");
      
      // Get the image URL before removing it from localImages
      const imageToDelete = localImages.find(img => img.public_id === public_id);
      
      if (imageToDelete) {
        // Remove the image from localImages
        setLocalImages(prev => prev.filter(image => image.public_id !== public_id));
        
        // Remove the image markdown from localMarkdown if requested
        if (updateMarkdown) {
          const imageUrl = imageToDelete.url;
          const markdownRegex = new RegExp(`!\\[[^\\]]*\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)\\n?`, 'g');
          setLocalMarkdown(prev => prev.replace(markdownRegex, ''));
        }
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  const markdownHelpPopover = (
    <Popover id="markdown-help-popover">
      <Popover.Header as="h3">Markdown Help</Popover.Header>
      <Popover.Body>
        <strong>Bold:</strong> `**text**`<br />
        <em>Italic:</em> `*text*`<br />
        <code>Code:</code> `` `code` ``<br />
        Lists: `- item` or `1. item`<br />
        Links: `[title](url)`<br />
        Images: `![alt](url)`<br />
        ....
        <hr />
        Tap the button to see full guide
      </Popover.Body>
    </Popover>
  );

  return (
    <Form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <Row>
          <Col>
            <Form.Group controlId="title">
              <Form.Label>Title</Form.Label>
              <Form.Control ref={titleRef} required defaultValue={title} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="tags">
              <Form.Label>Tags</Form.Label>
              <div style={{color:"black"}}>
              <CreatableReactSelect
                onCreateOption={label => {
                  const newTag = { id: uuidV4(), label }
                  onAddTag(newTag)
                  setSelectedTags(prev => [...prev, newTag])
                }}
                value={selectedTags.map(tag => {
                  return { label: tag.label, value: tag.id }
                })}
                options={availableTags.map(tag => {
                  return { label: tag.label, value: tag.id }
                })}
                onChange={tags => {
                  setSelectedTags(
                    tags.map(tag => {
                      return { label: tag.label, id: tag.value }
                    })
                  )
                }}
                isMulti
              />
              </div>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group controlId="markdown">
              <Form.Label>Body</Form.Label>
              <div style={{ position: "relative" }}>
                {/* Markdown Help Button inside textarea container */}
                <OverlayTrigger
                  trigger={["hover","focus"]}
                  placement="top"
                  overlay={markdownHelpPopover}
                  rootClose
                >
                  <Button
                    variant="info"
                    size="sm"
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "14px",
                      opacity: 0.6,
                      zIndex: 10,
                    }}
                    title="Markdown Help"
                    as="a"
                    href="https://github.com/im-luka/markdown-cheatsheet/blob/main/complete-markdown-cheatsheet.pdf"
                    target="_blank"
                  >
                    ℹ️
                  </Button>
                </OverlayTrigger>

                {/* Textarea */}
                <Form.Control
                  as="textarea"
                  value={localMarkdown}
                  required
                  rows={15}
                  ref={markdownRef}
                  onChange={(e) => setLocalMarkdown(e.target.value)}
                  style={{
                    height: "50vh",
                    overflowY: "auto",
                    resize: "none",
                  }}
                  spellCheck="false"
                />
              </div>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Preview</Form.Label>
              <div
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: ".25rem",
                  padding: "0.5rem",
                  overflowY: "auto",
                  height:"50vh"
                }}
              >
                <MarkdownViewer markdown={localMarkdown} />
              </div>
            </Form.Group>
          </Col>
        </Row>

        <Stack direction="horizontal" gap={2}>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <OverlayTrigger
            show={showImageHelp}
            placement="top"
            overlay={
              <Popover id="image-help-popover">
                <Popover.Body>
                  🖼️ Image added! To remove it, simply delete the image's markdown link from the note.
                </Popover.Body>
              </Popover>
            }
          >
            <Button
              type="button"
              variant="outline-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              🖼️ Insert Image
            </Button>
          </OverlayTrigger>


          <Button type="submit" variant="primary" className="ms-auto">
            Save
          </Button>
          <Link to=".." className="">
            <Button type="button" variant="outline-secondary">
              Cancel
            </Button>
          </Link>
        </Stack>
      </Stack>
    </Form>
  )
}