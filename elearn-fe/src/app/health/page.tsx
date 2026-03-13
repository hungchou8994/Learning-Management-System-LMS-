"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Activity, UserPlus, LogIn } from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  [key: string]: unknown;
}

interface RegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
}

interface FormData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export default function HealthCheckPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [registeredUser, setRegisteredUser] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [manualFormData, setManualFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    role: "",
  });
  const [manualLoginData, setManualLoginData] = useState<{
    username: string;
    password: string;
  }>({
    username: "",
    password: "",
  });
  const [manualResults, setManualResults] = useState<{
    registration: TestResult | null;
    login: TestResult | null;
  }>({
    registration: null,
    login: null,
  });

  const runTest = async (
    testName: string,
    testFn: () => Promise<TestResult>
  ) => {
    setLoading((prev) => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      setResults((prev) => ({ ...prev, [testName]: result }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setResults((prev) => ({
        ...prev,
        [testName]: { success: false, message: errorMessage },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [testName]: false }));
    }
  };

  const testHealth = async (): Promise<TestResult> => {
    const response = await fetch("http://localhost:3000/health");
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Health check failed");
    }
    const data: HealthResponse = await response.json();
    return { success: true, message: "Health check successful", data };
  };

  const testRegistration = async (): Promise<TestResult> => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);
    const user = {
      username: `user_${timestamp}`,
      email: `user_${timestamp}@example.com`,
      password: "StrongPass123",
      role: "student",
    };

    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Registration failed");
    }

    const data: RegistrationResponse = await response.json();
    setRegisteredUser({ username: user.username, password: user.password });
    return {
      success: true,
      message: "Registration successful",
      data: data.data,
    };
  };

  const testLogin = async (): Promise<TestResult> => {
    if (!registeredUser) {
      return { success: false, message: "Please register a user first" };
    }

    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registeredUser),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Login failed");
    }

    const data: LoginResponse = await response.json();
    return { success: true, message: "Login successful", data: data.data };
  };

  const handleManualRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData = {
        ...manualFormData,
        role: "student",
      };

      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Registration failed");
      }

      const data: RegistrationResponse = await response.json();
      setManualResults((prev) => ({
        ...prev,
        registration: {
          success: true,
          message: "Registration successful",
          data: data.data,
        },
      }));

      // Set the registered user for manual login
      setManualLoginData({
        username: userData.username,
        password: userData.password,
      });
    } catch (error) {
      setManualResults((prev) => ({
        ...prev,
        registration: {
          success: false,
          message:
            error instanceof Error ? error.message : "Registration failed",
        },
      }));
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualLoginData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Login failed");
      }

      const data: LoginResponse = await response.json();
      setManualResults((prev) => ({
        ...prev,
        login: {
          success: true,
          message: "Login successful",
          data: data.data,
        },
      }));
    } catch (error) {
      setManualResults((prev) => ({
        ...prev,
        login: {
          success: false,
          message: error instanceof Error ? error.message : "Login failed",
        },
      }));
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-semibold text-gray-800">
              API Health Check
            </h1>
          </div>

          <button
            onClick={() => runTest("health", testHealth)}
            disabled={loading.health}
            className="w-full bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
          >
            {loading.health ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Test Health Endpoint</span>
              </>
            )}
          </button>

          {results.health && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(results.health.success)}
                <span
                  className={`text-sm font-medium ${
                    results.health.success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {results.health.message}
                </span>
              </div>
              <pre className="text-xs bg-white p-3 rounded border border-gray-100 overflow-auto">
                {JSON.stringify(results.health.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-800">
              Automatic Registration
            </h2>
          </div>

          <button
            onClick={() => runTest("registration", testRegistration)}
            disabled={loading.registration}
            className="w-full bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
          >
            {loading.registration ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Test Registration</span>
              </>
            )}
          </button>

          {results.registration && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(results.registration.success)}
                <span
                  className={`text-sm font-medium ${
                    results.registration.success
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {results.registration.message}
                </span>
              </div>
              {results.registration.data && (
                <pre className="text-xs bg-white p-3 rounded border border-gray-100 overflow-auto">
                  {JSON.stringify(results.registration.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center space-x-2 mb-4">
            <LogIn className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-800">
              Automatic Login
            </h2>
          </div>

          <button
            onClick={() => runTest("login", testLogin)}
            disabled={loading.login || !registeredUser}
            className="w-full bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
          >
            {loading.login ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Test Login</span>
              </>
            )}
          </button>

          {!registeredUser && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
              Please register a user first before testing login
            </div>
          )}

          {results.login && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(results.login.success)}
                <span
                  className={`text-sm font-medium ${
                    results.login.success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {results.login.message}
                </span>
              </div>
              {results.login.data && (
                <pre className="text-xs bg-white p-3 rounded border border-gray-100 overflow-auto">
                  {JSON.stringify(results.login.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-800">
              Manual Registration
            </h2>
          </div>

          <form onSubmit={handleManualRegistration} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={manualFormData.username}
                onChange={(e) =>
                  setManualFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={manualFormData.email}
                onChange={(e) =>
                  setManualFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={manualFormData.password}
                onChange={(e) =>
                  setManualFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </form>

          {manualResults.registration && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(manualResults.registration.success)}
                <span
                  className={`text-sm font-medium ${
                    manualResults.registration.success
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {manualResults.registration.message}
                </span>
              </div>
              {manualResults.registration.data && (
                <pre className="text-xs bg-white p-3 rounded border border-gray-100 overflow-auto">
                  {JSON.stringify(manualResults.registration.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center space-x-2 mb-4">
            <LogIn className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-800">
              Manual Login
            </h2>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={manualLoginData.username}
                onChange={(e) =>
                  setManualLoginData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={manualLoginData.password}
                onChange={(e) =>
                  setManualLoginData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          </form>

          {manualResults.login && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(manualResults.login.success)}
                <span
                  className={`text-sm font-medium ${
                    manualResults.login.success
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {manualResults.login.message}
                </span>
              </div>
              {manualResults.login.data && (
                <pre className="text-xs bg-white p-3 rounded border border-gray-100 overflow-auto">
                  {JSON.stringify(manualResults.login.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
