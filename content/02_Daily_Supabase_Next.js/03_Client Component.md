Trong kiến trúc Next.js App Router và hệ sinh thái Supabase, **Client Component** đóng vai trò là tầng tương tác trực tiếp với người dùng cuối, được thực thi chủ yếu trên trình duyệt của khách hàng,.

Dưới đây là chi tiết về Client Component và mối quan hệ của nó với các tác nhân xung quanh:

### 1. Client Component là gì?

Client Component là những thành phần React được đánh dấu bằng chỉ thị `'use client'` ở đầu tệp mã nguồn. Chúng được sử dụng khi ứng dụng cần các tính năng đặc thù của trình duyệt hoặc sự tương tác động mà Server Component không thể thực hiện được.

**Các trường hợp bắt buộc dùng Client Component:**

- **Xử lý sự kiện:** Khi cần dùng các trình nghe sự kiện như `onClick()`, `onChange()`.
- **Quản lý trạng thái và vòng đời:** Khi sử dụng các React Hook như `useState()`, `useReducer()`, hoặc `useEffect()`.
- **Sử dụng API của trình duyệt:** Truy cập các đối tượng như `window`, `localStorage`, hoặc `navigator`.
- **Tính tương tác cao:** Phù hợp cho các công cụ tương tác, bộ lọc tìm kiếm hoặc các thành phần giao diện động.

### 2. Mối quan hệ với các tác nhân xung quanh

#### Với Server Components (RSC)

- **Mô hình render hỗn hợp:** Next.js kết hợp cả hai để tạo ra trải nghiệm người dùng tối ưu. Trong khi Server Component xử lý việc nạp dữ liệu ban đầu trên máy chủ để tăng tốc độ tải trang (FCP), Client Component sẽ đảm nhận phần tương tác sau khi trang đã tải xong,.
- **Truyền dữ liệu (Props):** Server Component có thể chứa Client Component và truyền dữ liệu cho chúng dưới dạng **props**. Dữ liệu này được gửi qua mạng dưới dạng một định dạng đặc biệt gọi là **React Server Component Payload** để cập nhật DOM trên trình duyệt.

#### Với Server Actions

- **Cầu nối thực thi logic phía server:** Client Component có thể gọi trực tiếp các **Server Actions** (hàm chạy trên máy chủ) để thực hiện các thay đổi dữ liệu (mutations) như gửi biểu mẫu hoặc cập nhật cơ sở dữ liệu,.
- **Bảo mật:** Mối quan hệ này cho phép Client Component kích hoạt các logic nghiệp vụ phức tạp trên server mà không cần phải lộ mã nguồn xử lý nhạy cảm hoặc API endpoint truyền thống,.

#### Với Supabase

- **Cập nhật thời gian thực (Realtime):** Client Component là tác nhân chính trong việc thiết lập các kết nối WebSocket đến Supabase Realtime. Chúng lắng nghe các thay đổi trực tiếp từ database và cập nhật giao diện ngay lập tức mà không cần tải lại trang,.
- **Tương tác SDK:** Lớp Client (Client layer) trong kiến trúc Supabase chạy trực tiếp trong ứng dụng, thường nằm trong các Client Component để gọi hàm đăng nhập, đăng ký và quản lý phiên (session) người dùng.

#### Với Trình duyệt và Người dùng

- **Hydration:** Sau khi nhận được HTML tĩnh từ máy chủ, trình duyệt sẽ sử dụng các hướng dẫn JavaScript của Client Component để thực hiện quá trình "thủy hóa" (hydration), giúp giao diện trở nên tương tác được.
- **Hiệu suất:** Việc sử dụng quá nhiều Client Component có thể làm tăng dung lượng tệp JavaScript gửi xuống trình duyệt, do đó các chuyên gia khuyến nghị chỉ sử dụng chúng khi thực sự cần tính tương tác để duy trì tốc độ tải trang nhanh,.

Tóm lại, Client Component hoạt động như một **vùng đệm tương tác**, kết nối dữ liệu từ Server/Supabase với trải nghiệm thực tế của người dùng trên trình duyệt.
[[04_Server Component]]
[[01_Design System with Todo List]]
