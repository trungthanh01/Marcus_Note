**Mục tiêu:** Giám sát sức khỏe hệ thống và quản lý lượng session khổng lồ một cách ổn định.

- **Tóm tắt cốt lõi:**
    - Sử dụng **Next.js Middleware** để xử lý phân giải tenant (subdomain resolution) và quản lý session tập trung.
    - Thiết lập cookie session có thể hoạt động xuyên suốt các subdomain (cross-subdomain sessions) bằng cách cấu hình thuộc tính `domain` về parent domain.
    - Sử dụng các công cụ giám sát (Observability) để theo dõi CPU, Memory và các truy vấn chậm nhằm đưa ra quyết định nâng cấp resource (Vertical Scaling) kịp thời.
- **Sơ đồ tư duy (Text-based Diagram):** `Incoming Request -> Middleware (Check Session/Subdomain) -> Centralized Error Boundary -> Feature Page -> Logging/Metrics Service (Supabase Observability)`
- **Case Study 50k Users:**
    - _Bottleneck:_ Không thể theo dõi được lỗi khi hệ thống scale, dẫn đến việc solo developer mất quá nhiều thời gian fix lỗi thủ công.
    - _Giải quyết:_ Tập trung hóa việc xử lý lỗi (Centralized Error Handling) thông qua các utility functions trả về `formState` nhất quán và sử dụng các automation agents (như Warp Cloud Agents) để chạy task định kỳ.
- **Bài tập thực hành:** Viết một Middleware để kiểm tra session người dùng. Nếu user chưa login, redirect về trang `/login`. Nếu đã login, trích xuất `tenant_id` từ URL và đính kèm vào headers của request để các Server Components phía sau sử dụng.