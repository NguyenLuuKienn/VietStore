# Tài liệu Thiết kế RESTful API cho Hệ thống cửa hàng VietStore

Tài liệu này liệt kê toàn bộ các API Backend (dự kiến) phục vụ cho các chức năng của ứng dụng theo cấu trúc cơ sở dữ liệu đã thiết kế, bao gồm các bảng được định nghĩa trong `database.sql`.

## 1. Authentication & Phân Quyền (NguoiDung)

Các thao tác liên quan đến đăng ký, đăng nhập và phiên đăng nhập.

- `POST /api/auth/register`
  - **Mô tả:** Đăng ký tài khoản khách hàng mới.
  - **Body parameters:** `HoTen`, `Email`, `MatKhau`, `SoDienThoai`
- `POST /api/auth/login`
  - **Mô tả:** Đăng nhập hệ thống (trả về JWT token dùng cho các request có yêu cầu quyền).
  - **Body parameters:** `Email`, `MatKhau`
- `GET /api/auth/me`
  - **Mô tả:** Lấy thông tin user (NguoiDung) hiện tại dựa trên JWT token.

## 2. Người Dùng (NguoiDung)

- `GET /api/users`
  - **Mô tả:** Lấy danh sách khách hàng/nhân viên (Yêu cầu quyền Admin). Hỗ trợ tìm kiếm, phân trang và sắp xếp.
- `GET /api/users/:MaNguoiDung`
  - **Mô tả:** Lấy chi tiết thông tin một người dùng (Profile, tổng số đơn hàng, tổng chi tiêu).
- `PUT /api/users/:MaNguoiDung`
  - **Mô tả:** Cập nhật thông tin profile của người dùng (Tên, Số điện thoại).
- `PUT /api/users/:MaNguoiDung/status`
  - **Mô tả:** Cập nhật trạng thái người dùng (Ví dụ: `active`, `locked`) (Yêu cầu quyền Admin).

## 3. Danh Mục (DanhMuc)

- `GET /api/categories`
  - **Mô tả:** Lấy danh sách tất cả các danh mục sản phẩm (Dùng cho cả Public và Admin).
- `GET /api/categories/:MaDanhMuc`
  - **Mô tả:** Lấy thông tin chi tiết của một danh mục.
- `POST /api/categories`
  - **Mô tả:** Thêm một danh mục mới (Yêu cầu quyền Admin).
  - **Body parameters:** `MaDanhMuc`, `TenDanhMuc`
- `PUT /api/categories/:MaDanhMuc`
  - **Mô tả:** Chỉnh sửa tên danh mục hiện tại (Yêu cầu quyền Admin).
  - **Body parameters:** `TenDanhMuc`
- `DELETE /api/categories/:MaDanhMuc`
  - **Mô tả:** Xóa một danh mục khỏi hệ thống (Yêu cầu quyền Admin).

## 4. Sản Phẩm (SanPham, HinhAnhSanPham, KichThuocSanPham)

Thông tin sản phẩm được tách ra thành 3 bảng, do đó có API để lấy tổng hợp hoặc thiết lập riêng lẻ.

- `GET /api/products`
  - **Mô tả:** Lấy danh sách sản phẩm. Có thể truyền params để: Lọc theo `MaDanhMuc`, tìm kiếm theo `TenSanPham`, lọc theo `GiaBan`, phân trang (page, limit). Dữ liệu rà soát và trả về kèm một ảnh đại diện (nếu truy cập public).
- `GET /api/products/:MaSanPham`
  - **Mô tả:** Lấy chi tiết một sản phẩm, bao gồm tất cả dữ liệu từ `SanPham`, danh sách hình ảnh từ `HinhAnhSanPham` và các sizes từ `KichThuocSanPham`.
- `POST /api/products`
  - **Mô tả:** Tạo mới một sản phẩm với thông tin chung (Yêu cầu quyền Admin).
  - **Body parameters:** `TenSanPham`, `MaDanhMuc`, `MaNhaCungCap`, `GiaBan`, `MoTa`
