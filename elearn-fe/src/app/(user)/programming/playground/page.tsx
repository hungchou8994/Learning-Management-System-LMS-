"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Code2, Play, Trash2, ChevronDown } from "lucide-react";
import ProgrammingSectionNav from "@/components/programming/ProgrammingSectionNav";
import styles from "./styles.module.scss";

interface Language {
  id: string;
  name: string;
  monacoId: string;
  template: string;
  icon: string;
}

const MultiLanguagePlayground = () => {
  const languages: Language[] = [
    {
      id: "cpp",
      name: "C++",
      monacoId: "cpp",
      icon: "⚡",
      template: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string input;
    cout << "Enter your name: ";
    getline(cin, input);
    cout << "Hello, " << input << "!" << endl;
    return 0;
}`,
    },
    {
      id: "python",
      name: "Python",
      monacoId: "python",
      icon: "🐍",
      template: `# Python Program
def main():
    name = input("Enter your name: ")
    print(f"Hello, {name}!")

if __name__ == "__main__":
    main()`,
    },
    {
      id: "java",
      name: "Java",
      monacoId: "java",
      icon: "☕",
      template: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        System.out.println("Hello, " + name + "!");
        scanner.close();
    }
}`,
    },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    languages[0]
  );
  const [code, setCode] = useState(languages[0].template);
  const [input, setInput] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    setCode(language.template);
    setOutput("");
    setError("");
    setShowLanguageDropdown(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleRun = async () => {
    try {
      setIsRunning(true);
      setError("");
      setOutput("Running...");

      console.log(
        "Sending request to:",
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/process/submit`
      );
      console.log("Request body:", {
        mainCode: code,
        inputData: input,
        expectedOutput: expectedOutput || "undefined",
        language: selectedLanguage.id,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/process/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mainCode: code,
            inputData: input,
            expectedOutput: expectedOutput || "undefined",
            language: selectedLanguage.id,
          }),
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (data.status === "success") {
        let outputText = data.result.actualOutput;

        if (expectedOutput) {
          // Normalize line endings and trim whitespace for comparison
          const normalizedActual = outputText.replace(/\r\n/g, "\n").trim();
          const normalizedExpected = expectedOutput
            .replace(/\r\n/g, "\n")
            .trim();

          if (normalizedActual === normalizedExpected) {
            outputText += "\n\n✅ Output matches expected result!";
          } else {
            outputText += `\n\n❌ Output does not match expected result!\nExpected:\n${expectedOutput}`;
          }
        }

        setOutput(outputText);
      } else {
        setError(data.error || data.message || "Compilation failed");
        setOutput("");
      }
    } catch (err) {
      console.error("Error running code:", err);
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
        });
      }
      setError("Failed to run code. Please try again.");
      setOutput("");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={styles.playgroundWrapper}>
      <motion.div
        className={styles.playgroundContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ paddingTop: "0px" }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
            marginTop: "0px",
            paddingTop: "0px",
          }}
        >
          <ProgrammingSectionNav />
        </div>

        <PanelGroup direction="horizontal">
          <Panel defaultSize={70} minSize={30}>
            <div className={styles.editorSection}>
              <div className={styles.editorHeader}>
                {/* Language Selector */}
                <div ref={dropdownRef} className={styles.languageSelector}>
                  <button
                    className={styles.languageButton}
                    onClick={() =>
                      setShowLanguageDropdown(!showLanguageDropdown)
                    }
                  >
                    <span className={styles.languageIcon}>
                      {selectedLanguage.icon}
                    </span>
                    <span className={styles.languageName}>
                      {selectedLanguage.name}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`${styles.chevron} ${
                        showLanguageDropdown ? styles.open : ""
                      }`}
                    />
                  </button>

                  {showLanguageDropdown && (
                    <div className={styles.languageDropdown}>
                      {languages.map((language) => (
                        <button
                          key={language.id}
                          className={`${styles.languageOption} ${
                            selectedLanguage.id === language.id
                              ? styles.active
                              : ""
                          }`}
                          onClick={() => handleLanguageChange(language)}
                        >
                          <span className={styles.languageIcon}>
                            {language.icon}
                          </span>
                          <span className={styles.languageName}>
                            {language.name}
                          </span>
                          {selectedLanguage.id === language.id && (
                            <span className={styles.checkmark}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <h2 className={styles.playgroundTitle}>
                  <Code2 size={24} />
                  {selectedLanguage.name} Playground
                </h2>

                <button
                  className={styles.runButton}
                  onClick={handleRun}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <span className={styles.spinner}></span>
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Run Code
                    </>
                  )}
                </button>
              </div>
              <div className={styles.monacoEditorContainer}>
                <Editor
                  height="calc(100vh - 120px)"
                  language={selectedLanguage.monacoId}
                  theme="vs-dark"
                  value={code}
                  onChange={handleEditorChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: selectedLanguage.id === "python" ? 4 : 2,
                    insertSpaces: true,
                    wordWrap: "on",
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: "on",
                    snippetSuggestions: "inline",
                    wordBasedSuggestions: "currentDocument",
                    parameterHints: { enabled: true },
                    quickSuggestions: true,
                    renderWhitespace: "selection",
                    renderControlCharacters: true,
                    renderLineHighlight: "all",
                    scrollbar: {
                      vertical: "visible",
                      horizontal: "visible",
                      useShadows: false,
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    },
                  }}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className={styles.resizeHandle} />

          <Panel defaultSize={30} minSize={20}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={30} minSize={20}>
                <div className={styles.inputSection}>
                  <div className={styles.sectionHeader}>
                    <h3>Input</h3>
                    <button
                      className={styles.clearButton}
                      onClick={() => setInput("")}
                    >
                      <Trash2 size={16} />
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
                        lineNumbers: "on",
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                        formatOnPaste: true,
                        formatOnType: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: "on",
                        snippetSuggestions: "inline",
                        wordBasedSuggestions: "currentDocument",
                        parameterHints: { enabled: true },
                        quickSuggestions: true,
                        renderWhitespace: "selection",
                        renderControlCharacters: true,
                        renderLineHighlight: "all",
                        scrollbar: {
                          vertical: "visible",
                          horizontal: "visible",
                          useShadows: false,
                          verticalScrollbarSize: 10,
                          horizontalScrollbarSize: 10,
                        },
                      }}
                    />
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className={styles.resizeHandleVertical} />

              <Panel defaultSize={30} minSize={20}>
                <div className={styles.expectedOutputSection}>
                  <div className={styles.sectionHeader}>
                    <h3>Expected Output (Optional)</h3>
                    <button
                      className={styles.clearButton}
                      onClick={() => setExpectedOutput("")}
                    >
                      <Trash2 size={16} />
                      Clear
                    </button>
                  </div>
                  <div className={styles.ioMonacoEditorContainer}>
                    <Editor
                      height="100%"
                      defaultLanguage="plaintext"
                      theme="vs-dark"
                      value={expectedOutput}
                      onChange={(value) => setExpectedOutput(value || "")}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                        formatOnPaste: true,
                        formatOnType: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: "on",
                        snippetSuggestions: "inline",
                        wordBasedSuggestions: "currentDocument",
                        parameterHints: { enabled: true },
                        quickSuggestions: true,
                        renderWhitespace: "selection",
                        renderControlCharacters: true,
                        renderLineHighlight: "all",
                        scrollbar: {
                          vertical: "visible",
                          horizontal: "visible",
                          useShadows: false,
                          verticalScrollbarSize: 10,
                          horizontalScrollbarSize: 10,
                        },
                      }}
                    />
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className={styles.resizeHandleVertical} />

              <Panel defaultSize={40} minSize={20}>
                <div className={styles.outputSection}>
                  <div className={styles.sectionHeader}>
                    <h3>Output</h3>
                    <button
                      className={styles.clearButton}
                      onClick={() => {
                        setOutput("");
                        setError("");
                      }}
                    >
                      <Trash2 size={16} />
                      Clear
                    </button>
                  </div>
                  <div className={styles.ioMonacoEditorContainer}>
                    <Editor
                      height="100%"
                      defaultLanguage="plaintext"
                      theme="vs-dark"
                      value={error ? error : output}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                        formatOnPaste: true,
                        formatOnType: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: "on",
                        snippetSuggestions: "inline",
                        wordBasedSuggestions: "currentDocument",
                        parameterHints: { enabled: true },
                        quickSuggestions: true,
                        renderWhitespace: "selection",
                        renderControlCharacters: true,
                        renderLineHighlight: "all",
                        scrollbar: {
                          vertical: "visible",
                          horizontal: "visible",
                          useShadows: false,
                          verticalScrollbarSize: 10,
                          horizontalScrollbarSize: 10,
                        },
                      }}
                    />
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </motion.div>
    </div>
  );
};

export default MultiLanguagePlayground;
