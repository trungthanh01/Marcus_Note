Hàm **`auth.uid()`** là một công cụ cốt lõi trong Supabase dùng để xác định danh tính người dùng đang thực hiện yêu cầu dựa trên mã thông báo JWT của họ. Hàm này trả về UUID của người dùng đã xác thực hoặc trả về `null` nếu yêu cầu đến từ người dùng ẩn danh.

Dưới đây là hướng dẫn chi tiết cách sử dụng hàm này trong chính sách Row Level Security (RLS):

### 1. Kích hoạt RLS trên bảng

Trước khi áp dụng chính sách, bạn phải bật tính năng RLS cho bảng dữ liệu:

```
ALTER TABLE tên_bảng ENABLE ROW LEVEL SECURITY;
```

Mặc định, sau khi bật lệnh này mà chưa có chính sách nào, mọi truy vấn từ API sẽ bị từ chối (trả về kết quả trống).

### 2. Cấu hình chính sách sở hữu cơ bản

Mô hình phổ biến nhất là cho phép người dùng chỉ truy cập vào các dòng dữ liệu mà họ sở hữu (thường thông qua một cột như `user_id`).

**Ví dụ cho phép người dùng đọc dữ liệu của chính mình:**

```
CREATE POLICY "Người dùng chỉ xem dữ liệu cá nhân"
ON tên_bảng
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

- **`FOR SELECT`**: Chính sách này chỉ áp dụng cho thao tác đọc dữ liệu.
- **`TO authenticated`**: Chỉ áp dụng cho người dùng đã đăng nhập thành công.
- **`USING`**: Điều kiện lọc để xác định dòng dữ liệu nào người dùng được phép "thấy".

### 3. Sử dụng `USING` và `WITH CHECK` cho các thao tác ghi

Khi làm việc với các thao tác thay đổi dữ liệu (INSERT, UPDATE), bạn cần lưu ý sự khác biệt:

- **`USING`**: Dùng để kiểm tra các dòng dữ liệu **đã tồn tại** (cho SELECT, DELETE, UPDATE).
- **`WITH CHECK`**: Dùng để kiểm tra dữ liệu **mới hoặc dữ liệu sau khi sửa** (cho INSERT, UPDATE).

**Ví dụ chính sách cho phép INSERT:**

```
CREATE POLICY "Người dùng có thể thêm dữ liệu của mình"
ON tên_bảng
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

Điều này đảm bảo người dùng không thể mạo danh ID của người khác khi tạo dữ liệu mới.

### 4. Tối ưu hóa hiệu suất (Rất quan trọng)

Nếu không được cấu hình đúng, chính sách RLS có thể làm chậm truy vấn đáng kể khi bảng dữ liệu lớn dần.

- **Đánh chỉ mục (Index):** Luôn đánh chỉ mục cho cột được so sánh với `auth.uid()` (ví dụ cột `user_id`). Nếu không, cơ sở dữ liệu sẽ phải quét toàn bộ bảng cho mỗi lần kiểm tra chính sách.
- **Bao bọc bằng Subquery:** Một kỹ thuật tối ưu mạnh mẽ là viết `(SELECT auth.uid())` thay vì chỉ gọi hàm trực tiếp. Điều này giúp PostgreSQL tính toán ID người dùng một lần và lưu vào bộ nhớ đệm cho toàn bộ câu lệnh, thay vì tính lại cho từng dòng dữ liệu được kiểm tra.

### 5. Một số lưu ý bảo mật

- **Tránh so sánh phủ định (`!=`) trực tiếp:** Do `auth.uid()` trả về `null` cho khách vãng lai, việc sử dụng các phép toán phủ định có thể dẫn đến kết quả sai lệch do logic ba trị của SQL. Hãy luôn ưu tiên các phép so sánh bằng (`=`) trực tiếp.
- **Kiểm tra chính sách:** Bạn có thể sử dụng tính năng **"Impersonate user"** trong trình soạn thảo SQL của Supabase Dashboard để giả lập một người dùng cụ thể và kiểm tra xem chính sách có hoạt động đúng như mong đợi hay không.

[[01_Design System with Todo List]]