- `PUT /api/products/:MaSanPham`
  - **Mô tả:** Cập nhật thông tin gốc của sản phẩm (giá, mô tả, danh mục...) (Yêu cầu quyền Admin).
- `DELETE /api/products/:MaSanPham`
  - **Mô tả:** Xoá sản phẩm (Yêu cầu quyền Admin). Các dữ liệu hình ảnh và kích thước sẽ bị xóa cascaded theo ràng buộc khóa tham chiếu CSDL.

### 4.1. Hình Ảnh Sản Phẩm (HinhAnhSanPham)
- `POST /api/products/:MaSanPham/images`
  - **Mô tả:** Thêm một URL hình ảnh mới cho sản phẩm. Có thể được sử dụng trong luồng upload file.
  - **Body parameters:** `URLHinhAnh`
- `DELETE /api/products/:MaSanPham/images/:MaHinhAnh`
  - **Mô tả:** Xóa một hình ảnh cụ thể của sản phẩm.

### 4.2. Kích Thước Sản Phẩm (KichThuocSanPham)
- `POST /api/products/:MaSanPham/sizes`
  - **Mô tả:** Thêm kích thước hỗ trợ mới cho sản phẩm (Yêu cầu quyền Admin).
  - **Body parameters:** `TenKichThuoc`
- `DELETE /api/products/:MaSanPham/sizes/:MaKichThuoc`
  - **Mô tả:** Xóa một size của sản phẩm (Yêu cầu quyền Admin).

## 5. Nhà Cung Cấp (NhaCungCap)

- `GET /api/suppliers`
  - **Mô tả:** Lấy danh sách nhà cung cấp (Yêu cầu quyền Admin).
- `GET /api/suppliers/:MaNhaCungCap`
  - **Mô tả:** Lấy chi tiết một nhà cung cấp.
- `POST /api/suppliers`
  - **Mô tả:** Tạo mới nhà cung cấp (Yêu cầu quyền Admin).
  - **Body parameters:** `TenCongTy`, `NguoiLienHe`, `SoDienThoai`, `Email`, `DiaChi`, `TrangThai`
- `PUT /api/suppliers/:MaNhaCungCap`
  - **Mô tả:** Sửa thông tin trạng thái, địa chỉ liên hệ của nhà cung cấp.
- `DELETE /api/suppliers/:MaNhaCungCap`
  - **Mô tả:** Xóa dữ liệu nhà cung cấp (Yêu cầu quyền Admin).

## 6. Đơn Hàng (DonHang, ChiTietDonHang)

Quản lý luồng đặt hàng và danh sách các chi tiết mua hàng.

- `POST /api/orders`
  - **Mô tả:** Đặt hàng thành công. Server sẽ tạo bản ghi trong bảng `DonHang` và bulk insert các món mua vào bảng `ChiTietDonHang`.
  - **Body parameters:** `NgayDatHang`, thông tin KH (`TenKhachHang`, `SoDienThoai`, `DiaChiGiaoHang`), Danh sách sp (cart items), Mã được áp dụng, Phương thức thanh toán (`COD`, `TheTinDung`), `TongTien`.
- `GET /api/orders`
  - **Mô tả:** Lấy danh sách đơn hàng. Nếu gọi với token KH -> Trả về đơn hàng của KH đó (`MaNguoiDung`). Nếu với token Admin -> Lấy toàn bộ với filter.
- `GET /api/orders/:MaDonHang`
  - **Mô tả:** Xem chi tiết 1 đơn hàng và mảng danh sách các sản phẩm từ bảng `ChiTietDonHang`.
- `PUT /api/orders/:MaDonHang/status`
  - **Mô tả:** Đổi trạng thái xử lý đơn (Ví dụ: `ChoXacNhan` -> `DangGiao` -> `HoanThanh` hoặc `DaHuy`) (Yêu cầu quyền Admin). Cập nhật số điểm hoặc tổng chi tiêu của user (Neu HoanThanh).

