export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">
          TeacherMon
        </h1>
        <p className="text-center text-gray-600 mb-8">
          ระบบติดตามและหนุนเสริมการพัฒนาครูรัก(ษ์)ถิ่น
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            เข้าสู่ระบบ
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            แดชบอร์ด
          </a>
        </div>
      </div>
    </main>
  );
}
