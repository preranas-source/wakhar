// API Simulation Gateway for Wakhar WMS

// Add transaction to persistent localStorage api logs
const logTransaction = (endpoint, method, requestBody, responseStatus, responseBody) => {
  try {
    const logs = JSON.parse(localStorage.getItem('wakhar_api_logs') || '[]');
    const newLog = {
      id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
      endpoint,
      method,
      requestBody: JSON.stringify(requestBody, null, 2),
      responseStatus,
      responseBody: JSON.stringify(responseBody, null, 2)
    };
    
    // Cap logs size at 50 to prevent overflow
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    localStorage.setItem('wakhar_api_logs', JSON.stringify(updatedLogs));
    
    // Dispatch a custom event to notify listeners
    window.dispatchEvent(new Event('wakhar_api_log_added'));
  } catch (e) {
    console.error('Error logging simulated API transaction:', e);
  }
};

export const apiSim = {
  // 1. ERPNext Stock entry sync
  syncERPNextStock: async (lot) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const endpoint = 'https://erpnext.wakhar.in/api/resource/Stock Entry';
        const payload = {
          stock_entry_type: 'Material Receipt',
          company: 'Wakhar Digital Agri Cooperative',
          items: [
            {
              item_code: lot.commodity,
              item_name: `${lot.commodity} (${lot.variety})`,
              qty: lot.quantity,
              uom: 'Kg',
              t_warehouse: lot.warehouse,
              custom_lot_number: lot.id,
              custom_farmer_id: lot.farmerId
            }
          ],
          remarks: `Intake recorded via WMS for farmer ${lot.farmerName}`
        };
        const response = {
          name: `STE-${Date.now().toString().slice(-6)}`,
          docstatus: 1,
          status: 'Submitted'
        };
        logTransaction(endpoint, 'POST', payload, 201, response);
        resolve(response);
      }, 800);
    });
  },

  // 2. Fleetbase dispatch order
  triggerFleetbaseDispatch: async (dispatch) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const endpoint = 'https://api.fleetbase.io/v1/orders';
        const payload = {
          type: 'dispatch',
          payload: {
            reference: dispatch.id,
            vehicle_registration: dispatch.vehicle,
            destination: dispatch.destination,
            cargo: {
              commodity: dispatch.commodity,
              weight: dispatch.quantity
            }
          }
        };
        const response = {
          status: 'success',
          order_id: `order_${Math.random().toString(36).substr(2, 9)}`,
          tracking_url: `https://trck.fb.io/${dispatch.id}`
        };
        logTransaction(endpoint, 'POST', payload, 200, response);
        resolve(response);
      }, 1000);
    });
  },

  // 3. Traccar position pull
  fetchTraccarPositions: async (vehicleId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const endpoint = `https://api.traccar.org/api/positions?deviceId=${vehicleId}`;
        const response = [
          {
            deviceId: vehicleId,
            latitude: 17.9625 + (Math.random() - 0.5) * 0.1,
            longitude: 73.8821 + (Math.random() - 0.5) * 0.1,
            speed: 42.5,
            course: 180,
            serverTime: new Date().toISOString()
          }
        ];
        logTransaction(endpoint, 'GET', {}, 200, response);
        resolve(response);
      }, 400);
    });
  },

  // 4. SMS Notification (MSG91 / Twilio)
  sendSMSNotification: async (phone, message) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const endpoint = 'https://api.msg91.com/api/v5/flow';
        const payload = {
          flow_id: 'wakhar_intake_confirm',
          recipients: [{ mobiles: phone, message_text: message }]
        };
        const response = {
          type: 'success',
          msg: 'SMS queued for delivery'
        };
        logTransaction(endpoint, 'POST', payload, 200, response);
        resolve(response);
      }, 500);
    });
  },

  // 5. WhatsApp Receipt dispatch
  sendWhatsAppReceipt: async (phone, wrId, details) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const endpoint = 'https://graph.facebook.com/v17.0/messages';
        const payload = {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: 'e_wr_delivery_template',
            language: { code: 'en_US' },
            components: [
              { type: 'header', parameters: [{ type: 'text', text: wrId }] },
              { type: 'body', parameters: [{ type: 'text', text: details }] }
            ]
          }
        };
        const response = {
          messaging_product: 'whatsapp',
          contacts: [{ input: phone, wa_id: phone.replace(/[^0-9]/g, '') }],
          messages: [{ id: `wamid.HBg${Math.random().toString(36).substr(2, 9)}` }]
        };
        logTransaction(endpoint, 'POST', payload, 200, response);
        resolve(response);
      }, 600);
    });
  },

  // 6. Razorpay payment check
  verifyRazorpayPayment: async (invoiceId, amount) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const endpoint = `https://api.razorpay.com/v1/invoices/${invoiceId}/payments`;
        const response = {
          entity: 'collection',
          count: 1,
          items: [
            {
              id: `pay_${Math.random().toString(36).substr(2, 9)}`,
              amount: amount * 100, // Razorpay uses paisa
              currency: 'INR',
              status: 'captured',
              method: 'upi',
              created_at: Math.floor(Date.now() / 1000)
            }
          ]
        };
        logTransaction(endpoint, 'GET', {}, 200, response);
        resolve(response);
      }, 700);
    });
  }
};
