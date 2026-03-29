import express from "express";
import multer from "multer";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const app = express();
const PORT = 3000;
const upload = multer({ dest: "uploads/" });

app.use(express.json());

// Mock "Compiler" Logic
function generateMockBinary(sourceCode: string, isMalicious: boolean = false, compilerName: string = ""): Buffer {
  // Simple deterministic "binary" generation based on source code
  let baseData = Buffer.from(sourceCode.split("").reverse().join(""));
  
  // Simulate natural compiler differences (e.g., timestamps, optimizations)
  // We use the compiler name to generate a unique "signature" or "noise"
  if (compilerName) {
    const compilerHash = Buffer.from(compilerName).slice(0, 4);
    baseData = Buffer.concat([baseData, compilerHash]);
  }

  if (isMalicious) {
    // Inject "malicious" bytes (e.g., a backdoor payload)
    const backdoor = Buffer.from([0x48, 0x31, 0xc0, 0x48, 0x31, 0xff, 0x48, 0x31, 0xf6, 0x48, 0x31, 0xd2, 0x48, 0x8d, 0x3d, 0x00, 0x00, 0x00, 0x00, 0x0f, 0x05]);
    const pos = Math.floor(baseData.length / 2);
    return Buffer.concat([baseData.slice(0, pos), backdoor, baseData.slice(pos)]);
  }
  return baseData;
}

// Disassembly Simulation
function disassemble(diffBytes: Buffer, isMalicious: boolean): string[] {
  const baseInstructions = [
    "0x401000: mov rax, 1",
    "0x401007: mov rdi, 1",
    "0x40100e: lea rsi, [rip + 0x2000]",
    "0x401015: mov rdx, 13",
    "0x40101c: syscall",
    "0x40101e: mov rax, 60",
    "0x401025: xor rdi, rdi",
    "0x40102c: syscall"
  ];
  
  if (isMalicious) {
    return [
      ...baseInstructions.slice(0, 4),
      "// SUSPICIOUS INJECTION DETECTED",
      "0x40201a: mov rax, 59 // execve",
      "0x402021: lea rdi, [rip + 0x100] // /bin/sh",
      "0x402028: xor rsi, rsi",
      "0x40202b: xor rdx, rdx",
      "0x40202e: syscall",
      ...baseInstructions.slice(4)
    ];
  }

  if (diffBytes.length > 0) {
    return [
      ...baseInstructions,
      "// COMPILER OPTIMIZATION DIFFERENCES",
      "0x403000: nop",
      "0x403001: align 16",
      "0x403008: mov r8, r9 // Register allocation diff"
    ];
  }

  return baseInstructions;
}

app.post("/api/validate", upload.single("sourceFile"), (req, res) => {
  const { simulateAttack, sourceCode, suspectCompiler, referenceCompiler } = req.body;
  const isAttack = simulateAttack === "true" || simulateAttack === true;
  
  // 1. "Compile" with Suspect Compiler
  const suspectBinary = generateMockBinary(sourceCode, isAttack, suspectCompiler);
  
  // 2. "Compile" with Trusted Compiler
  const trustedBinary = generateMockBinary(sourceCode, false, referenceCompiler);
  
  // 3. Compare Binaries
  const differences: { offset: number; suspect: number; trusted: number | null }[] = [];
  const maxLen = Math.max(suspectBinary.length, trustedBinary.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (suspectBinary[i] !== trustedBinary[i]) {
      differences.push({
        offset: i,
        suspect: suspectBinary[i] || 0,
        trusted: trustedBinary[i] !== undefined ? trustedBinary[i] : null
      });
    }
  }
  
  // 4. Analyze Source Code Risk
  const riskyKeywords = ["system", "exec", "socket", "connect", "ptrace", "mmap", "shm", "fork"];
  const riskCount = riskyKeywords.filter(kw => sourceCode.toLowerCase().includes(kw)).length;
  const sourceComplexity = sourceCode.length / 100; // Rough metric

  // 5. Calculate Dynamic Score
  let score = 100;
  const diffRatio = differences.length / maxLen;
  
  if (isAttack) {
    // Attack simulation: significantly lower score
    // Riskier code (using system calls) makes an attack even more dangerous
    const riskPenalty = riskCount * 2;
    score = Math.max(5, Math.floor(45 - (diffRatio * 150) - riskPenalty));
  } else if (differences.length > 0) {
    // Natural differences (optimizations)
    // If the code is simple (low complexity) but has many differences, it's more suspicious
    const complexityBonus = Math.min(10, sourceComplexity);
    const suspicionFactor = (differences.length / (sourceCode.length + 1)) * 100;
    
    score = Math.max(70, Math.floor(100 - (diffRatio * 400) - suspicionFactor + complexityBonus));
  }
  
  // Adjust score based on specific risky patterns in the source
  if (riskCount > 3 && differences.length > 0) {
    score = Math.max(score - 10, 5); // Extra penalty for differences in high-risk code
  }

  let verdict = "TRUSTED";
  if (score < 60) verdict = "COMPROMISED";
  else if (score < 92) verdict = "SUSPICIOUS";
  
  // 6. Disassemble
  const diffBuffer = Buffer.from(differences.map(d => d.suspect));
  const disassembly = disassemble(diffBuffer, isAttack);
  
  res.json({
    score,
    verdict,
    differences,
    disassembly,
    suspectBinary: suspectBinary.toString("hex"),
    trustedBinary: trustedBinary.toString("hex"),
    stats: {
      diffCount: differences.length,
      sizeDiff: suspectBinary.length - trustedBinary.length,
      patterns: isAttack ? ["Backdoor Shellcode", "Syscall Injection"] : [],
      riskLevel: riskCount > 3 ? "High" : riskCount > 0 ? "Medium" : "Low"
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
