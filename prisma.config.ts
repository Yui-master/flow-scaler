import { defineConfig, env } from "@prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Prisma CLI (như lệnh db push) CẦN dùng kết nối trực tiếp cổng 5432 của Supabase
    // Do đó, ta sẽ truyền DIRECT_URL vào đây thay vì DATABASE_URL
    url: env("DIRECT_URL"),
  },
});