### Trong Next.js, tệp nào thường được dùng để bảo vệ các tuyến đường (routes) yêu cầu xác thực?

Tệp **middleware.ts** đóng vai trò là "người gác cổng" trung tâm trong các ứng dụng Next.js hiện đại, đặc biệt là khi kết hợp với hệ sinh thái Supabase. Dưới đây là giải thích chi tiết về lý do và cách tệp này được sử dụng để bảo vệ các tuyến đường (routes):

1. Cơ chế "Chạy trước khi xử lý"

	Middleware trong Next.js là một đoạn mã chạy **ngay trước khi một yêu cầu (request) được hoàn tất**. Điều này có nghĩa là khi người dùng cố gắng truy cập vào một trang, `middleware.ts` sẽ can thiệp trước khi máy chủ bắt đầu render HTML hoặc gửi dữ liệu về trình duyệt.
	
	Đối với bảo mật, điều này cho phép bạn kiểm tra danh tính người dùng ở mức độ ưu tiên cao nhất, trước khi bất kỳ logic nghiệp vụ nào của trang được thực thi.

2. Bảo vệ theo phạm vi thư mục (Folders)

	Thay vì phải thêm mã kiểm tra xác thực vào từng trang đơn lẻ, `middleware.ts` cho phép bạn bảo vệ **toàn bộ các thư mục** hoặc các phân đoạn đường dẫn cụ thể (ví dụ: tất cả các đường dẫn bắt đầu bằng `/dashboard`).
	
	- Nếu người dùng đã đăng nhập: Middleware cho phép yêu cầu tiếp tục đi qua.
	- Nếu người dùng chưa đăng nhập: Middleware sẽ thực hiện lệnh **chuyển hướng (redirect)** họ về trang đăng nhập.

3. Cải thiện trải nghiệm người dùng (UX)

	Một lợi ích quan trọng của việc sử dụng Middleware là ngăn chặn tình trạng **"nháy" nội dung (flashes of unauthorized content)**.
	
	- Trong các ứng dụng kiểu cũ, trình duyệt thường phải tải trang xong mới kiểm tra xác thực qua JavaScript (Client-side), khiến người dùng thấy nội dung bí mật trong một phần giây trước khi bị đuổi ra.
	- Với Middleware, vì việc kiểm tra diễn ra trên Server hoặc tại mạng phân phối (Edge), trình duyệt sẽ không bao giờ nhận được nội dung của trang nếu người dùng chưa hợp lệ.

4. Khả năng tương tác với Cookies

	Như chúng ta đã thảo luận về thư viện `@supabase/ssr`, mã thông báo xác thực được lưu trong Cookies. `middleware.ts` có khả năng đọc các Cookies này một cách nhanh chóng để xác định phiên làm việc (session) của người dùng. Next.js cũng hỗ trợ **Edge Middleware**, cho phép mã bảo vệ này chạy tại các điểm mạng gần người dùng nhất để giảm thiểu độ trễ.

5. Vị trí và cấu hình

	- **Vị trí:** Tệp này thường được đặt ở thư mục gốc (root) của dự án Next.js.
	- **Bộ lọc (Matcher):** Bạn có thể cấu hình Middleware chỉ chạy trên một số đường dẫn nhất định bằng cách sử dụng `config.matcher`, giúp tối ưu hóa hiệu suất cho các trang công khai (như trang chủ hay blog) mà không cần kiểm tra xác thực không cần thiết.

Tóm lại, **middleware.ts** là lớp bảo mật đầu tiên và quan trọng nhất, giúp đảm bảo rằng chỉ những người dùng có quyền mới có thể tiếp cận được các khu vực nhạy cảm của ứng dụng một cách mượt mà và an toàn nhất.

## Liên kết
<!-- connected by /marcus_connect 2026-03-26 -->
- [[01_Supabase auth và Next.js]] — kiến trúc auth và @supabase/ssr là nền tảng để middleware đọc session từ cookies