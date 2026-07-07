import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadParser() {
  try {
    const { parseCreateTask } = await import(
      join(root, "src/lib/ai-command-router/parse-create-task.ts")
    );
    return parseCreateTask;
  } catch {
    console.error(
      "Run with: npx tsx scripts/verify-parse-create-task.mjs"
    );
    process.exit(1);
  }
}

const cases = [
  {
    input: "crea task per Mioni inviare documenti",
    title: "Inviare documenti",
    projectRef: "Mioni",
    confidence: "high",
  },
  {
    input: "aggiungi task a Villa Rossi inviare preventivo",
    title: "Inviare preventivo",
    projectRef: "Villa Rossi",
    confidence: "high",
  },
  {
    input: "nuova task progetto Hotel Milano verificare illuminazione",
    title: "Verificare illuminazione",
    projectRef: "Hotel Milano",
    confidence: "high",
  },
  {
    input: "crea task per Mioni chiamare il cliente",
    title: "Chiamare il cliente",
    projectRef: "Mioni",
    confidence: "high",
  },
  {
    input: "task urgente consegna progetto 1",
    title: "Consegna",
    projectRef: "1",
    confidence: "high",
  },
  {
    input: "task per Mioni",
    title: "",
    projectRef: "Mioni",
    confidence: "low",
  },
];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

const parseCreateTask = await loadParser();

for (const testCase of cases) {
  const result = parseCreateTask(testCase.input);

  if (!result) {
    fail(`"${testCase.input}" did not match create_task`);
    continue;
  }

  if (result.title !== testCase.title) {
    fail(
      `"${testCase.input}" title = "${result.title}", expected "${testCase.title}"`
    );
    continue;
  }

  if (result.projectRef !== testCase.projectRef) {
    fail(
      `"${testCase.input}" projectRef = "${result.projectRef}", expected "${testCase.projectRef}"`
    );
    continue;
  }

  if (result.confidence !== testCase.confidence) {
    fail(
      `"${testCase.input}" confidence = "${result.confidence}", expected "${testCase.confidence}"`
    );
    continue;
  }

  pass(testCase.input);
}

if (failures > 0) {
  process.exit(1);
}

console.log(`All ${cases.length} parse-create-task cases passed.`);
