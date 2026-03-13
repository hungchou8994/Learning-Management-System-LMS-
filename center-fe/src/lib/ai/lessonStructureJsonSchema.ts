// JSON Schema used to constrain OpenAI output deterministically.
// This mirrors `lesson-structure.schema.json` (repo root) and is intentionally embedded
// in manage-fe so the server API route can enforce it without filesystem reads.

export const lessonStructureJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://elearn.vn/schemas/lesson-structure.schema.json",
  title: "Vietnamese Primary School Lesson Plan Structure",
  type: "object",
  required: ["lessonMetadata", "activities"],
  additionalProperties: false,
  properties: {
    lessonMetadata: {
      type: "object",
      required: ["title", "subject", "grade", "duration", "textbook"],
      additionalProperties: false,
      properties: {
        title: { type: "string", minLength: 1, maxLength: 500 },
        subject: {
          type: "string",
          enum: [
            "Toán",
            "Tiếng Việt",
            "Khoa học",
            "Lịch sử",
            "Địa lý",
            "Đạo đức",
            "Tự nhiên và Xã hội",
            "Mỹ thuật",
            "Âm nhạc",
            "Thể dục",
            "Tiếng Anh",
            "Tin học",
            "Hoạt động trải nghiệm",
          ],
        },
        grade: { type: "integer", minimum: 1, maximum: 5 },
        duration: { type: "integer", minimum: 1, maximum: 60 },
        textbook: {
          type: "string",
          enum: ["Chân trời sáng tạo", "Kết nối tri thức", "Cánh diều", "Khác"],
        },
        textbookSeries: { type: "string", maxLength: 200 },
        lessonTopic: { type: "string", maxLength: 300 },
        unitNumber: { type: "integer", minimum: 1 },
        lessonNumber: { type: "integer", minimum: 1 },
      },
    },
    regulatoryCompliance: {
      type: "object",
      required: ["references"],
      additionalProperties: false,
      properties: {
        references: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["documentType", "documentCode"],
            additionalProperties: false,
            properties: {
              documentType: {
                type: "string",
                enum: ["Công văn", "Thông tư", "Nghị định", "Quyết định", "Chỉ thị"],
              },
              documentCode: {
                type: "string",
                pattern: "^[0-9]+(/[0-9]{4})?$",
              },
              year: { type: "integer", minimum: 2000, maximum: 2100 },
              relevance: { type: "string", maxLength: 500 },
            },
          },
        },
      },
    },
    competencyFormation: {
      type: "object",
      required: ["qualities", "competencies"],
      additionalProperties: false,
      properties: {
        qualities: {
          type: "array",
          items: {
            type: "object",
            required: ["code", "name"],
            additionalProperties: false,
            properties: {
              code: {
                type: "string",
                enum: ["PQ1", "PQ2", "PQ3", "PQ4", "PQ5"],
              },
              name: {
                type: "string",
                enum: [
                  "Yêu nước",
                  "Nhân ái",
                  "Chăm chỉ",
                  "Trung thực",
                  "Trách nhiệm",
                ],
              },
              targetLevel: {
                type: "string",
                enum: ["Nhận biết", "Hiểu", "Vận dụng", "Vận dụng cao"],
              },
            },
          },
        },
        competencies: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "code", "name"],
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: ["Chung", "Đặc thù"] },
              code: { type: "string", pattern: "^NL[A-Za-z0-9]+$" },
              name: { type: "string", maxLength: 200 },
              targetLevel: {
                type: "string",
                enum: ["Nhận biết", "Hiểu", "Vận dụng", "Vận dụng cao"],
              },
            },
          },
        },
      },
    },
    activities: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: [
          "activityName",
          "order",
          "duration",
          "learningObjectives",
          "teachingMaterials",
          "content",
          "procedure",
          "teachingMethods",
          "assessmentProducts",
        ],
        additionalProperties: false,
        properties: {
          activityName: { type: "string", maxLength: 200 },
          order: { type: "integer", minimum: 1 },
          duration: { type: "integer", minimum: 1, maximum: 35 },
          learningObjectives: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["objective", "level"],
              additionalProperties: false,
              properties: {
                objective: { type: "string", maxLength: 500 },
                level: {
                  type: "string",
                  enum: ["Nhận biết", "Hiểu", "Vận dụng", "Vận dụng cao"],
                },
                competencyCode: { type: "string", pattern: "^NL[A-Za-z0-9]+$" },
              },
            },
          },
          teachingMaterials: {
            type: "array",
            items: {
              type: "object",
              required: ["name", "type"],
              additionalProperties: false,
              properties: {
                name: { type: "string", maxLength: 200 },
                type: { type: "string", maxLength: 50 },
                quantity: { type: "integer", minimum: 1 },
                notes: { type: "string", maxLength: 300 },
              },
            },
          },
          content: {
            type: "object",
            required: ["mainContent"],
            additionalProperties: false,
            properties: {
              mainContent: { type: "string", maxLength: 2000 },
              keyConcepts: { type: "array", items: { type: "string" } },
              examples: { type: "array", items: { type: "string" } },
            },
          },
          procedure: {
            type: "object",
            required: ["steps"],
            additionalProperties: false,
            properties: {
              steps: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  required: ["stepNumber", "description"],
                  additionalProperties: false,
                  properties: {
                    stepNumber: { type: "integer", minimum: 1 },
                    description: { type: "string", maxLength: 1000 },
                    timeAllocation: { type: "integer", minimum: 1 },
                    teacherAction: { type: "string", maxLength: 500 },
                    studentAction: { type: "string", maxLength: 500 },
                  },
                },
              },
              interactionType: {
                type: "string",
                enum: ["Cá nhân", "Nhóm đôi", "Nhóm nhỏ", "Cả lớp", "Hỗn hợp"],
              },
            },
          },
          teachingMethods: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["method", "technique"],
              additionalProperties: false,
              properties: {
                method: { type: "string", maxLength: 50 },
                technique: { type: "string", maxLength: 200 },
                rationale: { type: "string", maxLength: 300 },
              },
            },
          },
          assessmentProducts: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["productType", "description"],
              additionalProperties: false,
              properties: {
                productType: { type: "string", maxLength: 50 },
                description: { type: "string", maxLength: 500 },
                assessmentCriteria: {
                  type: "array",
                  items: { type: "string", maxLength: 300 },
                },
                assessmentMethod: { type: "string", maxLength: 50 },
                feedbackType: { type: "string", maxLength: 50 },
              },
            },
          },
          competencyTargets: {
            type: "array",
            items: {
              type: "object",
              required: ["type", "code"],
              additionalProperties: false,
              properties: {
                type: { type: "string", maxLength: 30 },
                code: { type: "string", maxLength: 50 },
                evidence: { type: "string", maxLength: 300 },
              },
            },
          },
          interdisciplinaryLinks: {
            type: "array",
            items: {
              type: "object",
              required: ["subject", "connection"],
              additionalProperties: false,
              properties: {
                subject: {
                  type: "string",
                  enum: [
                    "Toán",
                    "Tiếng Việt",
                    "Khoa học",
                    "Lịch sử",
                    "Địa lý",
                    "Đạo đức",
                    "Tự nhiên và Xã hội",
                    "Mỹ thuật",
                    "Âm nhạc",
                    "Thể dục",
                    "Tiếng Anh",
                    "Tin học",
                    "Hoạt động trải nghiệm",
                  ],
                },
                connection: { type: "string", maxLength: 300 },
              },
            },
          },
        },
      },
    },
    timeAllocation: {
      type: "object",
      required: ["totalDuration", "breakdown"],
      additionalProperties: false,
      properties: {
        totalDuration: { type: "integer", minimum: 1 },
        breakdown: {
          type: "array",
          items: {
            type: "object",
            required: ["activityOrder", "duration", "percentage"],
            additionalProperties: false,
            properties: {
              activityOrder: { type: "integer", minimum: 1 },
              duration: { type: "integer", minimum: 1 },
              percentage: { type: "number", minimum: 0, maximum: 100 },
            },
          },
        },
        bufferTime: { type: "integer", minimum: 0 },
      },
    },
    interdisciplinaryIntegration: {
      type: "object",
      additionalProperties: false,
      properties: {
        integratedSubjects: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "Toán",
              "Tiếng Việt",
              "Khoa học",
              "Lịch sử",
              "Địa lý",
              "Đạo đức",
              "Tự nhiên và Xã hội",
              "Mỹ thuật",
              "Âm nhạc",
              "Thể dục",
              "Tiếng Anh",
              "Tin học",
              "Hoạt động trải nghiệm",
            ],
          },
        },
        integrationPoints: {
          type: "array",
          items: {
            type: "object",
            required: ["subject", "activityOrder", "description"],
            additionalProperties: false,
            properties: {
              subject: { type: "string", maxLength: 50 },
              activityOrder: { type: "integer", minimum: 1 },
              description: { type: "string", maxLength: 500 },
            },
          },
        },
      },
    },
    notes: {
      type: "object",
      additionalProperties: false,
      properties: {
        preparationNotes: { type: "string", maxLength: 1000 },
        teachingNotes: { type: "string", maxLength: 1000 },
        adaptationNotes: { type: "string", maxLength: 1000 },
        extensionActivities: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;


