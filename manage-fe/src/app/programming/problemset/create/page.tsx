"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Minus,
  Code,
  Save,
  Eye,
  Lightbulb,
  TestTube,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { createProblem } from "@/lib/api";
import styles from "./styles.module.scss";

interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
  points: number;
  explanation: string;
}

interface TutorialStep {
  stepNumber: number;
  title: string;
  description: string;
  codeTemplate: {
    cpp: string;
    python: string;
    java: string;
  };
  hints: string[];
}

interface ProblemForm {
  title: string;
  rank: "S" | "A" | "B" | "C" | "D";
  description: string;
  supportedLanguages: string[];
  isInteractiveTutorial: boolean;
  testCases: TestCase[];
  languageTemplates: {
    cpp: string;
    python: string;
    java: string;
  };
  tutorialSteps: TutorialStep[];
  hints: string[];
}

const DEFAULT_LEARNER_URL =
  process.env.NEXT_PUBLIC_ELEARN_FE_URL || "http://localhost:3004";

const CreateProblemPage: React.FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<ProblemForm>({
    title: "",
    rank: "C",
    description: "",
    supportedLanguages: ["cpp"],
    isInteractiveTutorial: false,
    testCases: [
      {
        input: "",
        output: "",
        isHidden: false,
        points: 10,
        explanation: "",
      },
    ],
    languageTemplates: {
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Read input from stdin and print the answer to stdout\n    return 0;\n}",
      python:
        '# Read input from stdin and print the answer to stdout\n\ndef solution():\n    pass\n\nif __name__ == "__main__":\n    solution()',
      java: "import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input from stdin and print the answer to stdout\n    }\n}",
    },
    tutorialSteps: [],
    hints: [""],
  });

  const [activeTab, setActiveTab] = useState<
    "basic" | "testcases" | "tutorial" | "preview"
  >("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allLanguages = [
    { id: "cpp", name: "C++" },
    { id: "python", name: "Python" },
    { id: "java", name: "Java" },
  ];

  const handleLanguageToggle = (langId: string) => {
    setForm((prev) => ({
      ...prev,
      supportedLanguages: prev.supportedLanguages.includes(langId)
        ? prev.supportedLanguages.filter((l) => l !== langId)
        : [...prev.supportedLanguages, langId],
    }));
  };

  const addTestCase = () => {
    setForm((prev) => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        {
          input: "",
          output: "",
          isHidden: false,
          points: 10,
          explanation: "",
        },
      ],
    }));
  };

  const removeTestCase = (index: number) => {
    if (form.testCases.length > 1) {
      setForm((prev) => ({
        ...prev,
        testCases: prev.testCases.filter((_, i) => i !== index),
      }));
    }
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    setForm((prev) => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      ),
    }));
  };

  const addTutorialStep = () => {
    setForm((prev) => ({
      ...prev,
      tutorialSteps: [
        ...prev.tutorialSteps,
        {
          stepNumber: prev.tutorialSteps.length + 1,
          title: "",
          description: "",
          codeTemplate: {
            cpp: form.languageTemplates.cpp,
            python: form.languageTemplates.python,
            java: form.languageTemplates.java,
          },
          hints: [""],
        },
      ],
    }));
  };

  const removeTutorialStep = (index: number) => {
    setForm((prev) => ({
      ...prev,
      tutorialSteps: prev.tutorialSteps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, stepNumber: i + 1 })),
    }));
  };

  const updateTutorialStep = (
    index: number,
    field: keyof TutorialStep,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      tutorialSteps: prev.tutorialSteps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      ),
    }));
  };

  const addHint = (stepIndex?: number) => {
    if (stepIndex !== undefined) {
      updateTutorialStep(stepIndex, "hints", [
        ...form.tutorialSteps[stepIndex].hints,
        "",
      ]);
    } else {
      setForm((prev) => ({
        ...prev,
        hints: [...prev.hints, ""],
      }));
    }
  };

  const removeHint = (hintIndex: number, stepIndex?: number) => {
    if (stepIndex !== undefined) {
      const hints = form.tutorialSteps[stepIndex].hints.filter(
        (_, i) => i !== hintIndex
      );
      updateTutorialStep(stepIndex, "hints", hints.length ? hints : [""]);
    } else {
      const hints = form.hints.filter((_, i) => i !== hintIndex);
      setForm((prev) => ({
        ...prev,
        hints: hints.length ? hints : [""],
      }));
    }
  };

  const updateHint = (hintIndex: number, value: string, stepIndex?: number) => {
    if (stepIndex !== undefined) {
      const hints = form.tutorialSteps[stepIndex].hints.map((hint, i) =>
        i === hintIndex ? value : hint
      );
      updateTutorialStep(stepIndex, "hints", hints);
    } else {
      setForm((prev) => ({
        ...prev,
        hints: prev.hints.map((hint, i) => (i === hintIndex ? value : hint)),
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!form.title.trim()) {
        alert("Please enter a problem title");
        return;
      }
      if (!form.description.trim()) {
        alert("Please enter a problem description");
        return;
      }
      if (form.supportedLanguages.length === 0) {
        alert("Please select at least one supported language");
        return;
      }
      if (
        form.testCases.length === 0 ||
        !form.testCases[0].input.trim() ||
        !form.testCases[0].output.trim()
      ) {
        alert("Please add at least one complete test case");
        return;
      }

      // Prepare problem data for API
      const problemData = {
        title: form.title.trim(),
        rank: form.rank,
        description: form.description.trim(),
        supportedLanguages: form.supportedLanguages,
        isInteractiveTutorial: form.isInteractiveTutorial,
        testCases: form.testCases.filter(
          (tc) => tc.input.trim() && tc.output.trim()
        ),
        languageTemplates: form.languageTemplates,
        tutorialSteps: form.isInteractiveTutorial
          ? form.tutorialSteps.map((step) => ({
              stepNumber: step.stepNumber,
              title: step.title,
              description: step.description,
              hint: step.hints[0] || "",
              codeTemplate: step.codeTemplate,
              expectedOutput: "",
              isCompleted: false,
            }))
          : [],
        hints: form.hints
          .filter((hint) => hint.trim())
          .map((content, index) => ({
            level: index + 1,
            content: content.trim(),
            cost: 0,
          })),
        tags: [],
        timeLimit: 5000,
        memoryLimit: 256000,
        isPublic: true,
      };

      // Call API to create problem
      const response = await createProblem(problemData as any);

      if (response.success && (response as any).data) {
        const created = (response as any).data;
        alert("Problem created successfully!");

        // Open learner preview in a new tab, keep teacher in manage-fe
        window.open(
          `${DEFAULT_LEARNER_URL}/programming/problem/${created._id}`,
          "_blank"
        );

        // Stay on the page but reset to create another quickly
        router.refresh();
      } else {
        alert(
          (response as any).error?.message ||
            "Error creating problem. Please try again."
        );
      }
    } catch (error) {
      console.error("Error creating problem:", error);
      alert("Error creating problem. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRankColor = (rank: string) => {
    const colors = {
      S: "#ef4444",
      A: "#f97316",
      B: "#eab308",
      C: "#22c55e",
      D: "#3b82f6",
    };
    return colors[rank as keyof typeof colors] || "#6b7280";
  };

  return (
    <div className={styles.createContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Link href={`${DEFAULT_LEARNER_URL}/programming`} className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Problems (Learner Site)
          </Link>

          <h1 className={styles.title}>
            <Code className={styles.titleIcon} />
            Create New Problem
          </h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "basic" ? styles.active : ""}`}
            onClick={() => setActiveTab("basic")}
          >
            <BookOpen size={16} />
            Basic Info
          </button>
          <button
            className={`${styles.tab} ${activeTab === "testcases" ? styles.active : ""}`}
            onClick={() => setActiveTab("testcases")}
          >
            <TestTube size={16} />
            Test Cases
          </button>
          <button
            className={`${styles.tab} ${activeTab === "tutorial" ? styles.active : ""}`}
            onClick={() => setActiveTab("tutorial")}
          >
            <Lightbulb size={16} />
            Tutorial
          </button>
          <button
            className={`${styles.tab} ${activeTab === "preview" ? styles.active : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <Eye size={16} />
            Preview
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className={styles.formContainer}>
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <div className={styles.tabContent}>
            <div className={styles.formSection}>
              <h3>Problem Information</h3>

              <div className={styles.formGroup}>
                <label className={styles.label}>Problem Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter problem title..."
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rank *</label>
                  <select
                    value={form.rank}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        rank: e.target.value as any,
                      }))
                    }
                    className={styles.select}
                  >
                    <option value="D">D - Beginner</option>
                    <option value="C">C - Easy</option>
                    <option value="B">B - Medium</option>
                    <option value="A">A - Hard</option>
                    <option value="S">S - Expert</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Supported Languages *</label>
                  <div className={styles.languageCheckboxes}>
                    {allLanguages.map((lang) => (
                      <label key={lang.id} className={styles.checkboxContainer}>
                        <input
                          type="checkbox"
                          checked={form.supportedLanguages.includes(lang.id)}
                          onChange={() => handleLanguageToggle(lang.id)}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxLabel}>{lang.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Problem Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the problem in detail..."
                  className={styles.textarea}
                  rows={6}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    checked={form.isInteractiveTutorial}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isInteractiveTutorial: e.target.checked,
                      }))
                    }
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxLabel}>
                    Enable Interactive Tutorial Mode
                  </span>
                </label>
                <small className={styles.helpText}>
                  Tutorial mode provides step-by-step guidance for learners
                </small>
              </div>
            </div>

            {/* Language Templates */}
            <div className={styles.formSection}>
              <h3>Starting Code Templates</h3>

              {form.supportedLanguages.map((lang) => (
                <div key={lang} className={styles.formGroup}>
                  <label className={styles.label}>
                    {allLanguages.find((l) => l.id === lang)?.name} Template
                  </label>
                  <textarea
                    value={
                      form.languageTemplates[
                        lang as keyof typeof form.languageTemplates
                      ]
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        languageTemplates: {
                          ...prev.languageTemplates,
                          [lang]: e.target.value,
                        },
                      }))
                    }
                    className={`${styles.textarea} ${styles.codeTextarea}`}
                    rows={8}
                    placeholder={`Enter starting code template for ${lang}...`}
                  />
                </div>
              ))}
            </div>

            {/* General Hints */}
            <div className={styles.formSection}>
              <h3>General Hints</h3>

              {form.hints.map((hint, index) => (
                <div key={index} className={styles.hintGroup}>
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => updateHint(index, e.target.value)}
                    placeholder={`Hint ${index + 1}...`}
                    className={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => removeHint(index)}
                    className={styles.removeButton}
                    disabled={form.hints.length === 1}
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addHint()}
                className={styles.addButton}
              >
                <Plus size={16} />
                Add Hint
              </button>
            </div>
          </div>
        )}

        {/* Test Cases Tab */}
        {activeTab === "testcases" && (
          <div className={styles.tabContent}>
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <h3>Test Cases</h3>
                <button
                  type="button"
                  onClick={addTestCase}
                  className={styles.addButton}
                >
                  <Plus size={16} />
                  Add Test Case
                </button>
              </div>

              {form.testCases.map((testCase, index) => (
                <div key={index} className={styles.testCaseCard}>
                  <div className={styles.testCaseHeader}>
                    <h4>Test Case {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className={styles.removeButton}
                      disabled={form.testCases.length === 1}
                    >
                      <Minus size={16} />
                    </button>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Input</label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) =>
                          updateTestCase(index, "input", e.target.value)
                        }
                        placeholder="Enter test input..."
                        className={styles.textarea}
                        rows={3}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Expected Output</label>
                      <textarea
                        value={testCase.output}
                        onChange={(e) =>
                          updateTestCase(index, "output", e.target.value)
                        }
                        placeholder="Enter expected output..."
                        className={styles.textarea}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Points</label>
                      <input
                        type="number"
                        value={testCase.points}
                        onChange={(e) =>
                          updateTestCase(
                            index,
                            "points",
                            parseInt(e.target.value)
                          )
                        }
                        className={styles.input}
                        min="1"
                        max="100"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.checkboxContainer}>
                        <input
                          type="checkbox"
                          checked={testCase.isHidden}
                          onChange={(e) =>
                            updateTestCase(index, "isHidden", e.target.checked)
                          }
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxLabel}>
                          Hidden Test Case
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Explanation (Optional)
                    </label>
                    <textarea
                      value={testCase.explanation}
                      onChange={(e) =>
                        updateTestCase(index, "explanation", e.target.value)
                      }
                      placeholder="Explain this test case..."
                      className={styles.textarea}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tutorial Tab */}
        {activeTab === "tutorial" && (
          <div className={styles.tabContent}>
            {!form.isInteractiveTutorial ? (
              <div className={styles.emptyState}>
                <AlertCircle size={48} className={styles.emptyIcon} />
                <h3>Tutorial Mode Disabled</h3>
                <p>
                  Enable &ldquo;Interactive Tutorial Mode&rdquo; in Basic Info
                  to create tutorial steps.
                </p>
              </div>
            ) : (
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h3>Tutorial Steps</h3>
                  <button
                    type="button"
                    onClick={addTutorialStep}
                    className={styles.addButton}
                  >
                    <Plus size={16} />
                    Add Step
                  </button>
                </div>

                {form.tutorialSteps.map((step, index) => (
                  <div key={index} className={styles.tutorialStepCard}>
                    <div className={styles.stepHeader}>
                      <h4>Step {step.stepNumber}</h4>
                      <button
                        type="button"
                        onClick={() => removeTutorialStep(index)}
                        className={styles.removeButton}
                      >
                        <Minus size={16} />
                      </button>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Step Title</label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) =>
                          updateTutorialStep(index, "title", e.target.value)
                        }
                        placeholder="Enter step title..."
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Step Description</label>
                      <textarea
                        value={step.description}
                        onChange={(e) =>
                          updateTutorialStep(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Describe what to do in this step..."
                        className={styles.textarea}
                        rows={4}
                      />
                    </div>

                    {/* Step Hints */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Step Hints</label>
                      {step.hints.map((hint, hintIndex) => (
                        <div key={hintIndex} className={styles.hintGroup}>
                          <input
                            type="text"
                            value={hint}
                            onChange={(e) =>
                              updateHint(hintIndex, e.target.value, index)
                            }
                            placeholder={`Hint ${hintIndex + 1}...`}
                            className={styles.input}
                          />
                          <button
                            type="button"
                            onClick={() => removeHint(hintIndex, index)}
                            className={styles.removeButton}
                            disabled={step.hints.length === 1}
                          >
                            <Minus size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addHint(index)}
                        className={styles.addButton}
                      >
                        <Plus size={16} />
                        Add Hint
                      </button>
                    </div>
                  </div>
                ))}

                {form.tutorialSteps.length === 0 && (
                  <div className={styles.emptyState}>
                    <Lightbulb size={48} className={styles.emptyIcon} />
                    <h3>No Tutorial Steps</h3>
                    <p>
                      Add tutorial steps to guide learners through the problem
                      solving process.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className={styles.tabContent}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div
                  className={styles.rankBadge}
                  style={{ backgroundColor: getRankColor(form.rank) }}
                >
                  {form.rank}
                </div>
                {form.isInteractiveTutorial && (
                  <div className={styles.tutorialBadge}>Tutorial</div>
                )}
              </div>

              <h2 className={styles.previewTitle}>
                {form.title || "Untitled Problem"}
              </h2>
              <p className={styles.previewDescription}>
                {form.description || "No description provided"}
              </p>

              <div className={styles.previewLanguages}>
                {form.supportedLanguages.map((lang) => (
                  <span key={lang} className={styles.languageTag}>
                    {allLanguages.find((l) => l.id === lang)?.name}
                  </span>
                ))}
              </div>

              <div className={styles.previewStats}>
                <div className={styles.statItem}>
                  <strong>Test Cases:</strong> {form.testCases.length}
                </div>
                <div className={styles.statItem}>
                  <strong>Tutorial Steps:</strong> {form.tutorialSteps.length}
                </div>
                <div className={styles.statItem}>
                  <strong>General Hints:</strong>{" "}
                  {form.hints.filter((h) => h.trim()).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className={styles.submitContainer}>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !form.title || !form.description}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <>
              <Save size={18} />
              Creating...
            </>
          ) : (
            <>
              <Save size={18} />
              Create Problem
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateProblemPage;

