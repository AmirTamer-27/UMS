import { supabase } from '../../../services/supabase';

const LMS_STORAGE_BUCKET = 'course-materials';

const getCourseMaterialFileType = (file) => {
  if (!file) return 'other';

  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type || '';

  if (extension === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv'].includes(extension) ||
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('presentation') ||
    mimeType.includes('spreadsheet')
  ) {
    return 'document';
  }

  return 'other';
};

export const getCourseMaterials = async (courseOfferingId) => {
  const { data, error } = await supabase
    .from('course_materials')
    .select('*, profiles!uploaded_by(full_name)')
    .eq('course_offering_id', courseOfferingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getMaterialDownloadUrl = async (filePath) => {
  if (!filePath) return null;
  const { data } = supabase.storage.from(LMS_STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

export const uploadMaterial = async (courseOfferingId, title, file, userId) => {
  let filePath = null;
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
    filePath = `materials/${courseOfferingId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(LMS_STORAGE_BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      console.error(`Storage upload failed. Ensure bucket '${LMS_STORAGE_BUCKET}' exists.`, uploadError);
      // For MVP, if storage fails we might want to just let it throw or save without file.
      // We will throw to notify the user.
      throw new Error(`Upload failed: ${uploadError.message}. Check the ${LMS_STORAGE_BUCKET} storage bucket.`);
    }
  }

  const { data, error } = await supabase
    .from('course_materials')
    .insert([
      {
        course_offering_id: courseOfferingId,
        title,
        file_path: filePath,
        file_type: getCourseMaterialFileType(file),
        uploaded_by: userId
      }
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const getAssignments = async (courseOfferingId) => {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, profiles!created_by(full_name)')
    .eq('course_offering_id', courseOfferingId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data;
};

export const createAssignment = async (courseOfferingId, title, description, dueDate, userId) => {
  const { data, error } = await supabase
    .from('assignments')
    .insert([
      {
        course_offering_id: courseOfferingId,
        title,
        description,
        due_date: dueDate,
        created_by: userId
      }
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getAssignmentDetails = async (assignmentId) => {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, course_offerings(id, courses(name, code))')
    .eq('id', assignmentId)
    .single();
  if (error) throw error;
  return data;
};

export const getAssignmentSubmissions = async (assignmentId) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*, profiles!student_user_id(full_name, email)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const submitAssignment = async (assignmentId, studentId, text, file) => {
  let filePath = null;
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
    filePath = `submissions/${assignmentId}/${studentId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(LMS_STORAGE_BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload failed.", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}. Check the ${LMS_STORAGE_BUCKET} storage bucket.`);
    }
  }

  const { data, error } = await supabase
    .from('assignment_submissions')
    .insert([
      {
        assignment_id: assignmentId,
        student_user_id: studentId,
        submission_text: text,
        file_path: filePath,
        is_late: false
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMySubmission = async (assignmentId, studentId) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_user_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getCourseQuizzes = async (courseOfferingId) => {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, profiles!created_by(full_name)')
    .eq('course_offering_id', courseOfferingId);
  if (error) throw error;
  return data;
};

export const getQuizQuestions = async (quizId, includeAnswers = false) => {
  const columns = includeAnswers
    ? 'id, question_text, correct_answer'
    : 'id, question_text';

  const { data, error } = await supabase
    .from('quiz_questions')
    .select(columns)
    .eq('quiz_id', quizId);
  if (error) throw error;
  return data;
};

export const createQuizWithQuestions = async ({
  courseOfferingId,
  title,
  description,
  questions,
  userId,
}) => {
  const cleanedQuestions = questions
    .map((question) => ({
      question_text: question.question_text.trim(),
      correct_answer: question.correct_answer.trim(),
    }))
    .filter((question) => question.question_text && question.correct_answer);

  if (!cleanedQuestions.length) {
    throw new Error('Add at least one complete question.');
  }

  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .insert([
      {
        course_offering_id: courseOfferingId,
        title: title.trim(),
        description: description.trim(),
        created_by: userId,
        is_published: true,
      },
    ])
    .select()
    .single();

  if (quizError) throw quizError;

  const { error: questionsError } = await supabase
    .from('quiz_questions')
    .insert(
      cleanedQuestions.map((question) => ({
        quiz_id: quizData.id,
        ...question,
      })),
    );

  if (questionsError) throw questionsError;

  return quizData;
};

export const getMyQuizAttempt = async (quizId, studentId) => {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('student_user_id', studentId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const submitQuizAttempt = async ({ quizId, studentId, questions, answers }) => {
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert([
      {
        quiz_id: quizId,
        student_user_id: studentId,
        submitted_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (attemptError) throw attemptError;

  const answerRows = questions.map((question) => ({
    attempt_id: attempt.id,
    question_id: question.id,
    answer_text: answers[question.id] || '',
  }));

  const { error: answersError } = await supabase
    .from('quiz_answers')
    .insert(answerRows);

  if (answersError) throw answersError;

  return attempt;
};

export const getCourseAssignmentSubmissions = async (courseOfferingId) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select(`
      id,
      submission_text,
      file_path,
      submitted_at,
      grade,
      profiles!student_user_id(full_name, email),
      assignments!inner(id, title, course_offering_id)
    `)
    .eq('assignments.course_offering_id', courseOfferingId);

  if (error) throw error;
  return data;
};

export const updateAssignmentSubmissionGrade = async (submissionId, grade) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update({
      grade: grade === '' || grade === null || grade === undefined ? null : Number(grade),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCourseQuizAttempts = async (courseOfferingId) => {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      submitted_at,
      grade,
      profiles!student_user_id(full_name, email),
      quizzes!inner(id, title, course_offering_id),
      quiz_answers(answer_text, quiz_questions(question_text, correct_answer))
    `)
    .eq('quizzes.course_offering_id', courseOfferingId);

  if (error) throw error;
  return data;
};

export const updateQuizAttemptGrade = async (attemptId, grade) => {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .update({
      grade: grade === '' || grade === null || grade === undefined ? null : Number(grade),
    })
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
