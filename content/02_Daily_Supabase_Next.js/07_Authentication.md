**Authentication** (xác thực) là quá trình **xác nhận danh tính** của một người dùng khi họ truy cập vào hệ thống. Trong hệ sinh thái Supabase và Next.js, đây là bước then chốt để đảm bảo rằng người đang truy cập chính là người mà họ tự nhận.

Dưới đây là các khía cạnh chi tiết về Authentication dựa trên các tài liệu:

### 1. Vai trò cốt lõi

Authentication trả lời cho câu hỏi: **"Bạn là ai?"**. Nó khác với _Authorization_ (phân quyền), vốn trả lời cho câu hỏi "Bạn được phép làm gì?" sau khi đã xác định được danh tính.

### 2. Cách thức hoạt động trong Supabase Auth

Hệ thống xác thực của Supabase được xây dựng dựa trên dịch vụ **GoTrue**, một API dựa trên mã thông báo (token) để quản lý người dùng.

- **Cấp phát JWT:** Khi người dùng đăng nhập thành công, dịch vụ Auth sẽ phát hành một **JSON Web Token (JWT)**. Mã thông báo này chứa thông tin định danh người dùng và được gửi kèm theo mỗi yêu cầu truy cập dữ liệu.
- **Lớp Client:** Các bộ SDK của Supabase (như trong mã frontend hoặc backend) cung cấp các hàm để đăng ký, đăng nhập và tự động quản lý việc làm mới (refresh) các mã thông báo này.
- **Lưu trữ an toàn:** Trong kiến trúc Next.js App Router, thư viện `@supabase/ssr` thường được dùng để lưu trữ token trong **Cookies** thay vì localStorage, giúp máy chủ có thể nhận diện người dùng ngay trong quá trình render trang (SSR).

### 3. Các phương thức xác thực phổ biến

Supabase Auth hỗ trợ nhiều hình thức xác thực linh hoạt:

- **Truyền thống:** Email và mật khẩu.
- **Không mật khẩu (Passwordless):** Gửi mã Magic Link qua email hoặc OTP qua điện thoại.
- **Xác thực mạng xã hội (OAuth):** Đăng nhập qua các nhà cung cấp như Google, GitHub, Apple.
- **SSO doanh nghiệp:** Hỗ trợ các tiêu chuẩn như SAML cho các tổ chức lớn.

### 4. Mối quan hệ với Bảo mật (RLS)

Authentication là nền tảng để thực thi **Row Level Security (RLS)** trong cơ sở dữ liệu Postgres.

- Sau khi Authentication xác định được ID người dùng (qua hàm `auth.uid()`), cơ sở dữ liệu sẽ dựa vào thông tin này để áp dụng các chính sách bảo mật, đảm bảo người dùng chỉ có thể xem hoặc chỉnh sửa dữ liệu thuộc sở hữu của chính họ.

### 5. Triển khai trong Next.js

Để bảo vệ ứng dụng, Authentication thường được kết hợp với:

- **Middleware:** Một tệp `middleware.ts` kiểm tra trạng thái xác thực của người dùng trước khi họ truy cập vào các đường dẫn nhạy cảm (như `/dashboard`), giúp ngăn chặn việc lộ nội dung không cho phép.
- **Server Actions:** Các hàm xử lý dữ liệu trên server phải luôn kiểm tra lại xác thực để đảm bảo yêu cầu đến từ một người dùng hợp lệ, vì các điểm cuối (endpoints) này có thể bị gọi trực tiếp từ bên ngoài.
[[01_Design System with Todo List]]