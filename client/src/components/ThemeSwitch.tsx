import { Button, Col, Row, Stack } from "react-bootstrap";
import { useTheme } from "./ThemeContext";

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Row className="align-items-center mb-4">
      <Col xs="auto">
        <Stack gap={2} direction="horizontal">
          <Button onClick={toggleTheme}>
            {theme === "light" ? (
              <i className="bi bi-sun-fill"></i>
            ) : (
              <i className="bi bi-moon-fill"></i>
            )}
          </Button>
        </Stack>
      </Col>
    </Row>
  );
}