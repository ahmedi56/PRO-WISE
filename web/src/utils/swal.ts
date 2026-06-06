/**
 * Centralized SweetAlert2 helper with Neo-Industrial theme.
 * Import `swal` from this file instead of 'sweetalert2' directly.
 */
import Swal from 'sweetalert2';

const themeParams = {
    background: 'var(--color-surface, #1e293b)',
    color: 'var(--color-text, #f8fafc)',
    confirmButtonColor: 'var(--color-primary, #6366f1)',
    cancelButtonColor: '#ef4444',
};

/** Pre-themed Swal instance */
const swal = Swal.mixin({
    customClass: {
        popup: 'swal-neo-popup',
        title: 'swal-neo-title',
        htmlContainer: 'swal-neo-html',
        confirmButton: 'swal-neo-confirm',
        cancelButton: 'swal-neo-cancel',
    },
    ...themeParams,
});

export default swal;

/** Themed fire shorthand for common patterns */

export const swalError = (title: string, text: string) =>
    swal.fire({ icon: 'error', title, text });

export const swalSuccess = (title: string, text: string) =>
    swal.fire({ icon: 'success', title, text });

export const swalConfirm = (title: string, text: string) =>
    swal.fire({
        icon: 'warning',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
    });

export const swalPrompt = (title: string, inputPlaceholder: string) =>
    swal.fire({
        title,
        input: 'text',
        inputPlaceholder,
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value || !value.trim()) return 'This field is required';
        },
    });
