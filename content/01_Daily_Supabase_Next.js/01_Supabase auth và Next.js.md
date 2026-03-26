2026-03-26 16:27'
### Bốn lớp chính trong kiến trúc supabase auth gồm những gì?
=>Client Layer, Kong API Gateway, Auth Service (GoTrue), PostGres Database 

1. **Lớp Client (Client layer):** Đây là tầng chạy trực tiếp trong ứng dụng của người dùng, bao gồm mã frontend trên trình duyệt, mã server backend hoặc ứng dụng di động bản địa. Lớp này chịu trách nhiệm gửi các yêu cầu HTTP để đăng nhập và quản lý tài khoản. Supabase khuyến nghị sử dụng các bộ **SDK client** để xử lý tự động việc cấu hình cuộc gọi, duy trì và làm mới các mã thông báo xác thực (Auth Tokens) trong bộ nhớ của ứng dụng.
2. **Kong API Gateway:** Đây là **điểm tiếp nhận duy nhất** cho mọi yêu cầu gửi đến dự án. Kong đóng vai trò điều phối lưu lượng truy cập, nhận diện yêu cầu xác thực và chuyển hướng chúng đến đúng dịch vụ Auth phía sau.
3. **Dịch vụ Auth (Auth service):** Được xây dựng dựa trên dự án mã nguồn mở GoTrue, đây là một máy chủ API chuyên biệt có nhiệm vụ **phát hành, xác thực và làm mới các mã thông báo JWT (JSON Web Tokens)**. Nó đóng vai trò trung gian giữa ứng dụng và dữ liệu xác thực trong cơ sở dữ liệu, đồng thời xử lý việc liên lạc với các nhà cung cấp bên thứ ba như Google, GitHub để phục vụ các tính năng Social Login hoặc SSO.
4. **Cơ sở dữ liệu Postgres:** Đây là tầng lưu trữ cuối cùng, sử dụng một **schema xác thực riêng (auth schema)** để chứa các bảng người dùng và thông tin liên quan. Để đảm bảo bảo mật, schema này không được để lộ trực tiếp qua API tự động. Dữ liệu từ tầng này kết hợp chặt chẽ với tính năng **Row Level Security (RLS)** của PostgreSQL, cho phép thiết lập các chính sách bảo mật chi tiết để kiểm soát việc người dùng chỉ có thể truy cập vào những dòng dữ liệu mà họ được phép dựa trên danh tính đã xác thực.

Sự kết hợp này cho phép bảo mật được thực thi ngay tại **tầng dữ liệu**, thay vì chỉ ở tầng ứng dụng, giúp giảm thiểu rủi ro rò rỉ thông tin ngay cả khi có lỗi trong mã nguồn ứng dụng.
- Auth service của Supabase (trước đây là GoTrue) được viết dựa trên dự án gốc của công ty nào?
=> Netlify
---
### Trong Supabase Auth lớp nào chịu trách nhiệm xác thực, cấp và làm mới Json Web Token?
=> Auth service
Lớp AUth thường được gọi là trung tâm trong kiến trúc xác thực của supabase, đây là một máy chủ API chuyên biệt được thiết kế quản lý danh tính người dùng và điều phối các security code.
1. Các vai trò:
	1. Issuing: khi người dùng đăng nhập thành công qua các phương thức bảo mật như email/mật khẩu, mã Magic link (gg, github), AUth sẽ tạo ra một mã Json Web Token (JWT) mã này chứa các thông tin nhận diện người dùng (claims) được mã hóa.
	2. Validating: Mỗi khi ứng dụng gửi yêu cầu truy cập dũ liệu, Auth service sẽ kiểm tra tính hợp lệ của chữ ký số trên JWT đảm bảo không bị giả mạo và vẫn còn hạn sử dụng.
	3. Refreshing: để đảm bảo an toàn thì các JWT thường có tuổi thọ ngắn, Auth service sẽ refresh token để cấp lại một JWT mới mà không yêu cầu user phải dùng mật khẩu.
2. Trung gian giữa ứng dụng và cơ sở dữ liệu
	1. Quản lý schema xác thực: khi một dự án được triển khai thì Auth service sẽ đưa ra một schema riêng tên là `auth` vào cơ sở dữ liệu postgres. Schema này chứa các mảng thông tin user và phiên làm việc, nhưng nó được ẩn đi bởi các API tự động để ngăn chặn truy cập trái phép.
	2. Tích hợp với Row Level Security (RLS): các JWT do Auth service cấp phát chứa thông tin người dùng (như uid) mà PostgreSQL có thể đọc được thông qua các auth.id() Điều này cho phép chúng ta thiết lập user policy để chỉ có user mới thấy dữ liệu của chính họ.
---
### Thư viện nào được khuyến nghị sử dụng để quản lý Auth trong Next.js App Router nhằm lưu trữ token trong Cookies?
=> @supabase/ssr
Thư viện **@supabase/ssr** là một công cụ tiện ích chuyên biệt được thiết kế để tối ưu hóa việc tích hợp xác thực giữa Supabase và kiến trúc **Next.js App Router**.
1. Tại sao phải lưu trữ token cookies?
	1. trong các ứng dụng React truyền thống, token xác thực thường được lưu trong local storage mà local storage thường phải truy cập bằng browser.
	2. Vấn đề với SSR: khi sử dụng servier side rendering (SSR) hoặc server component, máy chủ cần biết danh tính người dùng để tạo ra HTML phù hợp trước khi gửi đến trình duyệt, máy chủ không thể đọc dữ liệu từ local storage
	3. Giải pháp từ cookie: Thư viện @ssr được cấu hình để lưu trữ các token auth trong cookies. Vì cookies được tự động gửi kèm theo các yêu cầu HTTP từ trình duyệt lên máy chủ, mã nguồn chạy trên server (Node.js hoặc Edge runtime) có thể biết ai đang đăng nhập để phản hồi dự liệu cá nhân hóa ngay lập tức.
2. Quản lý xác thực đa môi trường
	1. Next.js App Router hoạt động ngay trong môi trưòng hỗn hợp: trình duyệt Client, máy chủ Node.js và các mạng phân phối Edge run time
	2. Tính thích ứng: @supabase/ssr cung cấp các phương thức để tạo ra các supabase client khác nhau nhưng đồng bộ cho từng môi trường này
	3. Server side Client: Được thiết kế để tương tác với các hàm Headers và cookies của Next.js, giúp mã chạy trên server xác định session của người dùng một cách an toàn. 
3. Các thành phần chính trong triển khai
	1. Client Side (client.ts): Sử dụng các component chạy trên chình duyệt để xử lý đăng nhập/ đăng ký của user
	2. Server side (server.ts): sử dụng trong server components, server actions và route handlers. Clients này sẽ đọc token auth từ cookies để thực hiện các truy vấn dữ liệu thông qua RLS của Postgres.
4. Lợi ích về bảo mật và hiệu suất
	1. Giảm thiểu hack XSS so với local storage
	2. User Xperience: nhờ có token auth trong cookies máy chủ có thể kiểm tra quyền truy cập ngay trong middleware hoặc trước khi render trang giúp page web tránh tình trạng flash content 

---
Hôm sau học tiếp