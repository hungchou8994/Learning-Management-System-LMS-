"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  getProblemById,
  Problem as ApiProblem,
  getProblemForSubmission,
  submitToProcessingService,
  saveSubmission,
  SubmissionResult,
} from "@/lib/api";
import {
  Loader2,
  AlertCircle,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
} from "lucide-react";
import FormattedDescription from "@/components/common/FormattedDescription";
import styles from "./styles.module.scss";

interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
  explanation?: string;
}

interface TutorialStep {
  stepNumber: number;
  title: string;
  description: string;
  hint?: string;
  codeTemplate: {
    cpp?: string;
    python?: string;
    java?: string;
  };
  expectedOutput?: string;
  isCompleted: boolean;
}

interface Problem {
  _id: string;
  title: string;
  description: string;
  rank: "S" | "A" | "B" | "C" | "D";
  testCases: TestCase[];
  isInteractiveTutorial: boolean;
  tutorialSteps: TutorialStep[];
  languageTemplates: {
    cpp: string;
    python: string;
    java: string;
  };
  supportedLanguages: string[];
  hints: Array<{
    level: number;
    content: string;
    cost: number;
  }>;
}

const ProblemSolvePage = ({ params }: { params: { problemId: string } }) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<
    "cpp" | "python" | "java"
  >("cpp");
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState("");

  // Tutorial mode states
  const [isTutorialMode, setIsTutorialMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);

  // Test results
  const [testResults, setTestResults] = useState<
    Array<{
      passed: boolean;
      input: string;
      expected: string;
      actual: string;
      error?: string;
    }>
  >([]);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [showSubmissionResult, setShowSubmissionResult] = useState(false);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProblemById(params.problemId);

      if (response.success && response.data) {
        // Convert ApiProblem to local Problem interface
        const apiProblem = response.data as ApiProblem;
        const localProblem: Problem = {
          _id: apiProblem._id,
          title: apiProblem.title,
          description: apiProblem.description,
          rank: apiProblem.rank,
          testCases: apiProblem.testCases.map((tc) => ({
            input: tc.input,
            output: tc.output,
            isHidden: tc.isHidden,
            explanation: tc.explanation,
          })),
          isInteractiveTutorial: apiProblem.isInteractiveTutorial,
          tutorialSteps: apiProblem.tutorialSteps || [],
          languageTemplates: {
            cpp: apiProblem.languageTemplates.cpp || "",
            python: apiProblem.languageTemplates.python || "",
            java: apiProblem.languageTemplates.java || "",
          },
          supportedLanguages: apiProblem.supportedLanguages,
          hints: apiProblem.hints,
        };

        setProblem(localProblem);
        setIsTutorialMode(localProblem.isInteractiveTutorial);
        setCode(localProblem.languageTemplates[selectedLanguage]);
      } else {
        setError(response.error?.message || "Failed to load problem");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error fetching problem:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblem();
  }, [params.problemId]);

  // Debug submission result state changes
  useEffect(() => {
    console.log("Submission state changed:");
    console.log("- showSubmissionResult:", showSubmissionResult);
    console.log("- submissionResult:", submissionResult);
    console.log("- isSubmitting:", isSubmitting);
  }, [showSubmissionResult, submissionResult, isSubmitting]);

  useEffect(() => {
    if (problem && isTutorialMode && problem.tutorialSteps.length > 0) {
      const step = problem.tutorialSteps[currentStep];
      if (step?.codeTemplate[selectedLanguage]) {
        setCode(step.codeTemplate[selectedLanguage]);
      }
    } else if (problem) {
      setCode(problem.languageTemplates[selectedLanguage]);
    }
  }, [problem, currentStep, selectedLanguage, isTutorialMode]);

  const handleLanguageChange = (language: "cpp" | "python" | "java") => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    if (!problem) return;

    try {
      setIsRunning(true);
      setRunError("");
      setOutput("🚀 Running your code...");

      const testCase =
        isTutorialMode && problem.tutorialSteps[currentStep]
          ? {
              input: input || problem.testCases[0]?.input || "",
              expectedOutput: problem.tutorialSteps[currentStep].expectedOutput,
            }
          : { input, expectedOutput: problem.testCases[0]?.output };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/process/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mainCode: code,
            language: selectedLanguage,
            inputData: testCase.input,
            expectedOutput: testCase.expectedOutput,
            problemId: problem._id,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setOutput(data.result.actualOutput);

        if (isTutorialMode && data.result.isCorrect) {
          const newCompleted = new Set(completedSteps);
          newCompleted.add(currentStep);
          setCompletedSteps(newCompleted);
        }
      } else {
        setRunError(data.error || data.message || "❌ Execution failed");
        setOutput("");
      }
    } catch (err) {
      console.error("Error running code:", err);
      setRunError("❌ Failed to run code. Please try again.");
      setOutput("");
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunAllTests = async () => {
    if (!problem) return;

    setIsRunning(true);
    const results = [];

    for (const testCase of problem.testCases.filter((tc) => !tc.isHidden)) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/process/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mainCode: code,
              language: selectedLanguage,
              inputData: testCase.input,
              expectedOutput: testCase.output,
              problemId: problem._id,
            }),
          }
        );

        const data = await response.json();
        results.push({
          passed: data.result?.isCorrect || false,
          input: testCase.input,
          expected: testCase.output,
          actual: data.result?.actualOutput || "",
          error: data.error || undefined,
        });
      } catch (err) {
        results.push({
          passed: false,
          input: testCase.input,
          expected: testCase.output,
          actual: "",
          error: "Execution failed",
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!problem || !code.trim()) {
      console.log("Submit blocked: No problem or empty code");
      return;
    }

    console.log("Starting direct submission...");
    console.log("Problem ID:", problem._id);
    console.log("Language:", selectedLanguage);
    console.log("Code length:", code.length);

    try {
      setIsSubmitting(true);
      setSubmissionResult(null);
      setShowSubmissionResult(false);

      // Step 1: Get problem with all test cases (including hidden)
      console.log("Fetching problem with hidden test cases...");
      const problemResponse = await getProblemForSubmission(problem._id);

      if (!problemResponse.success || !problemResponse.data) {
        throw new Error(
          problemResponse.error?.message || "Failed to fetch problem test cases"
        );
      }

      const fullProblem = problemResponse.data;
      console.log(
        `Found ${fullProblem.testCases.length} test cases (including hidden)`
      );

      // Step 2: Run code against each test case
      const submissionResults = [];
      let passedTestCases = 0;
      const totalTestCases = fullProblem.testCases.length;

      for (let i = 0; i < fullProblem.testCases.length; i++) {
        const testCase = fullProblem.testCases[i];
        console.log(
          `Running test case ${i + 1}/${totalTestCases} (Hidden: ${
            testCase.isHidden
          })`
        );

        try {
          const result = await submitToProcessingService(
            code,
            selectedLanguage,
            testCase.input,
            testCase.output,
            problem._id
          );

          const testResult = {
            testCaseIndex: i + 1,
            passed: (result.success && result.data?.result?.isCorrect) || false,
            input: testCase.isHidden ? "[Hidden]" : testCase.input,
            expectedOutput: testCase.isHidden ? "[Hidden]" : testCase.output,
            actualOutput: testCase.isHidden
              ? "[Hidden]"
              : result.data?.result?.actualOutput || "",
            executionTime: result.data?.result?.executionTime || 0,
            isHidden: testCase.isHidden,
            error: !result.success ? result.error?.message : undefined,
          };

          if (testResult.passed) {
            passedTestCases++;
          }

          submissionResults.push(testResult);
          console.log(
            `Test case ${i + 1}: ${testResult.passed ? "PASSED" : "FAILED"}`
          );
        } catch (error) {
          console.error(`Test case ${i + 1} failed:`, error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          submissionResults.push({
            testCaseIndex: i + 1,
            passed: false,
            input: testCase.isHidden ? "[Hidden]" : testCase.input,
            expectedOutput: testCase.isHidden ? "[Hidden]" : testCase.output,
            actualOutput: "",
            executionTime: 0,
            isHidden: testCase.isHidden,
            error: `Execution failed: ${errorMessage}`,
          });
        }
      }

      // Step 3: Calculate final result
      const score =
        totalTestCases > 0
          ? Math.round((passedTestCases / totalTestCases) * 100)
          : 0;
      const status =
        passedTestCases === totalTestCases ? "accepted" : "partial";

      const finalResult: SubmissionResult = {
        problemId: problem._id,
        userId: null, // Will be filled by backend if needed
        language: selectedLanguage,
        code: code,
        status: status,
        score: score,
        passedTestCases: passedTestCases,
        totalTestCases: totalTestCases,
        testResults: submissionResults,
        submittedAt: new Date().toISOString(),
      };

      console.log(
        `Submission completed: ${passedTestCases}/${totalTestCases} passed (${score}%)`
      );

      // Save submission to database
      try {
        console.log("Saving submission to database...");
        const saveResponse = await saveSubmission(finalResult);
        if (saveResponse.success) {
          console.log("Submission saved successfully:", saveResponse.data);
          // Update finalResult with saved submission ID if needed
          if (saveResponse.data?._id) {
            finalResult.submissionId = saveResponse.data._id;
          }
        } else {
          console.warn("Failed to save submission:", saveResponse.error);
          // Continue anyway - don't block UI if save fails
        }
      } catch (saveError) {
        console.warn("Error saving submission:", saveError);
        // Continue anyway - don't block UI if save fails
      }

      setSubmissionResult(finalResult);
      setShowSubmissionResult(true);

      // Clear test results from "Test All" to avoid confusion
      setTestResults([]);
      setOutput("");
      setRunError("");
    } catch (error) {
      console.error("Error submitting solution:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setRunError(`Failed to submit solution: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      console.log("Submission process completed");
    }
  };

  const nextStep = () => {
    if (problem && currentStep < problem.tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowHint(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowHint(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.loadingIcon} size={48} />
        <p>Loading problem...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorState}>
        <AlertCircle className={styles.errorIcon} size={48} />
        <h3>Error loading problem</h3>
        <p>{error}</p>
        <button onClick={fetchProblem} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  // Problem not found
  if (!problem) {
    return (
      <div className={styles.errorState}>
        <AlertCircle className={styles.errorIcon} size={48} />
        <h3>Problem not found</h3>
        <p>The requested problem could not be found.</p>
      </div>
    );
  }

  const currentTutorialStep = isTutorialMode
    ? problem.tutorialSteps[currentStep]
    : null;
  const isStepCompleted = completedSteps.has(currentStep);

  return (
    <div className={styles.problemWrapper}>
      <motion.div
        className={styles.problemContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <PanelGroup direction="horizontal">
          {/* Problem Description Panel */}
          <Panel defaultSize={35} minSize={25}>
            <div className={styles.descriptionPanel}>
              <div className={styles.problemHeader}>
                <div className={styles.problemTitle}>
                  <span
                    className={`${styles.rankBadge} ${
                      styles[`rank${problem.rank}`]
                    }`}
                  >
                    {problem.rank}
                  </span>
                  <h1>{problem.title}</h1>
                </div>

                {isTutorialMode && (
                  <div className={styles.tutorialControls}>
                    <button
                      className={styles.tutorialToggle}
                      onClick={() => setIsTutorialMode(!isTutorialMode)}
                    >
                      Exit Tutorial
                    </button>
                  </div>
                )}
              </div>

              {isTutorialMode && currentTutorialStep ? (
                <div className={styles.tutorialMode}>
                  <div className={styles.stepProgress}>
                    <span className={styles.stepCounter}>
                      Step {currentStep + 1} of {problem.tutorialSteps.length}
                    </span>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${
                            ((currentStep + 1) / problem.tutorialSteps.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.stepContent}>
                    <div className={styles.stepHeader}>
                      <h3>{currentTutorialStep.title}</h3>
                      {isStepCompleted && (
                        <span className={styles.completedBadge}>
                          ✓ Completed
                        </span>
                      )}
                    </div>

                    <div className={styles.stepDescription}>
                      <FormattedDescription
                        description={currentTutorialStep.description}
                      />
                    </div>

                    {currentTutorialStep.hint && (
                      <div className={styles.hintSection}>
                        <button
                          className={styles.hintButton}
                          onClick={() => setShowHint(!showHint)}
                        >
                          💡 {showHint ? "Hide Hint" : "Show Hint"}
                        </button>
                        <AnimatePresence>
                          {showHint && (
                            <motion.div
                              className={styles.hintContent}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <FormattedDescription
                                description={currentTutorialStep.hint || ""}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    <div className={styles.stepNavigation}>
                      <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={styles.navButton}
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={nextStep}
                        disabled={
                          currentStep === problem.tutorialSteps.length - 1
                        }
                        className={`${styles.navButton} ${styles.nextButton}`}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.problemDescription}>
                  <FormattedDescription
                    description={problem.description}
                    className={styles.markdownContent}
                  />

                  {problem.isInteractiveTutorial && (
                    <button
                      className={styles.startTutorialButton}
                      onClick={() => setIsTutorialMode(true)}
                    >
                      🎯 Start Interactive Tutorial
                    </button>
                  )}
                </div>
              )}

              {/* Test Cases */}
              <div className={styles.testCases}>
                <h4>📋 Test Cases</h4>
                {problem.testCases
                  .filter((tc) => !tc.isHidden)
                  .map((testCase, index) => (
                    <div key={index} className={styles.testCase}>
                      <div className={styles.testCaseHeader}>
                        <strong>Example {index + 1}</strong>
                      </div>
                      <div className={styles.testCaseContent}>
                        <div className={styles.inputOutput}>
                          <div>
                            <strong>Input:</strong>
                            <pre>{testCase.input}</pre>
                          </div>
                          <div>
                            <strong>Output:</strong>
                            <pre>{testCase.output}</pre>
                          </div>
                        </div>
                        {testCase.explanation && (
                          <div className={styles.explanation}>
                            <strong>Explanation:</strong>
                            <FormattedDescription
                              description={testCase.explanation}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className={styles.resizeHandle} />

          {/* Code Editor Panel */}
          <Panel defaultSize={65} minSize={35}>
            <div className={styles.editorSection}>
              <div className={styles.editorHeader}>
                <div className={styles.languageSelector}>
                  {problem.supportedLanguages.map((lang) => (
                    <button
                      key={lang}
                      className={`${styles.languageButton} ${
                        selectedLanguage === lang ? styles.active : ""
                      }`}
                      onClick={() => handleLanguageChange(lang as any)}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className={styles.actionButtons}>
                  <button
                    className={styles.runButton}
                    onClick={handleRun}
                    disabled={isRunning || isSubmitting}
                  >
                    {isRunning ? (
                      <>
                        <span className={styles.spinner}></span>
                        Running...
                      </>
                    ) : (
                      <>▶ Run</>
                    )}
                  </button>

                  {!isTutorialMode && (
                    <>
                      <button
                        className={styles.testAllButton}
                        onClick={handleRunAllTests}
                        disabled={isRunning || isSubmitting}
                      >
                        🧪 Test All
                      </button>

                      <button
                        className={styles.submitButton}
                        onClick={() => {
                          console.log("SUBMIT BUTTON CLICKED!");
                          console.log(
                            "Button state - isRunning:",
                            isRunning,
                            "isSubmitting:",
                            isSubmitting,
                            "code length:",
                            code.length
                          );
                          handleSubmit();
                        }}
                        disabled={isRunning || isSubmitting || !code.trim()}
                      >
                        {isSubmitting ? (
                          <>
                            <span className={styles.spinner}></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Trophy size={16} />
                            Submit
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.codeEditorWrapper}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={60} minSize={30}>
                    <div className={styles.monacoEditorContainer}>
                      <Editor
                        height="100%"
                        language={
                          selectedLanguage === "cpp" ? "cpp" : selectedLanguage
                        }
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: "on",
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: "on",
                          formatOnPaste: true,
                          formatOnType: true,
                          suggestOnTriggerCharacters: true,
                          quickSuggestions: true,
                        }}
                      />
                    </div>
                  </Panel>

                  <PanelResizeHandle className={styles.resizeHandleVertical} />

                  <Panel defaultSize={40} minSize={20}>
                    <PanelGroup direction="horizontal">
                      <Panel defaultSize={50} minSize={25}>
                        <div className={styles.inputSection}>
                          <div className={styles.sectionHeader}>
                            <h3>⌨️ Input</h3>
                            <button
                              className={styles.clearButton}
                              onClick={() => setInput("")}
                            >
                              Clear
                            </button>
                          </div>
                          <div className={styles.ioMonacoEditorContainer}>
                            <Editor
                              height="100%"
                              defaultLanguage="plaintext"
                              theme="vs-dark"
                              value={input}
                              onChange={(value) => setInput(value || "")}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "off",
                                wordWrap: "on",
                                automaticLayout: true,
                              }}
                            />
                          </div>
                        </div>
                      </Panel>

                      <PanelResizeHandle className={styles.resizeHandle} />

                      <Panel defaultSize={50} minSize={25}>
                        <div className={styles.outputSection}>
                          <div className={styles.sectionHeader}>
                            <h3>📤 Output</h3>
                            <button
                              className={styles.clearButton}
                              onClick={() => {
                                setOutput("");
                                setError("");
                                setTestResults([]);
                              }}
                            >
                              Clear
                            </button>
                          </div>

                          {showSubmissionResult && submissionResult ? (
                            <div className={styles.submissionResults}>
                              <div className={styles.submissionHeader}>
                                <div className={styles.submissionStatus}>
                                  <div
                                    className={`${styles.statusBadge} ${
                                      styles[submissionResult.status]
                                    }`}
                                  >
                                    {submissionResult.status === "accepted" ? (
                                      <CheckCircle size={20} />
                                    ) : (
                                      <XCircle size={20} />
                                    )}
                                    {submissionResult.status.toUpperCase()}
                                  </div>
                                  <div className={styles.scoreDisplay}>
                                    <Target size={16} />
                                    <span>
                                      {submissionResult.passedTestCases}/
                                      {submissionResult.totalTestCases}
                                    </span>
                                    <span className={styles.percentage}>
                                      ({submissionResult.score}%)
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className={styles.clearButton}
                                  onClick={() => setShowSubmissionResult(false)}
                                >
                                  Close
                                </button>
                              </div>

                              <div className={styles.submissionDetails}>
                                <div className={styles.submissionInfo}>
                                  <span>
                                    <strong>Language:</strong>{" "}
                                    {submissionResult.language.toUpperCase()}
                                  </span>
                                  <span>
                                    <strong>Submitted:</strong>{" "}
                                    {new Date(
                                      submissionResult.submittedAt
                                    ).toLocaleString()}
                                  </span>
                                </div>

                                <div className={styles.testCaseResults}>
                                  {submissionResult.testResults.map(
                                    (testResult, index) => (
                                      <div
                                        key={index}
                                        className={`${styles.testCaseResult} ${
                                          testResult.passed
                                            ? styles.passed
                                            : styles.failed
                                        }`}
                                      >
                                        <div className={styles.testCaseHeader}>
                                          <span>
                                            Test Case {testResult.testCaseIndex}
                                          </span>
                                          <div
                                            className={styles.testCaseStatus}
                                          >
                                            {testResult.isHidden && (
                                              <span
                                                className={styles.hiddenBadge}
                                              >
                                                Hidden
                                              </span>
                                            )}
                                            <span className={styles.resultIcon}>
                                              {testResult.passed ? "✅" : "❌"}
                                            </span>
                                          </div>
                                        </div>
                                        {!testResult.isHidden &&
                                          !testResult.passed && (
                                            <div
                                              className={styles.testCaseDetails}
                                            >
                                              <div>
                                                <strong>Input:</strong>{" "}
                                                {testResult.input}
                                              </div>
                                              <div>
                                                <strong>Expected:</strong>{" "}
                                                {testResult.expectedOutput}
                                              </div>
                                              <div>
                                                <strong>Got:</strong>{" "}
                                                {testResult.actualOutput}
                                              </div>
                                              {testResult.error && (
                                                <div>
                                                  <strong>Error:</strong>{" "}
                                                  {testResult.error}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        {testResult.executionTime > 0 && (
                                          <div className={styles.executionTime}>
                                            <strong>Time:</strong>{" "}
                                            {testResult.executionTime}ms
                                          </div>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : testResults.length > 0 ? (
                            <div className={styles.testResults}>
                              {testResults.map((result, index) => (
                                <div
                                  key={index}
                                  className={`${styles.testResult} ${
                                    result.passed
                                      ? styles.passed
                                      : styles.failed
                                  }`}
                                >
                                  <div className={styles.testResultHeader}>
                                    <span>Test Case {index + 1}</span>
                                    <span className={styles.resultIcon}>
                                      {result.passed ? "✅" : "❌"}
                                    </span>
                                  </div>
                                  {!result.passed && (
                                    <div className={styles.testResultDetails}>
                                      <div>
                                        <strong>Expected:</strong>{" "}
                                        {result.expected}
                                      </div>
                                      <div>
                                        <strong>Got:</strong> {result.actual}
                                      </div>
                                      {result.error && (
                                        <div>
                                          <strong>Error:</strong> {result.error}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={styles.ioMonacoEditorContainer}>
                              <Editor
                                height="100%"
                                defaultLanguage="plaintext"
                                theme="vs-dark"
                                value={error || output}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  lineNumbers: "off",
                                  wordWrap: "on",
                                  automaticLayout: true,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </Panel>
                    </PanelGroup>
                  </Panel>
                </PanelGroup>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </motion.div>
    </div>
  );
};

export default ProblemSolvePage;
