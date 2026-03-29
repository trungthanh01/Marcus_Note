**Supabase Auth** là một dịch vụ quản lý danh tính (identity provider) mã nguồn mở, được thiết kế để xử lý toàn bộ quy trình xác thực người dùng từ đăng ký, đăng nhập đến quản lý phiên làm việc. Nó hoạt động như một thành phần cốt lõi trong hệ sinh thái Supabase, giúp các nhà phát triển tích hợp bảo mật mà không cần tự xây dựng hạ tầng phức tạp.

Dưới đây là chi tiết về các thành phần và mối quan hệ của nó với các tác nhân xung quanh:

### 1. Kiến trúc và Vai trò của GoTrue

Trái tim của Supabase Auth là **Auth Service** (dựa trên dự án mã nguồn mở **GoTrue**). Khi một dự án được triển khai, một thực thể GoTrue sẽ chạy song song với cơ sở dữ liệu Postgres của bạn.

- **Nhiệm vụ chính:** Xác thực danh tính, cấp phát, kiểm tra tính hợp lệ và làm mới các mã thông báo **JWT**.
- **Quản lý dữ liệu:** Nó tự động tạo ra một schema tên là `auth` trong Postgres để lưu trữ bảng người dùng và thông tin phiên. Schema này được ẩn đi khỏi API tự động để đảm bảo an toàn.

### 2. JSON Web Token (JWT) - "Chìa khóa" vạn năng

JWT là trung tâm của cơ chế xác thực trong Supabase.

- **Cấu tạo:** JWT chứa các thông tin (claims) về người dùng như `uid` (ID duy nhất), `role` (thường là `authenticated` hoặc `anon`), và các dữ liệu tùy chỉnh khác.
- **Tính năng:** JWT được ký bằng một mã bí mật. Khi ứng dụng gửi JWT kèm theo yêu cầu, hệ thống có thể xác minh ngay lập tức người dùng là ai mà không cần truy vấn lại bảng người dùng trong database cho mỗi yêu cầu.

### 3. Mối quan hệ với các tác nhân xung quanh

#### Với Cơ sở dữ liệu Postgres và Row Level Security (RLS)

Đây là mối quan hệ quan trọng nhất để bảo vệ dữ liệu.

- Dữ liệu trong JWT (như `uid`) được Postgres đọc thông qua các hàm như `auth.uid()`.
- Dựa trên đó, bạn thiết lập các chính sách **RLS** để đảm bảo: ví dụ, người dùng A chỉ có thể xem/sửa dòng dữ liệu có `user_id` trùng với `uid` của họ trong JWT.
- **Bảo mật:** Ngay cả khi mã nguồn frontend bị tấn công, cơ sở dữ liệu vẫn thực thi việc chặn truy cập trái phép ở tầng thấp nhất.

#### Với Client (Ứng dụng Frontend/Mobile)

- **SDK:** Supabase cung cấp các bộ thư viện (Client SDKs) để frontend gọi các hàm `signUp()`, `signIn()` một cách đơn giản.
- **Quản lý Token:** SDK tự động lưu trữ JWT vào bộ nhớ cục bộ (localStorage) hoặc Cookies, đồng thời tự động gọi Auth service để làm mới (refresh) JWT khi nó sắp hết hạn.

#### Với Next.js và Server-Side Rendering (SSR)

- **Middleware:** Tệp `middleware.ts` sử dụng JWT để kiểm tra quyền truy cập ngay khi người dùng yêu cầu một trang, giúp chuyển hướng người dùng chưa đăng nhập về trang login trước khi trang kịp render.
- **@supabase/ssr:** Thư viện này cho phép lưu trữ JWT trong **Cookies** thay vì localStorage, giúp các Server Components có thể đọc được danh tính người dùng để render nội dung cá nhân hóa ngay trên máy chủ.

#### Với các nhà cung cấp danh tính bên thứ ba (OAuth)

- Supabase Auth đóng vai trò là đầu mối giao tiếp với hơn 20 nhà cung cấp như Google, GitHub, Apple, và các hệ thống SSO doanh nghiệp (SAML).
- Nó xử lý các luồng callback phức tạp và chuyển đổi kết quả thành một phiên làm việc hợp lệ của Supabase.

### Tóm tắt luồng hoạt động:

1. **Người dùng** đăng nhập qua ứng dụng (Client Layer).
2. Yêu cầu đi qua **Kong API Gateway** đến **Auth service**.
3. **Auth service** kiểm tra thông tin trong **Postgres**, nếu đúng sẽ cấp **JWT**.
4. Ứng dụng gửi **JWT** này trong các yêu cầu truy cập dữ liệu tiếp theo.
5. **Postgres** sử dụng dữ liệu trong **JWT** để đối chiếu với chính sách **RLS** và trả về đúng dữ liệu người dùng đó được phép thấy.

[[01_Design System with Todo List]]