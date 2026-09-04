import api from './api';

// Dashboard
export const getDashboardStats = () => api.get('/admin/dashboard/stats').then(r => r.data);
export const seedSystem = () => api.post('/admin/seed').then(r => r.data);

// Customers
export const getCustomers = (params) => api.get('/admin/customers', { params }).then(r => r.data);
export const getCustomer = (id) => api.get(`/admin/customers/${id}`).then(r => r.data);
export const updateCustomer = (id, data) => api.put(`/admin/customers/${id}`, data).then(r => r.data);
export const deleteCustomer = (id) => api.delete(`/admin/customers/${id}`).then(r => r.data);

// Order Statuses
export const getOrderStatuses = () => api.get('/admin/order-statuses').then(r => r.data);
export const createOrderStatus = (data) => api.post('/admin/order-statuses', data).then(r => r.data);
export const updateOrderStatusDef = (id, data) => api.patch(`/admin/order-statuses/${id}`, data).then(r => r.data);
export const deleteOrderStatusDef = (id, permanent = false) => api.delete(`/admin/order-statuses/${id}?permanent=${permanent}`).then(r => r.data);

// Discount Codes
export const getDiscountCodes = () => api.get('/admin/discount-codes').then(r => r.data);
export const createDiscountCode = (data) => api.post('/admin/discount-codes', data).then(r => r.data);
export const updateDiscountCode = (id, data) => api.put(`/admin/discount-codes/${id}`, data).then(r => r.data);
export const deleteDiscountCode = (id) => api.delete(`/admin/discount-codes/${id}`).then(r => r.data);

// Production
export const getProductionBatches = () => api.get('/admin/production/batches').then(r => r.data);
export const getProductionBatch = (id) => api.get(`/admin/production/batches/${id}`).then(r => r.data);
export const generateProductionBatch = () => api.post('/admin/production/generate').then(r => r.data);
export const sendProductionBatch = (id, data) => api.post(`/admin/production/batches/${id}/send`, data).then(r => r.data);
export const getDispatchLogs = () => api.get('/admin/production/logs').then(r => r.data);

// SMS
export const getSmsCampaigns = () => api.get('/admin/sms/campaigns').then(r => r.data);
export const createSmsCampaign = (data) => api.post('/admin/sms/campaigns', data).then(r => r.data);
export const updateSmsCampaign = (id, data, applyToExisting = false) => api.patch(`/admin/sms/campaigns/${id}`, { ...data, applyToExisting }).then(r => r.data);
export const deleteSmsCampaign = (id, force = false) => api.delete(`/admin/sms/campaigns/${id}?force=${force}`).then(r => r.data);
export const getSmsMessages = (params = {}) => api.get('/admin/sms/messages', { params }).then(r => r.data);
export const exportCampaignNonPurchasers = (id) => api.get(`/admin/sms/campaigns/${id}/export`, { responseType: 'blob' }).then(r => r.data);
export const forceSendSmsMessage = (id) => api.post(`/admin/sms/messages/${id}/force-send`).then(r => r.data);
export const deleteSmsMessage = (id) => api.delete(`/admin/sms/messages/${id}`).then(r => r.data);
export const deleteRecipientMessages = (data) => api.post('/admin/sms/messages/delete-recipient', data).then(r => r.data);
export const updateRecipientPhone = (data) => api.post('/admin/sms/recipient/update-phone', data).then(r => r.data);
export const updateSmsMessage = (id, data) => api.patch(`/admin/sms/messages/${id}`, data).then(r => r.data);

// Excel
export const getExcelColumns = () => api.get('/admin/excel/columns').then(res => res.data);
export const createExcelColumn = (data) => api.post('/admin/excel/columns', data).then(res => res.data);
export const updateExcelColumns = (columns) => api.put('/admin/excel/columns', { columns }).then(res => res.data);
export const deleteExcelColumn = (id) => api.delete(`/admin/excel/columns/${id}`).then(res => res.data);

// Email Templates
export const getEmailTemplates = () => api.get('/admin/email-templates').then(r => r.data);
export const createEmailTemplate = (data) => api.post('/admin/email-templates', data).then(r => r.data);
export const updateEmailTemplate = (key, data) => api.patch(`/admin/email-templates/${key}`, data).then(r => r.data);
export const deleteEmailTemplate = (id) => api.delete(`/admin/email-templates/${id}`).then(r => r.data);

// Settings
export const getSettings = () => api.get('/admin/settings').then(r => r.data);
export const updateSetting = (key, value) => api.put('/admin/settings', { key, value }).then(r => r.data);

// Installment Plans
export const getInstallmentPlans = () => api.get('/admin/installment-plans').then(r => r.data);
export const createInstallmentPlan = (data) => api.post('/admin/installment-plans', data).then(r => r.data);
export const updateInstallmentPlan = (id, data) => api.put(`/admin/installment-plans/${id}`, data).then(r => r.data);
export const deleteInstallmentPlan = (id) => api.delete(`/admin/installment-plans/${id}`).then(r => r.data);
