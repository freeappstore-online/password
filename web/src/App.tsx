import { useState, useEffect, useCallback } from "react";
import { Shell } from "./components/Shell";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

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

function getStrength(
  password: string,
  upper: boolean,
  lower: boolean,
  numbers: boolean,
  symbols: boolean,
): { label: string; color: string } {
  if (!password) return { label: "—", color: "var(--muted)" };

  let poolSize = 0;
  if (upper) poolSize += 26;
  if (lower) poolSize += 26;
  if (numbers) poolSize += 10;
  if (symbols) poolSize += SYMBOLS.length;

  const entropy = password.length * Math.log2(poolSize || 1);

  if (entropy < 40) return { label: "Weak", color: "var(--error)" };
  if (entropy < 60) return { label: "Medium", color: "var(--warning)" };
  if (entropy < 80) return { label: "Strong", color: "var(--success)" };
  return { label: "Very Strong", color: "var(--success)" };
}

export default function App() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    setPassword(generatePassword(length, upper, lower, numbers, symbols));
    setCopied(false);
  }, [length, upper, lower, numbers, symbols]);

  useEffect(() => {
    generate();
  }, [generate]);

  const strength = getStrength(password, upper, lower, numbers, symbols);

  async function handleCopy() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const toggles: { label: string; checked: boolean; onChange: (v: boolean) => void }[] = [
    { label: "Uppercase", checked: upper, onChange: setUpper },
    { label: "Lowercase", checked: lower, onChange: setLower },
    { label: "Numbers", checked: numbers, onChange: setNumbers },
    { label: "Symbols", checked: symbols, onChange: setSymbols },
  ];

  return (
    <Shell>
      <div className="max-w-xl mx-auto">
        <h1
          className="text-3xl font-bold mb-6"
          style={{ fontFamily: "Fraunces, serif" }}
        >
          Password Generator
        </h1>

        {/* Password display */}
        <div
          className="p-6 rounded-2xl border break-all text-center"
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: "1.5rem",
            lineHeight: 1.6,
            background: "var(--panel)",
            borderColor: "var(--line)",
            color: "var(--ink)",
            minHeight: "4rem",
          }}
        >
          {password || <span style={{ color: "var(--muted)" }}>No character sets selected</span>}
        </div>

        {/* Strength indicator */}
        <div
          className="mt-2 text-sm font-medium text-right"
          style={{ color: strength.color }}
        >
          {strength.label}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={generate}
            className="flex-1 py-2.5 rounded-xl font-semibold text-white cursor-pointer"
            style={{ background: "var(--accent)" }}
          >
            Generate
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl font-semibold cursor-pointer border"
            style={{
              borderColor: copied ? "var(--success)" : "var(--line)",
              color: copied ? "var(--success)" : "var(--ink)",
              background: "var(--panel)",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Length slider */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Length</label>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: "var(--accent)" }}
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
            className="w-full accent-[var(--accent)]"
          />
        </div>

        {/* Toggles */}
        <div className="mt-6 space-y-3">
          {toggles.map((t) => (
            <label
              key={t.label}
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer"
              style={{
                borderColor: "var(--line)",
                background: "var(--panel)",
              }}
            >
              <span className="text-sm font-medium">{t.label}</span>
              <div
                onClick={(e) => {
                  e.preventDefault();
                  // Prevent disabling the last active toggle
                  const activeCount = toggles.filter((x) => x.checked).length;
                  if (t.checked && activeCount <= 1) return;
                  t.onChange(!t.checked);
                }}
                className="relative w-10 h-6 rounded-full transition-colors"
                style={{
                  background: t.checked ? "var(--accent)" : "var(--line-strong)",
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: t.checked ? "translateX(1.1rem)" : "translateX(0.15rem)",
                  }}
                />
              </div>
            </label>
          ))}
        </div>
      </div>
    </Shell>
  );
}
