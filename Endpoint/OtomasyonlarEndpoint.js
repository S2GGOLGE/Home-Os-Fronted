/* =====================================================
   Endpoint/otomasyonlar.js - Otomasyonlar API Entegrasyonu
   Backend Controller: AutomationsController.cs (/api/Automations)
   ===================================================== */

const AUTOMATION_API = `${getApiBaseUrl()}/Automations`;

async function apiGetAutomations() {
    const response = await fetch(AUTOMATION_API);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Otomasyonlar çekilemedi.'}`);
    }
    return await response.json();
}

async function apiCreateAutomation(data) {
    const response = await fetch(AUTOMATION_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            name: data.name,
            description: data.description || '',
            triggerCondition: data.triggerCondition || '',
            actionDescription: data.actionDescription || '',
            isActive: data.isActive !== undefined ? data.isActive : true
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText || 'Otomasyon oluşturulamadı.'}`);
    }
    return await response.json();
}

async function apiToggleAutomation(id) {
    const response = await fetch(`${AUTOMATION_API}/${id}/toggle`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText || 'Otomasyon durumu değiştirilemedi.'}`);
    }
    return await response.json();
}

async function apiRunAutomation(id) {
    const response = await fetch(`${AUTOMATION_API}/${id}/run`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText || 'Otomasyon çalıştırılamadı.'}`);
    }
    return await response.json();
}

async function apiDeleteAutomation(id) {
    const response = await fetch(`${AUTOMATION_API}/${id}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText || 'Otomasyon silinemedi.'}`);
    }
    return await response.json();
}
