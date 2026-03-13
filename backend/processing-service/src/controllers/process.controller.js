const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

// Language-specific configurations
const LANGUAGE_CONFIG = {
  cpp: {
    extension: ".cpp",
    executable: "program",
    compileCommand: (filePath, outputPath) => `g++ -std=c++17 ${filePath} -o ${outputPath}`,
    runCommand: (executablePath, inputFile) => `${executablePath} < ${inputFile}`,
    timeLimit: 5000, // 5 seconds
  },
  python: {
    extension: ".py",
    executable: null, // Python doesn't need compilation
    compileCommand: null,
    runCommand: (filePath, inputFile) => `python3 ${filePath} < ${inputFile}`,
    timeLimit: 10000, // 10 seconds (Python is slower)
  },
  java: {
    extension: ".java",
    executable: "Solution.class",
    compileCommand: (filePath) => `javac ${filePath}`,
    runCommand: (classPath, inputFile) => `cd ${path.dirname(classPath)} && java Solution < ${inputFile}`,
    timeLimit: 8000, // 8 seconds
  },
};

const processSubmission = async (req, res) => {
  try {
    const { mainCode, inputData, expectedOutput, language = "cpp", problemId = null } = req.body;

    // Validate language
    if (!LANGUAGE_CONFIG[language]) {
      return res.status(400).json({
        status: "error",
        message: "Unsupported language",
        supportedLanguages: Object.keys(LANGUAGE_CONFIG),
      });
    }

    const config = LANGUAGE_CONFIG[language];
    const submissionId = Date.now().toString();
    
    // Create a unique directory for this submission
    const submissionDir = path.join(__dirname, "../../temp", submissionId);
    await fs.mkdir(submissionDir, { recursive: true });

    // Prepare file paths
    const sourceFileName = language === "java" ? "Solution" : "main";
    const sourceFile = path.join(submissionDir, sourceFileName + config.extension);
    const inputFile = path.join(submissionDir, "input.txt");
    const outputFile = path.join(submissionDir, "output.txt");

    try {
      // Write files
      await fs.writeFile(sourceFile, mainCode);
      await fs.writeFile(inputFile, inputData || "");
      await fs.writeFile(outputFile, expectedOutput || "");

      const startTime = Date.now();
      let actualOutput = "";
      let executionTime = 0;

      // Compilation phase (if needed)
      if (config.compileCommand) {
        try {
          const executablePath = language === "cpp" 
            ? path.join(submissionDir, config.executable)
            : sourceFile;
            
          await execPromise(config.compileCommand(sourceFile, executablePath));
        } catch (compileError) {
          await cleanup(submissionDir);
          return res.status(400).json({
            status: "compilation_error",
            message: "Compilation failed",
            error: compileError.stderr || compileError.stdout,
          });
        }
      }

      // Execution phase
      try {
        const executablePath = language === "cpp" 
          ? path.join(submissionDir, config.executable)
          : sourceFile;

        const runCommand = config.runCommand(executablePath, inputFile);
        
        // Execute with timeout
        const { stdout, stderr } = await Promise.race([
          execPromise(runCommand),
          timeoutPromise(config.timeLimit)
        ]);

        executionTime = Date.now() - startTime;
        actualOutput = stdout.trim();

        if (stderr) {
          console.warn("Runtime warnings:", stderr);
        }

      } catch (runtimeError) {
        await cleanup(submissionDir);
        
        if (runtimeError.message === "TIMEOUT") {
          return res.status(400).json({
            status: "time_limit_exceeded",
            message: `Time limit exceeded (${config.timeLimit}ms)`,
            timeLimit: config.timeLimit,
          });
        }

        return res.status(400).json({
          status: "runtime_error",
          message: "Runtime error",
          error: runtimeError.stderr || runtimeError.message,
        });
      }

      // Compare output with expected output
      let isCorrect = false;
      let expectedOutputContent = "";

      if (expectedOutput) {
        expectedOutputContent = expectedOutput.trim();
        // Normalize line endings and trim whitespace for comparison
        const normalizedActual = actualOutput.replace(/\r\n/g, "\n").trim();
        const normalizedExpected = expectedOutputContent.replace(/\r\n/g, "\n").trim();
        isCorrect = normalizedActual === normalizedExpected;
      }

      // Clean up temporary files
      await cleanup(submissionDir);

      // Prepare response
      const result = {
        status: isCorrect ? "accepted" : (expectedOutput ? "wrong_answer" : "success"),
        actualOutput,
        expectedOutput: expectedOutputContent,
        isCorrect,
        executionTime,
        language,
        submissionId,
      };

      if (problemId) {
        result.problemId = problemId;
      }

      return res.json({
        status: "success",
        result,
      });

    } catch (error) {
      await cleanup(submissionDir);
      throw error;
    }

  } catch (error) {
    console.error("Processing error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Helper function for cleanup
const cleanup = async (dir) => {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (cleanupError) {
    console.warn("Cleanup warning:", cleanupError.message);
  }
};

// Helper function for timeout
const timeoutPromise = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("TIMEOUT")), ms);
  });
};

module.exports = {
  processSubmission,
};
