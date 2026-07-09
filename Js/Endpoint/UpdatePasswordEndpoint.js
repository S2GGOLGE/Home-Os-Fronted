// ── Şifre Güncelleme API çağrısı ─────────────────────────────────────────────
async function updatePassword(username, currentPassword, newPassword, newPasswordRepeat) {
    const url = `${API_BASE_URL}/auth/update-password`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                currentPassword,
                newPassword,
                newPasswordRepeat
            })
        });

        const text = await response.text();
        const payload = text
            ? unwrapApiResponse(parseApiPayload(text))
            : { success: response.ok, data: null, error: null };

        if (response.ok && payload.success) {
            return { success: true, message: payload.data?.message || 'Şifre güncellendi.' };
        }

        return {
            success: false,
            message: payload.error || payload.message || 'Şifre güncellenemedi.'
        };
    } catch (error) {
        console.error('Şifre güncelleme hatası:', error);
        return { success: false, message: error.message };
    }
}
