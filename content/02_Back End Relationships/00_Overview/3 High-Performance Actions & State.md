**Mục tiêu:** Tối ưu hóa trải nghiệm người dùng thông qua tốc độ phản hồi tức thì và chiến lược cache thông minh.

- **Tóm tắt cốt lõi:**
    - Sử dụng `revalidatePath` hoặc `revalidateTag` sau mỗi lần mutation để cập nhật Next.js cache và hiển thị dữ liệu mới nhất mà không cần load lại trang.
    - Đối với dữ liệu đọc nhiều nhưng ít thay đổi (ví dụ: thông tin Team), hãy offload truy vấn từ Postgres sang **Redis** và kết hợp với hàm `cache()` của React.
    - Sử dụng `useOptimistic` để cập nhật UI ngay lập tức trước khi server phản hồi, giúp ứng dụng cảm giác nhanh hơn đáng kể.
- **Sơ đồ tư duy (Text-based Diagram):** `User Action -> useOptimistic (Local Update) -> Server Action -> DB Update -> revalidatePath (Clear Cache) -> Client Router (Background Refresh)`
- **Case Study 50k Users:**
    - _Bottleneck:_ Database bị quá tải CPU (100%) do quá nhiều truy vấn lặp lại để kiểm tra quyền thành viên (membership) của người dùng mỗi khi load trang.
    - _Giải quyết:_ Cache thông tin team/member vào Redis (ví dụ: Upstash) để giảm tải cho database chính.
- **Bài tập thực hành:** Xây dựng tính năng "Like" bài viết. Sử dụng `useOptimistic` để tăng số like trên UI ngay khi click, gọi Server Action để cập nhật DB và dùng `revalidatePath` để đồng bộ dữ liệu.