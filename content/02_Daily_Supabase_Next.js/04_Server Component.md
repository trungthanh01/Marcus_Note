Trong kiến trúc Next.js hiện đại, **Server Component (RSC)** là một loại thành phần React mới được thực thi hoàn toàn trên máy chủ. Chúng cho phép nhà phát triển viết mã giao diện nhưng lại có khả năng truy cập trực tiếp vào các tài nguyên phía backend.

Dưới đây là chi tiết về bản chất và mối quan hệ của chúng với các tác nhân xung quanh:

### 1. Server Component là gì?

Server Component là các thành phần React được render thành một định dạng dữ liệu đặc biệt gọi là **React Server Component Payload** trên máy chủ trước khi gửi đến trình duyệt.

- **Hiệu suất:** Do HTML được tạo trên máy chủ (thường nằm cùng trung tâm dữ liệu với cơ sở dữ liệu), quá trình này giúp đạt được chỉ số First Contentful Paint (FCP) gần như tức thì và giảm độ trễ phía client.
- **Tối ưu hóa mã:** Server Component không gửi mã JavaScript của chính nó xuống trình duyệt, giúp giảm đáng kể kích thước gói dữ liệu (bundle size) mà người dùng phải tải về.
- **Bảo mật:** Vì mã chạy trên server, các thông tin nhạy cảm như API key bí mật hoặc logic nghiệp vụ phức tạp không bao giờ bị lộ dưới client.

### 2. Mối quan hệ với các tác nhân xung quanh

#### Với Cơ sở dữ liệu (Supabase/PostgreSQL)

Server Component có mối quan hệ trực tiếp và mật thiết nhất với database. Chúng có thể **truy vấn trực tiếp cơ sở dữ liệu** mà không cần thông qua một lớp API trung gian (như REST hay GraphQL) cho các thao tác đọc dữ liệu. Điều này làm thay đổi hoàn toàn mô hình phát triển truyền thống, loại bỏ sự phức tạp của việc quản lý các endpoint API cho việc hiển thị dữ liệu ban đầu.

#### Với Client Component

Server Component đóng vai trò là "khung xương" hoặc điểm bắt đầu của ứng dụng:

- **Phân chia nhiệm vụ:** Server Component xử lý việc nạp dữ liệu nặng, trong khi Client Component đảm nhận tính tương tác (như nhấn nút, xử lý form).
- **Truyền dữ liệu:** Server Component có thể chứa các Client Component bên trong và truyền dữ liệu cho chúng dưới dạng **props**. Dữ liệu này sẽ được tuần tự hóa vào RSC Payload để Client Component có thể sử dụng ngay khi render trên trình duyệt.

#### Với Server Actions

Mặc dù Server Component chủ yếu dùng để hiển thị (read), chúng kết hợp với **Server Actions** để thực hiện các thao tác ghi (write). Khi người dùng tương tác với giao diện được tạo bởi Server Component, họ có thể kích hoạt các Server Actions để cập nhật dữ liệu, sau đó Server Component sẽ tự động được render lại trên máy chủ để phản ánh trạng thái mới nhất.

#### Với Trình duyệt và Người dùng

- **Render nhanh:** Trình duyệt nhận được HTML tĩnh từ Server Component để hiển thị bản xem trước nhanh chóng cho người dùng.
- **Hydration:** Sau đó, RSC Payload được sử dụng để khớp nối (reconcile) cây thành phần và các lệnh JavaScript sẽ "thủy hóa" (hydrate) các Client Component để trang web trở nên tương tác được.

#### Với Hệ thống Caching (Full Route Cache)

Kết quả render của Server Component (bao gồm HTML và RSC Payload) thường được lưu trữ trong **Full Route Cache** trên máy chủ. Điều này cho phép Next.js phục vụ các yêu cầu tiếp theo nhanh hơn bằng cách sử dụng lại kết quả đã render thay vì phải chạy lại logic thành phần từ đầu cho mỗi người dùng.

[[03_Client Component]] 
[[01_Design System with Todo List]]
