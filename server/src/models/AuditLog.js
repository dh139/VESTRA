import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { type: String, required: true }, // e.g., 'CREATE_PRODUCT', 'UPDATE_PRICE', 'PROCESS_RETURN'
  entityType: { type: String, required: true }, // e.g., 'Product', 'Variant', 'Order', 'Settings'
  entityId: { type: String }, // Target entity ID
  previousValue: { type: mongoose.Schema.Types.Mixed }, // Object or value before change
  newValue: { type: mongoose.Schema.Types.Mixed }, // Object or value after change
  ipAddress: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } }); // Only create time needed

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
