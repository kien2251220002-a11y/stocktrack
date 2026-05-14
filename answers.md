# Đánh giá tiêu chí dự án StockTrack

## 1. Tổng quan
- Hệ thống có đầy đủ FE + BE + DB logic.
- Có Dockerfile và docker-compose.yml.
- Có GitHub Actions CI file `.github/workflows/ci.yml`.
- Tuy nhiên, phần deploy public URL và bản sao minh chứng không có trong repo.

## 2. Những tiêu chí đã có
- `Dockerfile` có sẵn.
- `docker-compose.yml` có sẵn và chứa service `app`.
- `.env.example` có sẵn và `.env` được ignore bằng `.gitignore`.
- `server.ts` có endpoint `GET /api/health`.
- Frontend gọi API qua `VITE_API_URL` trong `src/lib/api.ts`.
- Backend dùng biến môi trường `DATABASE_URL` trong `src/db.ts`.
- `.github/workflows/ci.yml` đã có pipeline với các job: install, lint, build, docker-build.
- Git branch hiện có: `main` và `dev`.
- Lịch sử commit nhiều lần, không phải commit duy nhất.

## 3. Những tiêu chí chưa đủ / chưa có
- Chưa có tài liệu sơ đồ kiến trúc FE→BE→DB trong repo.
- Chưa có tài liệu sơ đồ CI/CD flow.
- Chưa có minh chứng public URL deploy.
- Chưa có thông tin về môi trường deploy (VPS / Render / Vercel) trong repo.
- Chưa có README hoặc file mô tả rõ quy trình deploy backend → frontend → config.
- Chưa có phần `Incident` với ≥ 3 lỗi và xử lý.
- Chưa có test script trong `package.json`.
- CI hiện tại thiếu bước `test`.
- Branch `feature/*` không tồn tại trong repository hiện tại.
- Chưa có chứng thực Docker container chạy thành công hoặc log container.
- Chưa có chứng thực pipeline đã chạy thành công.

## 4. Ghi chú kỹ thuật quan trọng
- `server.ts` dùng `process.env.DATABASE_URL` với PostgreSQL (`pg.Pool`).
- `docker-compose.yml` và `Dockerfile` đang đặt biến `DB_PATH=/app/data/inventory.db`, nhưng backend hiện không dùng `DB_PATH`.
  - Điều này khiến cấu hình Docker hiện tại không khớp với backend nếu chạy container độc lập.
- `README.md` mô tả SQLite3 và better-sqlite3, nhưng mã nguồn backend hiện dùng PostgreSQL.
- `.env` tồn tại cục bộ và không được commit; `.env.example` hiện có commit.
- Frontend không hardcode API URL trong mã nguồn; nó dùng `import.meta.env.VITE_API_URL`.

## 5. Checklist đánh giá nhanh
- [x] Frontend load OK (dự án React + Vite có cấu trúc rõ ràng)
- [ ] Không lỗi console (chưa kiểm tra runtime)
- [x] API `GET /api/health` có
- [x] Dockerfile + docker-compose có
- [ ] Container chạy OK (chưa xác nhận; config DB không khớp hiện tại)
- [ ] CI/CD pass (pipeline file có, nhưng chưa chạy và thiếu test step)
- [ ] Deploy có URL (không có)
- [x] Không hardcode config trong source code chính
- [ ] Có ≥ 3 incident (không có)

## 6. Kết luận ngắn gọn
Dự án có nhiều thành phần cơ bản đúng: frontend react, backend express, CI file, Docker config và env example. Nhưng cần hoàn thiện thêm:
- đồng bộ Docker với backend thực tế,
- thêm test script và test job vào CI,
- thêm tài liệu deploy/diagram,
- bổ sung bằng chứng deploy và incident.
