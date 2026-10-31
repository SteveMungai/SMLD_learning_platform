export type QuestionData = {
  QuestionID: string;
  AssignmentID: string;
  QuestionText: string;
  SequenceOrder: number;
  QuestionType: "SHORT_ANSWER" | "ESSAY";
  MaxScore: number;
};

export type AssignmentData = {
  AssignmentID: string;
  LessonID: string;
  CohortID: string;
  Title: string;
  Description: string | null;
  DeadlineDate: string | null; // ISO string — null while a DRAFT has no deadline yet
  Status: "DRAFT" | "PUBLISHED";
  AcceptLate: boolean; // students may submit after the deadline (marked late)
  MaxScore: number | null;
  questions: QuestionData[];
};

export type AttachmentInfo = {
  AttachmentID: string;
  FileName: string;
  FileSizeKB: number | null;
  ContentType?: string | null;
};

export type SubmissionAnswerData = {
  AnswerID: string;
  SubmissionID: string;
  QuestionID: string;
  AnswerText: string | null;
  ScoreAwarded: number | null;
  Feedback: string | null;
  GradedByID: string | null;
  GradedAt: string | null;
};

export type SubmissionData = {
  SubmissionID: string;
  AssignmentID: string;
  StudentID: string;
  SubmittedAt: string | null;
  Status: "DRAFT" | "SUBMITTED" | "LATE";
  ReceiptCode: string | null;
  answers: SubmissionAnswerData[];
  attachments: AttachmentInfo[];
  // Present once a lecturer has graded the submission.
  grade?: {
    TotalScore: number | null;
    MaxPossibleScore: number | null;
    OverallFeedback: string | null;
    Status: "PENDING" | "COMPLETE";
  } | null;
};

export type LessonInfo = {
  LessonID: string;
  Title: string;
  SequenceOrder: number;
  CourseTitle: string;
};

//Grading-specific shapes 

export type GradableSubmission = {
  SubmissionID: string;
  StudentID: string;
  StudentName: string;
  StudentEmail: string;
  NameValid: boolean; // false when the stored name isn't a real full name (e.g. an email)
  attachments: AttachmentInfo[];
  SubmittedAt: string | null;
  Status: "DRAFT" | "SUBMITTED" | "LATE";
  IsLate: boolean;
  answers: SubmissionAnswerData[];
  grade: {
    GradeID: string;
    TotalScore: number | null;
    MaxPossibleScore: number | null;
    OverallFeedback: string | null;
    Status: "PENDING" | "COMPLETE";
  } | null;
};

// A cohort student who has not handed this assignment in (drafts don't count).
export type MissingStudent = {
  StudentID: string;
  StudentName: string;
  StudentEmail: string;
  NameValid: boolean;
};

export type GradingAssignmentData = AssignmentData & {
  lesson: LessonInfo;
  submissions: GradableSubmission[];
  missing: MissingStudent[];
};