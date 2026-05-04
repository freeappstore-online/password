import { useState, useEffect, useCallback } from "react";
import { Shell } from "./components/Shell";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

const HISTORY_KEY = "pw-history";
const MAX_HISTORY = 10;

function generatePassword(
  length: number,
  upper: boolean,
  lower: boolean,
  numbers: boolean,
  symbols: boolean,
): string {
  let chars = "";
  if (upper) chars += UPPERCASE;
  if (lower) chars += LOWERCASE;
  if (numbers) chars += NUMBERS;
  if (symbols) chars += SYMBOLS;
  if (!chars) return "";

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join("");
}

type Strength = { label: string; color: string; percent: number };

function getStrength(
  password: string,
  upper: boolean,
  lower: boolean,
  numbers: boolean,
  symbols: boolean,
): Strength {
  if (!password) return { label: "", color: "var(--color-muted)", percent: 0 };

  let poolSize = 0;
  if (upper) poolSize += 26;
  if (lower) poolSize += 26;
  if (numbers) poolSize += 10;
  if (symbols) poolSize += SYMBOLS.length;

  const entropy = password.length * Math.log2(poolSize || 1);

  if (entropy < 40) return { label: "Weak", color: "#ef4444", percent: 25 };
  if (entropy < 60) return { label: "Fair", color: "#f59e0b", percent: 50 };
  if (entropy < 80) return { label: "Strong", color: "#22c55e", percent: 75 };
  return { label: "Very Strong", color: "var(--color-accent)", percent: 100 };
}

function loadHistory(): string[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function App() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

  const generate = useCallback(() => {
    const pw = generatePassword(length, upper, lower, numbers, symbols);
    setPassword(pw);
    setCopied(false);
    if (pw) {
      setHistory((prev) => {
        const next = [pw, ...prev.filter((p) => p !== pw)].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
    }
  }, [length, upper, lower, numbers, symbols]);

  useEffect(() => {
    generate();
  }, [generate]);

  const strength = getStrength(password, upper, lower, numbers, symbols);

  async function handleCopy(text?: string) {
    const value = text ?? password;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const toggles: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }[] = [
    { label: "ABC", checked: upper, onChange: setUpper },
    { label: "abc", checked: lower, onChange: setLower },
    { label: "123", checked: numbers, onChange: setNumbers },
    { label: "#$%", checked: symbols, onChange: setSymbols },
  ];

  return (
    <Shell>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Password display */}
        <div
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: password.length > 32 ? "1rem" : "1.35rem",
            lineHeight: 1.6,
            background: "var(--color-panel)",
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--color-line)",
            color: "var(--color-ink)",
            padding: "1.5rem",
            minHeight: "5rem",
            wordBreak: "break-all",
            textAlign: "center",
            userSelect: "text",
            WebkitUserSelect: "text",
            letterSpacing: "0.05em",
          }}
        >
          {password || (
            <span style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
              No character types selected
            </span>
          )}
        </div>

        {/* Strength bar */}
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: "var(--color-line)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${strength.percent}%`,
                height: "100%",
                borderRadius: 3,
                background: strength.color,
                transition: "width 0.3s, background 0.3s",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: strength.color,
              minWidth: 75,
              textAlign: "right",
            }}
          >
            {strength.label}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={generate}
            style={{
              flex: 1,
              padding: "0.7rem 0",
              borderRadius: "var(--radius-btn)",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "#fff",
              background: "var(--color-accent)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            Generate
          </button>
          <button
            onClick={() => handleCopy()}
            style={{
              flex: 1,
              padding: "0.7rem 0",
              borderRadius: "var(--radius-btn)",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: copied ? "#22c55e" : "var(--color-ink)",
              background: "var(--color-panel)",
              border: `1px solid ${copied ? "#22c55e" : "var(--color-line)"}`,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Length slider */}
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-ink)",
              }}
            >
              Length
            </label>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "var(--color-accent)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {length}
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--color-accent)" }}
          />
        </div>

        {/* Character type toggles */}
        <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
          {toggles.map((t) => {
            const activeCount = toggles.filter((x) => x.checked).length;
            const disabled = t.checked && activeCount <= 1;
            return (
              <button
                key={t.label}
                onClick={() => {
                  if (disabled) return;
                  t.onChange(!t.checked);
                }}
                style={{
                  flex: 1,
                  padding: "0.6rem 0",
                  borderRadius: "var(--radius-btn)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  fontFamily: t.label === "ABC" || t.label === "abc"
                    ? "var(--font-body)"
                    : "'Courier New', Courier, monospace",
                  color: t.checked ? "#fff" : "var(--color-muted)",
                  background: t.checked ? "var(--color-accent)" : "var(--color-panel)",
                  border: `1px solid ${t.checked ? "var(--color-accent)" : "var(--color-line)"}`,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* History section */}
        {history.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--color-muted)",
                padding: 0,
                fontFamily: "var(--font-body)",
              }}
            >
              History ({history.length}){" "}
              <span style={{ fontSize: "0.7rem" }}>
                {showHistory ? "\u25B2" : "\u25BC"}
              </span>
            </button>

            {showHistory && (
              <div
                style={{
                  marginTop: 10,
                  borderRadius: "var(--radius-card)",
                  border: "1px solid var(--color-line)",
                  background: "var(--color-panel)",
                  overflow: "hidden",
                }}
              >
                {history.map((pw, i) => (
                  <div
                    key={`${pw}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.8rem",
                      borderTop: i > 0 ? "1px solid var(--color-line)" : "none",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: "0.75rem",
                        color: "var(--color-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        userSelect: "text",
                        WebkitUserSelect: "text",
                      }}
                    >
                      {pw}
                    </span>
                    <button
                      onClick={() => handleCopy(pw)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "var(--color-accent)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontFamily: "var(--font-body)",
                        flexShrink: 0,
                      }}
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile FreeAppStore link */}
        <div
          style={{
            marginTop: 40,
            textAlign: "center",
            fontSize: "0.75rem",
          }}
        >
          <a
            href="https://freeappstore.online"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-muted)", textDecoration: "none" }}
          >
            Part of FreeAppStore — free forever
          </a>
        </div>
      </div>
    </Shell>
  );
}

export default App;
