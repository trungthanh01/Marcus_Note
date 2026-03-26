**Mục tiêu:** Xây dựng hệ thống type-safe từ giao diện đến database, loại bỏ hoàn toàn các lỗi runtime về kiểu dữ liệu.

- **Tóm tắt cốt lõi:**
    - Định nghĩa cấu trúc dữ liệu bằng **Zod** và sử dụng `z.infer` để trích xuất kiểu TypeScript. Điều này giúp validate dữ liệu ngay trước khi insert vào DB.
    - Sử dụng **Server Actions** cho các thao tác mutation vì chúng được type-check mặc định, giúp mã nguồn gọn gàng và dễ bảo trì hơn Route Handlers.
    - Triển khai **Progressive Enhancement** cho Form để đảm bảo ứng dụng vẫn hoạt động cơ bản ngay cả khi JavaScript trên client chưa load xong.
- **Sơ đồ tư duy (Text-based Diagram):** `Client Form Input -> Zod Schema Parse (Frontend) -> Server Action -> Zod Schema Validation (Backend) -> Type-safe Database Call (Supabase Client)`
- **Case Study 50k Users:**
    - _Bottleneck:_ Dữ liệu rác hoặc không đúng định dạng lách qua được TypeScript (vì TS chỉ kiểm tra ở compile-time) gây lỗi logic ở database.
    - _Giải quyết:_ Ép buộc mọi Server Action phải đi qua một lớp HOF (Higher-Order Function) để validate payload bằng Zod trước khi xử lý.
- **Bài tập thực hành:** Viết một schema Zod cho tính năng "Update Profile". Tạo một Server Action sử dụng schema này để parse dữ liệu từ `FormData` và trả về lỗi chi tiết cho từng trường (field-level errors).