export const fixBootstrapModal = () => {
    // 1. Force remove all backdrops immediately
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((backdrop) => {
        backdrop.innerHTML = ""; // Detach internal event listeners if any
        backdrop.remove();
    });

    // 2. Clean up body classes and styles that lock scrolling
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('overflow-y'); // Sometimes set by different versions
};

export const closeModal = (modalId) => {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) {
        // Just clean up if modal doesn't exist but backdrop remains
        setTimeout(fixBootstrapModal, 150);
        return;
    }

    // Try standard Bootstrap hiding first
    const instance = window.bootstrap?.Modal?.getInstance(modalEl);
    if (instance) {
        instance.hide();
    } else {
        // Fallback: manually hide if no instance found
        modalEl.classList.remove('show');
        modalEl.style.display = 'none';
        modalEl.setAttribute('aria-hidden', 'true');
        modalEl.removeAttribute('aria-modal');
        modalEl.removeAttribute('role');
    }

    // Secondary cleanup: wait for Bootstrap's transition (usually 150ms)
    // Then force kill everything
    setTimeout(() => {
        fixBootstrapModal();

        // Double check: ensure the modal itself is definitely hidden
        if (modalEl) {
            modalEl.style.display = 'none';
            modalEl.classList.remove('show');
        }
    }, 200);
};

export const openModal = (modalId) => {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
        // Pre-flight cleanup: remove any stuck backdrops from previous errors
        fixBootstrapModal();

        // Get or create instance
        let instance = window.bootstrap?.Modal?.getInstance(modalEl);
        if (!instance) {
            instance = new window.bootstrap.Modal(modalEl, {
                backdrop: 'static', // Prevent clicking outside to close if desired, or default
                keyboard: false
            });
        }
        instance.show();
    }
};
