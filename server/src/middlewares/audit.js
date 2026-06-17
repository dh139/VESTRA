import AuditLog from '../models/AuditLog.js';

/**
 * Helper to log administrative operations in database audit records
 * @param {Object} params - Log properties
 * @param {Object} params.req - Express Request containing user and IP
 * @param {string} params.action - Operation string (e.g. 'CREATE_PRODUCT')
 * @param {string} params.entityType - Target model (e.g. 'Product')
 * @param {string} params.entityId - Primary ID of target document
 * @param {Object} [params.previousValue] - State before mutation
 * @param {Object} [params.newValue] - State after mutation
 */
export const logAdminAction = async ({
  req,
  action,
  entityType,
  entityId,
  previousValue = null,
  newValue = null
}) => {
  try {
    const adminId = req.user ? req.user._id : null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    if (!adminId) {
      console.warn(`[Audit Warning] Attempted to log admin action without authenticated user context.`);
      return;
    }
    
    const logEntry = new AuditLog({
      adminId,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      ipAddress
    });
    
    await logEntry.save();
    console.log(`[Audit Logged] ${action} on ${entityType} by Admin ID: ${adminId}`);
  } catch (error) {
    console.error(`[Audit Log Failure]: ${error.message}`);
  }
};
