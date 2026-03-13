const AiLessonPlan = require("../models/AiLessonPlan");
const logger = require("../config/logger");

function requireTeacherRole(req) {
  const role = req.user?.role;
  return role === "teacher" || role === "manager" || role === "admin";
}

function canAccessDoc(req, doc) {
  const role = req.user?.role;
  if (role === "admin" || role === "manager") return true;
  return doc.createdBy === req.user?.id;
}

exports.createAiLessonPlan = async (req, res) => {
  try {
    if (!requireTeacherRole(req)) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền thực hiện thao tác này.",
      });
    }

    const { structure, input, prompt, model } = req.body || {};

    if (!structure || typeof structure !== "object") {
      return res.status(400).json({
        status: "error",
        message: "Thiếu trường 'structure' hoặc dữ liệu không hợp lệ.",
      });
    }

    const lessonMetadata = structure.lessonMetadata || {};
    const subject = lessonMetadata.subject;
    const grade = lessonMetadata.grade;
    const textbook = lessonMetadata.textbook;
    const lessonTopic =
      lessonMetadata.lessonTopic || lessonMetadata.title || "Kế hoạch bài dạy";
    const durationMinutes = lessonMetadata.duration;

    if (!subject || !grade || !textbook || !durationMinutes) {
      return res.status(400).json({
        status: "error",
        message:
          "structure.lessonMetadata thiếu thông tin bắt buộc (subject/grade/textbook/duration).",
      });
    }

    const legalBasis =
      structure.regulatoryCompliance?.references?.map((r) => {
        const type = r?.documentType;
        const code = r?.documentCode;
        if (!type || !code) return null;
        return `${type} ${code}`;
      })?.filter(Boolean) || [];

    const doc = await AiLessonPlan.create({
      createdBy: req.user.id,
      createdByUsername: req.user.username,
      createdByRole: req.user.role,
      subject,
      grade,
      textbook,
      lessonTopic,
      durationMinutes,
      legalBasis,
      prompt,
      model,
      structure,
      input: input || null,
    });

    return res.status(201).json({
      status: "success",
      message: "Lưu bản kế hoạch AI thành công",
      data: doc,
    });
  } catch (error) {
    logger.error("Error creating AI lesson plan:", error);
    return res.status(500).json({
      status: "error",
      message: "Không thể lưu bản kế hoạch AI",
      error: error.message,
    });
  }
};

exports.listMyAiLessonPlans = async (req, res) => {
  try {
    if (!requireTeacherRole(req)) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền truy cập.",
      });
    }

    const role = req.user?.role;
    const query =
      role === "admin" || role === "manager"
        ? {}
        : { createdBy: req.user.id };

    const docs = await AiLessonPlan.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      status: "success",
      data: docs,
    });
  } catch (error) {
    logger.error("Error listing AI lesson plans:", error);
    return res.status(500).json({
      status: "error",
      message: "Không thể tải danh sách bản kế hoạch AI",
      error: error.message,
    });
  }
};

exports.getAiLessonPlan = async (req, res) => {
  try {
    if (!requireTeacherRole(req)) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền truy cập.",
      });
    }

    const doc = await AiLessonPlan.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy bản kế hoạch AI",
      });
    }

    if (!canAccessDoc(req, doc)) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền truy cập bản kế hoạch này.",
      });
    }

    return res.status(200).json({ status: "success", data: doc });
  } catch (error) {
    logger.error("Error getting AI lesson plan:", error);
    return res.status(500).json({
      status: "error",
      message: "Không thể tải bản kế hoạch AI",
      error: error.message,
    });
  }
};

exports.updateAiLessonPlan = async (req, res) => {
  try {
    if (!requireTeacherRole(req)) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền thực hiện thao tác này.",
      });
    }

    const doc = await AiLessonPlan.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy bản kế hoạch AI",
      });
    }

    if (!canAccessDoc(req, doc)) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền chỉnh sửa bản kế hoạch này.",
      });
    }

    const { status, structure } = req.body || {};
    if (status && !["draft", "archived"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Giá trị status không hợp lệ.",
      });
    }

    if (structure && typeof structure !== "object") {
      return res.status(400).json({
        status: "error",
        message: "structure không hợp lệ.",
      });
    }

    if (typeof status !== "undefined") doc.status = status;
    if (typeof structure !== "undefined") doc.structure = structure;

    // Keep listing fields in sync if structure updated
    if (structure?.lessonMetadata) {
      const lm = structure.lessonMetadata;
      if (lm.subject) doc.subject = lm.subject;
      if (lm.grade) doc.grade = lm.grade;
      if (lm.textbook) doc.textbook = lm.textbook;
      if (lm.lessonTopic || lm.title)
        doc.lessonTopic = lm.lessonTopic || lm.title;
      if (lm.duration) doc.durationMinutes = lm.duration;
    }

    await doc.save();

    return res.status(200).json({
      status: "success",
      message: "Cập nhật bản kế hoạch AI thành công",
      data: doc,
    });
  } catch (error) {
    logger.error("Error updating AI lesson plan:", error);
    return res.status(500).json({
      status: "error",
      message: "Không thể cập nhật bản kế hoạch AI",
      error: error.message,
    });
  }
};

exports.deleteAiLessonPlan = async (req, res) => {
  try {
    if (!requireTeacherRole(req)) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền thực hiện thao tác này.",
      });
    }

    const doc = await AiLessonPlan.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy bản kế hoạch AI",
      });
    }

    if (!canAccessDoc(req, doc)) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền xóa bản kế hoạch này.",
      });
    }

    await AiLessonPlan.deleteOne({ _id: doc._id });

    return res.status(200).json({
      status: "success",
      message: "Xóa bản kế hoạch AI thành công",
      data: { deleted: true },
    });
  } catch (error) {
    logger.error("Error deleting AI lesson plan:", error);
    return res.status(500).json({
      status: "error",
      message: "Không thể xóa bản kế hoạch AI",
      error: error.message,
    });
  }
};


