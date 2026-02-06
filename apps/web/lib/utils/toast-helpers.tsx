import { toast, Id } from 'react-toastify';

/**
 * แสดง toast สำหรับยืนยันการกระทำ
 * @param message ข้อความที่ต้องการแสดง
 * @param onConfirm callback เมื่อผู้ใช้ยืนยัน
 * @param onCancel callback เมื่อผู้ใช้ยกเลิก (optional)
 */
export const confirmToast = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): Id => {
  return toast.info(
    <div className="p-2">
      <div className="font-semibold mb-2 text-gray-900">{message}</div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => {
            toast.dismiss();
            onConfirm();
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          ยืนยัน
        </button>
        <button
          onClick={() => {
            toast.dismiss();
            if (onCancel) onCancel();
          }}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
        >
          ยกเลิก
        </button>
      </div>
    </div>,
    {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: true,
      className: 'toast-confirm',
    }
  );
};

/**
 * แสดง toast สำหรับยืนยันการลบ
 * @param message ข้อความที่ต้องการแสดง
 * @param onConfirm callback เมื่อผู้ใช้ยืนยัน
 */
export const confirmDeleteToast = (
  message: string,
  onConfirm: () => void
): Id => {
  return toast.warning(
    <div className="p-2">
      <div className="font-semibold mb-2 text-red-700">⚠️ ยืนยันการลบ</div>
      <div className="text-sm text-gray-700 mb-3">{message}</div>
      <div className="text-xs text-gray-500 mb-3">
        การกระทำนี้ไม่สามารถยกเลิกได้
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => {
            toast.dismiss();
            onConfirm();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
        >
          ลบ
        </button>
        <button
          onClick={() => toast.dismiss()}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
        >
          ยกเลิก
        </button>
      </div>
    </div>,
    {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: true,
      className: 'toast-confirm-delete',
    }
  );
};

/**
 * แสดง toast สำหรับข้อมูลเพิ่มเติม
 */
export const infoToast = (message: string, title?: string) => {
  return toast.info(
    <div>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="text-sm">{message}</div>
    </div>,
    {
      position: 'top-right',
      autoClose: 4000,
    }
  );
};