## 7. Mã Giảm Giá & Khuyến Mãi (KhuyenMai)

- `GET /api/vouchers`
  - **Mô tả:** Cung cấp dánh sách list khuyến mãi đã tạo, active = true (Đối với người dùng xem trang chủ) hoặc list All cho Admin manager.
- `POST /api/vouchers/apply`
  - **Mô tả:** Endpoint kiểm tra độ phù hợp của mã giảm giá khi Checkout.
  - **Body parameters:** `MaCode`, `TongTienHienTai`. Trả về True/False và số tiền được áp dụng. Tự báo lỗi nếu Đơn hàng không đạt `GiaTriDonToiThieu` hoặc thời gian quá hạn.
- `POST /api/vouchers`
  - **Mô tả:** Sinh/Tạo một mã giảm giá cấu hình (Yêu cầu quyền Admin).
  - **Body parameters:** `MaCode`, `LoaiGiamGia` (percent/fixed), `GiaTriGiam`, `GiamToiDa`, `GiaTriDonToiThieu`, `SoLuong`, `NgayBatDau`, `NgayKetThuc`, `TrangThai`.
- `PUT /api/vouchers/:MaKhuyenMai`
  - **Mô tả:** Sửa lại số lượng hoặc giới hạn mã.
- `DELETE /api/vouchers/:MaKhuyenMai`
  - **Mô tả:** Xóa vĩnh viễn hoặc set inactive khuyến mãi (Yêu cầu quyền Admin).

## 8. Banner & Giao Diện (Banner)

- `GET /api/banners`
  - **Mô tả:** Lấy list Banners, filter nếu cần bằng `?type=Main` hoặc `?type=Promo`. Được sort dựa trên trường `ThuTu`.
- `POST /api/banners`
  - **Mô tả:** Thêm mới 1 banner cấu hình. 
  - **Body parameters:** `TieuDe`, `PhuDe`, `MucGiam`, `MaCode`, `URLHinhAnh`, `DuongDan`, `ThuTu`, `LoaiBanner`.
- `PUT /api/banners/:MaBanner`
  - **Mô tả:** Cập nhật hình ảnh hoặc sắp xếp cấu hình banner.
- `DELETE /api/banners/:MaBanner`
  - **Mô tả:** Xóa banner.

## 9. Thông Báo (ThongBao)

- `GET /api/notifications`
  - **Mô tả:** Lấy danh sách các thông báo tới user. Nếu User thường: Lọc `MaNguoiDung = user_id`. Nếu Admin: Lọc thông báo có System/Kênh quản trị liên quan.
- `POST /api/notifications`
  - **Mô tả:** Bắn thông báo. Hệ thống/Bot dùng endpoint này để push vào `ThongBao` (vd: Thông báo có đơn hàng mới `DonHang`).
- `PUT /api/notifications/:MaThongBao/read`
  - **Mô tả:** Chủ động cập nhật cờ `DaDoc = 1` sau khi KH hoặc Admin mở.
- `PUT /api/notifications/read-all`
  - **Mô tả:** Đánh dấu toàn bộ thông báo của user đó thành đã đọc.

## 10. Thống Kê Tổng Quan (Dashboard/Stats)

Các Endpoint đặc biệt tổng hợp logic cho trang chủ Quản Trị, group by và format dữ liệu phù hợp với thư viện vẽ biểu đồ.

- `GET /api/stats/dashboard-summary`
  - **Mô tả:** Tổng hợp 4 block KPI (Tổng doanh thu, Tổng đơn hàng, Số khách hàng mới, Số sản phẩm đang bán).
- `GET /api/stats/revenue`
  - **Mô tả:** Truy xuất dữ liệu theo group `Tháng`, `Tuần` hoặc `Khoảng Date` để vẽ biểu đồ line Thu Nhập.
- `GET /api/stats/top-products`
  - **Mô tả:** Tính toán từ bảng `DonHang` (có `HoanThanh` status), joint với `ChiTietDonHang` để xem bảng xếp hạng sản phẩm bán tốt.

