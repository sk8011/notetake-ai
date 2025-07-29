import { Badge, Button, Col, Row, Stack } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useNote } from "./NoteLayout";
import MarkdownViewer from "./MarkdownViewer";
import { useRef } from "react";
import html2pdf from "html2pdf.js";

type NoteProps = {
  onDelete: (id: string) => void;
};

export function Note({ onDelete }: NoteProps) {
  const note = useNote();
  const navigate = useNavigate();
  const markdownRef = useRef<HTMLDivElement>(null); // Ref to the MarkdownViewer

  const handleExport = async () => {
    if (!note.markdown) return;

    try {
      const ReactDOMServer = await import("react-dom/server");
      const React = await import("react");
      const MarkdownViewerModule = await import("./MarkdownViewer");

      // 1. Convert React markdown to static HTML string
      const htmlContent = ReactDOMServer.renderToStaticMarkup(
        React.createElement(MarkdownViewerModule.default, { markdown: note.markdown })
      );

      // 2. Create a visible offscreen container to allow proper rendering
      const container = document.createElement("div");
      container.innerHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 1in;
                color: black;
              }
              .markdown-body {
                max-width: 100%;
                word-wrap: break-word;
              }
              a {
                color: blue;
                text-decoration: underline;
              }
              img, a {
                page-break-inside: avoid;
                break-inside: avoid;
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            <div class="markdown-body">${htmlContent}</div>
          </body>
        </html>
      `;

      // ⚠️ Append to DOM (must be visible enough to render)
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      // 3. Generate the PDF from the actual inner content
      const elementToPrint = container.querySelector(".markdown-body");
      if (!elementToPrint) throw new Error("Rendered HTML not found");

      const opt = {
        margin:       0.5,
        filename:     `${note.title || "note"}.pdf`,
        image:        { type: "jpeg", quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak:    {
          mode: ["avoid-all","css","legacy"],
        },
      };

      await html2pdf().set(opt).from(elementToPrint).save();

      // 4. Cleanup
      document.body.removeChild(container);
    } catch (error) {
      console.error("Export PDF error:", error);
      alert("Failed to export PDF");
    }
  };



  return (
    <>
      <Row className="align-items-center mb-4">
        <Col>
          <h1>{note.title}</h1>
          {note.tags.length > 0 && (
            <Stack gap={1} direction="horizontal" className="flex-wrap">
              {note.tags.map((tag) => (
                <Badge className="text-truncate" key={tag.id}>
                  {tag.label}
                </Badge>
              ))}
            </Stack>
          )}
        </Col>
        <Col xs="auto">
          <Stack gap={2} direction="horizontal">
            <Link to={`/${note.id}/edit`}>
              <Button variant="primary">Edit</Button>
            </Link>
            <Button
              onClick={() => {
                onDelete(note.id);
                navigate("/");
              }}
              variant="outline-danger"
            >
              Delete
            </Button>
            <Link to="/">
              <Button variant="outline-secondary">Back</Button>
            </Link>
            <Button onClick={handleExport}>Export as HTML</Button>
          </Stack>
        </Col>
      </Row>
      <div style={{ height:"70vh", borderStyle:"double", padding:"14px", overflowY:"auto",}}>
      <MarkdownViewer markdown={note.markdown} ref={markdownRef} /> {/* Attach the ref */}
      </div>
    </>
  );
}
