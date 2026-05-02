import { supabase } from '../../../services/supabase';

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
  const { data } = supabase.storage.from('lms-storage').getPublicUrl(filePath);
  return data.publicUrl;
};

export const uploadMaterial = async (courseOfferingId, title, file, userId) => {
  let filePath = null;
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
    filePath = `materials/${courseOfferingId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('lms-storage')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload failed. Ensure bucket 'lms-storage' exists.", uploadError);
      // For MVP, if storage fails we might want to just let it throw or save without file.
      // We will throw to notify the user.
      throw new Error(`Upload failed: ${uploadError.message}. Did you create the lms-storage bucket?`);
    }
  }

  const { data, error } = await supabase
    .from('course_materials')
    .insert([
      {
        course_offering_id: courseOfferingId,
        title,
        file_path: filePath,
        file_type: file?.type || 'other',
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
      .from('lms-storage')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload failed.", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}. Did you create the lms-storage bucket?`);
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
