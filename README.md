# StockTrack — Hệ thống quản lý kho

## Mô tả

StockTrack là một ứng dụng web quản lý kho hàng toàn diện, cho phép người dùng:
- Quản lý danh sách sản phẩm với SKU duy nhất
- Theo dõi nhập/xuất kho theo thời gian thực
- Kiểm tra tồn kho hiện tại
- Xem lịch sử giao dịch với phân trang
- Thống kê nhập/xuất theo ngày

## Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, TypeScript
- **Database**: SQLite3 với better-sqlite3
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD
- **Các thư viện khác**: React Router, Lucide React, Motion

## Hướng dẫn chạy Development

### Yêu cầu
- Node.js 20+
- npm hoặc yarn

### Cài đặt và chạy

1. Clone repository:
```bash
git clone <repository-url>
cd Stocktrack
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

4. Chạy server development:
```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

### Các script có sẵn

- `npm run dev` - Chạy server development
- `npm run build` - Build React frontend
- `npm run lint` - Kiểm tra code style
- `npm run start` - Chạy server production
- `npm run preview` - Preview build
- `npm run clean` - Xóa thư mục dist

## Hướng dẫn chạy bằng Docker

### Yêu cầu
- Docker 20.10+
- Docker Compose 2.0+

### Chạy ứng dụng (Docker Compose)

Project hiện được cấu hình để chạy **2 service** tách biệt: `backend` và `frontend`.

1. Build và chạy cả hai service:
```bash
docker compose up --build -d
```

2. Truy cập dịch vụ:
- Frontend (nginx): http://localhost:8081
- Backend (API): http://localhost:3000

3. Lưu dữ liệu:
- Database/volume: `./data` (được mount vào `backend` service)

4. Dừng ứng dụng:
```bash
docker compose down
```

5. Xóa containers và volumes:
```bash
docker compose down -v
```

Lưu ý về serving frontend:
- Theo mặc định, `backend` **không** phục vụ static files (trang `dist/`) — frontend được phục vụ riêng bởi `nginx` trong `frontend` service.
- Nếu bạn muốn backend phục vụ static files (ví dụ: single-container deployment), set biến môi trường `SERVE_STATIC=true` trên `backend` service trước khi chạy:

```bash
# example: run backend with SERVE_STATIC enabled
docker compose run -e SERVE_STATIC=true backend
```

Xây image thủ công (nếu cần):
```bash
docker build -f Dockerfile.backend -t stocktrack-backend .
docker build -f Dockerfile.frontend -t stocktrack-frontend .
```

## Danh sách API Endpoints

### Health Check
- **GET** `/api/health` - Kiểm tra trạng thái server và kết nối DB

### Sản phẩm
- **GET** `/api/items` - Lấy danh sách tất cả sản phẩm
- **GET** `/api/inventory` - Lấy danh sách sản phẩm với tồn kho hiện tại
- **POST** `/api/items` - Thêm sản phẩm mới
- **DELETE** `/api/items/:id` - Xóa sản phẩm

### Giao dịch kho
- **GET** `/api/stock-logs` - Lấy lịch sử giao dịch (hỗ trợ limit, offset)
- **POST** `/api/stock-logs` - Thêm giao dịch nhập/xuất

### Thống kê
- **GET** `/api/stats` - Lấy thống kê nhập/xuất trong ngày

## Cấu trúc thư mục dự án

```
Stocktrack/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx
│   │   ├── Items.tsx
│   │   ├── Sidebar.tsx
│   │   └── Stock.tsx
│   ├── lib/
│   │   └── utils.ts         # Utility functions
│   ├── App.tsx              # Main App component
│   ├── index.css            # Global styles
│   ├── main.tsx             # React entry point
│   └── types.ts             # TypeScript types
├── server.ts                # Express server
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── Dockerfile               # Docker build file
├── docker-compose.yml       # Docker Compose configuration
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI/CD pipeline
└── README.md                # This file
```

## Biến môi trường

Tạo file `.env` trong thư mục gốc với các biến:

```
PORT=3000                           # Port server chạy
NODE_ENV=development                # development hoặc production
DB_PATH=inventory.db                # Đường dẫn file database
VITE_API_URL=http://localhost:3000  # URL API cho frontend
```

## Xử lý lỗi Validation

### POST /api/items
- 400: Tên sản phẩm, SKU, hoặc đơn vị không được để trống
- 409: Mã SKU đã tồn tại

### POST /api/stock-logs
- 400: Thiếu thông tin bắt buộc hoặc số lượng <= 0
- 400: Không đủ tồn kho để xuất
- 404: Sản phẩm không tồn tại

### DELETE /api/items/:id
- 404: Sản phẩm không tồn tại

## Tính năng bảo mật

- Kiểm tra tồn kho trước khi xuất
- Constraint duy nhất trên SKU
- Foreign key constraints với ON DELETE CASCADE
- Validation input từ client
- Global error handler
- Parameterized queries để chống SQL injection

## Liên hệ & Support

Để báo cáo lỗi hoặc đề xuất tính năng, vui lòng tạo issue trên GitHub.

---

**Phiên bản**: 1.0.0
**Cập nhật lần cuối**: 2026-05-10

