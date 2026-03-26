Trong bối cảnh rộng hơn của cuốn sách **"SQL Antipatterns"**, các lỗi thiết kế cơ sở dữ liệu logic đại diện cho giai đoạn đầu tiên của quá trình phát triển, tập trung vào việc lập kế hoạch cho các bảng, cột và mối quan hệ trước khi bắt đầu viết mã. Những sai lầm này thường xuất phát từ việc hiểu sai lý thuyết cơ sở dữ liệu quan hệ.

Dưới đây là chi tiết về các lỗi thiết kế cơ sở dữ liệu logic được trình bày trong nguồn tài liệu:

### 1. Bản chất của Lỗi thiết kế Logic

Lỗi thiết kế logic xảy ra khi lập trình viên quyết định cách tổ chức và kết nối dữ liệu không hiệu quả. Thay vì giải quyết mục tiêu ban đầu, các kỹ thuật này thường tạo ra "nợ kỹ thuật" và dẫn đến các hệ quả tiêu cực cho hiệu suất, tính toàn vẹn dữ liệu và khả năng bảo trì.

### 2. Các lỗi thiết kế logic cụ thể (Phần I của tài liệu)

Nguồn tài liệu liệt kê 8 lỗi thiết kế logic điển hình:

- [[1.1 Jaywalking]] (Chương 2):** Lưu trữ một danh sách các giá trị phân tách bằng dấu phẩy trong một cột thay vì sử dụng bảng trung gian để quản lý mối quan hệ nhiều-nhiều. Điều này gây khó khăn cho việc truy vấn bằng so sánh bằng, vô hiệu hóa các hàm tổng hợp như `COUNT()` và gây rủi ro về tính toàn vẹn dữ liệu.
- **Naive Trees (Chương 3):** Luôn dựa vào cột `parent_id` duy nhất để lưu trữ dữ liệu phân cấp (như bình luận lồng nhau). Thiết kế này gây khó khăn khi cần truy xuất toàn bộ các nút con ở mọi cấp độ vì số lượng phép nối (JOIN) trong SQL phải là cố định.
- **ID Required (Chương 4):** Mặc định mọi bảng đều phải có cột khóa chính mang tên `id` tự động tăng, bỏ qua các khóa tự nhiên hoặc khóa hỗn hợp. Điều này có thể dẫn đến các khóa dư thừa, cho phép dữ liệu trùng lặp trong các bảng trung gian và làm lu mờ ý nghĩa của khóa.
- **Keyless Entry (Chương 5):** Bỏ qua các ràng buộc khóa ngoại (Foreign Keys) để đơn giản hóa kiến trúc hoặc tối ưu hóa hiệu suất. Hệ quả là ứng dụng phải tự chịu trách nhiệm kiểm tra tính toàn vẹn tham chiếu thủ công, dẫn đến mã nguồn phức tạp và rủi ro dữ liệu mồ côi.
- **Entity-Attribute-Value (Chương 6):** Sử dụng một bảng thuộc tính chung (Entity, Attribute, Value) để hỗ trợ các thuộc tính thay đổi. Cách tiếp cận này làm mất đi lợi thế của các kiểu dữ liệu SQL, không thể thực hiện các ràng buộc bắt buộc và khiến việc truy xuất một hàng dữ liệu đầy đủ trở nên cực kỳ phức tạp và tốn kém.
- **Polymorphic Associations (Chương 7):** Sử dụng một cột khóa ngoại duy nhất để tham chiếu đến nhiều bảng cha khác nhau, kết hợp với một cột "loại" để định danh bảng cha. Thiết kế này không thể khai báo trong siêu dữ liệu SQL, dẫn đến việc mất đi khả năng thực thi tính toàn vẹn dữ liệu bằng khóa ngoại.
- **Multicolumn Attributes (Chương 8):** Tạo nhiều cột cho cùng một loại thuộc tính đa trị (ví dụ: `tag1`, `tag2`, `tag3`). Việc này khiến việc tìm kiếm một giá trị trên tất cả các cột trở nên dài dòng, phức tạp khi thêm/xóa giá trị và bị giới hạn số lượng phần tử có thể lưu trữ.
- **Metadata Tribbles (Chương 9):** Chia nhỏ một bảng hoặc cột thành nhiều bảng/cột dựa trên các giá trị dữ liệu cụ thể (ví dụ: `Bugs_2008`, `Bugs_2009`). Điều này dẫn đến sự bùng nổ của các đối tượng siêu dữ liệu, gây khó khăn cho việc quản lý tính toàn vẹn, đồng bộ hóa siêu dữ liệu và thực hiện các truy vấn xuyên bảng.

### 3. Tầm quan trọng của việc nhận diện

Mỗi chương về lỗi thiết kế logic trong tài liệu đều cung cấp các dấu hiệu nhận biết thông qua những câu hỏi hoặc phàn nàn phổ biến từ đội ngũ dự án. Việc hiểu rõ các giải pháp thay thế (như bảng trung gian, bảng phụ thuộc, hay các mô hình cây thay thế) giúp các nhóm phát triển đưa ra quyết định tốt nhất dựa trên yêu cầu thực tế và thực tại của công nghệ RDBMS.

## Liên kết
<!-- connected by /marcus_connect 2026-03-26 -->
- [[0. Overview]] — tổng quan sách SQL Antipatterns, ngữ cảnh chứa chương này
- [[1.1 Jaywalking]] — lỗi lưu danh sách phân tách bằng dấu phẩy thay vì bảng trung gian
- [[1.2 Naive Trees]] — lỗi thiết kế cây phân cấp chỉ dùng parent_id
- [[1.3 Entity-Attribute-Value (EAV)]] — lỗi mô hình thuộc tính linh hoạt quá mức
- [[1.4  Polymorphic Associations]] — lỗi khóa ngoại tham chiếu nhiều bảng cha