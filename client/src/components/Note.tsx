import { Badge, Button, Col, Row, Stack } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useNote } from "./NoteLayout";
import MarkdownViewer from "./MarkdownViewer";
import { useRef } from "react";

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
      // Dynamically import react-dom/server and React to render MarkdownViewer to static HTML
      const ReactDOMServer = await import("react-dom/server");
      const React = await import("react");
      const MarkdownViewerModule = await import("./MarkdownViewer");

      const htmlContent = ReactDOMServer.renderToStaticMarkup(
        React.createElement(MarkdownViewerModule.default, { markdown: note.markdown })
      );

      // Wrap the HTML content in a full HTML document with styles and base tag
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <base href="${window.location.origin}" />
            <meta charset="utf-8" />
            <title>${note.title || "Note"}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0.5in;
              }
              .markdown-body {
                max-width: 100%;
                word-wrap: break-word;
              }
              a {
                color: blue;
                text-decoration: underline;
              }
              img {
                max-width: 500px;
                max-height: 400px;
                object-fit: contain;
                display: inline-block;
              }
              img, a {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            </style>
          </head>
          <body>
            <div class="markdown-body">
              ${htmlContent}
            </div>
          </body>
        </html>
      `;

      const response = await fetch("http://localhost:3001/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: fullHtml }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title || "note"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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
            <Button onClick={handleExport}>Export as PDF</Button>
          </Stack>
        </Col>
      </Row>
      <div style={{ height:"70vh", borderStyle:"double", padding:"14px", overflowY:"auto",}}>
      <MarkdownViewer markdown={note.markdown} ref={markdownRef} /> {/* Attach the ref */}
      </div>
    </>
  );
}
