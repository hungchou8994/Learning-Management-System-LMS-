import { z } from "zod";

export const aiRegulatoryCodeEnum = z.enum(["4567", "32", "17", "27"]);

export const aiSubjectEnum = z.enum([
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
]);

export const aiTextbookEnum = z.enum([
  "Chân trời sáng tạo",
  "Kết nối tri thức",
  "Cánh diều",
  "Khác",
]);

export const achievementLevelEnum = z.enum([
  "Nhận biết",
  "Hiểu",
  "Vận dụng",
  "Vận dụng cao",
]);

export const aiLessonPlanFormSchema = z.object({
  lessonMetadata: z.object({
    subject: aiSubjectEnum,
    grade: z.number().int().min(1).max(5),
    curriculum: aiTextbookEnum,
    curriculumOther: z.string().trim().max(200).optional(),
    lessonTopic: z.string().trim().min(1).max(300),
    durationMinutes: z.number().int().min(1).max(60),
  }),
  regulatoryCompliance: z.object({
    references: z.array(aiRegulatoryCodeEnum).min(1),
  }),
  pedagogicalRequirements: z.object({
    qualities: z
      .array(z.string().trim().min(1).max(80))
      .max(12)
      .describe("Danh sách phẩm chất giáo viên tự nhập (có thể để trống nếu không áp dụng)"),
    competencies: z
      .array(z.string().trim().min(1).max(200))
      .min(1)
      .describe("Danh sách năng lực (chung/đặc thù) ở dạng tên ngắn"),
    requiredAchievementLevel: achievementLevelEnum,
    interdisciplinary: z.object({
      enabled: z.boolean(),
      description: z.string().trim().max(500).optional(),
    }),
  }),
  outputConstraints: z.object({
    numberOfActivities: z.number().int().min(1).max(12),
    requireSevenColumnTable: z.literal(true),
    columns: z
      .tuple([
        z.literal("Hoạt động"),
        z.literal("Mục tiêu"),
        z.literal("Đồ dùng dạy học"),
        z.literal("Nội dung"),
        z.literal("Cách tiến hành"),
        z.literal("Phương pháp/KTDH"),
        z.literal("Sản phẩm/Đánh giá"),
      ])
      ,
  }),
});

export type AiLessonPlanForm = z.infer<typeof aiLessonPlanFormSchema>;

// Output type: must align with lesson-structure.schema.json (subset + strictness enforced server-side)
export const aiGeneratedLessonPlanSchema = z.object({
  lessonMetadata: z.object({
    title: z.string().min(1),
    subject: aiSubjectEnum,
    grade: z.number().int().min(1).max(5),
    duration: z.number().int().min(1).max(60),
    textbook: aiTextbookEnum,
    textbookSeries: z.string().optional(),
    lessonTopic: z.string().optional(),
    unitNumber: z.number().int().min(1).optional(),
    lessonNumber: z.number().int().min(1).optional(),
  }),
  regulatoryCompliance: z
    .object({
      references: z
        .array(
          z.object({
            documentType: z.enum([
              "Công văn",
              "Thông tư",
              "Nghị định",
              "Quyết định",
              "Chỉ thị",
            ]),
            documentCode: z.string().min(1),
            year: z.number().int().min(2000).max(2100).optional(),
            relevance: z.string().optional(),
          })
        )
        .min(1),
    })
    .optional(),
  competencyFormation: z
    .object({
      qualities: z.array(
        z.object({
          code: z.string(),
          name: z.string(),
          targetLevel: achievementLevelEnum.optional(),
        })
      ),
      competencies: z.array(
        z.object({
          type: z.enum(["Chung", "Đặc thù"]),
          code: z.string(),
          name: z.string(),
          targetLevel: achievementLevelEnum.optional(),
        })
      ),
    })
    .optional(),
  activities: z
    .array(
      z.object({
        activityName: z.string().min(1),
        order: z.number().int().min(1),
        duration: z.number().int().min(1).max(35),
        learningObjectives: z.array(
          z.object({
            objective: z.string().min(1),
            level: achievementLevelEnum,
            competencyCode: z.string().optional(),
          })
        ),
        teachingMaterials: z.array(
          z.object({
            name: z.string().min(1),
            type: z.string().min(1),
            quantity: z.number().int().min(1).optional(),
            notes: z.string().optional(),
          })
        ),
        content: z.object({
          mainContent: z.string().min(1),
          keyConcepts: z.array(z.string()).optional(),
          examples: z.array(z.string()).optional(),
        }),
        procedure: z.object({
          steps: z.array(
            z.object({
              stepNumber: z.number().int().min(1),
              description: z.string().min(1),
              timeAllocation: z.number().int().min(1).optional(),
              teacherAction: z.string().optional(),
              studentAction: z.string().optional(),
            })
          ),
          interactionType: z.string().optional(),
        }),
        teachingMethods: z.array(
          z.object({
            method: z.string().min(1),
            technique: z.string().min(1),
            rationale: z.string().optional(),
          })
        ),
        assessmentProducts: z.array(
          z.object({
            productType: z.string().min(1),
            description: z.string().min(1),
            assessmentCriteria: z.array(z.string()).optional(),
            assessmentMethod: z.string().optional(),
            feedbackType: z.string().optional(),
          })
        ),
        competencyTargets: z
          .array(
            z.object({
              type: z.string(),
              code: z.string(),
              evidence: z.string().optional(),
            })
          )
          .optional(),
        interdisciplinaryLinks: z
          .array(
            z.object({
              subject: aiSubjectEnum,
              connection: z.string().min(1),
            })
          )
          .optional(),
      })
    )
    .min(1),
  timeAllocation: z
    .object({
      totalDuration: z.number().int().min(1),
      breakdown: z.array(
        z.object({
          activityOrder: z.number().int().min(1),
          duration: z.number().int().min(1),
          percentage: z.number().min(0).max(100),
        })
      ),
      bufferTime: z.number().int().min(0).optional(),
    })
    .optional(),
  interdisciplinaryIntegration: z
    .object({
      integratedSubjects: z.array(aiSubjectEnum).optional(),
      integrationPoints: z
        .array(
          z.object({
            subject: z.string(),
            activityOrder: z.number().int().min(1),
            description: z.string().min(1),
          })
        )
        .optional(),
    })
    .optional(),
  notes: z
    .object({
      preparationNotes: z.string().optional(),
      teachingNotes: z.string().optional(),
      adaptationNotes: z.string().optional(),
      extensionActivities: z.array(z.string()).optional(),
    })
    .optional(),
});

export type AiGeneratedLessonPlan = z.infer<typeof aiGeneratedLessonPlanSchema>;


