/**
 * Biến môi trường Supabase, đọc một chỗ duy nhất.
 * Thiếu biến thì hỏng ngay lúc khởi động, không hỏng lặng lẽ giữa một request.
 */
function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Thiếu biến môi trường ${name}. Xem .env.example rồi tạo .env.local.`,
    )
  }
  return value
}

export const supabaseUrl = (): string => required('NEXT_PUBLIC_SUPABASE_URL')
export const supabaseAnonKey = (): string => required('NEXT_PUBLIC_SUPABASE_ANON_KEY')
export const supabaseServiceKey = (): string => required('SUPABASE_SERVICE_ROLE_KEY')
