Sự khác biệt giữa **Server Actions** và **API Routes** (còn gọi là Route Handlers trong Next.js App Router) nằm ở cách chúng được thiết kế để xử lý logic phía máy chủ và mức độ tích hợp của chúng với giao diện người dùng.

Dưới đây là so sánh chi tiết dựa trên các nguồn tài liệu:

### 1. Bản chất và Giao thức

- **Server Actions:** Được ví như các **cuộc gọi RPC (Remote Procedure Call) nội bộ**. Chúng là những hàm asynchronous chạy trên server nhưng có thể được gọi trực tiếp từ các component (cả Client và Server Components). Server Actions luôn sử dụng phương thức **POST** và dữ liệu được tuần tự hóa tự động.
- **API Routes (Route Handlers):** Là các **endpoint HTTP RESTful truyền thống**. Chúng được định nghĩa trong thư mục `app/api`, hoạt động độc lập với vòng đời của component và hỗ trợ đầy đủ các phương thức HTTP như GET, POST, PUT, DELETE.

### 2. Khả năng truy cập và Tích hợp

- **Server Actions:** Chỉ có thể truy cập **nội bộ** bên trong ứng dụng Next.js. Chúng được tích hợp chặt chẽ với React, cho phép xử lý biểu mẫu (form) và cập nhật giao diện người dùng một cách mượt mà mà không cần tạo endpoint riêng.
- **API Routes:** Có thể truy cập cả **nội bộ và bên ngoài**. Đây là lựa chọn bắt buộc khi bạn cần cung cấp dữ liệu cho các ứng dụng di động bản địa (iOS/Android), nhận Webhooks từ các dịch vụ bên thứ ba (như Stripe, GitHub) hoặc tạo API công khai.

### 3. Trải nghiệm lập trình (DX) và Boilerplate

- **Server Actions:** Yêu cầu **rất ít mã mẫu (boilerplate)**. Bạn không cần phải thiết lập endpoint, xử lý fetch thủ công hay quản lý trạng thái tải phức tạp vì Next.js xử lý việc tuần tự hóa dữ liệu và bảo mật CSRF tự động.
- **API Routes:** Có **boilerplate cao hơn**. Bạn phải viết mã để tạo yêu cầu fetch, quản lý headers, phân giải JSON và xử lý lỗi thủ công trên cả client và server.

### 4. Bảo mật và Xác thực

- **Server Actions:** Tích hợp sẵn tính năng bảo vệ chống lại tấn công **CSRF** và tự động đảm bảo an toàn về kiểu dữ liệu (type safety) khi kết hợp với TypeScript. Tuy nhiên, vì chúng là các endpoint POST công khai, bạn vẫn phải tự thực hiện kiểm tra xác thực (authentication) và phân quyền (authorization) bên trong hàm.
- **API Routes:** Đòi hỏi bạn phải tự cấu hình các biện pháp bảo mật như CORS (để truy cập từ bên ngoài) và các cơ chế xác thực riêng biệt cho từng endpoint.

### Bảng tóm tắt so sánh:

|Đặc tính|Server Actions|API Routes (Route Handlers)|
|:--|:--|:--|
|**Giao thức**|RPC-like (luôn là POST)|HTTP RESTful tiêu chuẩn|
|**Tích hợp**|Chặt chẽ với React/Components|Độc lập với giao diện|
|**Truy cập**|Chỉ nội bộ ứng dụng|Nội bộ và Bên ngoài (Public)|
|**Mã mẫu**|Tối thiểu (Minimal)|Cao hơn (Cần fetch/headers)|
|**Trường hợp dùng**|Form submission, thay đổi dữ liệu UI|Webhooks, Mobile Apps, Public API|

### Khi nào nên sử dụng loại nào?

- **Sử dụng Server Actions khi:** Bạn cần xử lý các tương tác trực tiếp của người dùng trên web như gửi form, cập nhật trạng thái dữ liệu (mutations) và muốn tận dụng tính năng tự động làm mới cache (`revalidatePath`).
- **Sử dụng API Routes khi:** Bạn cần hỗ trợ các tác nhân bên ngoài hệ thống Next.js, xử lý các luồng xác thực phức tạp (OAuth callbacks), truyền phát dữ liệu (streaming) hoặc xử lý tải lên tệp tin định dạng multipart.