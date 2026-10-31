import { supabase } from "../lib/supabase";

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS = 3;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const BUCKET = "task-attachments";

export type TaskAttachment = {
  id: string;
  task_id: number;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
};

type Reservation = {
  attachment_id: string;
  storage_path: string;
  expires_at: string;
};

export function validatePhoto(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Выберите фотографию JPG, PNG или WebP.");
  }

  if (file.size < 1 || file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("Размер каждой фотографии должен быть от 1 байта до 5 МБ.");
  }
}

export const attachmentsService = {
  async list(taskId: number): Promise<TaskAttachment[]> {
    const { data, error } = await supabase
      .from("attachments")
      .select("id, task_id, storage_path, file_name, mime_type, file_size")
      .eq("task_id", taskId)
      .eq("status", "ready")
      .order("created_at");

    if (error) throw error;

    return (data ?? []) as TaskAttachment[];
  },

  async download(path: string): Promise<Blob> {
    const { data, error } = await supabase.storage.from(BUCKET).download(path);

    if (error) throw error;
    if (!data) throw new Error("Не удалось получить фотографию.");

    return data;
  },

  async upload(taskId: number, file: File): Promise<string> {
    validatePhoto(file);

    const { data, error: reservationError } = await supabase.rpc(
      "reserve_task_attachment",
      {
        p_task_id: taskId,
        p_file_name: file.name,
        p_mime_type: file.type,
        p_file_size: file.size,
      },
    );

    if (reservationError) throw reservationError;

    const reservation = data as Reservation | null;

    if (!reservation?.attachment_id || !reservation.storage_path) {
      throw new Error("Сервер не вернул резервацию загрузки.");
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(reservation.storage_path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // После успешной загрузки подтверждаем ту же резервацию.
    // Один повтор помогает при кратковременном сбое сети.
    let confirmationError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      const { error } = await supabase.rpc("confirm_task_attachment", {
        p_attachment_id: reservation.attachment_id,
      });

      if (!error) return reservation.attachment_id;
      confirmationError = error;
    }

    throw confirmationError;
  },

  async replace(attachmentId: string, file: File): Promise<string> {
    validatePhoto(file);

    const { data, error: reservationError } = await supabase.rpc(
      "reserve_attachment_replacement",
      {
        p_attachment_id: attachmentId,
        p_file_name: file.name,
        p_mime_type: file.type,
        p_file_size: file.size,
      },
    );

    if (reservationError) throw reservationError;

    const reservation = data as Reservation | null;

    if (!reservation?.attachment_id || !reservation.storage_path) {
      throw new Error("Сервер не вернул резервацию замены.");
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(reservation.storage_path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    let confirmationError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      const { error } = await supabase.rpc("confirm_task_attachment", {
        p_attachment_id: reservation.attachment_id,
      });

      if (!error) return reservation.attachment_id;

      confirmationError = error;
    }

    throw confirmationError;
  },

  async remove(attachmentId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("delete_task_attachment", {
      p_attachment_id: attachmentId,
    });

    if (error) throw error;

    return data === true;
  },
};
