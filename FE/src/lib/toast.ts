import Swal from 'sweetalert2';

const createToast = (icon: 'success' | 'error' | 'info', message: string, timer: number) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    closeButtonHtml: '&times;',
    timer,
    timerProgressBar: true,
    didOpen: (toastEl) => {
      toastEl.onmouseenter = Swal.stopTimer;
      toastEl.onmouseleave = Swal.resumeTimer;
      toastEl.style.cursor = 'pointer';
      toastEl.onclick = () => Swal.close();
    }
  });
  Toast.fire({
    icon,
    title: message
  });
};

export const toast = {
  success: (message: string) => {
    createToast('success', message, 3000);
  },
  error: (message: string) => {
    createToast('error', message, 4000);
  },
  info: (message: string) => {
    createToast('info', message, 3000);
  }
};

export const confirm = async (title: string, text: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCloseButton: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    showCancelButton: true,
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#EF4444',
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Quay lại'
  });
};
