import { useState, useEffect } from 'react';
import { Calendar, Eye, FileText, CheckCircle2, XCircle, ArrowUpDown, ChevronDown, MessageSquare } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'returns'
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Return approval form state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnStatus, setReturnStatus] = useState('approved'); // 'approved' or 'rejected'
  const [adminComment, setAdminComment] = useState('');
  const [resolvingReturn, setResolvingReturn] = useState(false);

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  const fetchAdminOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/orders/admin/all`);
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load admin orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await axios.put(`${API_URL}/orders/admin/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        // Update local state
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  const handleOpenReturnModal = (orderId, statusType) => {
    setReturnOrderId(orderId);
    setReturnStatus(statusType);
    setAdminComment('');
    setShowReturnModal(true);
  };

  const handleResolveReturnSubmit = async (e) => {
    e.preventDefault();
    setResolvingReturn(true);
    try {
      const res = await axios.put(`${API_URL}/orders/admin/${returnOrderId}/return`, {
        status: returnStatus,
        adminComment
      });

      if (res.data.success) {
        setShowReturnModal(false);
        fetchAdminOrders();
        if (selectedOrder && selectedOrder._id === returnOrderId) {
          setSelectedOrder(res.data.order);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve return request.');
    } finally {
      setResolvingReturn(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-mist text-ink/75';
      case 'paid':
      case 'processing': return 'bg-pine/10 text-pine';
      case 'shipped': return 'bg-brass/10 text-brass';
      case 'delivered': return 'bg-pine text-bone';
      case 'refunded': return 'bg-brass text-bone';
      case 'cancelled': return 'bg-signal/10 text-signal';
      default: return 'bg-mist';
    }
  };

  // Filter returns queue
  const returnOrders = orders.filter(o => o.returnRequest && o.returnRequest.status === 'requested');
  const visibleOrders = activeTab === 'all' ? orders : returnOrders;

  return (
    <div className="space-y-6 animate-[slide-up_0.4s_ease-out]">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-ink uppercase tracking-tight">
          Orders & Returns Portal
        </h1>
        <p className="text-xs text-ink/50 mt-1 font-semibold uppercase tracking-wider">
          Manage shipping status pipelines and process tags return queues.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-mist pb-0.5 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 border-b-2 px-1 ${
            activeTab === 'all' ? 'border-pine text-pine' : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 border-b-2 px-1 ${
            activeTab === 'returns' ? 'border-pine text-pine' : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          Returns Queue ({returnOrders.length})
        </button>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-mist/30 border border-mist rounded-xl" />
          ))}
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="py-12 bg-bone border border-mist rounded-3xl text-center text-xs text-ink/50 font-semibold">
          No orders found in this queue.
        </div>
      ) : (
        <div className="border border-mist rounded-3xl overflow-hidden bg-bone shadow-soft text-xs divide-y divide-mist">
          {/* Header row */}
          <div className="grid grid-cols-6 p-4 font-bold text-ink/50 bg-mist/10 uppercase text-[9px] tracking-wider text-center">
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Total</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {/* Body list */}
          {visibleOrders.map((order) => (
            <div key={order._id} className="grid grid-cols-6 p-4 items-center text-center font-medium hover:bg-mist/5 transition-colors">
              <span className="font-mono text-ink/75 block font-semibold">{order.orderNumber}</span>
              <div className="text-left pl-4">
                <span className="font-bold text-ink block truncate">{order.userId?.name || 'Guest User'}</span>
                <span className="text-[9px] text-ink/40 block truncate">{order.userId?.email || 'N/A'}</span>
              </div>
              <span className="text-ink/60">{new Date(order.createdAt).toLocaleDateString()}</span>
              <div>
                <span className="text-pine font-bold font-display block">₹{order.pricing.total.toLocaleString('en-IN')}</span>
                <span className="text-[8px] uppercase tracking-wider text-ink/40 font-bold block mt-0.5">{order.payment?.method}</span>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-bold tracking-wider ${getStatusBadgeClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="p-1.5 border border-mist hover:bg-mist/40 rounded-lg text-pine"
                  title="Expand Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {order.invoiceUrl && (
                  <a
                    href={`http://localhost:5000${order.invoiceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 border border-mist hover:bg-mist/40 rounded-lg text-brass"
                    title="Invoice"
                  >
                    <FileText className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. EXPANDED ORDER DETAILS MODAL OVERLAY */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
          <div className="bg-bone border border-mist p-6 rounded-3xl max-w-2xl w-full shadow-2xl max-h-[85vh] overflow-y-auto relative animate-[scale-up_0.3s_ease-out]">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-xs font-bold border border-mist rounded-full bg-bone hover:bg-mist py-1 px-3 transition-all cursor-pointer"
            >
              Close
            </button>

            <h3 className="font-display font-extrabold text-lg text-ink uppercase tracking-wide border-b border-mist pb-3 mb-4">
              Manage Order #{selectedOrder.orderNumber}
            </h3>

            {/* Change Status Widget */}
            <div className="bg-mist/20 p-4 border border-mist/40 rounded-2xl mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-ink/50 block">Update Pipeline Status</span>
                <span className="text-xs font-bold text-ink/80 mt-0.5 block">Trigger customer alerts immediately.</span>
              </div>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                className="bg-bone border border-mist rounded-full py-2 px-4 text-xs font-bold text-pine focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Address & Pricing summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold mb-6">
              <div>
                <span className="text-[10px] text-ink/40 uppercase block mb-1">Shipping Snapshot</span>
                <div className="text-ink/80 leading-relaxed font-medium">
                  <p className="font-bold">{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.addressLine1}</p>
                  {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                  <p>Phone: {selectedOrder.shippingAddress.phone}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-ink/40 uppercase block mb-1">Pricing Ledger</span>
                <div className="space-y-1 text-ink/80 font-medium">
                  <div className="flex justify-between"><span>Subtotal:</span><span>₹{selectedOrder.pricing.subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-brass"><span>Discount:</span><span>-₹{selectedOrder.pricing.discount.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Shipping:</span><span>₹{selectedOrder.pricing.shipping.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>GST:</span><span>₹{selectedOrder.pricing.tax.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between font-bold text-pine text-sm pt-1 border-t border-mist/30">
                    <span>Grand Total:</span><span>₹{selectedOrder.pricing.total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-ink/50 pt-2 border-t border-mist/35">
                    <span>Payment Details:</span>
                    <span className="text-ink font-semibold">{selectedOrder.payment?.method} ({selectedOrder.payment?.status})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items grid */}
            <div className="space-y-3 mb-6">
              <span className="text-[10px] text-ink/40 uppercase font-bold block mb-1">Products Purchased</span>
              <div className="border border-mist rounded-2xl overflow-hidden divide-y divide-mist bg-bone text-xs">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-mist bg-mist/20">
                      <img src={item.image} alt="" className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-grow">
                      <span className="font-semibold text-ink block">{item.name}</span>
                      <span className="text-[10px] text-ink/50 uppercase font-bold tracking-wider">
                        Color: {item.color} | Size: {item.size} | SKU: {item.sku}
                      </span>
                    </div>
                    <div className="text-right font-semibold">
                      <span className="text-ink/65 block">{item.quantity} x ₹{item.price}</span>
                      <span className="font-display font-bold text-pine block">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return details widget */}
            {selectedOrder.returnRequest && selectedOrder.returnRequest.status !== 'none' && (
              <div className="p-4 border border-mist rounded-2xl bg-brass/5 space-y-3 text-xs mb-6">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-brass block">Return Request Alert</span>
                  <span className="font-semibold text-ink block mt-0.5">Reason: "{selectedOrder.returnRequest.reason}"</span>
                  <span className="text-[9px] text-ink/40 block mt-0.5">Submitted: {new Date(selectedOrder.returnRequest.requestedAt).toLocaleDateString()}</span>
                </div>

                {selectedOrder.returnRequest.status === 'requested' ? (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleOpenReturnModal(selectedOrder._id, 'rejected')}
                      className="py-2 px-5 bg-signal/15 text-signal font-bold text-[9px] uppercase rounded-full hover:bg-signal/25"
                    >
                      Decline Return
                    </button>
                    <button
                      onClick={() => handleOpenReturnModal(selectedOrder._id, 'approved')}
                      className="py-2 px-5 bg-pine text-bone font-bold text-[9px] uppercase rounded-full hover:bg-pine/90"
                    >
                      Approve & Refund
                    </button>
                  </div>
                ) : (
                  <div className="text-xs pt-1 border-t border-mist/40 font-bold uppercase tracking-wider text-brass">
                    Return is: {selectedOrder.returnRequest.status}
                    {selectedOrder.returnRequest.adminComment && (
                      <span className="text-ink/70 block mt-1 normal-case font-medium">Note: "{selectedOrder.returnRequest.adminComment}"</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. RETURN RESOLVE MODAL FORM OVERLAY */}
      {showReturnModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
          <div className="bg-bone border border-mist p-6 rounded-3xl max-w-sm w-full shadow-2xl relative animate-[scale-up_0.2s_ease-out]">
            <h4 className="font-display font-semibold text-sm text-ink uppercase tracking-wide mb-2">
              Resolve Return: {returnStatus === 'approved' ? 'Approve' : 'Decline'}
            </h4>
            <p className="text-xs text-ink/60 mb-4 leading-relaxed font-medium">
              {returnStatus === 'approved' 
                ? 'Approving restocks inventory sizes and sets order status to refunded.' 
                : 'Declining registers reason comment visible to customer.'
              }
            </p>

            <form onSubmit={handleResolveReturnSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-ink/50 block">Admin Comment (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Provide resolution details..."
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="w-full bg-mist/20 border border-mist rounded-2xl py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-pine"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="w-1/2 py-2.5 border border-mist bg-bone rounded-full text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolvingReturn}
                  className="w-1/2 py-2.5 bg-pine text-bone rounded-full text-xs font-bold uppercase hover:bg-pine/90"
                >
                  {resolvingReturn ? 'Saving...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
