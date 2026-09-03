-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SHORT_ANSWER', 'ESSAY');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LATE');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('PENDING', 'COMPLETE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');

-- CreateTable
CREATE TABLE "User" (
    "UserID" TEXT NOT NULL,
    "FullName" TEXT,
    "Email" TEXT NOT NULL,
    "Password" TEXT,
    "Role" "Role" NOT NULL DEFAULT 'STUDENT',
    "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Cohort" (
    "CohortID" TEXT NOT NULL,
    "CohortName" TEXT NOT NULL,
    "AcademicYear" TEXT NOT NULL,
    "Description" TEXT,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("CohortID")
);

-- CreateTable
CREATE TABLE "CohortMembership" (
    "MembershipID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "CohortID" TEXT NOT NULL,
    "Status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "DateJoined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortMembership_pkey" PRIMARY KEY ("MembershipID")
);

-- CreateTable
CREATE TABLE "Course" (
    "CourseID" TEXT NOT NULL,
    "CohortID" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("CourseID")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "LessonID" TEXT NOT NULL,
    "CourseID" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "SequenceOrder" INTEGER NOT NULL,
    "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("LessonID")
);

-- CreateTable
CREATE TABLE "Video" (
    "VideoID" TEXT NOT NULL,
    "LessonID" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "YoutubeLink" TEXT NOT NULL,
    "DurationSeconds" INTEGER,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("VideoID")
);

-- CreateTable
CREATE TABLE "Audio" (
    "AudioID" TEXT NOT NULL,
    "LessonID" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "AudioLink" TEXT NOT NULL,
    "DurationSeconds" INTEGER,

    CONSTRAINT "Audio_pkey" PRIMARY KEY ("AudioID")
);

-- CreateTable
CREATE TABLE "ZoomMeeting" (
    "MeetingID" TEXT NOT NULL,
    "LessonID" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "MeetingLink" TEXT,
    "RecordingLink" TEXT,
    "MeetingDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoomMeeting_pkey" PRIMARY KEY ("MeetingID")
);

-- CreateTable
CREATE TABLE "Note" (
    "NoteID" TEXT NOT NULL,
    "LessonID" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Content" TEXT,
    "FileLink" TEXT,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("NoteID")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "AssignmentID" TEXT NOT NULL,
    "LessonID" TEXT NOT NULL,
    "CohortID" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT,
    "DeadlineDate" TIMESTAMP(3) NOT NULL,
    "MaxScore" DOUBLE PRECISION,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("AssignmentID")
);

-- CreateTable
CREATE TABLE "Question" (
    "QuestionID" TEXT NOT NULL,
    "AssignmentID" TEXT NOT NULL,
    "QuestionText" TEXT NOT NULL,
    "SequenceOrder" INTEGER NOT NULL,
    "QuestionType" "QuestionType" NOT NULL DEFAULT 'SHORT_ANSWER',
    "MaxScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("QuestionID")
);

-- CreateTable
CREATE TABLE "Submission" (
    "SubmissionID" TEXT NOT NULL,
    "AssignmentID" TEXT NOT NULL,
    "StudentID" TEXT NOT NULL,
    "SubmittedAt" TIMESTAMP(3),
    "Status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "ReceiptCode" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("SubmissionID")
);

-- CreateTable
CREATE TABLE "SubmissionAnswer" (
    "AnswerID" TEXT NOT NULL,
    "SubmissionID" TEXT NOT NULL,
    "QuestionID" TEXT NOT NULL,
    "AnswerText" TEXT,
    "ScoreAwarded" DOUBLE PRECISION,
    "Feedback" TEXT,
    "GradedByID" TEXT,
    "GradedAt" TIMESTAMP(3),

    CONSTRAINT "SubmissionAnswer_pkey" PRIMARY KEY ("AnswerID")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "AttachmentID" TEXT NOT NULL,
    "SubmissionID" TEXT NOT NULL,
    "FileName" TEXT NOT NULL,
    "FileLink" TEXT NOT NULL,
    "FileSizeKB" INTEGER,
    "DateUploaded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("AttachmentID")
);

-- CreateTable
CREATE TABLE "Grade" (
    "GradeID" TEXT NOT NULL,
    "SubmissionID" TEXT NOT NULL,
    "FinalizedByID" TEXT,
    "TotalScore" DOUBLE PRECISION,
    "MaxPossibleScore" DOUBLE PRECISION,
    "OverallFeedback" TEXT,
    "Status" "GradeStatus" NOT NULL DEFAULT 'PENDING',
    "FinalizedAt" TIMESTAMP(3),

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("GradeID")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "AttendanceID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "LessonID" TEXT NOT NULL,
    "Status" "AttendanceStatus" NOT NULL,
    "MarkedByID" TEXT,
    "MarkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("AttendanceID")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "LogID" TEXT NOT NULL,
    "AdminID" TEXT NOT NULL,
    "Action" TEXT NOT NULL,
    "TargetType" TEXT NOT NULL,
    "TargetID" TEXT NOT NULL,
    "Timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("LogID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "CohortMembership_UserID_CohortID_key" ON "CohortMembership"("UserID", "CohortID");

-- CreateIndex
CREATE UNIQUE INDEX "Video_LessonID_key" ON "Video"("LessonID");

-- CreateIndex
CREATE UNIQUE INDEX "Audio_LessonID_key" ON "Audio"("LessonID");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_ReceiptCode_key" ON "Submission"("ReceiptCode");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_AssignmentID_StudentID_key" ON "Submission"("AssignmentID", "StudentID");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAnswer_SubmissionID_QuestionID_key" ON "SubmissionAnswer"("SubmissionID", "QuestionID");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_SubmissionID_key" ON "Grade"("SubmissionID");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_UserID_LessonID_key" ON "Attendance"("UserID", "LessonID");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembership" ADD CONSTRAINT "CohortMembership_CohortID_fkey" FOREIGN KEY ("CohortID") REFERENCES "Cohort"("CohortID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_CohortID_fkey" FOREIGN KEY ("CohortID") REFERENCES "Cohort"("CohortID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_CourseID_fkey" FOREIGN KEY ("CourseID") REFERENCES "Course"("CourseID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_LessonID_fkey" FOREIGN KEY ("LessonID") REFERENCES "Lesson"("LessonID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audio" ADD CONSTRAINT "Audio_LessonID_fkey" FOREIGN KEY ("LessonID") REFERENCES "Lesson"("LessonID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoomMeeting" ADD CONSTRAINT "ZoomMeeting_LessonID_fkey" FOREIGN KEY ("LessonID") REFERENCES "Lesson"("LessonID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_LessonID_fkey" FOREIGN KEY ("LessonID") REFERENCES "Lesson"("LessonID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_LessonID_fkey" FOREIGN KEY ("LessonID") REFERENCES "Lesson"("LessonID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_CohortID_fkey" FOREIGN KEY ("CohortID") REFERENCES "Cohort"("CohortID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_AssignmentID_fkey" FOREIGN KEY ("AssignmentID") REFERENCES "Assignment"("AssignmentID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_AssignmentID_fkey" FOREIGN KEY ("AssignmentID") REFERENCES "Assignment"("AssignmentID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_StudentID_fkey" FOREIGN KEY ("StudentID") REFERENCES "User"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_SubmissionID_fkey" FOREIGN KEY ("SubmissionID") REFERENCES "Submission"("SubmissionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_QuestionID_fkey" FOREIGN KEY ("QuestionID") REFERENCES "Question"("QuestionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_GradedByID_fkey" FOREIGN KEY ("GradedByID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_SubmissionID_fkey" FOREIGN KEY ("SubmissionID") REFERENCES "Submission"("SubmissionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_SubmissionID_fkey" FOREIGN KEY ("SubmissionID") REFERENCES "Submission"("SubmissionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_FinalizedByID_fkey" FOREIGN KEY ("FinalizedByID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_LessonID_fkey" FOREIGN KEY ("LessonID") REFERENCES "Lesson"("LessonID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_MarkedByID_fkey" FOREIGN KEY ("MarkedByID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_AdminID_fkey" FOREIGN KEY ("AdminID") REFERENCES "User"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;
