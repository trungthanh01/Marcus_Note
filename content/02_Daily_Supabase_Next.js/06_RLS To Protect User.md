Để cấu hình Row Level Security (RLS) nhằm bảo vệ dữ liệu người dùng trong Supabase, bạn cần thực hiện theo các bước từ kích hoạt đến thiết lập chính sách bảo mật chi tiết dựa trên định danh người dùng.

Dưới đây là các bước cụ thể và quy tắc quan trọng:

### 1. Kích hoạt RLS trên bảng dữ liệu

Mặc định, các bảng mới tạo trong Supabase có thể không được bật RLS, điều này khiến dữ liệu bị lộ công khai qua API. Bạn phải kích hoạt RLS cho từng bảng bằng lệnh SQL:

```
ALTER TABLE tên_bảng ENABLE ROW LEVEL SECURITY;
```

Sau khi bật lệnh này, mọi truy vấn từ API sẽ trả về kết quả trống cho đến khi bạn định nghĩa ít nhất một chính sách (policy) cho phép truy cập.

### 2. Thiết lập chính sách dựa trên quyền sở hữu (Ownership)

Mô hình phổ biến nhất là cho phép người dùng chỉ truy cập vào dữ liệu do họ tạo ra. Supabase cung cấp hàm `auth.uid()` để lấy ID của người dùng từ mã thông báo JWT.

**Ví dụ chính sách cho phép người dùng đọc và chỉnh sửa dữ liệu của chính mình:**

```
CREATE POLICY "Người dùng có thể quản lý dữ liệu cá nhân"
ON tên_bảng
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

Trong đó:

- **FOR ALL:** Áp dụng cho cả SELECT, INSERT, UPDATE, và DELETE.
- **TO authenticated:** Chỉ áp dụng cho người dùng đã đăng nhập, ngăn chặn các truy cập ẩn danh.
- **user_id:** Tên cột trong bảng lưu trữ ID người dùng.

### 3. Phân biệt `USING` và `WITH CHECK`

Hiểu rõ hai mệnh đề này là rất quan trọng để tránh lỗi bảo mật:

- **USING:** Dùng cho các thao tác đọc hoặc xóa (`SELECT`, `DELETE`). Nó lọc những dòng dữ liệu nào người dùng "có thể thấy".
- **WITH CHECK:** Dùng cho các thao tác ghi dữ liệu (`INSERT`, `UPDATE`). Nó kiểm tra xem dữ liệu mới mà người dùng định lưu có hợp lệ hay không.
- **Lưu ý quan trọng:** Nếu bạn không dùng `WITH CHECK` cho lệnh `UPDATE`, người dùng có thể "đánh cắp" dòng dữ liệu bằng cách đổi `user_id` của dòng đó sang ID của một người khác.

### 4. Các tối ưu hóa và thực hành tốt nhất

- **Đánh chỉ mục (Index):** Mọi cột được sử dụng trong chính sách RLS (như `user_id` hoặc `org_id`) **bắt buộc phải được đánh chỉ mục**. Nếu không, cơ sở dữ liệu sẽ phải quét toàn bộ bảng cho mỗi yêu cầu, gây chậm hệ thống nghiêm trọng khi dữ liệu lớn.
- **Sử dụng Subquery để tăng tốc:** Thay vì viết trực tiếp `auth.uid()`, hãy bao bọc nó trong một truy vấn con: `(SELECT auth.uid())`. Cách này giúp Postgres tính toán hàm một lần duy nhất cho toàn bộ câu lệnh thay vì tính lại cho từng dòng dữ liệu.
- **Không tin tưởng `user_metadata`:** Tuyệt đối không dùng thông tin trong `raw_user_meta_data` để phân quyền vì người dùng có thể tự thay đổi thông tin này; hãy dựa vào các bảng dữ liệu thực tế hoặc các claims được cấu hình an toàn.

### 5. Kiểm tra và gỡ lỗi

- **Impersonation (Giả danh):** Trong trình soạn thảo SQL của Supabase, bạn có thể sử dụng tính năng "Impersonate user" để chạy thử truy vấn dưới danh nghĩa một người dùng cụ thể nhằm kiểm tra chính sách RLS.
- **Cảnh báo về SQL Editor:** Các truy vấn chạy trực tiếp trong SQL Editor của Dashboard thường chạy với vai trò `postgres` (superuser), do đó nó **bỏ qua mọi chính sách RLS**. Bạn nên kiểm tra RLS thông qua Client SDK hoặc sử dụng lệnh giả lập vai trò `authenticated` trong SQL.
- [[01_Design System with Todo List]]